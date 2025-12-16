Risiko OWASP	Implementasi di Sistem Pilkades (Supabase)
A01: Broken Access Control	RLS (Row Level Security): Tabel voters hanya bisa dibaca oleh Admin. User biasa tidak bisa SELECT * FROM voters. Tabel votes tidak bisa di-read oleh siapapun kecuali fungsi rekapitulasi.
A02: Cryptographic Failures	Hashing: Token undangan (Kode Akses) di-hash menggunakan bcrypt sebelum disimpan. NIK ditransmisikan via HTTPS.
A03: Injection	PostgREST: Supabase menggunakan parameterized queries secara default, sehingga kebal terhadap SQL Injection OR 1=1 pada form login.
A04: Insecure Design	Business Logic: Penggunaan RPC (Stored Procedure) untuk memastikan satu NIK hanya bisa satu suara (Atomic Transaction).
A07: Identification Failures	2-Factor Auth Sederhana: Login membutuhkan kombinasi NIK (What you know/have) + Token Fisik (What you have). Rate Limiting pada fungsi login untuk cegah brute force.