# Black Box Testing — Platform E-Voting PEMIRA UNBARA

**Judul Skripsi:** Implementasi Platform E-Voting Berbasis Website dengan Penerapan Kerangka Keamanan OWASP (Studi Kasus: Pemilihan Presiden Mahasiswa Universitas Baturaja)

Pengujian dilakukan dengan metode **Black Box Testing**, yaitu menguji fungsionalitas perangkat lunak tanpa melihat struktur kode internal. Pengujian difokuskan pada kesesuaian antara masukan (input) dan keluaran (output) yang dihasilkan sistem.

---

## 1. Pengujian Fitur Admin (Panitia Pemilihan)

| No | Fitur yang Diuji | Langkah Pengujian | Hasil yang Diharapkan | Valid (Ya) | Valid (Tidak) |
|----|------------------|-------------------|------------------------|:----------:|:-------------:|
| 1 | Login Admin | Memasukkan email dan password admin yang benar pada halaman `/admin/login` | Admin berhasil masuk dan langsung diarahkan ke halaman Dashboard | | |
| 2 | Validasi Login Admin Salah | Memasukkan email atau password yang salah / kosong | Sistem menolak login dan menampilkan pesan kesalahan | | |
| 3 | Proteksi Akses Non-Admin | Login dengan akun yang tidak terdaftar pada tabel `admin_users` | Sistem menampilkan halaman "Akses Ditolak" dan memaksa logout | | |
| 4 | Navigasi Dashboard | Mengklik menu sidebar (Dashboard, Paslon, DPT, Audit Log) | Pengguna diarahkan ke halaman modul masing-masing dengan benar | | |
| 5 | Statistik Dashboard | Membuka halaman Dashboard | Menampilkan Total DPT, Suara Masuk, Partisipasi, dan Status Voting secara realtime | | |
| 6 | Grafik Perolehan Suara | Mengamati grafik batang & lingkaran pada Dashboard | Grafik votes per kandidat dan partisipasi tampil sesuai data | | |
| 7 | Kontrol Buka/Tutup Voting | Menekan tombol buka/tutup voting lalu konfirmasi | Status voting berubah (OPEN/CLOSED) dan langsung berpengaruh ke sisi pemilih | | |
| 8 | Kontrol Tampilkan Hasil | Menekan tombol Tayangkan/Sembunyikan rekap publik lalu konfirmasi | Hasil real count pada halaman publik ikut tampil/tersembunyi | | |
| 9 | Tambah Paslon | Mengisi nomor urut, nama ketua, wakil, visi, misi, dan foto lalu menyimpan | Data paslon baru tersimpan dan muncul di tabel kandidat | | |
| 10 | Preview Foto Paslon | Memilih file foto pada form tambah/edit paslon | Foto tampil sebagai preview sebelum data disimpan | | |
| 11 | Edit Paslon | Mengubah data salah satu paslon lalu menyimpan | Perubahan data tersimpan dan diperbarui di tabel kandidat | | |
| 12 | Hapus Paslon | Menekan tombol hapus pada satu paslon lalu konfirmasi | Paslon terhapus dari daftar kandidat | | |
| 13 | Hapus Semua Paslon | Menekan tombol "Hapus Semua" lalu konfirmasi | Seluruh data paslon (beserta suara terkait) terhapus | | |
| 14 | Validasi Form Paslon | Menyimpan paslon dengan ada kolom yang kosong | Sistem menolak dan menampilkan peringatan "Semua form wajib diisi" | | |
| 15 | Tambah DPT Manual | Mengisi NIM/NPM, nama, fakultas, dan prodi lalu menyimpan | Pemilih tersimpan dan token 12 karakter tampil sekali pada popup | | |
| 16 | Validasi NIM DPT | Menambah pemilih dengan NIM berisi huruf / kosong | Sistem menolak dan menampilkan peringatan NIM harus angka | | |
| 17 | Import DPT via CSV | Mengunggah file CSV (nim, name, faculty, major) lalu menekan "Mulai Import" | Data terimport massal, token ter-generate, dan progress bar berjalan | | |
| 18 | Download Master List Token | Menekan tombol Download CSV / Cetak PDF master list setelah import | File master list token berhasil diunduh / siap dicetak | | |
| 19 | Download Rekap DPT | Menekan tombol "Download Rekap" (semua / hanya sudah memilih) | File rekap CSV berhasil diunduh sesuai pilihan | | |
| 20 | Pencarian DPT | Mengetik NIM atau nama pada kolom pencarian | Daftar pemilih terfilter sesuai kata kunci | | |
| 21 | Pagination DPT | Menekan tombol Prev/Next pada tabel DPT | Halaman tabel berpindah sesuai data | | |
| 22 | Hapus Pemilih | Menekan tombol hapus pada satu pemilih lalu konfirmasi | Pemilih terhapus dari DPT | | |
| 23 | Hapus Semua DPT | Menekan tombol "Hapus Semua" lalu konfirmasi | Seluruh data pemilih terhapus dari tabel DPT | | |
| 24 | Audit Trail Log | Membuka halaman Audit Log | Riwayat aktivitas (login gagal, vote sukses, aksi admin) tampil dengan waktu & detail | | |
| 25 | Logout Admin | Menekan tombol Logout | Sesi admin berakhir dan diarahkan ke halaman login admin | | |

