# PROTOTYPE ASCII VISUALIZATION - SISTEM E-VOTING PEMIRA

Dokumen ini berisi representasi visual (wireframe/mockup) dalam bentuk ASCII untuk setiap halaman aplikasi.
Resolusi Referensi: Desktop (1280px width)
Dibuat berdasarkan analisis source code (React + Tailwind).

---

## 1. HOMEPAGE (Landing Page)
**URL:** `/`
**Akses:** Publik

```ascii
+-----------------------------------------------------------------------+
|  [LOGO] PEMIRA UNBARA                                  [Login] [Menu] |
+-----------------------------------------------------------------------+
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |  HERO SECTION (Dark Premium Background + Sparkles Effect)       |  |
|  |                                                                 |  |
|  |  [ Badge: PEMIRA UNBARA 2026 (Pulsing Dot) ]                    |  |
|  |                                                                 |  |
|  |  Suara Anda,                                                    |  |
|  |  Masa Depan Kampus.                                             |  |
|  |  ---------------------------------------------                  |  |
|  |                                                                 |  |
|  |  Platform e-voting modern untuk pemilihan umum raya             |  |
|  |  yang transparan, jujur, dan efisien.                           |  |
|  |                                                                 |  |
|  |  [ User Logged In State (If Auth): ]                            |  |
|  |  [ (UserIcon) Login sbg: 12345...      [Keluar] ]               |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
|  [ STATUS GRID ]                                                      |
|  +-------------------+  +-------------------+  +-------------------+  |
|  | Status Voting     |  | Live Result       |  | Total Pemilih     |  |
|  | [ Clock Icon ]    |  | [ Chart Icon ]    |  | [ Users Icon ]    |  |
|  |                   |  |                   |  |                   |  |
|  | DIBUKA (Open)     |  | AKTIF (Shown)     |  | 3,500             |  |
|  | (Hijau)           |  | (Biru)            |  | mahasiswa         |  |
|  +-------------------+  +-------------------+  +-------------------+  |
|                                                                       |
|  [ PRIMARY ACTIONS ]                                                  |
|  +-------------------------------------+  +------------------------+  |
|  |  BILIK SUARA (Gradient Purple)      |  |  HASIL REAL COUNT      |  |
|  |                                     |  |  (White Card)          |  |
|  |  Masuk ke bilik suara digital       |  |  Lihat perolehan suara |  |
|  |  untuk menggunakan hak pilih.       |  |  sementara.            |  |
|  |                                     |  |                        |  |
|  |  [ Mulai Voting > ]                 |  |  [ Lihat Grafik ]      |  |
|  +-------------------------------------+  +------------------------+  |
|                                                                       |
|  [ FOOTER ]                                                           |
|  [Instagram BEM]  [Instagram DPM]                                     |
|  (c) Sistem terenkripsi & terverifikasi oleh KPU Kemahasiswaan        |
+-----------------------------------------------------------------------+
```

---

## 2. LOGIN PAGE (Halaman Masuk)
**URL:** `/login`
**Akses:** Publik -> Secure

