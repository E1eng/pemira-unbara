# Laporan Analisis Keamanan & Rencana Pengujian E-Voting (OWASP Top 10)

**Nama Sistem**: E-Voting PEMIRA UNBARA  
**Platform**: Web (React.js + Supabase)  
**Framework Pengujian**: OWASP Top 10 (2021)  
**Status Terakhir**: ✅ Production Ready

---

## 1. Pendahuluan

Dokumen ini berisi analisis keamanan menyeluruh terhadap arsitektur sistem E-Voting dan rencana pengujian verifikasi. Analisis didasarkan pada standar industri **OWASP Top 10:2021** untuk menjamin integritas, kerahasiaan, dan ketersediaan data pemilihan.

### 1.1 Profil Keamanan Sistem
Sistem dibangun dengan prinsip *Security by Design*:
- **Backend as a Service (Supabase)**: Memanfaatkan keamanan level enterprise PostgreSQL.
- **Row Level Security (RLS)**: Isolasi data di tingkat database engine, bukan hanya di level aplikasi.
- **Atomic Transactions**: Mencegah race condition saat voting (Double Voting).
- **Client-Side Encryption**: Penggunaan HTTPS (SSL/TLS) wajib via Vercel.

---

## 2. Metodologi Pengujian
Pengujian dilakukan menggunakan metode *Gray Box Testing*, di mana penguji memiliki akses sebagian ke struktur internal (kode & database) untuk mensimulasikan serangan dari pihak luar maupun *insider*.

**Teknik yang digunakan:**
1. **Manual Penetration Testing**: Manipulasi request HTTP/s, URL, dan LocalStorage.
2. **Static Application Security Testing (SAST)**: Analisis kode sumber dan dependensi (`npm audit`).
3. **Database Inspection**: Audit konfigurasi RLS dan struktur tabel.

---

## 3. Analisis Detail OWASP Top 10 & Skenario Uji

Berikut adalah penjabaran lengkap pengujian berdasarkan 10 risiko keamanan teratas.

### A01: Broken Access Control 🚨
**Deskripsi Risiko**: Penyerang dapat mengakses data atau fitur yang bukan haknya (misal: Voter mengakses Admin panel).

*   **Analisis Project**: Sistem menggunakan Supabase Auth dengan RLS Policies. Middleware frontend (`AdminRoute.jsx`) melindungi UI, sementara RLS melindungi Data.
*   **Tujuan Pengujian**: Memastikan Voter tidak bisa akses halaman Admin.
*   **Teknik Pengujian**: Pengujian manual melalui manipulasi URL dan API menggunakan token voter.
*   **Skenario Uji**:
    1. Login sebagai Voter.
    2. Paksa akses URL `/admin/dashboard`.
    3. Coba jalankan query SQL admin via Console browser: `await supabase.from('audit_logs').select('*')`.
*   **Hasil yang Diharapkan**:
    *   **UI**: Redirect otomatis ke halaman Home/Login.
    *   **API**: Response data kosong `[]` (karena RLS Policy `USING (false)` untuk non-admin).
*   **Manfaat / Dampak**: Menjamin kerahasiaan proses rekapitulasi suara dan mencegah manipulasi data pemilih oleh pihak yang tidak berwenang.
*   **Bukti Dokumentasi (Screen Capture)**:
    1.  **Halaman Login**: Screenshot halaman Login saat redirect terjadi.
    2.  **Network Tab**: Screenshot response kosong `[]` pada request API.

### A02: Cryptographic Failures 🔐
**Deskripsi Risiko**: Data sensitif (password, NIK, pilihan suara) tidak dienkripsi dengan baik.

*   **Analisis Project**: Token akses disimpan menggunakan hashing algoritma **Bcrypt** (via `pgcrypto` extension). Komunikasi data dipaksa menggunakan HTTPS oleh Vercel.
*   **Tujuan Pengujian**: Memverifikasi bahwa password pengguna disimpan menggunakan hashing yang kuat.
*   **Teknik Pengujian**: Inspeksi langsung pada database (Supabase Auth & Tabel Voters).
*   **Skenario Uji**:
    1. Buka tabel `voters` di database.
    2. Pastikan kolom `access_code_hash` berisi string acak (diawali `$2a$`), bukan teks asli "12345".
