// TODO: Re-package and re-use such utility functions in all spreadsheet repos
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
export const updateSheet = function (
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
		logSheet.appendRow([now, func.name, err.message, err.stack]);
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
};

export const writeToSheet = function (
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
};
