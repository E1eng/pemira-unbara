# PEMIRA BEM - E-Voting Mahasiswa

Aplikasi e-voting untuk **Pemilihan Raya (PEMIRA) Badan Eksekutif Mahasiswa (BEM)** berbasis web.

## 🎯 Keunggulan Sistem

- **LUBER & Rahasia**: Suara disimpan anonim (tidak ada relasi pemilih → pilihan kandidat)
- **Keamanan Server-side**: Validasi + pencegahan double-vote via **RPC PostgreSQL**
- **Anti Brute-force**: Rate limiting berbasis fingerprint (IP + User-Agent)
- **Token Aman**: Kode akses di-hash dengan BCrypt, hanya muncul sekali saat generate

## 📁 Struktur Repository

```
├── frontend/           # React + Vite + Tailwind
│   └── src/pages/      # Halaman publik & admin
├── database/           # SQL schema + RLS + RPC functions
│   └── database.sql    # All-in-one schema (run di Supabase SQL Editor)
└── README.md
```

## 🛠 Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS, Lucide Icons |
| Backend | Supabase (PostgreSQL + RLS + PostgREST) |
| Charts | Recharts |
| Storage | Supabase Storage (foto kandidat) |

## ✨ Fitur

### 👤 Untuk Pemilih
- Login dengan **NIM/NPM + Kode Akses** (token 12 karakter)
- Pilih pasangan calon (Ketua & Wakil Ketua BEM)
- Lihat hasil voting (jika diaktifkan admin)

### ⚙️ Untuk Admin
- **Dashboard**: Statistik partisipasi per fakultas
- **Kelola Paslon**: Tambah/edit/hapus dengan nomor urut, visi & misi
- **Kelola DPT**: 
  - Import CSV (`nim,name,faculty,major`)
  - Tambah manual dengan auto-generate token
  - Hapus semua pemilih
- **Audit Log**: Catatan aktivitas dengan paginasi
- **Pengaturan**: Buka/tutup voting, tampilkan hasil live

## 🔗 Routing

### Public
| Path | Deskripsi |
|------|-----------|
| `/` | Home page |
| `/login` | Login pemilih |
| `/vote` | Halaman voting |
| `/thank-you` | Konfirmasi setelah voting |
| `/results` | Hasil pemilihan |

### Admin
| Path | Deskripsi |
|------|-----------|
| `/admin/login` | Login admin |
| `/admin/dashboard` | Dashboard & statistik |
| `/admin/candidates` | Kelola paslon |
| `/admin/voters` | Kelola DPT |
| `/admin/audit` | Security log |

## 🚀 Setup

### 1. Siapkan Supabase Project

1. Buat project di [supabase.com](https://supabase.com)
2. Buka **SQL Editor**
3. Copy & paste isi `database/database.sql`
4. Klik **Run**

### 2. Konfigurasi Admin

1. Buat user admin di **Authentication > Users**
2. Copy User ID-nya
3. Insert ke tabel `admin_users`:
   ```sql
   INSERT INTO admin_users (user_id) VALUES ('USER_ID_DISINI');
   ```

### 3. Setup Storage

1. Buka **Storage** di Supabase
2. Buat bucket bernama `candidate-photos`
3. Set bucket ke **Public**

### 4. Konfigurasi Frontend

Buat file `frontend/.env`:
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### 5. Jalankan Development Server

```bash
cd frontend
npm install
npm run dev
```

Buka `http://localhost:5173`

## 📋 Format CSV Import DPT

```csv
nim,name,faculty,major
22351001,Mahasiswa Satu,Fakultas Teknik,Informatika
22351002,Mahasiswa Dua,Fakultas Ekonomi,Akuntansi
```

> **Catatan**: Token otomatis di-generate saat import. Download master list segera karena token hanya muncul sekali.

## 🔒 Keamanan

- Jangan commit file `.env`
- Token disimpan sebagai **BCrypt hash**
- Rate limiting di server-side (RPC)
- RLS (Row Level Security) aktif di semua tabel
- Audit log untuk semua aktivitas penting

## 📄 Lisensi

Internal / kebutuhan skripsi.
