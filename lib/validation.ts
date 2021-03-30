import { FieldsWithOptionalFunction, parseRange } from './parse';

export class ValidationError extends Error {}

export const TRUE_VALUES = ['true', 'yes'];
export const FALSE_VALUES = ['false', 'no'];
export const BOOL_VALUES = [...TRUE_VALUES, ...FALSE_VALUES];
export const GSHEET_TYPES = ['string', 'number', 'date', 'boolean'];

/** Fields of the special `config` sheet used for data validation. */
const configFields: FieldsWithOptionalFunction = [
	['Sheet name', 'sheetName'],
	['Column name', 'columnName'],
	['Identifier', 'identifier'],
	['Type', 'type'],
	[
		'Required',
		'required',
		(value) =>
			typeof value === 'boolean'
				? value
				: typeof value !== 'string' || !FALSE_VALUES.includes(value),
	],
];

/**
 * metaConfig: A hardcoded `config` sheet that specifies the data types
 * of the config sheet itself, in order to validate the config sheet.
 */
const metaConfig = [
	['Sheet name', 'Column name', 'Identifier', 'Type', 'Required'],
	['config', 'Sheet name', 'sheetName', 'string', 'true'],
	['config', 'Column name', 'columnName', 'string', 'true'],
	['config', 'Identifier', 'identifier', 'string', 'true'],
	['config', 'Type', 'type', 'string', 'true'],
	['config', 'Required', 'required', 'boolean', 'true'],
];

/**
 * `config` sheet caching to speed up validation of multiple sheets
 * in the same script execution. Also avoids loading the config sheet
 * twice during recursive validation of the config sheet itself.
 */
class CachedConfig {
	constructor(
		public configSheet: GoogleAppsScript.Spreadsheet.Sheet | null = null,
		public configData: any[][] = [],
		public parsedConfig: ParsedConfig[] = [],
	) {}

	static bySpreadsheetId: {
		[spreadsheetId: string]: CachedConfig;
	} = {};

	get(
		spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
		spreadsheetId = spreadsheet.getId(),
	): CachedConfig {
		let cachedConfig = CachedConfig.bySpreadsheetId[spreadsheetId];
		if (!cachedConfig) {
			const configSheet = spreadsheet.getSheetByName('config');
			cachedConfig = new CachedConfig(configSheet);
			CachedConfig.bySpreadsheetId[spreadsheetId] = cachedConfig;
			if (configSheet) {
				cachedConfig.configData = configSheet
					.getRange(1, 1, configSheet.getMaxRows(), configFields.length)
					.getValues();
				cachedConfig.parsedConfig = parseRange(
					configFields,
					cachedConfig.configData,
				);
				// note that validateConfigSheetItself() will recursively call
				// this get() method, but will then get a cache hit.
				validateConfigSheetItself(
					spreadsheet,
					configSheet,
					cachedConfig.configData,
					cachedConfig.parsedConfig,
				);
			}
		}
		return cachedConfig;
	}
}

const configCache = new CachedConfig();

/** Parsed representation of the `config` sheet itself */
interface ParsedConfig {
	sheetName: string;
	columnName: string;
	identifier: string;
	type: string;
	required: string;
}

/** `config` details for a specific column of the sheet to validate */
interface ColumnTypeInfo {
	columnName: string;
	identifier: string;
	type: string;
	required: boolean;
}

export interface ConfigByColumn {
	[columnName: string]: ColumnTypeInfo;
}

/**
 * Validate the given sheet (tab) against the "schema" defined in a special
 * `config` sheet/tab in the same spreadsheet.
 * @param spreadsheet The Spreadsheet object containing the sheet to validate
 * @param sheet The Sheet object (tab) to validate
 * @param dataToValidate Sheet contents as a nested array (as produced by
 * Sheet.getRange().getValues())
 * @returns ConfigByColumn object if a `config` sheet exists
 */
export function validateSheet(
	spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
	sheet: GoogleAppsScript.Spreadsheet.Sheet,
	dataToValidate: any[][],
): ConfigByColumn | undefined {
	const sheetName = sheet.getName();
	const configByColumn = getConfigForSheet(spreadsheet, sheetName);
	if (!configByColumn) {
		return;
	}
	let endOfSheet = false;
	let header: string[] = []; // column names
	for (const row of dataToValidate) {
		endOfSheet ||= isBlank(row[0]);
		if (endOfSheet) {
			if (!isBlank(row[0])) {
				throw new ValidationError(`\
Validation error: non-empty cell found after empty cell in first column of sheet "${sheetName}".
An empty cell in the first column is used to indicate the end of the sheet.`);
			}
			continue;
		}
		if (!header.length) {
			validateHeader(row, configByColumn, sheetName);
			header = row;
			continue;
		}
		validateRow(row, header, configByColumn, sheetName);
	}

	return configByColumn;
}

