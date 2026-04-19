const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Mengambil Key dari Environment Variables Vercel
const GEMINI_KEY = process.env.GEMINI_KEY;

const SYSTEM_PROMPT = "Anda adalah Pria Solo, asisten yang tenang, sopan, dan solutif. Gunakan gaya bahasa Indonesia yang santun.";

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!GEMINI_KEY) {
            return res.status(500).json({ error: "API Key belum di-set di Environment Variables." });
        }

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
            {
                contents: [
                    { role: "user", parts: [{ text: `SYSTEM_INSTRUCTION: ${SYSTEM_PROMPT}` }] },
                    { role: "model", parts: [{ text: "Inggih, saya mengerti." }] },
                    { role: "user", parts: [{ text: message }] }
                ]
            }
        );

        if (response.data && response.data.candidates) {
            const aiReply = response.data.candidates[0].content.parts[0].text;
            res.json({ reply: aiReply });
        } else {
            res.status(500).json({ error: "Gagal mendapatkan respon dari Google." });
        }

    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
        res.status(500).json({ 
            error: error.response?.data?.error?.message || "Terjadi kesalahan pada server." 
        });
    }
});

// Support running di Termux (lokal)
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server jalan di http://localhost:${PORT}`));
}

module.exports = app;
