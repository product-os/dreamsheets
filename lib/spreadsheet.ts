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


export function writeToSheet(
	sheetName: string,
	writeArray: any[][],
	{
		startRow = 1,
		startColumn = 1,
		templateSheetName,
		spreadsheet = SpreadsheetApp.getActiveSpreadsheet(),
		clearSheet = false,
		overwriteRange = true
	}: {
		startRow?: number,
		startColumn?: number,
		templateSheetName?: string,
		spreadsheet?: GoogleAppsScript.Spreadsheet.Spreadsheet,
		clearSheet?: boolean,		
		overwriteRange?: boolean
	} = {}
	) {
	const spreadsheetName = spreadsheet.getName();
	let sheet = spreadsheet.getSheetByName(sheetName);

	// Check whether template was provided:
	let templateSheet = undefined
	if (templateSheetName) {
		templateSheet = spreadsheet.getSheetByName(templateSheetName)
		if (!templateSheet) {
			throw new Error(`A template sheet named "${templateSheetName}" does not exist in spreadsheet "${spreadsheetName}"!`)
		}		
	}

	// Check for existence of sheet in spreadsheet:
	if (!sheet) {			
		sheet = spreadsheet.insertSheet(sheetName, {template: templateSheet})
		console.log(`Sheet ${sheetName} created in spreadsheet ${spreadsheetName}.`)
	}

	// Output dimensions:
	const numRows = writeArray.length
	const numColumns = writeArray[0].length

	// Get relevant range:
	let range
	if (!clearSheet) {
		range = sheet.getRange(startRow, startColumn, numRows, numColumns)
		// Check whether write should only take place if range is empty:
		if (overwriteRange === false) {
			if (!range.isBlank()) {
				throw new Error(`Operation would overwrite existing data! Cancelling.`)
			}
		}		
	} else {
		range = sheet.getDataRange()
	}
	
	// Clear appropriate range on sheet:
	range.clearContent()

	// Write output:
	sheet.getRange(startRow, startColumn, numRows, numColumns).setValues(writeArray)
}

