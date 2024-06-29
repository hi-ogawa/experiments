const x = "x";

const f = async () => {
	"use server";
	return x;
};

async function f2() {
  "use server";
  return x;
}

const g = async () => {};

async function g2() {}

const h = async (formData) => {
	"use server";
	return formData.get(x);
};

async function h2(formData) {
  "use server";
  return formData.get(x);
}
