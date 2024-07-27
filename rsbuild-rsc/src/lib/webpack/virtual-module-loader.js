export default async function loader(_input) {
	this.cacheable(false);
	const { getCode } = this.getOptions();
	return getCode();
}
