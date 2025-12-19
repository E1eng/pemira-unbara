# Database Documentation (Supabase/PostgreSQL)

Dokumen ini menjelaskan **schema, RLS policies, dan RPC functions** yang dipakai aplikasi e-voting.

## File yang Dipakai

- **`database/database.sql`**: SQL utama yang kamu jalankan di Supabase SQL Editor.
  - Bersifat **idempotent** (aman di-run berulang; memakai `create ... if not exists`, `drop policy if exists`, `on conflict do nothing`, dll).

Dokumen tambahan (referensi/penjelasan konsep):

- `database/Structure.md` (alur & konsep sistem)
- `database/OWASP.md` (pemetaan OWASP Top 10)
- `database/arsitektur database.md` (snapshot struktur tabel untuk konteks)

## Cara Setup di Supabase

### 1) Jalankan SQL

1. Buka **Supabase Dashboard**
2. Masuk ke **SQL Editor**
3. Copy seluruh isi `database/database.sql`
4. Run

### 2) Buat Admin User

1. Buka **Authentication → Users**
2. Buat user admin (email+password)
3. Ambil `user_id` (UUID)
4. Tambahkan ke tabel `admin_users`:

```sql
insert into public.admin_users (user_id)
values ('<UUID_ADMIN>');
```

> Admin panel menggunakan `is_admin()` yang cek keberadaan `auth.uid()` di tabel `admin_users`.

### 3) Storage Bucket Foto Kandidat

Frontend upload foto kandidat ke Supabase Storage.

- **Nama bucket default**: `candidate-photos`
- Bisa diubah via env: `VITE_CANDIDATE_PHOTO_BUCKET`

Kebutuhan policy:

- **Public read** (agar foto kandidat bisa tampil sebelum voting)
- **Admin-only write** (hanya admin bisa upload/update)

Catatan:

- Error seperti `must be owner of table objects` biasanya muncul jika menjalankan SQL policy Storage dengan role yang tidak punya hak. Solusi paling aman:
  - atur policy via UI Storage di Supabase Dashboard, atau
  - pastikan menjalankan SQL dengan role yang tepat di project tersebut.

## Schema (Tabel Utama)

### `candidates`

Data kandidat.

- `id` identity bigint
- `name`, `vision`, `mission`
- `photo_url` (public URL dari Storage)

### `voters`

Daftar Pemilih Tetap (DPT).

- `nim` (PK) *(di konteks BEM, kolom ini dipakai untuk menyimpan NIM/NPM)*
- `name`
- `access_code_hash` (bcrypt)
- `has_voted`

**Penting**: tabel ini tidak boleh bisa di-SELECT oleh publik.

### `votes`

Penyimpanan suara **anonim**.

- Tidak ada `nim` / user identity (tidak ada data NIM/NPM di tabel ini)
- Hanya menyimpan `candidate_id` + timestamp

### `audit_logs`

Audit keamanan & aktivitas.

- `action`: `LOGIN_FAIL`, `VOTE_SUCCESS`, `SYSTEM_ERROR`, `ADMIN_ACTION`
- `details`: jsonb (ip, user-agent, reason, dll)

### `election_settings`

Konfigurasi status pemilu.

- `id = 1` (1 row)
- `is_voting_open`: buka/tutup voting
- `show_live_result`: tampilkan hasil realtime (jika dipakai di frontend)

### `admin_users`

Daftar user yang dianggap admin.

- `user_id` (FK ke `auth.users`)

### `vote_rate_limits`

State rate limiting untuk `submit_vote` (anti brute force).

- `client_key` (PK)
- `fail_count`, `first_fail_at`, `blocked_until`

## RLS (Row Level Security) – Strategi

Prinsip umum:

- Default: **deny**
- Public hanya boleh baca data yang memang publik
- Semua operasi sensitif dilakukan via **RPC security definer**

Ringkasan:

- **`candidates`**
  - Public select: boleh
  - Admin manage: boleh (via `is_admin()` untuk role `authenticated`, dan `service_role`)
- **`voters`**
  - Public: tidak boleh select
  - Admin: boleh select/update/delete
- **`votes`**
  - Public: tidak boleh insert langsung
  - Admin: tidak boleh membaca baris vote mentah; gunakan fungsi agregasi `get_vote_recap()`
- **`audit_logs`**
  - Admin: boleh select
- **`election_settings`**
  - Public: boleh select
  - Admin: boleh update

## RPC Functions

### `admin_add_voter(p_nim, p_name, p_access_code_plain)`

- Hanya admin (`is_admin()`) yang boleh menjalankan
- Menyimpan token sebagai **hash bcrypt** (`crypt(..., gen_salt('bf'))`)
- Menulis audit `ADMIN_ACTION`

### `submit_vote(p_nim, p_access_code_plain, p_candidate_id, p_client_info)`

Fungsi paling kritikal.

- `security definer` (menjadi “gateway” aman untuk voting)
- Validasi:
  - voting harus open (`election_settings.is_voting_open = true`)
  - NIM/NPM harus ada
  - kode akses harus cocok (cek hash)
  - tidak boleh double vote (`has_voted`)
- Atomik (di dalam 1 transaksi):
  - `voters.has_voted = true`
  - insert ke `votes`
- Audit:
  - `LOGIN_FAIL` untuk kegagalan login/vote
  - `VOTE_SUCCESS` untuk vote berhasil

#### Rate Limiting (Anti Brute Force)

Rate limit di-trigger saat:

- NIM/NPM tidak ditemukan
- token salah

Kunci rate limit:

- `client_key = sha256(IP + '|' + User-Agent)`
- IP diambil dari header (prioritas):
  - `cf-connecting-ip`
  - `x-forwarded-for`
  - `x-real-ip`
  - fallback: `p_client_info.ip`
- User-Agent diambil dari header `user-agent` (fallback: `p_client_info.userAgent`)

Parameter (bisa diubah di SQL function):

- max fail: **25**
- window: **10 menit**

Saat sukses voting, state rate limit untuk client tersebut dihapus.

### `get_vote_recap()`

Mengembalikan total suara per kandidat (aggregate), tanpa expose row `votes` secara massal.

## Checklist Verifikasi

- Kandidat tampil di halaman vote (public select candidates OK)
- Pemilih tidak bisa akses tabel `voters` secara langsung
- Voting ditolak saat `is_voting_open=false`
- Brute force dari 1 client akan kena rate limit
- Admin bisa:
  - lihat dashboard rekap
  - kelola DPT
  - kelola kandidat + upload foto
  - lihat audit logs
