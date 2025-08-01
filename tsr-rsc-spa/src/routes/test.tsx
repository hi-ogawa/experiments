export default async function TestPage() {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return <div>Test RSC (rendered at: {new Date().toISOString()})</div>;
}
