# Lembar Validasi Pengujian Keamanan (Grey Box Testing)

**Judul Skripsi:** Implementasi Platform E-Voting Berbasis Website dengan Penerapan Kerangka Keamanan OWASP (Studi Kasus: Pemilihan Presiden Mahasiswa Universitas Baturaja)

**Metode Pengujian:** Grey Box Testing (Penetration Testing) berbasis kerangka **OWASP Top 10:2021**

Berbeda dengan Black Box Testing yang memvalidasi fungsionalitas, pengujian Grey Box berfokus pada validasi keamanan. Penguji memiliki pengetahuan terbatas atas struktur internal sistem (akses API dan kode sumber yang dipublikasikan di GitHub), namun melakukan simulasi serangan dari sudut pandang penyerang luar. Karena bersifat teknis, validasi dilakukan **berdasarkan bukti (evidence-based)** dan disahkan oleh **validator yang berkompeten di bidang keamanan**.

---

## A. Identitas Validator Ahli (Pengujian Keamanan)

| Keterangan | Isi |
|------------|-----|
| Nama Validator | .......................................................... |
| Jabatan / Instansi | .......................................................... |
| Bidang Keahlian | (mis. Keamanan Sistem / Keamanan Jaringan / IT Security) |
| Tanggal Pengujian | .......................................................... |

---

## B. Tabel Hasil Pengujian Keamanan (OWASP Top 10)

Kolom **Status** diisi oleh validator dengan tanda centang (✓) berdasarkan kesesuaian antara *Hasil yang Diharapkan* dan *Hasil Aktual* yang dibuktikan saat pengujian.

| No | Kategori Risiko (OWASP) | Teknik Pengujian | Hasil yang Diharapkan | Lolos | Tidak Lolos |
|----|--------------------------|------------------|------------------------|:-----:|:-----------:|
| A01 | Broken Access Control | Manipulasi URL & pemanggilan API (RPC) memakai sesi non-admin | Akses ditolak: redirect ke Login, query tabel sensitif mengembalikan `[]`/error, RPC admin menolak dengan pesan *Unauthorized* | | |
| A02 | Cryptographic Failures | Inspeksi langsung kolom `access_code_hash` pada tabel `voters` + cek protokol koneksi | Token tersimpan sebagai hash BCrypt (diawali `$2a$`/`$2b$`), bukan teks asli. Koneksi memakai HTTPS/TLS | | |
| A03 | Injection (SQLi & XSS) | Menyisipkan payload `1 OR 1=1` dan `<script>alert()</script>` pada input | Payload tidak tereksekusi: SQLi gagal (parameterized query via RPC), `<script>` dirender sebagai teks (React escaping) | | |
| A04 | Insecure Design (Double Voting) | Race condition test memakai `Promise.all` mengirim 2 suara bersamaan | Hanya 1 suara tercatat; request kedua ditolak karena `has_voted=true` (row lock `FOR UPDATE`) | | |
| A05 | Security Misconfiguration | Automated scan via SecurityHeaders.com pada URL production | Memperoleh Grade A/B dengan header `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy` | | |
| A06 | Vulnerable & Outdated Components | Tinjauan statis dependency memakai `npm audit` | Tidak ada kerentanan level *High*/*Critical* yang belum termitigasi | | |
| A07 | Identification & Authentication Failures | Brute force simulation (loop login gagal 11x via console) | Setelah ambang batas tercapai, sistem mengunci sementara: *"Terlalu banyak percobaan. Tunggu 10 menit."* (rate limiting) | | |
| A08 | Software & Data Integrity Failures | Client-side state tampering (manipulasi `localStorage` + paksa kirim ulang vote) | Server menolak vote kedua meski state klien dimanipulasi (validasi di sisi server) | | |
| A09 | Security Logging & Monitoring Failures | Melakukan aksi mencurigakan lalu inspeksi tabel `audit_logs` | Aktivitas terekam dengan `action` (`LOGIN_FAIL`/`SECURITY_ALERT`), detail IP, dan timestamp | | |
| A10 | Server-Side Request Forgery (SSRF) | Audit ekstensi database aktif via SQL Editor | Ekstensi outbound (`http`, `pg_net`, dll) tidak terpasang; server tidak mampu melakukan request keluar | | |

---

## C. Catatan / Temuan Validator

```
......................................................................................
......................................................................................
......................................................................................
```

---

## D. Kesimpulan Validasi

Berdasarkan pengujian keamanan dengan metode Grey Box terhadap kerangka OWASP Top 10, sistem E-Voting PEMIRA UNBARA dinyatakan:

☐ **LOLOS** seluruh kategori pengujian keamanan (Layak / Aman digunakan)

☐ **LOLOS dengan catatan** (perlu perbaikan minor sebagaimana tercantum pada bagian C)

☐ **TIDAK LOLOS** (perlu perbaikan mayor)

<br>

|  |  |
|---|---|
| Baturaja, ........................ 2026 | |
| | |
| | |
| **( .................................................... )** | |
| Validator Ahli Pengujian Keamanan | |
| NIDN/NIP/ID: ............................ | |

---

### Lampiran Bukti Pengujian (Evidence)
Setiap baris pada Tabel B wajib disertai bukti dokumentasi (screenshot) sebagai lampiran, antara lain:
- **A01**: tangkapan layar redirect Login + response `[]`/error pada Network tab
- **A02**: tangkapan layar kolom `access_code_hash` (hash BCrypt) + indikator HTTPS/TLS
- **A03**: tangkapan layar input `<script>` yang tampil sebagai teks biasa
- **A04**: tangkapan layar dua request (satu sukses, satu error "sudah memilih")
- **A05**: tangkapan layar report card SecurityHeaders.com (Grade)
- **A06**: tangkapan layar output `npm audit`
- **A07**: tangkapan layar pesan "Terlalu banyak percobaan"
- **A08**: tangkapan layar console saat vote kedua ditolak
- **A09**: tangkapan layar baris baru pada tabel `audit_logs`
- **A10**: tangkapan layar hasil query ekstensi database
