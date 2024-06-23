const x = "x";

export const f = async () => {
	"use server";
	return x;
};
// export async function f() {
//   "use server";
//   return x;
// }

export const g = async () => {};
// export async function g() {}

export const h = async (formData) => {
	"use server";
	return formData.get(x);
};
// export async function h(formData) {
//   "use server";
//   return formData.get(x);
// }

// export default function w() {
//   "use server";
// }
