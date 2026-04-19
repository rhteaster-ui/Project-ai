const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// PASTIKAN KEY LO BENAR (TIDAK ADA SENSOR XXX)
const keys = ["AIzaSyC53iVc4By43ib29YZi6GkwBP3MB8W8b5U"]; 
let keyIndex = 0;

const SYSTEM_PROMPT = "Anda adalah Pria Solo, asisten yang tenang dan sopan.";

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const currentKey = keys[keyIndex];

        console.log("--- MENGIRIM PESAN KE GOOGLE ---");
        console.log("Pesan User:", message);

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${currentKey}`,
            {
                contents: [
                    { role: "user", parts: [{ text: `SYSTEM INSTRUCTION: ${SYSTEM_PROMPT}` }] },
                    { role: "model", parts: [{ text: "Inggih, saya mengerti." }] },
                    { role: "user", parts: [{ text: message }] }
                ]
            }
        );

        if (response.data && response.data.candidates) {
            const aiReply = response.data.candidates[0].content.parts[0].text;
            console.log("Respon AI Berhasil!");
            res.json({ reply: aiReply });
        } else {
            console.log("Struktur respon Google aneh:", JSON.stringify(response.data));
            res.status(500).json({ error: "Respon Google tidak sesuai format." });
        }

    } catch (error) {
        console.error("--- ERROR DETECTED ---");
        if (error.response) {
            // Error dari server Google (400, 404, 429, 500)
            console.error("Status Google:", error.response.status);
            console.error("Data Error Google:", JSON.stringify(error.response.data, null, 2));
            res.status(error.response.status).json({ 
                error: `Google Error: ${error.response.data.error?.message || "Cek Terminal"}` 
            });
        } else if (error.request) {
            // Gagal kirim request (masalah jaringan)
            console.error("Masalah Jaringan: Tidak ada respon dari Google.");
            res.status(503).json({ error: "Masalah koneksi internet di Termux." });
        } else {
            // Error kodingan
            console.error("Error Coding:", error.message);
            res.status(500).json({ error: error.message });
        }
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n=== RHMT LAB AKTIF ===`);
    console.log(`Jalan di http://localhost:${PORT}`);
    console.log(`Pantau log di sini jika ada error...\n`);
});
