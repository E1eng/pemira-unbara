# E-Voting Pemilihan Ketua BEM (Supabase + React)

Aplikasi e-voting untuk pemilihan Ketua **Badan Eksekutif Mahasiswa (BEM)** berbasis web.
Fokus utama project ini:

- **LUBER & Rahasia**: suara disimpan **anonim** (tidak ada relasi pemilih -> pilihan kandidat).
- **Keamanan server-side**: validasi + pencegahan double-vote dilakukan lewat **RPC (PostgreSQL function)**.
- **Anti brute-force**: rate limiting pada proses submit vote **berbasis client fingerprint** (IP + User-Agent), bukan per NIM/NPM (menghindari DoS ke pemilih).

## Struktur Repository

- **`frontend/`**
  - React + Vite + Tailwind
  - Halaman publik (login/vote/hasil) dan admin panel
- **`database/`**
  - SQL schema + RLS + RPC functions
  - Dokumentasi database lengkap (lihat `database/README.md`)
- **`Catatan/`** dan **`.windsurf/`**
  - Di-ignore oleh Git (berisi catatan/konfigurasi lokal)

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + RLS + PostgREST + Auth)
- **Charts**: Recharts
- **Storage**: Supabase Storage (foto kandidat)

## Fitur Utama

### Untuk Pemilih

- **Login pemilih** menggunakan:
  - NIM/NPM
  - Kode Akses (token dari panitia)
- **Voting**: pilih kandidat + konfirmasi
- **Enforcement voting closed**: voting akan ditolak saat pemungutan ditutup (`election_settings.is_voting_open = false`)
- **Hasil**:
  - `LivePage`/`ResultsPage` untuk rekap suara (tergantung konfigurasi)

### Untuk Admin

- **Admin Login** via Supabase Auth
- **Kelola kandidat**:
  - tambah/edit/hapus kandidat
  - upload foto kandidat ke Supabase Storage (bucket default `candidate-photos`)
- **Kelola pemilih (DPT)**:
  - tambah pemilih + generate token
  - reset status voting
  - download rekap CSV (nim, nama, has_voted)
- **Audit log**: melihat aktivitas (LOGIN_FAIL, VOTE_SUCCESS, ADMIN_ACTION)

## Halaman / Routing

### Public

- `/` Home
- `/login` Login pemilih
- `/vote` Halaman voting (butuh session pemilih)
- `/thank-you` Setelah voting sukses
- `/live` Live display (opsional)
- `/results` Rekap hasil

### Admin

- `/admin/login`
- `/admin/dashboard`
- `/admin/candidates`
- `/admin/voters`
- `/admin/audit`

## Setup Lokal (Frontend)

### Prasyarat

- Node.js (disarankan LTS)

### 1) Siapkan Supabase Project

Ikuti langkah pada dokumentasi database:

- **`database/README.md`** (wajib)

Minimal kamu perlu:

- menjalankan SQL `database/database.sql`
- membuat admin user (Supabase Auth)
- memasukkan `user_id` admin ke tabel `admin_users`
- membuat bucket Storage untuk foto kandidat

### 2) Konfigurasi ENV

Buat file `frontend/.env` (jangan di-commit) berdasarkan contoh `frontend/.env.example`.

Env yang dipakai:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_CANDIDATE_PHOTO_BUCKET` (opsional, default `candidate-photos`)

### 3) Install & Jalankan

Dari root repo:

```bash
cd frontend
npm install
npm run dev
```

Buka URL yang muncul di terminal (biasanya `http://localhost:5173`).

## Catatan Keamanan Penting

- **Jangan commit file `.env`**.
- `VITE_SUPABASE_ANON_KEY` pada Supabase umumnya memang “public”, tapi tetap lebih rapi tidak di-commit.
- Rate limit dilakukan di server-side (RPC), jadi brute force tidak bisa dibypass dari frontend.

## Dokumentasi Database

Lihat dokumentasi lengkap di:

- `database/README.md`

## Lisensi

Internal / kebutuhan skripsi (sesuaikan jika mau dipublikasikan).
