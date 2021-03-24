import { expect } from './chai';
import { parseRange } from '../lib/index';
import { FieldsWithOptionalFunction } from '../lib/parse';

describe('parseRange', function () {
	const exampleDataFields: FieldsWithOptionalFunction = [
		['Github handle', 'githubHandle'],
		['IANA time zone', 'IANATimeZone'],
		['Valid from', 'validFrom'],
		['Valid to', 'validTo'],
	];
	const exampleRawData = [
		['Github handle', 'IANA time zone', 'Valid from', 'Valid to'],
		['ann', 'Asia/Tokyo', '2019-05-01', '2019-05-30'],
		['bob', 'Asia/Hong_Kong', '2019-04-22', '2019-05-30'],
		['', '', '', ''],
	];

	it('should produced the expected output', function () {
		const expected = [
			{
				IANATimeZone: 'Asia/Tokyo',
				githubHandle: 'ann',
				validFrom: '2019-05-01',
				validTo: '2019-05-30',
			},
			{
				IANATimeZone: 'Asia/Hong_Kong',
				githubHandle: 'bob',
				validFrom: '2019-04-22',
				validTo: '2019-05-30',
			},
		];
		const result = parseRange(exampleDataFields, exampleRawData);
		expect(result).to.have.deep.members(expected);
	});
});
