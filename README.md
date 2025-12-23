# PEMIRA BEM - E-Voting Mahasiswa 🗳️

Sistem **E-Voting Pemilihan Raya (PEMIRA) Badan Eksekutif Mahasiswa (BEM)** yang modern, aman, dan transparan. Dirancang dengan pendekatan **Mobile-First** dan keamanan tingkat tinggi.

## ✨ Keunggulan Utama

*   **🔒 LUBER & JURDIL**:
    *   **Anonimitas Total**: Data pemilih dan data suara disimpan di tabel terpisah tanpa relasi ID (Decoupled Architecture). Tidak ada cara untuk melacak siapa memilih siapa.
    *   **Anti Double-Vote**: Validasi ketat di level Database (RPC Function) menjamin 1 NIM hanya bisa memilih 1 kali.
*   **🛡️ Security First**:
    *   **Secure Access Code**: Token akses di-hash menggunakan **BCrypt** (seperti password). Admin sekalipun tidak bisa melihat token asli mahasiswa.
    *   **Forensik Digital**: Audit Log mencatat IP Address, User-Agent, dan Timestamp untuk setiap aktivitas sensitif (Login Gagal, Vote Masuk, Admin Login).
    *   **Anti Brute-Force**: Rate limiting pintar berbasis kombinasi IP + Device Fingerprint.
*   **📱 Modern UI/UX**:
    *   **Mobile-First Design**: Dioptimalkan untuk layar HP mahasiswa.
    *   **Premium Aesthetic**: Konsep *Glassmorphism*, transisi halus (Framer Motion), dan interaksi responsif.
    *   **Real-time Count**: Hasil pemilihan terupdate detik demi detik (jika fitur "Show Live Result" diaktifkan).

## � Struktur Project

```
├── frontend/           # Aplikasi React (Vite + Tailwind + Framer Motion)
│   ├── src/pages/      # Halaman Publik (Vote, Result) & Admin Dashboard
│   ├── src/components/ # Reusable UI Components (Glass Card, Modal, etc)
│   └── src/lib/        # Helper functions & Supabase Client
├── database/           # Script Database Backend
│   └── database.sql    # Skema Lengkap (Run di Supabase SQL Editor)
└── README.md           # Dokumentasi ini
```

## 🛠 Teknologi

*   **Frontend**: React.js, Vite, Tailwind CSS, Framer Motion, Lucide Icons.
*   **Backend**: Supabase (PostgreSQL 15+).
*   **Security**: Row Level Security (RLS), PL/pgSQL RPC Functions, BCrypt Hashing.

## 🚀 Fitur Lengkap

### � Halaman Publik (Mahasiswa)
1.  **Halaman Login**: Validasi NIM & Token real-time dengan animasi interaktif.
2.  **Bilik Suara (Vote Page)**:
    *   Tampilan kartu kandidat vertikal (Compact).
    *   Foto kandidat rasio 1:1 resolusi tinggi.
    *   Modal detail visi & misi yang lengkap.
3.  **Halaman Hasil (Real Count)**:
    *   Leaderboard otomatis (Kandidat unggul ditandai).
    *   Statistik partisipasi per Fakultas & Prodi.

### 👔 Admin Dashboard
1.  **Overview**: Grafik partisipasi & status server.
2.  **Manajemen Paslon**: Tambah/Edit/Hapus kandidat + Upload Foto.
3.  **Manajemen DPT**:
    *   Import data massal via CSV.
    *   Generate token otomatis.
    *   Cetak kartu pemilih (Export token).
4.  **Audit Log**: Pantau keamanan (IP Address, Login Gagal, dll).
5.  **Election Control**: Buka/Tutup voting & Show/Hide hasil.

## ⚙️ Panduan Instalasi

### 1. Setup Backend (Supabase)
1.  Buat project baru di [supabase.com](https://supabase.com).
2.  Masuk ke menu **SQL Editor**.
3.  Copy seluruh isi file `database/database.sql` dan Paste ke editor.
4.  Klik **Run**. (Ini akan membuat tabel, fungsi, dan policy keamanan secara otomatis).
5.  Buat Bucket Storage:
    *   Menu **Storage** -> New Bucket -> `candidate-photos` -> Set **Public**.

### 2. Setup Frontend
1.  Masuk folder frontend: `cd frontend`
2.  Install dependencies: `npm install`
3.  Copy `.env.example` ke `.env` dan isi kredensial Supabase Anda:
    ```env
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key-here
    ```
4.  Jalankan server: `npm run dev`

## 🔒 Konfigurasi Admin
Untuk keamanan, User Admin dibuat manual lewat database atau dashboard Supabase Authentication, lalu ID-nya didaftarkan:

```sql
-- Di SQL Editor Supabase:
INSERT INTO admin_users (user_id) VALUES ('UUID-USER-DARI-AUTH-MENU');
```

## � Format CSV DPT
Gunakan format berikut untuk import data mahasiswa:
```csv
nim,name,faculty,major
2025001,Budi Santoso,Teknik,Informatika
2025002,Siti Aminah,Ekonomi,Akuntansi
```

---
*Dikembangkan untuk keperluan Skripsi / Tugas Akhir - 2025.*
