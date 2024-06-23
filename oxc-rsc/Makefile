# auto generate phony targets
.PHONY: $(shell grep --no-filename -E '^([a-zA-Z_-]|/)+:' $(MAKEFILE_LIST) | sed 's/:.*//')

lint:
	cargo fmt

lint-check:
	cargo fmt --check

test:
	cargo test

test-snap:
	cargo insta test --review