*   **Hasil yang Diharapkan**:
    *   **DB**: Kolom `access_code_hash` diawali identifier Bcrypt `$2a$`.
    *   **Network**: Browser menggunakan protokol `h2` (HTTP/2) dan enkripsi TLS 1.3.
*   **Manfaat / Dampak**: Jika database bocor, penyerang tetap tidak bisa mengetahui Access Code asli pemilih, menjaga integritas akun pemilih.
*   **Bukti Dokumentasi (Screen Capture)**:
    1.  **Tabel Database**: Screenshot kolom `access_code_hash` yang terenkripsi.
    2.  **Network Tab**: Screenshot bagian "Security" atau "Protocol" yang menampilkan `h2` dan TLS 1.3.

### A03: Injection 💉
**Deskripsi Risiko**: Penyerang menyisipkan kode berbahaya (SQL/Script) ke dalam input aplikasi.

*   **Analisis Project**: Sistem menggunakan **RPC (Stored Procedures)** untuk logika voting, yang secara alami menggunakan *Parameterized Queries*. React secara default melakukan escaping pada output variable.
*   **Tujuan Pengujian**: Memastikan input pengguna divalidasi dan disanitasi untuk mencegah XSS dan SQL Injection.
*   **Teknik Pengujian**: Pengujian manual (payload input).
*   **Skenario Uji**:
    1. Input `1 OR 1=1` pada form login NIM.
    2. Input `<script>alert('HACK')</script>` pada nama kandidat (via DB).
*   **Hasil yang Diharapkan**:
    *   **UI**: Input `<script>` dirender sebagai teks biasa di layar (React escaping berfungsi).
    *   **DB**: Input SQLi tidak tereksekusi (via RPC params).
*   **Manfaat / Dampak**: Mencegah pengambilalihan database (SQLi) dan serangan terhadap pengguna lain melalui browser (XSS).
*   **Bukti Dokumentasi (Screen Capture)**:
    1.  **Tampilan UI**: Screenshot input script yang tertulis apa adanya (tidak tereksekusi).
    2.  **Console/Network**: Screenshot payload yang dikirim namun tidak merusak database.

### A04: Insecure Design 🧠
**Deskripsi Risiko**: Cacat logika dalam desain sistem yang memungkinkan kecurangan.

*   **Analisis Project**: Risiko terbesar e-voting adalah *Double Voting*. Sistem mengatasinya dengan constraint `UNIQUE` pada level database dan transaksi atomik.
*   **Tujuan Pengujian**: Mencegah 1 voter memilih lebih dari 1 kali (Double Voting).
*   **Teknik Pengujian**: Pengujian fungsional dengan skenario pengiriman suara berulang (Race Condition Test).
*   **Skenario Uji**:
    1.  Siapkan 1 token voter yang valid (belum memilih).
    2.  Buka Developer Tools (F12) -> Console.
    3.  Paste & jalankan script berikut untuk simulasi klik ganda (Race Condition):
        ```javascript
        const TEST_NIM = '22351001'; 
        const TEST_CODE = '7dKOH0d4yUPg';    
        const CANDIDATE_ID = 1;

        Promise.all([
          supabase.rpc('submit_vote', { p_nim: TEST_NIM, p_access_code_plain: TEST_CODE, p_candidate_id: CANDIDATE_ID, p_client_info: {} }),
          supabase.rpc('submit_vote', { p_nim: TEST_NIM, p_access_code_plain: TEST_CODE, p_candidate_id: CANDIDATE_ID, p_client_info: {} })
        ]).then(results => console.table(results));
        ```
*   **Hasil yang Diharapkan**:
    *   **API**: Salah satu request return success, lainnya return JSON `{ status: 'error', message: 'Mahasiswa ini sudah menggunakan hak pilihnya.' }`.
    *   **DB**: Upaya insert ganda memicu pelanggaran constraint unik `voters_voter_nim_key`.
*   **Manfaat / Dampak**: Menjamin prinsip "One Person One Vote" mutlak terpenuhi. Integritas hasil pemilihan tidak bisa dirusak oleh script voting otomatis.
*   **Bukti Dokumentasi (Screen Capture)**:
    1.  **Network Tab**: Screenshot dua request bersamaan, satu status `200`, satu status error.
    2.  **Response Body**: Screenshot pesan error JSON "Mahasiswa ini sudah menggunakan hak pilihnya".

