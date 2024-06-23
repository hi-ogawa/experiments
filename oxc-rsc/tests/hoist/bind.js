let count = 0;

export function Counter() {
  const outer1 = 0;
  const outer2 = 0;

  return {
    type: "form",
    action: (formData) => {
      "use server";
      const inner = 0;
      count += Number(formData.get("name"));
      count += inner;
      count += outer1;
      count += outer2;
    }
  }
}