---

## 2. Pengujian Fitur Pemilih (Mahasiswa)

| No | Fitur yang Diuji | Langkah Pengujian | Hasil yang Diharapkan | Valid (Ya) | Valid (Tidak) |
|----|------------------|-------------------|------------------------|:----------:|:-------------:|
| 1 | Halaman Beranda | Membuka alamat utama aplikasi | Pengunjung melihat halaman beranda berisi status pemilihan & total DPT | | |
| 2 | Navigasi Beranda | Menekan tombol "Mulai Voting" dan "Lihat Hasil" | Pengguna diarahkan ke halaman login/vote dan halaman hasil | | |
| 3 | Login Pemilih | Memasukkan NIM dan Kode Akses (token) yang benar | Pemilih tervalidasi dan diarahkan ke Bilik Suara | | |
| 4 | Validasi Input Login | Mengosongkan NIM/token atau mengisi NIM dengan huruf | Sistem menolak dan menampilkan pesan kesalahan | | |
| 5 | Login NIM Tidak Terdaftar | Memasukkan NIM yang tidak ada di DPT | Sistem menampilkan pesan "NIM tidak ditemukan" | | |
| 6 | Login Token Salah | Memasukkan token yang salah | Sistem menampilkan pesan "Kode Akses salah" | | |
| 7 | Pembatasan Percobaan (Rate Limit) | Melakukan login gagal berulang kali | Sistem mengunci sementara (anti brute-force) selama 10 menit | | |
| 8 | Tampilan Kartu Kandidat | Membuka halaman Bilik Suara | Foto, nomor urut, dan nama paslon tampil rapi | | |
| 9 | Modal Detail Paslon | Menekan tombol "Detail" pada salah satu paslon | Pop-up berisi visi dan misi paslon muncul dengan benar | | |
| 10 | Konfirmasi Pilihan | Menekan tombol "Pilih" pada salah satu paslon | Muncul modal konfirmasi sebelum suara dikirim | | |
| 11 | Kirim Suara | Menekan "Ya, Kirim Suara" pada modal konfirmasi | Suara terekam dan pengguna diarahkan ke halaman Terima Kasih | | |
| 12 | Anti Double Vote | Mencoba login & memilih kembali dengan NIM yang sudah memilih | Sistem menolak dengan pesan sudah menggunakan hak pilih | | |
| 13 | Voting Ditutup | Mencoba memilih saat status voting ditutup | Sistem menolak suara dan menampilkan pesan voting ditutup | | |
| 14 | Alur Selesai Memilih | Mengamati halaman "Terima Kasih" setelah memilih | Animasi confetti tampil, sesi berakhir, dan auto-redirect ke beranda dalam 10 detik | | |
| 15 | Halaman Hasil (Real Count) | Membuka halaman Hasil saat rekap dipublikasikan | Progress bar & persentase suara tiap paslon tampil proporsional | | |
| 16 | Hasil Belum Dibuka | Membuka halaman Hasil saat rekap belum dipublikasikan | Sistem menampilkan informasi "Hasil Belum Tersedia" | | |
| 17 | Pembaruan Hasil Otomatis | Membiarkan halaman Hasil terbuka beberapa saat | Data perolehan suara ter-update otomatis (live update) | | |

---

**Keterangan:**
Kolom **Valid (Ya/Tidak)** diisi dengan tanda centang (✓) sesuai hasil pengujian di lapangan. Pengujian dinyatakan **berhasil** apabila seluruh skenario menghasilkan keluaran yang sesuai dengan kolom *Hasil yang Diharapkan*.
