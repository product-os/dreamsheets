type RangeTuple =
	| [number, number]
	| [number, number, number]
	| [number, number, number, number];

export function readSheet(
	sheetName: string,
	{
		range,
		spreadsheet = SpreadsheetApp.getActiveSpreadsheet(),
	}: {
		range?: string | RangeTuple;
		spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet;
	} = {},
) {
	const spreadsheetName = spreadsheet.getName();
	const sheet = spreadsheet.getSheetByName(sheetName);

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


/**
 * Write a 2D array to a particular sheet within a Google Spreadsheet
 * @param sheetName			Name of sheet where array should be written.
 * 			 				If it does not exist, it is created.
 * @param writeArray		2D array containing data to be written
 * @param startRow			First sheet row for writing array. Defaults to 1,
 * 				   			corresponding to first row. Negative value is
 * 				   			interpreted as "append", and startRow is set to
 * 				   			<last-row-with-content> + 1 at runtime.
 * @param startColumn		First sheet column for writing array. Defaults
 *  				  		to 1, corresponding to first column. Negative
 * 					  		value is interpreted as "append", and startColumn
 * 				   	  		is set to <last-column-with-content> + 1 at
 * 					  		runtime.
 * @param spreadsheet		Relevant Google Spreadsheet. Defaults to
 * 							active spreadsheet.
 * @param templateSheetName Name of sheet to use as template if sheet
 * 							<sheetName> has to be created.
 * @param clearSheet		Whether to clear the sheet content, starting
 * 							at [startRow, startColumn]. Defaults to false.
 * 							Ignored if either startRow or startColumn
 * 							is negative. ("Append" already implies no existing
 * 							content.)
 * @param overwriteRange	Whether to overwrite existing content. Defaults
 * 							to true. If false, writing operation is cancelled
 * 							if any of the cells to be written to already
 * 							have content. Ignored if clearSheet is true, or
 * 							if either startRow or startColumn is
 * 							negative. ("Append" already implies no existing
 * 							content.)
 */
 export function writeToSheet(
	sheetName: string,
	writeArray: any[][],
	{
		startRow = 1,
		startColumn = 1,
		spreadsheet = SpreadsheetApp.getActiveSpreadsheet(),
		templateSheetName,
		clearSheet = false,
		overwriteRange = true,
	}: {
		startRow?: number;
		startColumn?: number;
		spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet;
		templateSheetName?: string;
		clearSheet?: boolean;
		overwriteRange?: boolean;
	} = {},
) {
	const spreadsheetName = spreadsheet.getName();
	let sheet = spreadsheet.getSheetByName(sheetName);

	// Check whether template was provided:
	let templateSheet;
	if (templateSheetName) {
		templateSheet = spreadsheet.getSheetByName(templateSheetName);
		if (!templateSheet) {
			throw new Error(
				`A template sheet named "${templateSheetName}" does not exist in spreadsheet "${spreadsheetName}"!`,
			);
		}
	}

	// Check for existence of sheet in spreadsheet:
	if (!sheet) {
		sheet = spreadsheet.insertSheet(sheetName, { template: templateSheet });
		console.log(
			`Sheet ${sheetName} created in spreadsheet ${spreadsheetName}.`,
		);
	}

	// Sheet dimensions:
	const lastSheetRow = sheet.getLastRow();
	const lastSheetColumn = sheet.getLastColumn();

	// Output dimensions:
	const numOutputRows = writeArray.length;
	const numOutputColumns = writeArray[0].length;

	// Check for negative startRow/startColumn, which imply "append":
	const append = startRow < 0 || startColumn < 0;
	if (startRow < 0) {
		startRow = lastSheetRow + 1;
	}
	if (startColumn < 0) {
		startColumn = lastSheetColumn + 1;
	}

	// Clear appropriate range on sheet:
	if (lastSheetRow > 0 && !append) {
		let range;
		if (!clearSheet) {
			range = sheet.getRange(
				startRow,
				startColumn,
				numOutputRows,
				numOutputColumns,
			);
			if (!overwriteRange) {
				// Check if range is empty:
				if (!range.isBlank()) {
					throw new Error(
						`Operation would overwrite existing data! Cancelling.`,
					);
				}
			}
		} else {
			range = sheet.getRange(
				startRow,
				startColumn,
				lastSheetRow - startRow + 1,
				lastSheetColumn - startColumn + 1,
			);
		}
		range.clearContent();
	}
	// Write output:
	sheet
		.getRange(startRow, startColumn, numOutputRows, numOutputColumns)
		.setValues(writeArray);
	console.log(
		`Successfully wrote output to sheet ${sheetName} in spreadsheet ${spreadsheetName}.`,
	);
}
