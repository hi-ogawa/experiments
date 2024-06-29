use std::collections::BTreeSet;

use oxc::{
    ast::ast::{
        Argument, BindingIdentifier, Declaration, Expression, FormalParameterKind,
        FormalParameters, FunctionBody, FunctionType, NullLiteral, Statement,
    },
    semantic::{Reference, ScopeId},
    span::{Span, SPAN},
};
use oxc_traverse::Traverse;

// porting
// https://github.com/hi-ogawa/vite-plugins/blob/main/packages/transforms/src/hoist.ts

pub struct HoistTransformer<'a> {
    directive: &'a str,
    runtime: &'a str,
    id: &'a str,
    hoisted_functions: Vec<Statement<'a>>,
}

impl<'a> HoistTransformer<'a> {
    pub fn new(directive: &'a str, runtime: &'a str, id: &'a str) -> Self {
        Self {
            directive,
            runtime,
            id,
            hoisted_functions: vec![],
        }
    }
}

//
// collect references which are neither global nor in own scope
// TODO: probably relying on "span" is not robust.
//
fn get_bind_vars<'a>(ctx: &mut oxc_traverse::TraverseCtx<'a>, span: Span) -> Vec<Reference> {
    let mut bind_vars: Vec<Reference> = vec![];
    let ancestors: BTreeSet<ScopeId> = ctx.scopes().ancestors(ctx.current_scope_id()).collect();
    for reference in &ctx.symbols().references {
        // pick reference used inside
        let ref_span = reference.span();
        if !(span.start <= ref_span.start && ref_span.end <= span.end) {
            continue;
        }
        if let Some(symbol_id) = reference.symbol_id() {
            // pick symbol defined outside except top level one
            let scope_id = ctx.symbols().get_scope_id(symbol_id);
            let scope_flags = ctx.scopes().get_flags(scope_id);
            if !scope_flags.is_top() && ancestors.contains(&scope_id) {
                bind_vars.push(reference.clone());
            }
        }
    }
    bind_vars
}

fn has_directive(body: &FunctionBody, directive: &str) -> bool {
    body.directives
        .iter()
        .any(|e| e.expression.value == directive)
}

// create action register and bind expression
//   $$register($$hoist, "<id>", "$$hoist").bind(null, <args>)
fn ast_register_bind_expression<'a>(
    ctx: &mut oxc_traverse::TraverseCtx<'a>,
    id: &str,
    runtime: &str,
    name: &str,
    bind_vars: &Vec<Reference>,
) -> Expression<'a> {
    // $$register(...)
    let mut expr = ctx.ast.call_expression(
        SPAN,
        ctx.ast
            .identifier_reference_expression(ctx.ast.identifier_reference(SPAN, runtime)),
        ctx.ast.new_vec_from_iter([
            Argument::from(
                ctx.ast
                    .identifier_reference_expression(ctx.ast.identifier_reference(SPAN, name)),
            ),
            Argument::from(
                ctx.ast
                    .literal_string_expression(ctx.ast.string_literal(SPAN, id)),
            ),
            Argument::from(
                ctx.ast
                    .literal_string_expression(ctx.ast.string_literal(SPAN, name)),
            ),
        ]),
        false,
        None,
    );

    if bind_vars.len() > 0 {
        // $$register(...).bind(...)
        let mut arguments = ctx.ast.new_vec_single(Argument::from(
            ctx.ast.literal_null_expression(NullLiteral::new(SPAN)),
        ));
        for var in bind_vars {
            arguments.push(Argument::from(ctx.ast.identifier_reference_expression(
                ctx.ast.identifier_reference(SPAN, var.name()),
            )))
        }
        expr = ctx.ast.call_expression(
            SPAN,
            ctx.ast.static_member_expression(
                SPAN,
                expr,
                ctx.ast.identifier_name(SPAN, "bind"),
                false,
            ),
            arguments,
            false,
            None,
        );
    }
    expr
}

