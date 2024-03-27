// Made 3-26-24
// Made to handle data gathering for the madden sheet

// Global Variables
const { google } = require('googleapis')
const sheets = google.sheets('v4');
const creds = require("./creds.json")
// Sheet Config
const spreadsheetId = creds["creds"]["sheetID"]
const sheetName = creds["creds"]["range"]

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

// Returns the client Token
async function getAuthToken() {
    const auth = new google.auth.GoogleAuth({
        scopes: SCOPES,
        credentials: creds
    });
  
    const authToken = await auth.getClient();
    return authToken;
}

// Returns the Spread Sheet Values
async function getSpreadSheetValues({spreadsheetId, auth, sheetName}) {
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        auth,
        range: sheetName
    });
    return res;
}

// This will add the give data
async function addSpreadSheetValues({spreadsheetId, auth, sheetName, data}) {
    const res = await sheets.spreadsheets.values.append({
        spreadsheetId,
        auth,
        range: sheetName,
        insertDataOption: "INSERT_ROWS",
        valueInputOption: "RAW",
        resource: {
            values: [
                data
            ]
        }
    });
    return res
}

// This will add the give data
async function updateSpreadSheetValues({spreadsheetId, auth, sheetName, data}) {
    const res = await sheets.spreadsheets.values.update({
        spreadsheetId,
        auth,
        range: sheetName,
        insertDataOption: "INSERT_ROWS",
        valueInputOption: "RAW",
        resource: {
            values: [
                data
            ]
        }
    });
    console.log(data)
    return res
}

// Adds to the Picks
async function addPicks(data) {
    try {
        const auth = await getAuthToken();
        const response = await addSpreadSheetValues({
            spreadsheetId,
            sheetName,
            auth,
            data: data
        })

        //console.log('output for add', JSON.stringify(response.data, null, 2));
    } catch(error) {
        console.log(error.message, error.stack);
    }
}

// Returns the values of the posted draft picks
async function getPicks() {
    try {
        const auth = await getAuthToken();
        const response = await getSpreadSheetValues({
            spreadsheetId,
            sheetName,
            auth
        })
        /* Response returns with this format
            "range": {Document Range},
            "majorDimension": {What way it reads}
            "values": [{All Cell values based on the majorDimension}]
        */

        //console.log('output for getSpreadSheetValues', JSON.stringify(response.data, null, 2));
    } catch(error) {
        console.log(error.message, error.stack);
    }
}
// Exports for other scripts to use
module.exports = {
    getPicks,
    addPicks
}