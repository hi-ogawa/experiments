pub fn add(x: isize, y: isize) -> isize {
    x + y
}

#[cfg(test)]
mod tests {
    use super::add;

    #[test]
    fn test_add() {
        assert_eq!(add(1, 2), 3);
    }
}
