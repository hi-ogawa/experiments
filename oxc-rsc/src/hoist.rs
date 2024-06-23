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
    hoist_names: Vec<String>,
}

impl<'a> HoistTransformer<'a> {
    pub fn new(directive: &'a str, runtime: &'a str, id: &'a str) -> Self {
        Self {
            directive,
            runtime,
            id,
            hoist_names: vec![],
        }
    }
}

impl<'a> Traverse<'a> for HoistTransformer<'a> {
    fn exit_program(
        &mut self,
        node: &mut oxc::ast::ast::Program<'a>,
        ctx: &mut oxc_traverse::TraverseCtx<'a>,
    ) {
        // append hosited function declarations
        // TODO
        node.body.push(
            ctx.ast.function_declaration(
                ctx.ast.function(
                    FunctionType::FunctionDeclaration,
                    SPAN,
                    Some(BindingIdentifier::new(SPAN, "$$hoist_0".into())),
                    false,
                    true,
                    None,
                    ctx.ast.formal_parameters(
                        SPAN,
                        FormalParameterKind::FormalParameter,
                        ctx.ast.new_vec(),
                        None,
                    ),
                    Some(
                        ctx.ast
                            .function_body(SPAN, ctx.ast.new_vec(), ctx.ast.new_vec()),
                    ),
                    None,
                    None,
                    Modifiers::empty(),
                ),
            ),
        );
    }

    fn enter_expression(
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
                    let new_name = format!("$$hoist_{}", self.hoist_names.len());
                    self.hoist_names.push(new_name.clone());

                    // collect variables which are neither global nor in own scope
                    // TODO
                    // - collect identifier references inside node.body
                    // - check where it lives e.g.
                    //     [global] count
                    //     [local] formData, inner
                    //     [others] outer <-- this needs to be bound
                    let bind_vars = vec!["outer"];

                    // append a new `FunctionDeclaration` at the end
                    // TODO
                    // let original_expr = ctx.ast.move_expression(expr);

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
                        for var in bind_vars {
                            arguments.push(Argument::from(ctx.ast.identifier_reference_expression(
                                ctx.ast.identifier_reference(SPAN, var),
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

                    *expr = new_expr;
                }
            }
            _ => {}
        }
    }
}

#[test]
fn test_traverse() {
    use oxc::{allocator::Allocator, codegen::CodeGenerator, parser::Parser, span::SourceType};
    use oxc_traverse::traverse_mut;

    let source_text = r#"
let count = 0;

function Counter() {
  const outer = 0;

  return {
    type: "form",
    action: (formData) => {
      "use server";
      const inner = 0;
      count += Number(formData.get("name"));
      count += outer;
      count += inner;
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
    let codegen_ret = CodeGenerator::new().build(&program);
    insta::assert_snapshot!(codegen_ret.source_text);
}