// create hoisted function declarations
//   export function $$hoist(...) { ... }
fn ast_hoist_declaration<'a>(
    ctx: &mut oxc_traverse::TraverseCtx<'a>,
    span: Span,
    name: &str,
    params: &FormalParameters<'a>,
    body: &FunctionBody<'a>,
    bind_vars: &Vec<Reference>,
) -> Statement<'a> {
    let mut new_param_items = ctx.ast.new_vec_from_iter(bind_vars.iter().map(|var| {
        ctx.ast.formal_parameter(
            SPAN,
            ctx.ast.binding_pattern(
                ctx.ast.binding_pattern_identifier(BindingIdentifier::new(
                    SPAN,
                    ctx.ast.new_atom(var.name()),
                )),
                None,
                false,
            ),
            None,
            false,
            false,
            ctx.ast.new_vec(),
        )
    }));
    new_param_items.extend(ctx.ast.copy(&params.items));

    let new_func = ctx.ast.function(
        FunctionType::FunctionDeclaration,
        span,
        Some(BindingIdentifier::new(SPAN, ctx.ast.new_atom(name))),
        false,
        true,
        false,
        None,
        ctx.ast.formal_parameters(
            params.span,
            FormalParameterKind::FormalParameter,
            new_param_items,
            None,
        ),
        Some(ctx.ast.function_body(
            body.span,
            ctx.ast.new_vec(),
            // TODO: move?
            ctx.ast.copy(&body.statements),
        )),
        None,
        None,
    );
    Statement::ExportNamedDeclaration(ctx.ast.plain_export_named_declaration_declaration(
        SPAN,
        Declaration::FunctionDeclaration(new_func),
    ))
}

impl<'a> Traverse<'a> for HoistTransformer<'a> {
    fn exit_expression(
        &mut self,
        expr: &mut Expression<'a>,
        ctx: &mut oxc_traverse::TraverseCtx<'a>,
    ) {
        match expr {
            Expression::ArrowFunctionExpression(node) => {
                if has_directive(&node.body, &self.directive) {
                    // replace function definition with action register and bind
                    //   $$register($$hoist, "<id>", "$$hoist").bind(null, <args>)
                    let new_name = format!("$$hoist_{}", self.hoisted_functions.len());
                    let bind_vars = get_bind_vars(ctx, node.span);
                    let new_expr = ast_register_bind_expression(
                        ctx,
                        &self.id,
                        &self.runtime,
                        &new_name,
                        &bind_vars,
                    );

                    // save functions to be hoisted
                    //   export function $$hoist(...) { ... }
                    self.hoisted_functions.push(ast_hoist_declaration(
                        ctx,
                        node.span,
                        &new_name,
                        &node.params,
                        &node.body,
                        &bind_vars,
                    ));

                    *expr = new_expr;
                }
            }
            Expression::FunctionExpression(node) => {
                if let Some(body) = &node.body {
                    if has_directive(&body, &self.directive) {
                        let new_name = format!("$$hoist_{}", self.hoisted_functions.len());
                        let bind_vars = get_bind_vars(ctx, node.span);
                        let new_expr = ast_register_bind_expression(
                            ctx,
                            &self.id,
                            &self.runtime,
                            &new_name,
                            &bind_vars,
                        );

                        self.hoisted_functions.push(ast_hoist_declaration(
                            ctx,
                            node.span,
                            &new_name,
                            &node.params,
                            node.body.as_ref().unwrap(),
                            &bind_vars,
                        ));

                        *expr = new_expr;
                    }
                }
            }
            _ => {}
        }
    }

    fn exit_statement(
        &mut self,
        stmt: &mut Statement<'a>,
        ctx: &mut oxc_traverse::TraverseCtx<'a>,
    ) {
        match stmt {
            Statement::FunctionDeclaration(node) => {
                if let (Some(body), Some(name)) = (&node.body, &node.id) {
                    if has_directive(&body, &self.directive) {
                        let new_name = format!("$$hoist_{}", self.hoisted_functions.len());
                        let bind_vars = get_bind_vars(ctx, node.span);
                        let new_expr = ast_register_bind_expression(
                            ctx,
                            &self.id,
                            &self.runtime,
                            &new_name,
                            &bind_vars,
                        );

                        // const <name> = $$register(...)
                        let new_stmt =
                            Statement::VariableDeclaration(ctx.ast.variable_declaration(
                                SPAN,
                                oxc::ast::ast::VariableDeclarationKind::Const,
                                ctx.ast.new_vec_single(ctx.ast.variable_declarator(
                                    SPAN,
                                    oxc::ast::ast::VariableDeclarationKind::Const,
                                    ctx.ast.binding_pattern(
                                        ctx.ast.binding_pattern_identifier(name.clone()),
                                        None,
                                        false,
                                    ),
                                    Some(new_expr),
                                    true,
                                )),
                                false,
                            ));

                        self.hoisted_functions.push(ast_hoist_declaration(
                            ctx,
                            node.span,
                            &new_name,
                            &node.params,
                            node.body.as_ref().unwrap(),
                            &bind_vars,
                        ));

                        *stmt = new_stmt;
                    }
                }
            }
            _ => {}
        }
    }

    fn exit_program(
        &mut self,
        program: &mut oxc::ast::ast::Program<'a>,
        ctx: &mut oxc_traverse::TraverseCtx<'a>,
    ) {
        for stmt in &mut self.hoisted_functions {
            program.body.push(ctx.ast.move_statement(stmt));
        }
    }
}

