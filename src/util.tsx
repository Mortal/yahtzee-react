export function classNames(v: {[className: string]: any}) {
	let c = "";
	for (let k in v) {
		if (v[k]) c += k + " ";
	}
	return c.substring(0, c.length - 1);
}
