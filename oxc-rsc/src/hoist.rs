use std::{borrow::BorrowMut, ops::DerefMut};

use oxc::{
    ast::ast::{
        Argument, BindingIdentifier, Declaration, Expression, FormalParameterKind, Function,
        FunctionType, NullLiteral, Statement,
    },
    span::SPAN,
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

impl<'a> Traverse<'a> for HoistTransformer<'a> {
    // Expression::ArrowFunctionExpression
    fn exit_expression(
        &mut self,
        expr: &mut Expression<'a>,
        ctx: &mut oxc_traverse::TraverseCtx<'a>,
    ) {
        match expr {
            Expression::ArrowFunctionExpression(node) => {
                // check "use server"
                if node
                    .body
                    .directives
                    .iter()
                    .any(|e| e.expression.value == self.directive)
                {
                    //
                    // collect references which are neither global nor in own scope
                    //
                    let mut bind_vars: Vec<String> = vec![];
                    // TODO: should loop only references inside the function
                    for reference in &ctx.symbols().references {
                        // filter used inside (TODO: probably shouldn't rely on span?)
                        let ref_span = reference.span();
                        if !(node.span.start <= ref_span.start && ref_span.end <= node.span.end) {
                            continue;
                        }
                        if let Some(symbol_id) = reference.symbol_id() {
                            // filter defined outside
                            let sym_span = ctx.symbols().get_span(symbol_id);
                            if node.span.start <= sym_span.start && sym_span.end <= node.span.end {
                                continue;
                            }
                            let scope_id = ctx.symbols().get_scope_id(symbol_id);
                            let scope_flags = ctx.scopes().get_flags(scope_id);
                            // skip top level symbol
                            if scope_flags.is_top() {
                                continue;
                            }
                            bind_vars.push(reference.name().to_string());
                        }
                    }

                    //
                    // replace function definition with action register and bind
                    //   $$register($$hoist, "<id>", "$$hoist").bind(null, <args>)
                    //

                    // $$register(...)
                    let new_name = format!("$$hoist_{}", self.hoisted_functions.len());
                    let mut new_expr =
                        ctx.ast.call_expression(
                            SPAN,
                            ctx.ast.identifier_reference_expression(
                                ctx.ast.identifier_reference(SPAN, &self.runtime),
                            ),
                            ctx.ast.new_vec_from_iter([
                                Argument::from(ctx.ast.identifier_reference_expression(
                                    ctx.ast.identifier_reference(SPAN, &new_name.clone()),
                                )),
                                Argument::from(ctx.ast.literal_string_expression(
                                    ctx.ast.string_literal(SPAN, &self.id),
                                )),
                                Argument::from(ctx.ast.literal_string_expression(
                                    ctx.ast.string_literal(SPAN, &new_name),
                                )),
                            ]),
                            false,
                            None,
                        );

                    if bind_vars.len() > 0 {
                        // $$register(...).bind(...)
                        let mut arguments = ctx.ast.new_vec_single(Argument::from(
                            ctx.ast.literal_null_expression(NullLiteral::new(SPAN)),
                        ));
                        for var in bind_vars.clone() {
                            arguments.push(Argument::from(ctx.ast.identifier_reference_expression(
                                ctx.ast.identifier_reference(SPAN, var.as_str()),
                            )))
                        }
                        new_expr = ctx.ast.call_expression(
                            SPAN,
                            ctx.ast.static_member_expression(
                                SPAN,
                                new_expr,
                                ctx.ast.identifier_name(SPAN, "bind"),
                                false,
                            ),
                            arguments,
                            false,
                            None,
                        );
                    }

                    //
                    // create new function to be hoisted at the end
                    //
                    let mut new_param_items =
                        ctx.ast.new_vec_from_iter(bind_vars.iter().map(|var| {
                            ctx.ast.formal_parameter(
                                SPAN,
                                ctx.ast.binding_pattern(
                                    ctx.ast.binding_pattern_identifier(BindingIdentifier::new(
                                        SPAN,
                                        ctx.ast.new_atom(&var),
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
                    new_param_items.extend(ctx.ast.copy(&node.params.items));

                    let new_func = ctx.ast.function(
                        FunctionType::FunctionDeclaration,
                        node.span,
                        Some(BindingIdentifier::new(SPAN, ctx.ast.new_atom(&new_name))),
                        false,
                        node.r#async,
                        false,
                        None,
                        ctx.ast.formal_parameters(
                            node.params.span,
                            FormalParameterKind::FormalParameter,
                            new_param_items,
                            None,
                        ),
                        Some(ctx.ast.function_body(
                            node.body.span,
                            ctx.ast.new_vec(),
                            ctx.ast.move_statement_vec(&mut node.body.statements),
                        )),
                        None,
                        None,
                    );
                    self.hoisted_functions
                        .push(Statement::ExportNamedDeclaration(
                            ctx.ast.plain_export_named_declaration_declaration(
                                SPAN,
                                Declaration::FunctionDeclaration(new_func),
                            ),
                        ));

                    *expr = new_expr;
                }
            }
            _ => {}
        }
    }

    // Statement::FunctionDeclaration
    fn exit_statement(
        &mut self,
        stmt: &mut Statement<'a>,
        ctx: &mut oxc_traverse::TraverseCtx<'a>,
    ) {
        match stmt {
            Statement::FunctionDeclaration(node) => {
                if let (Some(body), Some(name)) = (&node.body, &node.id) {
                    // check "use server"
                    if body
                        .directives
                        .iter()
                        .any(|e| e.expression.value == self.directive)
                    {
                        let new_name = format!("$$hoist_{}", self.hoisted_functions.len());

                        // $$register(...)
                        let register_call = ctx.ast.call_expression(
                            SPAN,
                            ctx.ast.identifier_reference_expression(
                                ctx.ast.identifier_reference(SPAN, &self.runtime),
                            ),
                            ctx.ast.new_vec_from_iter([
                                Argument::from(ctx.ast.identifier_reference_expression(
                                    ctx.ast.identifier_reference(SPAN, &new_name.clone()),
                                )),
                                Argument::from(ctx.ast.literal_string_expression(
                                    ctx.ast.string_literal(SPAN, &self.id),
                                )),
                                Argument::from(ctx.ast.literal_string_expression(
                                    ctx.ast.string_literal(SPAN, &new_name),
                                )),
                            ]),
                            false,
                            None,
                        );

                        // TODO: $$register(...).bind(...)

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
                                    Some(register_call),
                                    true,
                                )),
                                false,
                            ));

                        //
                        // create new function to be hoisted at the end
                        //
                        let Function {
                            span,
                            r#async,
                            params,
                            body,
                            ..
                        } = node.borrow_mut().deref_mut();
                        // TODO: bind_vars
                        let new_param_items = ctx.ast.copy(&params.items);
                        let body = body.as_mut().unwrap();
                        let new_func = ctx.ast.function(
                            FunctionType::FunctionDeclaration,
                            *span,
                            Some(BindingIdentifier::new(SPAN, ctx.ast.new_atom(&new_name))),
                            false,
                            *r#async,
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
                                ctx.ast.move_statement_vec(&mut body.statements),
                            )),
                            None,
                            None,
                        );
                        self.hoisted_functions
                            .push(Statement::ExportNamedDeclaration(
                                ctx.ast.plain_export_named_declaration_declaration(
                                    SPAN,
                                    Declaration::FunctionDeclaration(new_func),
                                ),
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
