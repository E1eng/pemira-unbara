Aktor yang Terlibat
Panitia (Admin): Mengelola data DPT (Daftar Pemilih Tetap) & Calon.

Pemilih (Voter): Warga desa.

Sistem (Supabase): Wasit yang menegakkan aturan.

Alur Kerja (The Flow)
Fase 1: Persiapan (Oleh Panitia)
Fokus Keamanan: Broken Access Control (Hanya Admin yang boleh).

Input Data Calon: Foto, Nama, Visi Misi.

Input DPT (Import Excel): NIK dan Nama warga yang berhak memilih.

Generate Token Unik:

Sistem men-generate "Kode Akses" (misal: 6 digit huruf acak) untuk setiap NIK.

Kode ini dicetak di Surat Undangan fisik yang dibagikan ke warga.

Kenapa? Karena tidak semua warga desa punya email/HP. Surat undangan fisik adalah validasi paling umum di desa.

Fase 2: Pemungutan Suara (Oleh Pemilih)
Fokus Keamanan: Identification Failures & Double Voting.

Login:

Pemilih datang ke TPS (atau remote jika e-voting murni).

Masuk ke web app.

Input NIK dan Kode Akses (dari surat undangan).

Validasi Sistem (Supabase):

Cek: Apakah NIK & Kode cocok?

Cek: Apakah kolom sudah_milih (boolean) di database masih FALSE?

Jika oke, masuk ke halaman voting.

Bilik Suara Digital:

Tampil foto para calon.

Pemilih klik calon pilihan -> Muncul Pop-up Konfirmasi "Yakin pilih Bapak X?" -> Klik YA.

Eksekusi Database (Crucial Step):

Sistem melakukan 2 hal secara bersamaan (Transaction):

Menambah count suara ke Calon X.

Mengubah status pemilih ini menjadi sudah_milih = TRUE.

Menghapus/Invalidate Kode Akses (supaya tidak bisa dipake login lagi).

Selesai:

Muncul layar "Terima Kasih".

Session langsung dihancurkan (Auto Logout).

Fase 3: Penghitungan (Realtime/Rekap)
Fokus Keamanan: Security Misconfiguration (Jangan sampai hasil bocor sebelum waktunya).

Dashboard Hasil:

Bisa diset untuk tampil Realtime (Quick Count) di layar proyektor balai desa.

Atau diset Hidden sampai jam voting ditutup.

Implementasi Keamanan (Bahan Bab 4 Skripsi)
Disinilah Supabase bersinar untuk pembuktian OWASP Top 10 kamu.

1. Mencegah "Serangan Fajar" / Intimidasi (Anonymity)
Bagaimana membuktikan sistem ini LUBER (Langsung Umum Bebas Rahasia)? Jangan sampai admin tahu Si A milih Siapa.

Solusi Schema Database: Pisahkan tabel Pemilih dan Suara.

Tabel voters: { NIK, nama, kode_akses, status_sudah_milih (Boolean) }

Tabel votes: { id_calon, total_suara }

Triknya: Jangan pernah buat relasi (Foreign Key) antara voters ke votes.

Saat user nge-vote, sistem cuma kirim perintah: "Tambah 1 suara ke Calon A" TANPA mengirim "Siapa yang nambah".

Jadi kalau database dibongkar hacker pun, tidak ada jejak Si A milih Calon A.

2. Mencegah Double Voting (Race Condition)
Gimana kalau user login di 2 HP bersamaan dan tekan tombol "PILIH" di detik yang persis sama?

Solusi (Supabase RLS & Constraint):

Buat RLS Policy di tabel voters:

SQL

CREATE POLICY "Hanya bisa update jika belum milih"
ON voters
FOR UPDATE
USING (auth.uid() = user_id AND status_sudah_milih = false)
WITH CHECK (status_sudah_milih = true);
Dengan policy ini, request kedua di detik yang sama otomatis DITOLAK oleh database karena begitu request pertama sukses, status langsung true, dan request kedua tidak memenuhi syarat status_sudah_milih = false. Aman!

Saran Fitur Tambahan buat Skripsi: "Audit Log"
Buat satu tabel lagi bernama system_logs. Setiap ada kejadian (Login sukses, Login gagal, Vote masuk), catat di situ (Timestamp + IP Address).

Gunanya? Untuk mendeteksi Brute Force. Kalau ada 1 IP mencoba login 100 NIK berbeda dalam 1 menit, sistem bisa mendeteksi serangan.