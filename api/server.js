const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

const keys = ["ISI_API_KEY_LO_DISINI"]; 
let keyIndex = 0;

const SYSTEM_PROMPT = "Anda adalah Pria Solo, asisten yang tenang, sopan, dan solutif. Gunakan gaya bahasa Indonesia yang santun namun efisien.";

app.post('/chat', async (req, res) => {
    try {
        const userMsg = req.body.message;
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keys[keyIndex]}`,
            {
                contents: [
                    { role: "user", parts: [{ text: `SYSTEM_INSTRUCTION: ${SYSTEM_PROMPT}` }] },
                    { role: "model", parts: [{ text: "Siap, saya mengerti." }] },
                    { role: "user", parts: [{ text: userMsg }] }
                ]
            }
        );
        res.json({ reply: response.data.candidates[0].content.parts[0].text });
    } catch (error) {
        res.status(500).json({ error: "Terjadi gangguan sistem." });
    }
});

app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