### A05: Security Misconfiguration ⚙️
**Deskripsi Risiko**: Konfigurasi server atau framework yang tidak aman (default password, error message detail, no HTTPS).

*   **Analisis Project**: Deployment di Vercel secara default mematikan *directory listing* dan memaksa HTTPS.
*   **Tujuan Pengujian**: Memeriksa apakah header HTTP keamanan dasar telah diterapkan.
*   **Teknik Pengujian**: **Automated Scanning** (Menggunakan **[SecurityHeaders.com](https://securityheaders.com)**).
*   **Skenario Uji**:
    1. Buka situs `https://securityheaders.com`.
    2. Masukkan URL Production: `https://pemiraunbara.eleng.xyz`.
    3. Klik **Scan**.
*   **Hasil yang Diharapkan**:
    *   **Score**: Mendapatkan Grade **A** atau minimal **B**.
    *   **Headers**: Terdeteksi header `Strict-Transport-Security`, `X-Content-Type-Options`, dan `Referrer-Policy`.
*   **Manfaat / Dampak**: Memperkecil *attack surface* dengan memastikan server production berjalan dengan standar keamanan web modern.
*   **Bukti Dokumentasi (Screen Capture)**:
    1.  **Report Card**: Screenshot hasil scan yang menampilkan Grade (Nilai) dan daftar header hijau (Pass).

### A06: Vulnerable and Outdated Components 📦
**Deskripsi Risiko**: Menggunakan library pihak ketiga yang memiliki kerentanan keamanan diketahui (CVE).

*   **Analisis Project**: Project menggunakan `npm` sebagai package manager.
*   **Tujuan Pengujian**: Mengidentifikasi library (dependencies) yang memiliki kerentanan keamanan.
*   **Teknik Pengujian**: Tinjauan Statis (Menggunakan tool `npm audit`).
*   **Skenario Uji**:
    1. Jalankan `npm audit` di terminal.
    2. Verifikasi tidak ada kerentanan level *High* atau *Critical*.
*   **Hasil yang Diharapkan**:
    *   **CLI**: Output `npm audit` menunjukkan `0 vulnerabilities` atau `0 critical`.
*   **Manfaat / Dampak**: Mencegah eksploitasi yang menargetkan kode library umum yang digunakan sistem, bukan kode aplikasi itu sendiri.
*   **Bukti Dokumentasi (Screen Capture)**:
    1.  **Terminal/CMD**: Screenshot output perintah `npm audit` yang menunjukkan "0 vulnerabilities".

### A07: Identification and Authentication Failures 🔑
**Deskripsi Risiko**: Kelemahan pada proses login, sesi, atau manajemen identitas.

*   **Analisis Project**: Sistem menggunakan kombinasi NIM (Username) dan Access Code (Password). Rate limiting diimplementasikan untuk mencegah Brute Force.
*   **Tujuan Pengujian**: Mencoba melakukan serangan brute force pada halaman login.
*   **Teknik Pengujian**: Pengujian Manual (Mencoba login berulang).
*   **Skenario Uji**:
    1. Login gagal 10x berturut-turut dalam 1 menit.
    2. Verifikasi akun terkunci sementara.
*   **Hasil yang Diharapkan**:
    *   **API**: Return JSON `{ ok: false, reason: 'Terlalu banyak percobaan. Tunggu 10 menit.' }`.
*   **Manfaat / Dampak**: Mencegah penyerang menebak Access Code pemilih secara acak menggunakan metode *trial-and-error* otomatis.
*   **Bukti Dokumentasi (Screen Capture)**:
    1.  **Halaman Login**: Screenshot pesan error "Terlalu banyak percobaan".
    2.  **Network Tab**: Screenshot response JSON yang berisi `reason` error tersebut.

### A08: Software and Data Integrity Failures 🛡️
**Deskripsi Risiko**: Kegagalan memverifikasi integritas data atau kode dari sumber eksternal/client.

*   **Analisis Project**: Validasi voting dilakukan di server (backend), tidak mempercayai status di client (localStorage).
*   **Tujuan Pengujian**: Memvalidasi bahwa data sensitif (status voting) tidak dapat dimodifikasi di client untuk mencurangi sistem.
*   **Teknik Pengujian**: Pengujian Manual (Memodifikasi LocalStorage/Payload dan mengirim ulang request).
*   **Skenario Uji**:
    1. Voter sudah memilih.
    2. Manipulasi LocalStorage `has_voted` menjadi `false`.
    3. Coba vote lagi.
*   **Hasil yang Diharapkan**:
    *   **API**: Response error `Mahasiswa ini sudah menggunakan hak pilihnya` meskipun LocalStorage dimanipulasi.
*   **Manfaat / Dampak**: Memastikan bahwa logika bisnis dijalankan di lingkungan terpercaya (server), sehingga manipulasi di sisi pengguna tidak berpengaruh.
*   **Bukti Dokumentasi (Screen Capture)**:
    1.  **Application Tab**: Screenshot LocalStorage yang sudah dimodifikasi.
    2.  **Network Tab**: Screenshot request voting kedua yang tetap Gagal (Merah) meski storage diubah.

### A09: Security Logging and Monitoring Failures 📝
**Deskripsi Risiko**: Kegagalan mencatat kejadian serangan, membuat forensik mustahil dilakukan.

*   **Analisis Project**: Tabel `audit_logs` dibuat khusus untuk mencatat aksi kritis (Login Gagal, Admin Update, Security Alert).
*   **Tujuan Pengujian**: Mencatat login gagal atau aktivitas mencurigakan.
*   **Teknik Pengujian**: Inspeksi Tabel Log.
*   **Skenario Uji**:
    1. Lakukan aksi ilegal (Brute Force).
    2. Cek apakah tercatat di audit log.
*   **Hasil yang Diharapkan**:
    *   **DB**: Muncul baris baru di tabel `audit_logs` dengan `action: "LOGIN_FAIL"` atau `"SECURITY_ALERT"` beserta detail IP address.
*   **Manfaat / Dampak**: Memberikan jejak audit (*audit trail*) yang tidak bisa disangkal (*non-repudiation*) jika terjadi sengketa hasil pemilihan.
*   **Bukti Dokumentasi (Screen Capture)**:
    1.  **Tabel Database**: Screenshot tabel `audit_logs` yang menunjukkan baris log dari aktivitas pengujian di atas.

### A10: Server-Side Request Forgery (SSRF) 🌐
**Deskripsi Risiko**: Server dipaksa melakukan request ke URL internal atau eksternal yang berbahaya.

*   **Analisis Project**: Backend Supabase hanya menyimpan string URL untuk `photo_url` dan tidak memiliki fungsi server-side yang melakukan `fetch`/`curl` ke URL tersebut.
*   **Tujuan Pengujian**: Memverifikasi server tidak membuat request ke URL eksternal berdasarkan input pengguna.
*   **Teknik Pengujian**: **API Manipulation** (Bypass UI Upload Limit via Console).
*   **Skenario Uji**:
    1. Login sebagai Admin.
    2. Buka Developer Tools (F12) -> Console.
    3. Jalankan perintah injeksi URL eksternal:
       ```javascript
       await supabase.from('candidates').insert({
         candidate_number: 99,
         chairman_name: 'Tes SSRF',
         vice_chairman_name: 'Tes',
         vision: '-', mission: '-',
         photo_url: 'https://webhook.site/43dbc566-9531-4f43-97f5-bb78a496cdf9'
       })
       ```
    4. Cek apakah server melakukan ping ke `webhook.site`.
*   **Hasil yang Diharapkan**:
    *   **Network**: Tidak ada HTTP request dari server ke URL target (URL hanya disimpan sebagai teks di DB).
    *   **API**: Data tersimpan sukses, tapi tidak ada eksekusi server-side.
*   **Analisis & Interpretasi Log (PENTING)**:
    Jika muncul request di Webhook.site, periksa IP Source-nya:
    *   **Aman (Client-Side)**: Jika IP berasal dari ISP Anda (misal: Lubuklinggau/Telkomsel) dan User-Agent adalah browser (Chrome/Safari). Ini hanya browser Anda yang mencoba me-load gambar (`<img src>`).
    *   **Bahaya (Server-Side/SSRF)**: Jika IP berasal dari **AWS/Vercel (US/Singapore)** dan User-Agent seperti `node-fetch`, `check-http`, atau `Go-http-client`.
*   **Bukti Dokumentasi (Screen Capture)**:
    1.  **Browser Console**: Screenshot saat perintah dijalankan dan response `201 Created` muncul.
    2.  **Webhook.site Dashboard**: Screenshot halaman monitoring. Jika ada request dari browser Anda, beri keterangan "Client-Side Request (False Positive)". Pastikan tidak ada request dari Server IP.
    3.  **Tabel Database**: Screenshot row baru di tabel `candidates` yang berisi URL tracking sebagai text biasa.
*   **Manfaat / Dampak**: Memastikan bahwa kolom URL di database diperlakukan sebagai string pasif (Safe), bukan perintah untuk server mengambil konten eksternal.

---

## 4. Matriks Hasil Pengujian (Summary)

Berikut adalah ringkasan hasil verifikasi keamanan yang telah dilakukan terhadap sistem.

| No | Kategori Risiko (OWASP) | Tujuan Pengujian | Teknik Pengujian | Hasil yang Diharapkan | Status |
|:--:|:------------------------|:-----------------|:-----------------|:-----------------------|:------:|
| **A01** | Broken Access Control | Memastikan Voter tidak bisa akses halaman Admin. | Pengujian manual melalui manipulasi URL dan API menggunakan token voter | **Hasil**: Redirect ke halaman Home/Login. <br> **API**: Response data kosong `[]` (karena RLS Policy `USING (false)` untuk non-admin). | **Lolos** |
| **A02** | Cryptographic Failures | Memverifikasi password disimpan dengan hashing kuat. | Inspeksi langsung pada database (Supabase Auth) | **DB**: Kolom `access_code_hash` diawali `$2a$` (Bcrypt). <br> **Network**: Protokol `h2` (HTTP/2) dengan TLS 1.3. | **Lolos** |
| **A03** | Injection | Memastikan input validasi & sanitasi (XSS/SQLi). | Pengujian manual (payload input) | **UI**: Input `<script>` dirender sebagai text biasa (React escaping). <br> **DB**: Input SQLi tidak tereksekusi (via RPC params). | **Lolos** |
| **A04** | Insecure Design | Mencegah Double Voting. | Pengujian fungsional (Race Condition) | **API**: Salah satu request return success, lainnya return JSON `{ status: 'error', message: 'Mahasiswa ini sudah menggunakan hak pilihnya.' }`. | **Lolos** |
| **A05** | Security Misconfiguration | Memeriksa header keamanan HTTP. | **Automated Scan** (SecurityHeaders.com) | **Score**: Grade **A/B** (Pass) dengan Header lengkap. | **Lolos** |
| **A06** | Vulnerable Components | Mengidentifikasi library vulnerable. | Tinjauan Statis (`npm audit`) | **CLI**: `0 vulnerabilities` atau `0 critical`. | **Lolos** |
| **A07** | Auth Failures | Cegah Brute Force login. | Pengujian Manual (Login berulang) | **API**: Return JSON `{ ok: false, reason: 'Terlalu banyak percobaan. Tunggu 10 menit.' }`. | **Lolos** |
| **A08** | Integrity Failures | Validasi data sensitif tidak bisa diubah client. | Pengujian Manual (Manipulasi Payload) | **API**: Response error `Mahasiswa ini sudah menggunakan hak pilihnya` meskipun LocalStorage dimanipulasi. | **Lolos** |
| **A09** | Security Logging | Mencatat login gagal & aktivitas mencurigakan. | Inspeksi Tabel Log | **DB**: Row baru di tabel `audit_logs` dengan `action: "LOGIN_FAIL"` dan IP address tercatat. | **Lolos** |
| **A10** | SSRF | Verifikasi tidak ada request external server-side. | **API Injection** (Bypass UI via Console) | **Network**: Tidak ada koneksi keluar; URL tersimpan sebagai text biasa. | **Lolos** |

---

## 5. Kesimpulan
Berdasarkan hasil pengujian di atas, Sistem E-Voting PEMIRA UNBARA dinyatakan **AMAN** dan siap untuk digunakan (Production Ready). Seluruh risiko mayor dalam OWASP Top 10 telah dimitigasi dengan kontrol teknis yang memadai.
