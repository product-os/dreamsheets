interface Dictionary<T> {
	[key: string]: T;
}

type FieldsWithOptionalFunction = Array<
	[string, string] | [string, string, (...args: any) => any]
>;

const identity = <T>(arg: T) => {
	return arg;
};

export function parseRange(
	fields: FieldsWithOptionalFunction,
	data: any[][],
): any[] {
	const header = data[0];
	for (let i = 0; i < fields.length; i++) {
		if (header[i] !== fields[i][0]) {
			throw new Error(
				'Unexpected column name. Expected: ' +
					JSON.stringify(fields[i][0]) +
					' Got: ' +
					JSON.stringify(header[i]),
			);
		}
	}

	const ret = [];
	for (let i = 1; i < data.length; i++) {
		if (data[i][0] === '') {
			break;
		}
		const obj: Dictionary<any> = {};
		for (let j = 0; j < fields.length; j++) {
			const transform = fields[j][2] || identity;
			obj[fields[j][1]] = transform(data[i][j]);
		}
		ret.push(obj);
	}
	return ret;
}
