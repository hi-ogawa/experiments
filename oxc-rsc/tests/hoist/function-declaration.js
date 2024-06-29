let count = 0;

export function Counter() {
	function action(formData) {
		"use server";
		count += Number(formData.get("name"));
	};
	return {
		type: "form",
		action,
	};
}