/** Validate the header (row of column names) of a sheet */
function validateHeader(
	row: any[],
	configByColumn: ConfigByColumn,
	sheetName: string,
) {
	const expectedCols = Object.keys(configByColumn);
	if (row.length !== expectedCols.length) {
		throw new ValidationError(`\
Validation error: Expected a header row to contain ${
			expectedCols.length
		} column names,
but found ${row.length} column names instead.
Expected column names: "${expectedCols.sort().join('", "')}"
Found column names: "${row.sort().join('", "')}"`);
	}
	for (const col of row) {
		if (!configByColumn[col]) {
			throw new ValidationError(`\
Validation error: column "${col}" of sheet "${sheetName}" not found in "config" sheet.
Expected column names: "${expectedCols.sort().join('", "')}"
Found column names: "${row.sort().join('", "')}"`);
		}
	}
}

/** Validate a data row (not the header) of a sheet */
function validateRow(
	row: any[],
	header: any[],
	configByColumn: ConfigByColumn,
	sheetName: string,
) {
	let colIndex = 0;
	for (const col of row) {
		const colName = header[colIndex++];
		const colType = typeof col;
		const config = configByColumn[colName];

		if (isBlank(col)) {
			if (config.required) {
				throw new ValidationError(`\
Validation error: blank cell found in column "${colName}" of sheet "${sheetName}",
but the "config" sheet specifies that a value is required.`);
			}
			continue; // empty and not required
		}

		if (config.type === 'boolean') {
			parseBoolean(col, `in column "${colName}" of sheet "${sheetName}"`);
		} else if (config.type === 'date') {
			if (!(col instanceof Date)) {
				const foundType =
					colType === 'object' ? col?.constructor?.name || 'object' : colType;
				throw new ValidationError(`\
Validation error: mismatched data type in column "${colName}" of sheet "${sheetName}".
Expected "Date", found "${foundType}".
Cell value: "${col}"`);
			}
		} else if (config.type !== colType) {
			throw new ValidationError(`\
Validation error: mismatched data type in column "${colName}" of sheet "${sheetName}".
Expected "${config.type}", found "${colType}".
Cell value: "${col}"`);
		}
	}
}

/** Compute a ConfigByColumn object for the given sheetName (tab name). */
export function getConfigForSheet(
	spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
	sheetName: string,
): ConfigByColumn | undefined {
	const cachedConfig = configCache.get(spreadsheet);
	if (!cachedConfig.configSheet) {
		console.log(`\
Warning: Skipping data type validation of "${spreadsheet.getName()}"
because it does not contain a "config" sheet/tab.`);
		return;
	}
	const configByColumn: ConfigByColumn = {};
	const parsedConfig: ParsedConfig[] =
		sheetName === 'config'
			? parseRange(configFields, metaConfig)
			: cachedConfig.parsedConfig;

	for (const configObj of parsedConfig) {
		if (configObj.sheetName === sheetName) {
			configByColumn[configObj.columnName] = {
				columnName: configObj.columnName.trim(),
				identifier: configObj.identifier.trim(),
				type: configObj.type.trim().toLowerCase(),
				required: parseBoolean(
					configObj.required,
					`in column "Required" of sheet "config"`,
				),
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

/**
 * Validate the `config` sheet itself, by recursively calling
 * validateSheet() and then performing a few extra checks.
 */
function validateConfigSheetItself(
	spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
	configSheet: GoogleAppsScript.Spreadsheet.Sheet,
	configData: any[][],
	parsedConfig: ParsedConfig[],
) {
	validateSheet(spreadsheet, configSheet, configData);
	const sheetNames: Set<string> = new Set();

	for (const configObj of parsedConfig) {
		sheetNames.add(configObj.sheetName);
		if (!GSHEET_TYPES.includes(configObj.type.trim().toLowerCase())) {
			throw new ValidationError(`\
Uknown data type specification "${configObj.type}" in "config" sheet of
spreadsheet "${spreadsheet.getName()}".
Known data types are: "${GSHEET_TYPES.join('", ')}"`);
		}
	}
	// Validate that all sheet names found in the config sheet exist.
	for (const name of sheetNames) {
		if (!spreadsheet.getSheetByName(name)) {
			throw new ValidationError(`\
Config data validation exists for sheet "${name}", but this sheet was
not found in spreadsheet "${spreadsheet.getName()}"`);
		}
	}
}

/** Validate and parse true/false/yes/no as a boolean */
function parseBoolean(value: any, context?: string): boolean {
	if (typeof value === 'boolean') {
		return value;
	}
	function fail() {
		const msg = [
			`\
Validation error: Invalid boolean value representation: "${value}"
Valid representations are one of: "${BOOL_VALUES.join('", "')}"`,
		];
		if (context) {
			msg.push(context);
		}
		throw new ValidationError(msg.join('\n'));
	}
	if (typeof value !== 'string') {
		fail();
	}
	const normalized = value.toLowerCase();
	if (!BOOL_VALUES.includes(normalized)) {
		fail();
	}
	return TRUE_VALUES.includes(normalized);
}

/** Determine whether a cell value is blank */
function isBlank(value: any) {
	return value == null || (typeof value === 'string' && value.trim() === '');
}
