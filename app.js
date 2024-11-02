require('dotenv').config();
const express = require('express');
const axios = require('axios');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Setup access log stream
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

// Morgan to log HTTP requests
app.use(morgan('combined', { stream: accessLogStream }));

// List of blocked IPs
const blockedIPs = ['109.236.40.78', '192.168.1.1'];

// IP Blocker Middleware
app.use((req, res, next) => {
    const requesterIP = req.ip;
    if (blockedIPs.includes(requesterIP)) {
        res.status(403).json({ error: 'Access denied' });
    } else {
        next();
    }
});

// Middleware to log IP addresses for the /ip/:ipAddress endpoint
app.use('/ip/:ipAddress', (req, res, next) => {
    const ipAddress = req.params.ipAddress;
    const logMessage = `IP Info Requested for: ${ipAddress} - Requester IP: ${req.ip}\n`;
    fs.appendFileSync(path.join(__dirname, 'ip-requests.log'), logMessage);
    next();
});

const IPINFO_TOKEN = '47aaf906402e29';

app.get('/ip/:ipAddress', async (req, res) => {
    const { ipAddress } = req.params;
    const url = `https://ipinfo.io/${ipAddress}/json?token=${IPINFO_TOKEN}`;

    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json({ error: error.response.data });
        } else {
            res.status(500).json({ error: 'Error retrieving IP information' });
        }
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
