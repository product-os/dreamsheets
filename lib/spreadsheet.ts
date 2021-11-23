export function clearSheet(
	sheet: GoogleAppsScript.Spreadsheet.Sheet,
	startingRow: number = 1,
	startingColumn: number = 1,
	rowsLength: number = sheet.getMaxRows(),
	colsLenghth: number = sheet.getMaxColumns(),
) {
	sheet
		.getRange(startingRow, startingColumn, rowsLength, colsLenghth)
		.clearContent();
}

/* Runs the given function with parameters and writes the results to the outputTab
 * .. srow and scol are the starting cell for the output
 * .. errorTab lists the errors raised when running the function
 */
export function updateSheet(
	func: (...args: any[]) => any[][],
	params: any[],
	outputSheetName: string,
	startingRow: number,
	startingColumn: number,
	errorTabName: string,
): void {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const logSheet = ss.getSheetByName(errorTabName);

	if (!logSheet) {
		throw new Error(`Error logging sheet ${errorTabName} is not found`);
	}

	console.log(`Now running ${func.name}`);
	let res: any[][] | undefined;
	try {
		res = func(...params);
	} catch (err) {
		const now = new Date();
		logSheet.appendRow([
			now,
			func.name,
			(err as Error).message,
			(err as Error).stack,
		]);
	}
	if (res != null) {
		writeToSheet(
			outputSheetName,
			startingRow,
			startingColumn,
			res,
			errorTabName,
		);
	} else {
		throw new Error(`Error running ${func.name}`);
	}

	console.log(`Done running ${func.name}`);
}

export function writeToSheet(
	outputSheetName: string,
	startingRow: number,
	startingColumn: number,
	writeArray: any[][],
	errorTabName: string,
) {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const logSheet = ss.getSheetByName(errorTabName);
	const outputSheet = ss.getSheetByName(outputSheetName);

	if (!logSheet) {
		throw new Error(`Error logging sheet ${errorTabName} is not found`);
	}
	if (!outputSheet) {
		throw new Error(`writeTo sheet ${outputSheetName} is not found`);
	}

	const rows = writeArray.length;
	const cols = writeArray[0].length;
	console.log('Writing the results. # of rows: ' + rows + ' and cols: ' + cols);
	clearSheet(outputSheet, startingRow, startingColumn, rows, cols);
	outputSheet
		.getRange(startingRow, startingColumn, rows, cols)
		.setValues(writeArray);
}

export function readSheet(
	sheetName: string,
	{
		range,
		spreadSheet,
	}: {
		range?: string | [number, number, number, number];
		spreadSheet?: GoogleAppsScript.Spreadsheet.Spreadsheet;
	} = {},
): any[][] {
	// If no spreadsheet provided, read the currently active spreadsheet:
	if (!spreadSheet) {
		spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
	}
	const spreadSheetName = spreadSheet.getName();
	const sheet = spreadSheet.getSheetByName(sheetName);

	// Check for existence of sheet in spreadsheet:
	if (!sheet) {
		throw new Error(
			`Sheet "${sheetName}" does not exist in spreadsheet "${spreadSheetName}"!`,
		);
	}

	// If no range provided, default to the full data-containing range in the sheet:
	if (!range) {
		range = [1, 1, sheet.getLastRow(), sheet.getLastColumn()];
	}

	// Read data from sheet:
	let rangeData: any[][];
	if (typeof range === 'string') {
		rangeData = sheet.getRange(range).getValues();
	} else {
		rangeData = sheet.getRange(...range).getValues();
	}
	console.log(
		`Successfully read contents of sheet "${sheetName}" in spreadsheet "${spreadSheetName}".`,
	);
	return rangeData;
}