```ascii
+-----------------------------------------------------------------------+
|  [< Kembali]                                                          |
+-----------------------------------------------------------------------+
|                                                                       |
|          (Aurora Background Animation)                                |
|                                                                       |
|       +-------------------------------------------------------+       |
|       |  [ Shield Icon (Gradient) ]                           |       |
|       |                                                       |       |
|       |  Login Pemilih                                        |       |
|       |  Masukkan NIM dan Kode Akses untuk mulai memilih.     |       |
|       |                                                       |       |
|       |  +-------------------------------------------------+  |       |
|       |  | [User Icon]  NIM / NPM                          |  |       |
|       |  +-------------------------------------------------+  |       |
|       |                                                       |       |
|       |  +-------------------------------------------------+  |       |
|       |  | [Key Icon]   Kode Akses (Token)        [Eye]    |  |       |
|       |  +-------------------------------------------------+  |       |
|       |                                                       |       |
|       |  (Error Alert Box appears here if invalid)            |       |
|       |                                                       |       |
|       |  [ BUTTON: Masuk ke Bilik Suara (Gradient) ]          |       |
|       |                                                       |       |
|       +-------------------------------------------------------+       |
|                                                                       |
|       (c) 2025 Panitia Pemilihan Raya UNBARA                          |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## 3. VOTE PAGE (Bilik Suara)
**URL:** `/vote`
**Akses:** Authenticated Only (RequireAuth)

```ascii
+-----------------------------------------------------------------------+
| [LOGO]                                          [Logout Button (Icon)]|
+-----------------------------------------------------------------------+
|                                                                       |
|  Bilik Suara                                     [BadgeStatus: DIBUKA]|
|  Tentukan pilihan masa depan kampus.                                  |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  | Login Sebagai:                                                  |  |
|  | [UserIcon] 202102030 (NIM)                    [Logout IconBtn]  |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
|  [ CANDIDATE GRID ]                                                   |
|                                                                       |
|  +-------------------------+      +-------------------------+         |
|  |   [   FOTO KANDIDAT  ]  |      |   [   FOTO KANDIDAT  ]  |         |
|  |   (Square Aspect)       |      |                         |         |
|  |   [#01 Badge]           |      |   [#02 Badge]           |         |
|  |                         |      |                         |         |
|  |   Budi Santoso          |      |   Siti Aminah           |         |
|  |   & Ahmad Dhani         |      |   & Joko Widodo         |         |
|  |                         |      |                         |         |
|  |   [Detail] [ PILIH ]    |      |   [Detail] [ PILIH ]    |         |
|  +-------------------------+      +-------------------------+         |
|                                                                       |
+-----------------------------------------------------------------------+

--- [MODAL: DETAIL KANDIDAT] ---
+-------------------------------------------------------+
|  Detail Kandidat                                [X]   |
|-------------------------------------------------------|
|          [ Foto Kandidat Portrait ]                   |
|                                                       |
|          ( #1 )                                       |
|      Budi Santoso                                     |
|      & Ahmad Dhani                                    |
|                                                       |
|  [Box Visi]                                           |
|  Visi: Menjadikan kampus unggul...                    |
|                                                       |
|  [Box Misi]                                           |
|  Misi:                                                |
|  1. Transparansi anggaran                             |
|  2. Kegiatan mahasiswa aktif                          |
|                                                       |
|  [ TUTUP ]   [ PILIH KANDIDAT INI ]                   |
+-------------------------------------------------------+

--- [MODAL: KONFIRMASI PILIHAN] ---
+-------------------------------------------------------+
|                                                       |
|        [ Icon Kotak Suara Besar 🗳️ ]                  |
|                                                       |
|        Anda yakin memilih:                            |
|        BUDI SANTOSO & AHMAD DHANI                     |
|                                                       |
|    [Warn: Pilihan tidak dapat diubah setelah dikirim] |
|                                                       |
|      [ BATAL ]    [ YA, KIRIM SUARA ]                 |
|                                                       |
+-------------------------------------------------------+
```

---

## 4. THANK YOU PAGE (Selesai Voting)
**URL:** `/thank-you`
**Akses:** Post-Vote Redirect

```ascii
+-----------------------------------------------------------------------+
|                                                                       |
|           (Confetti Animation Drops from Top)                         |
|                                                                       |
|       +-------------------------------------------------------+       |
|       |  [ Check Circle Icon (Green) ]                        |       |
|       |                                                       |       |
|       |  Terima Kasih!                                        |       |
|       |  Suara Anda telah berhasil direkam.                   |       |
|       |                                                       |       |
|       |  +-------------------------------------------------+  |       |
|       |  | [Shield] Keamanan Terjamin                      |  |       |
|       |  | Demi privasi, sesi diakhiri otomatis.           |  |       |
|       |  +-------------------------------------------------+  |       |
|       |                                                       |       |
|       |  +-------------------------------------------------+  |       |
|       |  | [Clock] Pengalihan Otomatis                     |  |       |
|       |  | Kembali ke beranda dalam 10 detik...       [10] |  |       |
|       |  +-------------------------------------------------+  |       |
|       |                                                       |       |
|       |  [ BUTTON: Kembali ke Beranda ]                       |       |
|       |                                                       |       |
|       |  (Link: Ingin melihat hasil? > [Hasil Akhir])         |       |
|       +-------------------------------------------------------+       |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## 5. RESULTS PAGE (Real Count)
**URL:** `/results`
**Akses:** Publik (If `show_live_result` = true)

```ascii
+-----------------------------------------------------------------------+
|  Real Count                               [Patch: 1,250 Suara Masuk]  |
|  (Live Update Indicator: ●)                                           |
+-----------------------------------------------------------------------+
|                                                                       |
|  [ STATS ROW ]                                                        |
|  +---------------------+   +-----------------------+                  |
|  | [Users] Total DPT   |   | [Chart] Partisipasi   |                  |
|  | 3,500               |   | 65%                   |                  |
|  | Mahasiswa           |   | 1,225 Belum           |                  |
|  +---------------------+   +-----------------------+                  |
|                                                                       |
|  [ LEADER SPOTLIGHT (Winner Card) ]                                   |
|  +-----------------------------------------------------------------+  |
|  |                                                                 |  |
|  |          [ PHOTO with Gold Ring ]                               |  |
|  |                [#01 Badge]                                      |  |
|  |                                                                 |  |
|  |          BUDI SANTOSO                                           |  |
|  |          & AHMAD DHANI                                          |  |
|  |                                                                 |  |
|  |          75%                                                    |  |
|  |          950 Suara                                              |  |
|  |                                                                 |  |
|  |   [================= Progress Bar ====================]         |  |
|  |                                                                 |  |
|  |   [Badge: MEMIMPIN SEMENTARA / PEMENANG VOTING]                 |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
|  KANDIDAT LAINNYA                                                     |
|  +-----------------------------------------------------------------+  |
|  | [Photo]  Siti Aminah & Joko     [=========     ]  25% | 300     |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
+-----------------------------------------------------------------------+

--- [LOCKED STATE] (Jika show_live_result = false) ---
+-------------------------------------------------------+
|            [ Lock Icon Big ]                          |
|          Hasil Belum Tersedia                         |
| Hasil pemilihan masih bersifat rahasia...             |
|                                                       |
|          [ Kembali ke Beranda ]                       |
+-------------------------------------------------------+
```

---

## 6. ADMIN LOGIN
**URL:** `/admin/login`
**Akses:** Public (Admin Only)

```ascii
+-----------------------------------------------------------------------+
|                                                                       |
|       +-------------------------------------------------------+       |
|       |  [Logo] PEMIRA UNBARA                                 |       |
|       |  Login Panitia Pemilihan                              |       |
|       |                                                       |       |
|       |  Email:    [___________________________]              |       |
|       |  Password: [___________________________]              |       |
|       |                                                       |       |
|       |  [ BUTTON: Masuk ]                                    |       |
|       +-------------------------------------------------------+       |
|                                                                       |
|       (c) 2025 PEMIRA UNBARA - Secured by Supabase                    |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## 7. ADMIN DASHBOARD
**URL:** `/admin/dashboard`
**Akses:** Admin Authenticated

```ascii
+-----------------------+-----------------------------------------------+
| [SIDEBAR FIXED 64px]  |  [HEADER MOBILE / CONTENT AREA]               |
|                       |                                               |
| [Logo] PEMIRA         |  Overview                                     |
| Panitia Panel         |  Dashboard                                    |
|                       |                                               |
| [Dash] Dashboard      |  [ OVERVIEW CARDS ]                           |
| [User] Paslon         |  +-------+  +-------+  +-------+  +-------+   |
| [DPT ] DPT Mhs        |  | DPT   |  | SUARA |  | PARTIS|  | STATUS|   |
| [Doc ] Audit Log      |  | 3500  |  | 1250  |  | 35%   |  | OPEN  |   |
|                       |  +-------+  +-------+  +-------+  +-------+   |
| ...                   |                                               |
| [Logout]              |  [ CONTROL ROOM (Danger Zone) ]               |
| admin@unbara.ac.id    |  +------------------------+  +--------------+ |
|                       |  | Buka/Tutup Voting      |  | Publikasi    | |
|                       |  | [ BUTTON: CLOSED/OPEN ]|  | [ TAYANGKAN ]| |
|                       |  +------------------------+  +--------------+ |
|                       |                                               |
+-----------------------|  [ CHARTS ROW ]                               |
| (Mobile Bottom Nav)   |  +---------------------------+  +-----------+ |
| [Dash][Pasl][DPT]...  |  | Votes per Kandidat (Bar)  |  | Pie Chart | |
|                       |  | |       |                 |  |   ( O )   | |
|                       |  | | |     |                 |  |           | |
|                       |  | I II III                  |  | Sudah/Blm | |
|                       |  +---------------------------+  +-----------+ |
|                       |                                               |
|                       |  [ RECAP LIST ]                               |
|                       |  1. Budi (75%) [======]                       |
|                       |  2. Siti (25%) [=     ]                       |
+-----------------------+-----------------------------------------------+
```

---

## 8. ADMIN CANDIDATES (Manajemen Paslon)
**URL:** `/admin/candidates`
**Akses:** Admin Authenticated

```ascii
+-----------------------+-----------------------------------------------+
| [SIDEBAR]             |  Manajemen                                    |
|                       |  Kandidat                                     |
|                       |                                               |
|                       |          [ Hapus Semua ]  [ + Tambah ]        |
|                       |                                               |
|                       |  +-----------------------------------------+  |
|                       |  |  TABLE KANDIDAT                         |  |
|                       |  |-----------------------------------------|  |
|                       |  | No | Foto | Paslon      | Visi | Aksi   |  |
|                       |  |----|------|-------------|------|--------|  |
|                       |  | 01 | [Img]| Budi & Andi | ...  | [Edit] |  |
|                       |  |    |      |             |      | [Del]  |  |
|                       |  |----|------|-------------|------|--------|  |
|                       |  | 02 | [Img]| Siti & Joko | ...  | [Edit] |  |
|                       |  |    |      |             |      | [Del]  |  |
|                       |  +-----------------------------------------+  |
|                       |                                               |
+-----------------------+-----------------------------------------------+

--- [MODAL: TAMBAH/EDIT PASLON] ---
+------------------------------------------+
|  Tambah Kandidat                     [X] |
|------------------------------------------|
|  No. Urut:  [   ]                        |
|  Ketua:     [ Budi        ]              |
|  Wakil:     [ Andi        ]              |
|  Visi:      [ Textarea    ]              |
|  Misi:      [ Textarea    ]              |
|                                          |
|  Foto:      [ Choose File ]              |
|             (Preview Image)              |
|                                          |
|         [ Batal ]   [ Simpan ]           |
+------------------------------------------+
```

---

## 9. ADMIN VOTERS (Manajemen DPT)
**URL:** `/admin/voters`
**Akses:** Admin Authenticated

```ascii
+-----------------------+-----------------------------------------------+
| [SIDEBAR]             |  Manajemen                                    |
|                       |  DPT (Pemilih)                                |
|                       |                                               |
|                       |  [Import CSV] [Download Rekap] [Hapus All]    |
|                       |                           [+ Tambah Manual]   |
|                       |                                               |
|                       |  [INFO BOX: Keamanan Token ]                  |
|                       |  (Generate token otomatis, hash di DB)        |
|                       |                                               |
|                       |  [Search: Cari NIM/Nama...]                   |
|                       |                                               |
|                       |  +-----------------------------------------+  |
|                       |  |  TABLE DPT                              |  |
|                       |  |-----------------------------------------|  |
|                       |  | NIM      | Nama  | Prodi | Sts  | Aksi  |  |
|                       |  |----------|-------|-------|------|-------|  |
|                       |  | 2021...  | Budi  | IF    | Blm  | [Del] |  |
|                       |  | 2021...  | Ani   | SI    | Sdh  | [Del] |  |
|                       |  +-----------------------------------------+  |
|                       |                                               |
|                       |  [ Prev ] page 1/5 [ Next ]                   |
+-----------------------+-----------------------------------------------+

--- [MODAL: IMPORT CSV] ---
+------------------------------------------+
|  Import DPT (CSV)                        |
|------------------------------------------|
|  Format: nim,name,faculty,major          |
|  Sistem akan auto-generate Secure Token. |
|                                          |
|  [ Choose File (.csv) ]                  |
|                                          |
|  Progress: [==========] 100%             |
|  Berhasil: 500, Gagal: 0                 |
|                                          |
|       [ Tutup ]  [ Mulai Import ]        |
+------------------------------------------+
```

---

## 10. ADMIN AUDIT (Log Aktivitas)
**URL:** `/admin/audit`
**Akses:** Admin Authenticated

```ascii
+-----------------------+-----------------------------------------------+
| [SIDEBAR]             |  Audit Log                                    |
|                       |  Catatan aktivitas penting transparansi.      |
|                       |                                               |
|                       |  +-----------------------------------------+  |
|                       |  |  TABLE LOG                              |  |
|                       |  |-----------------------------------------|  |
|                       |  | Waktu     | Event     | Detail          |  |
|                       |  |-----------|-----------|-----------------|  |
|                       |  | 10:05:01  | VOTE_OK   | NIM:2025..      |  |
|                       |  |           |           | IP:192.168...   |  |
|                       |  |-----------|-----------|-----------------|  |
|                       |  | 10:04:55  | LOGIN_ERR | Reason:Wrong Pwd|  |
|                       |  +-----------------------------------------+  |
|                       |                                               |
|                       |  [ Prev ] page 1/50 [ Next ]                  |
+-----------------------+-----------------------------------------------+
```
