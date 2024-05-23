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

	// replace "use server" with "$$flight" proxy
	walk(ast, {
		enter(node, parent) {
			// TODO: only top level function for now
			if (
				parent?.type === "Program" &&
				node.type === "FunctionDeclaration" &&
				getFunctionDirective(node.body.body) === SERVER_DIRECTIVE
			) {
				const name = node.id.name;
				const newCode = `const ${name} = $$flight("${id + "#" + name}")`;
				output.update(node.start, node.end, newCode);
				this.remove();
			}
		},
	});

	transformDeadCodeElimination(ast, output);

	output.prepend(
		`import { createFlightLoader as $$flight } from "/src/integrations/flight/client";\n`,
	);

	return { output };
}

export async function transformDirectiveExpose(input: string) {
	const ast = await parseAstAsync(input);
	const output = new MagicString(input);

	// TODO: very rough...
	walk(ast, {
		enter(node, parent) {
			// strip `export`
			if (
				parent?.type === "Program" &&
				node.type === "ExportNamedDeclaration"
			) {
				output.remove(node.start, node.end);
				this.remove();
			}
			// export "use server"
			if (
				parent?.type === "Program" &&
				node.type === "FunctionDeclaration" &&
				getFunctionDirective(node.body.body) === SERVER_DIRECTIVE
			) {
				// strip "use server"
				output.update(node.body.body[0].start, node.body.body[0].end, `;`);
				output.appendLeft(node.start, "export ");
				const newNode: estree.ExportNamedDeclaration = {
					type: "ExportNamedDeclaration",
					start: node.start,
					end: node.end,
					specifiers: [],
					declaration: node,
				};
				this.replace(newNode);
				this.skip();
			}
		},
	});

	transformDeadCodeElimination(ast, output);

	return { output };
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
