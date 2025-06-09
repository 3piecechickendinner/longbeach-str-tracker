// --- CORRECTED CODE FOR RENDER ---
const express = require('express');
const { google } = require('googleapis');

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// Render provides the PORT environment variable.
const PORT = process.env.PORT || 3001;

// This is crucial for allowing your frontend (on a different URL) to talk to your API.
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any origin
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-control-allow-headers', 'Content-Type');
    next();
});

// The browser will send an OPTIONS request first to check CORS, we need to handle it.
app.options('/', (req, res) => {
    res.status(200).send('OK');
});

// This is your main API logic, now inside an app.post() route.
app.post('/', async (req, res) => {
    if (!req.body) {
        return res.status(400).json({ error: 'Bad request: No body provided.' });
    }

    try {
        const { tract, status, details, submittedAt } = req.body;

        if (!tract || !status) {
            return res.status(400).json({ error: 'Tract and status are required.' });
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'A1:D1',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[submittedAt, tract, status, details || '']],
            },
        });

        return res.status(200).json({ message: 'Data successfully added to sheet.' });

    } catch (error) {
        console.error('Error writing to Google Sheet:', error);
        return res.status(500).json({ error: 'Failed to write to Google Sheet.' });
    }
});

// This is the most important line: it starts the server and listens on a port.
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));