use oxc::{
    allocator::Allocator,
    ast::{
        ast::{
            Argument, ArrayExpressionElement, BindingIdentifier, BindingPattern, Expression,
            FormalParameterKind, NullLiteral,
        },
        AstBuilder,
    },
    codegen::CodeGenerator,
    parser::Parser,
    span::{SourceType, SPAN},
};
use oxc_traverse::{traverse_mut, Traverse};

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
    fn enter_expression(
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
                    let new_name = format!("$hoist_{}", self.hoist_names.len());
                    self.hoist_names.push(new_name.clone());

                    // bind variables which are neither global nor in own scope
                    // TODO

                    // append a new `FunctionDeclaration` at the end
                    // TODO

                    //
                    // replace function definition with action register and bind
                    //   $$register($$hoist, "<id>", "$$hoist").bind(null, <args>)
                    //

                    // $$register(...)
                    let new_expr =
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

                    // $$register(...).bind(...)
                    let new_expr = ctx.ast.call_expression(
                        SPAN,
                        ctx.ast.static_member_expression(
                            SPAN,
                            new_expr,
                            ctx.ast.identifier_name(SPAN, "bind"),
                            false,
                        ),
                        ctx.ast.new_vec_single(Argument::from(
                            ctx.ast.literal_null_expression(NullLiteral::new(SPAN)),
                        )),
                        false,
                        None,
                    );
                    *expr = new_expr;
                }
            }
            _ => {}
        }
    }
}

#[test]
fn test_traverse() {
    let source_text = r#"
let count = 0;

function Counter() {
  const name = "value";

  return {
    type: "form",
    action: (formData) => {
      "use server";
      count += Number(formData.get(name));
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
