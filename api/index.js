// --- FINAL API CODE with Email and Rate Limiting ---
const express = require('express');
const { google } = require('googleapis');
const rateLimit = require('express-rate-limit'); // Import the rate-limit package

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// Render provides the PORT environment variable.
const PORT = process.env.PORT || 3001;

// Setup the rate limiter
// This will limit each IP address to 20 form submissions per 15 minutes.
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 20, // Limit each IP to 20 requests per window
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests created from this IP, please try again after 15 minutes'
});

// Apply the rate limiting middleware to all incoming requests
app.use(limiter);

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
        const { tract, status, details, submittedAt, email } = req.body;

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
            range: 'A1:E1', // Extended range that includes the email column
            valueInputOption: 'USER_ENTERED',
            resource: {
                // Array includes the email field
                values: [[submittedAt, tract, status, details || '', email || '']],
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