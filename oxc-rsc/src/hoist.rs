use oxc::{
    ast::ast::{
        Argument, BindingIdentifier, Expression, FormalParameterKind, FunctionType, Modifiers,
        NullLiteral,
    },
    span::SPAN,
};
use oxc_traverse::Traverse;

pub struct HoistTransformer<'a> {
    directive: &'a str,
    runtime: &'a str,
    id: &'a str,
    hoisted_functions: Vec<(String, Vec<String>, Expression<'a>)>,
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
    fn exit_expression(
        &mut self,
        expr: &mut Expression<'a>,
        ctx: &mut oxc_traverse::TraverseCtx<'a>,
    ) {
        match expr {
            // TODO: also FunctionExpression, FunctionDeclaration
            Expression::ArrowFunctionExpression(node) => {
                // check "use server"
                if node
                    .body
                    .directives
                    .iter()
                    .any(|e| e.expression.value == self.directive)
                {
                    let new_name = format!("$$hoist_{}", self.hoisted_functions.len());

                    // collect variables which are neither global nor in own scope
                    // TODO
                    // - collect identifier references inside node.body
                    // - check where it lives e.g.
                    //     [global] count
                    //     [local] formData, inner
                    //     [others] outer1, outer2 <-- these needs to be bound
                    let bind_vars = vec!["outer1".to_string(), "outer2".to_string()];

                    //
                    // replace function definition with action register and bind
                    //   $$register($$hoist, "<id>", "$$hoist").bind(null, <args>)
                    //

                    // $$register(...)
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
                    // save function definition to hoist it at the end
                    //
                    let original_expr = ctx.ast.move_expression(expr);
                    self.hoisted_functions
                        .push((new_name, bind_vars, original_expr));

                    *expr = new_expr;
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
        // append hosited function declarations
        for (hoist_name, bind_vars, func) in &mut self.hoisted_functions {
            match func {
                Expression::ArrowFunctionExpression(node) => {
                    let mut params = ctx.ast.new_vec_from_iter(bind_vars.iter().map(|var| {
                        ctx.ast.formal_parameter(
                            SPAN,
                            ctx.ast.binding_pattern(
                                ctx.ast.binding_pattern_identifier(BindingIdentifier::new(
                                    SPAN,
                                    ctx.ast.new_atom(var.as_str()),
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
                    params.extend(ctx.ast.copy(&node.params.items));

                    program
                        .body
                        .push(ctx.ast.function_declaration(ctx.ast.function(
                            FunctionType::FunctionDeclaration,
                            SPAN,
                            Some(BindingIdentifier::new(
                                SPAN,
                                ctx.ast.new_atom(hoist_name.as_str()),
                            )),
                            false,
                            true,
                            None,
                            ctx.ast.formal_parameters(
                                SPAN,
                                FormalParameterKind::FormalParameter,
                                params,
                                None,
                            ),
                            Some(ctx.ast.function_body(
                                SPAN,
                                ctx.ast.new_vec(),
                                ctx.ast.move_statement_vec(&mut node.body.statements),
                            )),
                            None,
                            None,
                            Modifiers::empty(),
                        )));
                }
                _ => {}
            }
        }
    }
}

#[test]
fn test_traverse() {
    use base64::{engine::general_purpose::STANDARD, Engine as _};
    use oxc::{allocator::Allocator, codegen::CodeGenerator, parser::Parser, span::SourceType};
    use oxc_traverse::traverse_mut;

    let source_text = r#"
let count = 0;

function Counter() {
  const outer1 = 0;
  const outer2 = 0;

  return {
    type: "form",
    action: (formData) => {
      "use server";
      const inner = 0;
      count += Number(formData.get("name"));
      count += inner;
      count += outer1;
      count += outer2;
    }
  }
}
"#;
    let allocator = Allocator::default();
    let source_type = SourceType::default().with_module(true);
    let parser = Parser::new(&allocator, source_text, source_type);
    let parser_ret = parser.parse();
    assert_eq!(parser_ret.errors.len(), 0);
    let mut program = parser_ret.program;
    let mut traverser = HoistTransformer::new("use server", "$$register", "<id>");
    traverse_mut(
        &mut traverser,
        &mut program,
        source_text,
        source_type,
        &allocator,
    );
    let codegen_ret = CodeGenerator::new()
        .enable_source_map("test.js", &source_text)
        .build(&program);
    let output = codegen_ret.source_text;
    insta::assert_snapshot!(output);

    // source map viz
    // https://github.com/oxc-project/oxc/blob/a6487482bc053797f7f1a42f5793fafbd9a47114/crates/oxc_codegen/examples/sourcemap.rs#L34-L44
    let source_map = codegen_ret.source_map.unwrap().to_json_string().unwrap();
    let hash = STANDARD.encode(format!(
        "{}\0{}{}\0{}",
        output.len(),
        output,
        source_map.len(),
        source_map
    ));
    println!("https://evanw.github.io/source-map-visualization/#{hash}");
}
