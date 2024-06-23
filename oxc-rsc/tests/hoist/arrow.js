let count = 0;

export function Counter() {
	return {
		type: "form",
		action: (formData) => {
			"use server";
			count += Number(formData.get("name"));
		},
	};
}
