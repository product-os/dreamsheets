type RangeTuple =
	| [number, number]
	| [number, number, number]
	| [number, number, number, number];


export function readSheet(
	sheetName: string,
	{
		range,
		ss,
	}: {
		range?: string | RangeTuple;
		ss?: GoogleAppsScript.Spreadsheet.Spreadsheet;
	} = {},
) {
	// If no spreadsheet provided, read the currently active spreadsheet:
	if (!ss) {
		ss = SpreadsheetApp.getActiveSpreadsheet();
	}
	const ssName = ss.getName();
	const sheet = ss.getSheetByName(sheetName);

	// Check for existence of sheet in spreadsheet:
	if (!sheet) {
		throw new Error(
			`Sheet "${sheetName}" does not exist in spreadsheet "${ssName}"!`,
		);
	}
	// Read data from sheet (if no range provided, default to the full data-containing range in the sheet):
	let rangeValues: any[][] = []
	if (!range) {
		rangeValues = sheet.getDataRange().getValues();
	} else {
		// The extended if-else blocks below constitute a workaround for this issue: https://github.com/microsoft/TypeScript/issues/14107
		if (typeof range === 'string') {
			rangeValues = sheet.getRange(range).getValues();
		} else if (range.length === 2) {
			rangeValues = sheet.getRange(...range).getValues();
		} else if (range.length === 3) {
			rangeValues = sheet.getRange(...range).getValues();
		} else if (range.length === 4) {
			rangeValues = sheet.getRange(...range).getValues();
		}
	}
	console.log(
		`Successfully read contents of sheet "${sheetName}" in spreadsheet "${ssName}".`,
	);
	return rangeValues;
}


export function writeToSheet(
	sheetName: string,
	writeArray: any[][],
	{
		startRow,
		startColumn,
		templateSheetName,
		ss,
		eraseAllDataInSheet,
		onlyWriteIfEmpty
	}: {
		startRow?: number,
		startColumn?: number,
		templateSheetName?: string,
		ss?: GoogleAppsScript.Spreadsheet.Spreadsheet,
		eraseAllDataInSheet?: boolean,		
		onlyWriteIfEmpty?: boolean
	} = {}
	) {
	// If no spreadsheet provided, read the currently active spreadsheet:
	if (!ss) {
		ss = SpreadsheetApp.getActiveSpreadsheet();
	}
	const ssName = ss.getName();
	let sheet = ss.getSheetByName(sheetName);

	// Check whether template was provided:
	let templateSheet
	if (templateSheetName) {
		templateSheet = ss.getSheetByName(templateSheetName)
		if (!templateSheet) {
			throw new Error(`A template sheet named ${templateSheetName} does not exist in spreadsheet "${ssName}"!`)
		}		
	}

	// Check for existence of sheet in spreadsheet:
	if (!sheet) {			
		sheet = ss.insertSheet(sheetName, {template: templateSheet})
		console.log(`Sheet ${sheetName} created in spreadsheet ${ssName}.`)
	}

	// Check whether starting row and column were provided:
	if (!startRow) {
		startRow = 1
	}
	if (!startColumn) {
		startColumn = 1
	}

	// Output dimensions:
	const numRows = writeArray.length
	const numColumns = writeArray[0].length

	// Get relevant range:
	let range
	if (!eraseAllDataInSheet) { // Parameter either not provided, or set to false.
		range = sheet.getRange(startRow, startColumn, numRows, numColumns) // Assuming writeArray is rectangular.
	} else {
		range = sheet.getDataRange()
	}
	
	// Check whether write should only take place if range is empty:
	if (onlyWriteIfEmpty === true) {
		if (!range.isBlank()) {
			throw new Error(`Operation would overwrite existing data! Cancelling.`)
		}
	}
	
	// Clear appropriate range on sheet:
	range.clearContent()

	// Write output:
	sheet.getRange(startRow, startColumn, numRows, numColumns).setValues(writeArray)
}