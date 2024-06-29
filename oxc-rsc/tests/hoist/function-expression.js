let count = 0;

export function Counter() {
	return {
		type: "form",
		// TODO: FunctionExpression
		action: function (formData) {
			"use server";
			count += Number(formData.get("name"));
		},
	};
}
