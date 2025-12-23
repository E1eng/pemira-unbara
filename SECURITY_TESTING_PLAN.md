# Rencana Pengujian Keamanan Sistem E-Voting (PEMIRA BEM)
**Metode: OWASP Top 10 (2021) & Vulnerability Scanning**

Dokumen ini disusun sebagai panduan pengujian keamanan untuk kebutuhan Skripsi/Tugas Akhir. Pengujian dilakukan untuk memvalidasi ketahanan sistem terhadap ancaman siber yang umum.

---

## 🛠️ Persiapan & Alat (Tools)

Untuk melakukan pengujian ini, Anda memerlukan tools berikut:

1.  **OWASP ZAP (Zed Attack Proxy)**: Untuk automated scanning & brute force.
    *   *Download*: [https://www.zaproxy.org/download/](https://www.zaproxy.org/download/)
    *   *Mode*: Gunakan "Standard Mode" untuk pemula.
2.  **Browser Developer Tools**: Untuk manipulasi client-side (Inspect Element, Console, Network Tab).
3.  **Postman / cURL**: Untuk pengujian API endpoint secara manual.
4.  **NPM Audit**: Untuk mengecek dependensi project.

---

## 🧪 Skenario Pengujian (Berdasarkan OWASP Top 10 Lengkap)

Berikut adalah daftar kerentanan yang harus diuji secara spesifik pada aplikasi "PEMIRA BEM", mencakup ke-10 kategori OWASP.

### 1. A01:2021-Broken Access Control (Kritis) 🚨
**Tujuan**: Memastikan user biasa tidak bisa mengakses fitur admin atau data orang lain.

*   **Test Case 1.1: Bypass Halaman Admin**
    *   **Langkah**: Logout dari admin. Coba akses URL `http://localhost:5173/admin/dashboard` secara langsung di browser.
    *   **Ekspektasi**: Redirect otomatis ke halaman login atau beranda. Data admin tidak tampil sekejap pun.
    *   **Bukti Dokumentasi**: 
        *   Screenshot browser saat URL mengetikkan link admin.
        *   Screenshot hasil redirect (halaman login).
        *   *Caption Skripsi*: "Gambar 4.x: Percobaan akses paksa URL Admin tanpa sesi valid otomatis diredirect sistem."

*   **Test Case 1.2: Database RLS Bypass**
    *   **Langkah**: Buka halaman Login di browser. Tekan `F12` untuk membuka Console. Ketik: `await window.supabase.from('votes').select('*')` lalu Enter.
    *   **Ekspektasi**: Error object dengan status `401 Unauthorized` atau array kosong `[]` dengan pesan error RLS policy.
    *   **Bukti Dokumentasi**: 
        *   Screenshot Console browser yang menampilkan pesan error merah dari Supabase RLS.
        *   *Caption Skripsi*: "Gambar 4.x: Kebijakan RLS (Row Level Security) mencegah pembacaan tabel Vote dari client tanpa otoritas."

### 2. A02:2021-Cryptographic Failures 🔐
**Tujuan**: Memastikan data sensitif dilindungi enkripsi yang kuat.

*   **Test Case 2.1: Audit Hash Token**
    *   **Langkah**: Buka Table Editor di Supabase -> tabel `voters`. Lihat kolom `access_code_hash`.
    *   **Ekspektasi**: Token tidak berbentuk teks (misal: "12345"), tapi hash acak panjang (Bcrypt start `$2a$...`).
    *   **Bukti Dokumentasi**: 
        *   Screenshot tabel database yang menunjukkan kolom hash.
        *   *Caption Skripsi*: "Gambar 4.x: Penyimpanan Access Code menggunakan hashing Bcrypt, sehingga database administrator tidak dapat melihat kode asli mahasiswa."

### 3. A03:2021-Injection (SQLi & XSS) 💉
**Tujuan**: Memastikan input user dibersihkan sebelum diproses.

*   **Test Case 3.1: SQL Injection Login**
    *   **Langkah**: Di form login, input NIM: `123' OR '1'='1` lalu tekan masuk.
    *   **Ekspektasi**: Muncul pesan "NIM tidak ditemukan" atau "Kode Akses salah". Bukan error database atau login berhasil.
    *   **Bukti Dokumentasi**: 
        *   Screenshot form login dengan input jahat.
        *   Screenshot pesan error UI.
        *   *Caption Skripsi*: "Gambar 4.x: Payload SQL Injection dianggap sebagai string biasa dan ditolak oleh validasi sistem."

*   **Test Case 3.2: Stored XSS**
    *   **Langkah**: (Via Database/Admin) Input Visi Misi kandidat dengan: `<script>alert('XSS Test')</script>`. Buka halaman Vote sebagai mahasiswa.
    *   **Ekspektasi**: Browser menampilkan teks `<script>...` apa adanya, TIDAK muncul popup alert.
    *   **Bukti Dokumentasi**: 
        *   Screenshot halaman vote yang menampilkan teks script mentah.
        *   *Caption Skripsi*: "Gambar 4.x: React secara otomatis meng-escape output HTML, sehingga serangan XSS dirender sebagai teks biasa."

### 4. A04:2021-Insecure Design (Logic flaws) 🧠
**Tujuan**: Mencegah manipulasi alur bisnis.

*   **Test Case 4.1: Double Voting**
    *   **Langkah**: Gunakan satu akun yang belum memilih. Lakukan request vote API endpoint yang sama 2x secara bersamaan (bisa pakai script atau klik super cepat dengan delay network).
    *   **Ekspektasi**: Vote pertama sukses, vote kedua gagal dengan error "User sudah memilih".
    *   **Bukti Dokumentasi**: 
        *   Screenshot Network Tab atau Response API yang menunjukkan satu `200 OK` dan satu error `400/500`.
        *   *Caption Skripsi*: "Gambar 4.x: Constraint database mencegah duplikasi suara dari satu NIM."

### 5. A05:2021-Security Misconfiguration ⚙️
**Tujuan**: Memastikan konfigurasi server aman.

*   **Test Case 5.1: Error Handling Verbose**
    *   **Langkah**: Matikan koneksi internet sesaat, lalu coba submit login.
    *   **Ekspektasi**: UI menampilkan pesan error generik ("Terjadi kesalahan koneksi"), tidak menampilkan stack trace kode.
    *   **Bukti Dokumentasi**: 
        *   Screenshot UI dengan pesan error yang rapi.
        *   *Caption Skripsi*: "Gambar 4.x: Error handling menyembunyikan detail teknis code dari pengguna akhir."

### 6. A06:2021-Vulnerable and Outdated Components 📦
**Tujuan**: Memastikan library pihak ketiga aman.

*   **Test Case 6.1: NPM Audit**
    *   **Langkah**: Jalankan command `npm audit` di terminal VS Code.
    *   **Ekspektasi**: Output "found 0 vulnerabilities" atau hanya low severity.
    *   **Bukti Dokumentasi**: 
        *   Screenshot terminal VS Code hasil command audit.
        *   *Caption Skripsi*: "Gambar 4.x: Hasil pemindaian dependensi menunjukkan tidak ada kerentanan kritikal pada library yang digunakan."

### 7. A07:2021-Identification and Authentication Failures 🔑
**Tujuan**: Tes kekuatan login.

*   **Test Case 7.1: Brute Force Token (Rate Limiting)**
    *   **Langkah**: Gunakan NIM valid, masukkan token salah 10x berturut-turut dengan cepat.
    *   **Ekspektasi**: Pada percobaan ke-11, muncul pesan "Terlalu banyak percobaan. Tunggu 10 menit.".
    *   **Bukti Dokumentasi**: 
        *   Screenshot UI pesan blokir merah.
        *   Screenshot tabel `audit_logs` yang berisi `SECURITY_ALERT`.
        *   *Caption Skripsi*: "Gambar 4.x: Mekanisme Rate Limiting memblokir IP penyerang setelah batas percobaan terlampaui."

### 8. A08:2021-Software and Data Integrity Failures 🛡️
**Tujuan**: Memastikan integritas kode dan update.

*   **Test Case 8.1: Integritas Client-Side**
    *   **Langkah**: Buka Tab Network (`F12`), filter JS. Lihat file `index-xxxx.js`.
    *   **Ekspektasi**: File dilayani dari origin yang sama (localhost/domain sendiri), tidak ada script mencurigakan dari domain antah berantah.
    *   **Bukti Dokumentasi**: 
        *   Screenshot Tab Network yang bersih dari domain asing (kecuali yang diizinkan seperti fonts.googleapis.com).
        *   *Caption Skripsi*: "Gambar 4.x: Semua aset dimuat dari sumber terpercaya (Same-Origin)."

### 9. A09:2021-Security Logging and Monitoring Failures 📝
**Tujuan**: Memastikan serangan tercatat.

*   **Test Case 9.1: Audit Log Trigger**
    *   **Langkah**: Cek kembali hasil Test Case 7.1 (Brute Force). Buka halaman Admin -> Audit Log.
    *   **Ekspektasi**: Ada log `LOGIN_FAIL` (percobaan awal) dan `SECURITY_ALERT` (saat terblokir) lengkap dengan IP Address.
    *   **Bukti Dokumentasi**: 
        *   Screenshot halaman Admin Audit Log yang men-highlight baris alert tersebut.
        *   *Caption Skripsi*: "Gambar 4.x: Sistem Logging mencatat anomali keamanan secara real-time untuk audit forensik."

### 10. A10:2021-Server-Side Request Forgery (SSRF) 🌐
**Tujuan**: Mencegah server melakukan request berbahaya ke internal network.

*   **Test Case 10.1: Client-Side Fetch Verification**
    *   **Langkah**: Verifikasi kode `LoginPage.jsx` bagian pengambilan IP.
    *   **Ekspektasi**: Kode menggunakan `fetch('https://api.ipify.org')` yang berjalan di Browser User, BUKAN di Server Supabase (Postgres Function).
    *   **Bukti Dokumentasi**: 
        *   Screenshot potongan kode (Code Snippet) `LoginPage.jsx`.
        *   *Caption Skripsi*: "Gambar 4.x: Implementasi fetch IP dilakukan di sisi klien (frontend), mengeliminasi risiko SSRF pada server backend."

---

## 📊 Template Matriks Laporan Akhir

Gunakan tabel ini sebagai kesimpulan di BAB 4 (Pengujian dan Analisis).

| No | Kategori OWASP Top 10 | Metode Pengujian | Status | Keterangan |
|:--:|:----------------------|:-----------------|:------:|:-----------|
| 1 | Broken Access Control | Manual URL Bypass | PASS | URL Admin terproteksi Guard login. |
| 2 | Cryptographic Failures | DB Inspection | PASS | Password/Token di-hash (Bcrypt). |
| 3 | Injection | Payload Test | PASS | Input sanitization aktif via React & RPC. |
| 4 | Insecure Design | Stress Test | PASS | Race condition teratasi atomic transaction. |
| 5 | Security Misconfiguration | Error Observ. | PASS | Error detail disembunyikan dari user. |
| 6 | Vulnerable Components | NPM Audit | PASS | Dependensi aman (update rutin). |
| 7 | Auth Failures | Brute Force Test | PASS | Blocked setelah 10x gagal (10 menit). |
| 8 | Integrity Failures | Source Review | PASS | Integrity aset terjaga local serving. |
| 9 | Logging Failures | Log Inspection | PASS | Admin action & Security event tercatat. |
| 10 | SSRF | Code Review | PASS | Tidak ada server-side fetch user-controlled. |