#[cfg(test)]
mod tests {
    use std::fs;

    use base64::{engine::general_purpose::STANDARD, Engine as _};
    use oxc::{
        allocator::Allocator,
        codegen::{CodeGenerator, CodegenReturn},
        parser::Parser,
        span::SourceType,
    };
    use oxc_traverse::traverse_mut;

    use super::HoistTransformer;

    #[test]
    fn test_hoist_snapshot() {
        insta::glob!("../tests/hoist", "*.js", |path| {
            let source_text = fs::read_to_string(path).unwrap();
            let name = path.file_stem().unwrap().to_str().unwrap();

            let allocator = Allocator::default();
            let source_type = SourceType::default().with_module(true);
            let parser = Parser::new(&allocator, &source_text, source_type);
            let parser_ret = parser.parse();
            assert_eq!(parser_ret.errors.len(), 0);
            let mut program = parser_ret.program;
            let mut traverser = HoistTransformer::new("use server", "$$register", "<id>");
            traverse_mut(
                &mut traverser,
                &mut program,
                &source_text,
                source_type,
                &allocator,
            );
            let codegen_ret = CodeGenerator::new()
                .enable_source_map("test.js", &source_text)
                .build(&program);

            if std::env::var("DEBUG_SOURCEMAP").is_ok() {
                let output = to_source_map_debug(&codegen_ret);
                fs::write(path.parent().unwrap().join(format!("{name}.debug")), output).unwrap();
            }

            insta::with_settings!({
                prepend_module_to_snapshot => false,
                omit_expression => true,
                snapshot_suffix => "",
                snapshot_path => path.parent().unwrap()
            }, {
                insta::assert_snapshot!(name, codegen_ret.source_text);
            });
        });
    }

    fn to_source_map_debug(result: &CodegenReturn) -> String {
        // https://github.com/oxc-project/oxc/blob/a6487482bc053797f7f1a42f5793fafbd9a47114/crates/oxc_codegen/examples/sourcemap.rs#L34-L44
        let source_map = result.source_map.as_ref().unwrap();
        let source_map_json = source_map.to_json_string().unwrap();
        let evanw_hash = STANDARD.encode(format!(
            "{}\0{}{}\0{}",
            result.source_text.len(),
            result.source_text,
            source_map_json.len(),
            source_map_json
        ));
        let evanw_url = format!("https://evanw.github.io/source-map-visualization/#{evanw_hash}");
        return format!(
            "{}\n// {}\n//# sourceMappingURL={}\n",
            &result.source_text,
            &evanw_url,
            source_map.to_data_url().unwrap()
        );
    }
}
