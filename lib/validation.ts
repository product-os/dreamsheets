class ValidationError extends Error {}

import { FieldsWithOptionalFunction, parseRange } from './parse';

const configFields: FieldsWithOptionalFunction = [
	['Sheet name', 'sheetName'],
	['Column name', 'columnName'],
	['Identifier', 'identifier'],
	['Type', 'type'],
	[
		'Required',
		'required',
		(value) => typeof value !== 'string' || value.toLowerCase() !== 'false',
	],
];

interface ParsedConfig {
	sheetName: string;
	columnName: string;
	identifier: string;
	type: string;
	required: boolean;
}

interface ColumnTypeInfo {
	columnName: string;
	identifier: string;
	type: string;
	required: boolean;
}

interface ConfigByColumn {
	[columnName: string]: ColumnTypeInfo;
}

export function validateSheet(
	spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
	sheet: GoogleAppsScript.Spreadsheet.Sheet | null,
	sheetName: string,
	_dataToValidate?: any[][],
) {
	getConfigForSheet(spreadsheet, sheet, sheetName);
	// TODO: validate dataToValidate :-)
}

export function getConfigForSheet(
	spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
	sheet: GoogleAppsScript.Spreadsheet.Sheet | null,
	sheetName: string,
): ConfigByColumn | undefined {
	if (!sheet) {
		throw new ValidationError(
			`Sheet "${sheetName}" was not found in spreadsheet "${spreadsheet.getName()}"`,
		);
	}
	if (!sheetName || sheetName !== sheet.getName()) {
		throw new Error(`\
Validation inconsistency error: "${sheetName}" does not match "${sheet.getName()}".
This is likely to be a programming bug.`);
	}

	const configSheet = spreadsheet.getSheetByName('config');
	if (!configSheet) {
		console.log(`\
Warning: Skipping data type validation of "${spreadsheet.getName()}"
because it does not contain a "config" sheet/tab.`);
		return;
	}
	const configData = configSheet
		.getRange(1, 1, configSheet.getMaxRows(), configFields.length)
		.getValues();
	const parsedConfig: ParsedConfig[] = parseRange(configFields, configData);

	// Even though we are only meant to validate sheetName, we insist
	// that all sheet names found in the config sheet must exist.
	const sheetNames = new Set(parsedConfig.map((config) => config.sheetName));
	for (const name of sheetNames) {
		if (!spreadsheet.getSheetByName(name)) {
			throw new ValidationError(`\
Config data validation exists for sheet "${name}", but this sheet was
not found in spreadsheet "${spreadsheet.getName()}"`);
		}
	}

	const configByColumn: ConfigByColumn = {};

	for (const configObj of parsedConfig) {
		if (configObj.sheetName === sheetName) {
			configByColumn[configObj.columnName] = {
				columnName: configObj.columnName,
				identifier: configObj.identifier,
				type: configObj.type,
				required: configObj.required,
			};
		}
	}
	if (!Object.keys(configByColumn).length) {
		console.log(`\
Warning: Skipping data type validation of "${sheetName}" because it is not
listed in the "config" sheet/tab.`);
		return;
	}
	return configByColumn;
}
