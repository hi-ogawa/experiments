export default async function loader(_input) {
	this.cacheable(false);
	return this.getOptions().load();
}
