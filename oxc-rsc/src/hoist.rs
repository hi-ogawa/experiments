use oxc::{allocator::Allocator, codegen::CodeGenerator, parser::Parser, span::SourceType};
use oxc_traverse::{traverse_mut, Traverse};

pub struct HoistTransformer;

impl<'a> Traverse<'a> for HoistTransformer {}

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

    let mut traverser = HoistTransformer;
    traverse_mut(
        &mut traverser,
        &mut program,
        source_text,
        source_type,
        &allocator,
    );
    let codegen_ret = CodeGenerator::new().build(&program);
    println!("{}", &codegen_ret.source_text);
}
