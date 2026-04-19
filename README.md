# Project-ai

## Menjalankan lokal

```bash
npm start
```

Server default berjalan di `http://localhost:3000`.

## Diagnostik error AI (Gemini)

Agar error tidak "simulasi", gunakan endpoint berikut untuk melihat error runtime aktual dari request ke Gemini API:

- `GET /api/health` → mengecek apakah key terbaca pada proses runtime + cek akses model Gemini.
- `POST /api/chat` → mengembalikan `error`, `code`, dan `details` langsung dari hasil request gagal.

Contoh uji lokal:

```bash
curl -sS http://localhost:3000/api/health
curl -sS -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Halo"}'
```

## Environment variables

Gunakan salah satu:

- `GEMINI_KEY`
- `GOOGLE_API_KEY`

Opsional:

- `GEMINI_MODEL` (default: `gemini-2.0-flash`)

> Catatan: runtime lokal sekarang otomatis membaca file `.env` di root project tanpa library tambahan.
