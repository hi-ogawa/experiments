pub mod hoist;
pub mod proxy_export;

pub fn add(x: usize, y: usize) -> usize {
    x + y
}

#[test]
fn test_add() {
    let result = add(2, 2);
    assert_eq!(result, 4);
}
