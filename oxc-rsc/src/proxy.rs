use oxc::{allocator::Allocator, codegen::CodeGenerator, parser::Parser, span::SourceType};

pub fn proxy_transform(source_text: &str) -> String {
    let allocator = Allocator::default();
    let source_type = SourceType::default().with_module(true);
    let parser = Parser::new(&allocator, source_text, source_type);
    let parser_ret = parser.parse();
    assert_eq!(parser_ret.errors.len(), 0);
    let codegen_ret = CodeGenerator::new().build(&parser_ret.program);
    codegen_ret.source_text
}

#[test]
fn test_basic() {
    let input = "
export function TestFnDecl() {}
export const TestVarDecl = () => {}
export default function TestDefault() {}
";
    let result = proxy_transform(input);
    assert_eq!(
        result,
        "export function TestFnDecl() {}
export const TestVarDecl = () => {};
export default function TestDefault() {}"
    );
}
