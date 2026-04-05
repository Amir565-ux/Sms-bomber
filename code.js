// sms-bomber-api.js - Complete SMS Bomber Server + API Key System
// Number + Count daalo, SMS spam ho jayega! 🔥
// (Authorized pentest only bhai)

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// ===== API KEYS SYSTEM =====
class KeyManager {
    constructor() {
        this.keysFile = './sms-bomber-keys.json';
        this.keys = this.loadKeys();
    }

    loadKeys() {
        if (fs.existsSync(this.keysFile)) {
            return JSON.parse(fs.readFileSync(this.keysFile, 'utf8'));
        }
        return [];
    }

    saveKeys() {
        fs.writeFileSync(this.keysFile, JSON.stringify(this.keys, null, 2));
    }

    isValidKey(apiKey) {
        return this.keys.find(k => k.apiKey === apiKey && k.status === 'active');
    }

    updateUsage(apiKey, smsCount) {
        const key = this.keys.find(k => k.apiKey === apiKey);
        if (key) {
            key.usage.smsSent += smsCount;
            key.usage.requests += 1;
            key.usage.lastUsed = new Date().toISOString();
            this.saveKeys();
        }
    }
}

const keyManager = new KeyManager();

// ===== SMS SENDING FUNCTION =====
// Yahan tum apna REAL SMS API daal dena (Twilio, TextNow, etc)
async function sendSMS(phone, message) {
    // EXAMPLE: Real SMS API call (replace with yours)
    try {
        // Twilio example:
        // const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/ACxxx/Messages.json', {
        //     method: 'POST',
        //     headers: { 'Authorization': 'Basic ' + Buffer.from('ACxxx:auth_token').toString('base64') },
        //     body: new URLSearchParams({ To: phone, Body: message })
        // });
        
        // SIMULATOR for testing:
        console.log(`📱 SMS sent to ${phone}: ${message}`);
        await new Promise(r => setTimeout(r, 100)); // 100ms delay
        return true;
    } catch (e) {
        console.log(`❌ SMS failed: ${e.message}`);
        return false;
    }
}

// ===== API ROUTES =====

// 1. API KEY GENERATE
app.post('/api/generate-key', (req, res) => {
    const { user } = req.body;
    const keyData = {
        apiKey: `SB_${user}_${crypto.randomBytes(24).toString('hex').toUpperCase()}`,
        user: user || 'guest',
        status: 'active',
        usage: { smsSent: 0, requests: 0, lastUsed: null },
        created: new Date().toISOString()
    };
    
    keyManager.keys.push(keyData);
    keyManager.saveKeys();
    
    res.json({
        success: true,
        message: 'API Key ban gaya bhai! 🔥',
        data: keyData
    });
});

// 2. MAIN SMS BOMBER API
app.post('/api/bomb', async (req, res) => {
    const { apiKey, phone, count, message = 'Test SMS from Bomber' } = req.body;

    // API Key check
    if (!keyManager.isValidKey(apiKey)) {
        return res.status(401).json({ success: false, error: 'Galat API key bhai!' });
    }

    if (!phone || !count) {
        return res.status(400).json({ success: false, error: 'Phone number aur count do!' });
    }

    console.log(`🚀 BOMBER START: ${phone} x${count} SMS`);

    let successCount = 0;
    const errors = [];

    // Spam loop chalao
    for (let i = 0; i < count; i++) {
        const ok = await sendSMS(phone, `${message} (${i+1}/${count})`);
        if (ok) successCount++;
        else errors.push(i+1);
        
        // 50ms delay har SMS ke beech
        await new Promise(r => setTimeout(r, 50));
    }

    // Usage update
    keyManager.updateUsage(apiKey, successCount);

    res.json({
        success: true,
        stats: {
            total: count,
            success: successCount,
            failed: errors.length,
            failedList: errors.slice(0, 10) // First 10 errors
        },
        message: `Bomb complete! ${successCount}/${count} SMS bhej diye 🔥`
    });
});

// 3. KEYS CHECK
app.get('/api/keys', (req, res) => {
    res.json({
        success: true,
        totalKeys: keyManager.keys.length,
        activeKeys: keyManager.keys.filter(k => k.status === 'active')
    });
});

// ===== SERVER START =====
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n💣 SMS BOMBER API CHAL RAHA HAI: http://localhost:${PORT}`);
    console.log(`📱 Test karo:`);
    console.log(`1. Key banao: POST /api/generate-key {"user": "bhai"}`);
    console.log(`2. Bomb maro: POST /api/bomb {"apiKey": "SB_...", "phone": "+1234567890", "count": 100}`);
});
