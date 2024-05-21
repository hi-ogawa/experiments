import type * as estree from "estree";
import { walk } from "estree-walker";
import MagicString from "magic-string";
import * as periscopic from "periscopic";
import { parseAstAsync } from "vite";

// extend types for rollup ast with node position
declare module "estree" {
	interface BaseNode {
		start: number;
		end: number;
	}
}

export async function transformDirectiveProxy(input: string, id: string) {
	const ast: estree.Program = await parseAstAsync(input);
	const output = new MagicString(input);
	const names: string[] = [];

	// replace "use server" with "$$flight" proxy
	walk(ast, {
		enter(node) {
			// TODO: only top level function for now
			if (
				node.type === "FunctionDeclaration" &&
				getFunctionDirective(node.body.body) === SERVER_DIRECTIVE
			) {
				const name = node.id.name;
				names.push(name);
				const newCode = `const ${name} = $$flight("${id + "#" + name}")`;
				output.update(node.start, node.end, newCode);
				this.remove();
			}
		},
	});

	if (names.length === 0) {
		return;
	}

	transformDeadCodeElimination(ast, output);

	output.prepend(
		`import { createFlightLoader as $$flight } from "/src/integrations/flight/client";\n`,
	);

	return { output };
}

export async function transformDirectiveExpose(input: string) {
	// TODO: strip all exports
	// TODO: lift "use server" funciton
	// TODO: dead code elimination
	const ast = await parseAstAsync(input);
	ast;
}

function transformDeadCodeElimination(
	ast: estree.Program,
	output: MagicString,
) {
	// TODO: iterate
	const removeSet = new Set<estree.Node>();

	// remove unused decl
	const scopes = periscopic.analyze(ast);
	for (const [name, decl] of scopes.scope.declarations) {
		if (!scopes.scope.references.has(name)) {
			removeSet.add(decl);
		}
	}

	// remove empty import declaration
	walk(ast, {
		enter(node) {
			if (removeSet.has(node)) {
				this.remove();
			}
		},
		leave(node) {
			if (node.type === "ImportDeclaration") {
				if (node.specifiers.length === 0) {
					output.remove(node.start, node.end);
				}
			}
		},
	});
}

function getFunctionDirective(body: estree.Statement[]): string | undefined {
	const stmt = body[0];
	if (
		stmt &&
		stmt.type === "ExpressionStatement" &&
		stmt.expression.type === "Literal" &&
		typeof stmt.expression.value === "string"
	) {
		return stmt.expression.value;
	}
	return;
}

const SERVER_DIRECTIVE = "use server";
