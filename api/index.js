// This is a Node.js serverless function that runs on Render
const { google } = require('googleapis');

// Export the function handler
module.exports = async (req, res) => {
    // We only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const body = req.body;

        // Basic validation
        if (!body.tract || !body.status) {
            return res.status(400).json({ error: 'Tract and status are required.' });
        }

        // --- Google Sheets Authentication ---
        const auth = new google.auth.GoogleAuth({
            // These credentials will be stored securely as Environment Variables on Render
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle newline characters
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // --- Append Data to Sheet ---
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID, // This will also be an Environment Variable
            range: 'A1:D1', // The range to append to. 'A1:D1' means start after the last row in this range.
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [
                    // The data in the order of our columns
                    [body.submittedAt, body.tract, body.status, body.details || '']
                ],
            },
        });

        // Send a success response back to the frontend
        return res.status(200).json({ 
            message: 'Data successfully added to sheet.',
            data: response.data 
        });

    } catch (error) {
        console.error('Error writing to Google Sheet:', error);
        // Send an error response back to the frontend
        return res.status(500).json({ error: 'Failed to write to Google Sheet.' });
    }
};