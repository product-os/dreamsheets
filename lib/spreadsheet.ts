type RangeTuple =
	| [number, number]
	| [number, number, number]
	| [number, number, number, number];

export function readSheet(
	sheetName: string,
	{
		range,
		ss = SpreadsheetApp.getActiveSpreadsheet(),
	}: {
		range?: string | RangeTuple;
		ss?: GoogleAppsScript.Spreadsheet.Spreadsheet;
	} = {},
) {
	const spreadsheetName = ss.getName();
	const sheet = ss.getSheetByName(sheetName);

	// Check for existence of sheet in spreadsheet:
	if (!sheet) {
		throw new Error(
			`Sheet "${sheetName}" does not exist in spreadsheet "${spreadsheetName}"!`,
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
		`Successfully read contents of sheet "${sheetName}" in spreadsheet "${spreadsheetName}".`,
	);
	return rangeValues;
}

function isPositiveInteger(x: number) {
	if (Number.isInteger(x) && x >= 1) {
		return true;
	}
	return false;
}

/**
 * Write a rectangular array to a particular sheet within a Google Spreadsheet
 * @param sheetName         Name of sheet where array should be written.
 *                          If it does not exist, it is created.
 * @param writeArray        Rectangular 2D array containing data to be written
 * @param startRow          First sheet row for writing array, defaulting to 1.
 *                          If mode is set to APPENDROWS, value is reset to
 *                          <last-row-with-content> + 1 at runtime. For other
 *                          modes, the passed value has to be a positive
 *                          integer.
 * @param startColumn       First sheet column for writing array, defaulting to
 *                          1. If mode is set to APPENDCOLUMNS, value is
 *                          reset to <last-column-with-content> + 1 at runtime.
 *                          For other modes, the passed value has to be a
 *                          positive integer.
 * @param ss                Relevant Google Spreadsheet. Defaults to
 *                          active spreadsheet.
 * @param templateSheetName Name of sheet to use as template if sheet named
 *                          sheetName has to be created.
 * @param mode              One of OVERWRITE, APPENDROWS or
 *                          APPENDCOLUMNS, defaulting to OVERWRITE.
 *                          OVERWRITE: clears a rectangular grid on the
 *                          sheet starting at [startRow, startColumn],
 *                          with height equal to the number of rows in
 *                          writeArray,	and width to the number of columns in
 *                          writeArray. Content of writeArray is then written
 *                          to this cleared rectangular grid.
 *                          APPENDROWS: append writeArray directly below
 *                          last data-containing row in sheet.
 *                          APPENDCOLUMNS: append writeArray directly to
 *                          the right of the last data-containing column in
 *                          sheet.
 * @param clearSheet        Whether to clear the existing sheet content to the
 *                          bottom and right, starting at
 *                          [startRow, startColumn]. Defaults to false.
 *                          Only applies when mode=OVERWRITE.
 */
 export function writeToSheet(
	sheetName: string,
	writeArray: any[][],
	{
		startRow = 1,
		startColumn = 1,
		ss = SpreadsheetApp.getActiveSpreadsheet(),
		templateSheetName,
		mode = 'OVERWRITE',
		clearSheet = false,
	}: {
		startRow?: number;
		startColumn?: number;
		ss?: GoogleAppsScript.Spreadsheet.Spreadsheet;
		templateSheetName?: string;
		mode?: 'OVERWRITE' | 'APPENDROWS' | 'APPENDCOLUMNS';
		clearSheet?: boolean;
	} = {},
) {
	// Output dimensions:
	const numOutputRows = writeArray.length;
	const numOutputColumns = writeArray[0].length;

	// Verify mode:
	if (!['OVERWRITE', 'APPENDROWS', 'APPENDCOLUMNS'].includes(mode)) {
		throw new Error(
			`Allowed values for mode are: OVERWRITE, APPENDROWS, APPENDCOLUMNS. Received ${mode} instead.`,
		);
	}

	// Get spreadsheet name:
	const spreadsheetName = ss.getName();
	let sheet = ss.getSheetByName(sheetName);

	// Retrieve template sheet if provided:
	let templateSheet;
	if (templateSheetName) {
		templateSheet = ss.getSheetByName(templateSheetName);
		if (!templateSheet) {
			throw new Error(
				`A template sheet named "${templateSheetName}" does not exist in spreadsheet "${spreadsheetName}"!`,
			);
		}
	}

	// If sheet does not exist in spreadsheet, create it:
	if (!sheet) {
		sheet = ss.insertSheet(sheetName, { template: templateSheet });
		console.log(
			`Sheet "${sheetName}" created in spreadsheet "${spreadsheetName}".`,
		);
	}

	// Sheet dimensions:
	const lastSheetRow = sheet.getLastRow();
	const lastSheetColumn = sheet.getLastColumn();

	// Adjust/verify startRow and startColumn based on mode:
	if (mode === 'APPENDROWS') {
		startRow = lastSheetRow + 1;
	} else {
		if (!isPositiveInteger(startRow)) {
			throw new Error(
				`Expected a positive integer value for "startRow", received ${startRow} instead.`,
			);
		}
	}
	if (mode === 'APPENDCOLUMNS') {
		startColumn = lastSheetColumn + 1;
	} else {
		if (!isPositiveInteger(startColumn)) {
			throw new Error(
				`Expected a positive integer value for "startColumn", received ${startColumn} instead.`,
			);
		}
	}

	// For overwrite mode, clear appropriate range on sheet:
	if (mode === 'OVERWRITE' && lastSheetRow > 0) {
		let range;
		if (clearSheet) {
			range = sheet.getRange(
				startRow,
				startColumn,
				lastSheetRow - startRow + 1,
				lastSheetColumn - startColumn + 1,
			);
		} else {
			range = sheet.getRange(
				startRow,
				startColumn,
				numOutputRows,
				numOutputColumns,
			);
		}
		range.clearContent();
	}

	// Write output:
	sheet
		.getRange(startRow, startColumn, numOutputRows, numOutputColumns)
		.setValues(writeArray);
	console.log(
		`Successfully wrote output to sheet "${sheetName}" in spreadsheet "${spreadsheetName}".`,
	);
}
