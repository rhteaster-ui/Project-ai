const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');

// Lightweight local .env loader (no external dependency).
(function loadLocalEnv() {
    const dotenvPath = path.join(__dirname, '../.env');
    if (!fs.existsSync(dotenvPath)) return;

    const content = fs.readFileSync(dotenvPath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;

        const sep = line.indexOf('=');
        if (sep <= 0) continue;

        const key = line.slice(0, sep).trim();
        let value = line.slice(sep + 1).trim();

        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        if (process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
})();

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const GEMINI_KEY = process.env.GEMINI_KEY || process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const SYSTEM_PROMPT =
    'Anda adalah Pria Solo, asisten yang tenang, sopan, dan solutif. Gunakan gaya bahasa Indonesia yang santun.';

function mapGeminiError(error) {
    const status = error.response?.status || 500;
    const data = error.response?.data;
    const gError = data?.error;

    return {
        status,
        code: gError?.status || `HTTP_${status}`,
        message:
            gError?.message ||
            (typeof data === 'string' ? data.slice(0, 300) : null) ||
            error.message ||
            'Terjadi kesalahan pada server ketika menghubungi Gemini API.',
        details: gError?.details || (typeof data === 'object' ? data : null),
    };
}

app.get('/api/health', async (_req, res) => {
    const checks = {
        envKeyPresent: Boolean(GEMINI_KEY),
        model: GEMINI_MODEL,
        serverTimeUtc: new Date().toISOString(),
    };

    if (!GEMINI_KEY) {
        return res.status(500).json({
            ok: false,
            checks,
            error: 'Environment variable GEMINI_KEY / GOOGLE_API_KEY tidak ditemukan di runtime process.',
        });
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}?key=${GEMINI_KEY}`;
        const ping = await axios.get(url, { timeout: 10000 });
        return res.json({
            ok: true,
            checks,
            modelInfo: {
                name: ping.data?.name,
                displayName: ping.data?.displayName,
                description: ping.data?.description,
            },
        });
    } catch (error) {
        const mapped = mapGeminiError(error);
        return res.status(mapped.status).json({
            ok: false,
            checks,
            error: mapped,
        });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body || {};

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Payload tidak valid. Field "message" wajib berupa string.' });
        }

        if (!GEMINI_KEY) {
            return res.status(500).json({
                error:
                    'API key tidak tersedia pada runtime. Pastikan GEMINI_KEY (atau GOOGLE_API_KEY) tersedia di process.env.',
            });
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
        const response = await axios.post(
            url,
            {
                systemInstruction: {
                    parts: [{ text: SYSTEM_PROMPT }],
                },
                contents: [{ role: 'user', parts: [{ text: message }] }],
            },
            { timeout: 30000 }
        );

        const aiReply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiReply) {
            return res.status(502).json({
                error: 'Gemini mengembalikan response tanpa konten teks.',
                rawFinishReason: response.data?.candidates?.[0]?.finishReason || null,
            });
        }

        res.json({ reply: aiReply });
    } catch (error) {
        const mapped = mapGeminiError(error);
        console.error('Gemini API error:', JSON.stringify(mapped, null, 2));

        res.status(mapped.status).json({
            error: mapped.message,
            code: mapped.code,
            details: mapped.details,
        });
    }
});

if (require.main === module) {
    const PORT = Number(process.env.PORT) || 3000;
    app.listen(PORT, () => {
        console.log(`Server jalan di http://localhost:${PORT}`);
        console.log(`Mode diagnostics: GET http://localhost:${PORT}/api/health`);
    });
}

module.exports = app;
