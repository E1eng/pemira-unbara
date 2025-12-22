# Database Documentation (Supabase/PostgreSQL)

Dokumen ini menjelaskan **schema, RLS policies, dan RPC functions** yang dipakai aplikasi PEMIRA BEM.

## File yang Dipakai

- **`database/database.sql`**: SQL utama yang kamu jalankan di Supabase SQL Editor.
  - Bersifat **idempotent** (aman di-run berulang; memakai `create ... if not exists`, `drop policy if exists`, `on conflict do nothing`, dll).

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

## Schema (Tabel Utama)

### `candidates`

Data pasangan calon BEM.

| Kolom | Deskripsi |
|-------|-----------|
| `id` | identity bigint |
| `candidate_number` | Nomor urut paslon |
| `chairman_name` | Nama Ketua |
| `vice_chairman_name` | Nama Wakil Ketua |
| `vision`, `mission` | Visi & Misi |
| `photo_url` | Public URL dari Storage |

### `voters`

Daftar Pemilih Tetap (DPT).

| Kolom | Deskripsi |
|-------|-----------|
| `nim` | Primary Key (NIM/NPM) |
| `name` | Nama pemilih |
| `faculty` | Fakultas |
| `major` | Program studi |
| `access_code_hash` | Hash BCrypt token |
| `has_voted` | Status sudah vote |

**Penting**: tabel ini tidak boleh bisa di-SELECT oleh publik.

### `votes`

Penyimpanan suara **anonim**.

- Tidak ada `nim` / user identity
- Hanya menyimpan `candidate_id` + timestamp

### `audit_logs`

Audit keamanan & aktivitas.

| Action | Deskripsi |
|--------|-----------|
| `LOGIN_FAIL` | Login gagal |
| `VOTE_SUCCESS` | Vote berhasil |
| `SYSTEM_ERROR` | Error sistem |
| `ADMIN_ACTION` | Aksi admin |

### `election_settings`

Konfigurasi status pemilu (1 row, id=1).

| Kolom | Deskripsi |
|-------|-----------|
| `is_voting_open` | Buka/tutup voting |
| `show_live_result` | Tampilkan hasil realtime |

### `admin_users`

Daftar user admin (`user_id` FK ke `auth.users`).

### `vote_rate_limits`

State rate limiting untuk anti brute force.

## RLS (Row Level Security)

Prinsip: **deny by default**

| Tabel | Public | Admin |
|-------|--------|-------|
| `candidates` | SELECT ✓ | CRUD ✓ |
| `voters` | ✗ | CRUD ✓ |
| `votes` | ✗ | via RPC only |
| `audit_logs` | ✗ | SELECT ✓ |
| `election_settings` | SELECT ✓ | UPDATE ✓ |

## RPC Functions

### `admin_add_voter(p_nim, p_name, p_faculty, p_major, p_access_code_plain)`

- Hash token dengan BCrypt
- Menulis audit log

### `submit_vote(p_nim, p_access_code_plain, p_candidate_id, p_client_info)`

Fungsi voting:
- Validasi voting open
- Cek NIM & token
- Cek belum vote
- Insert vote + update has_voted (atomic)
- Rate limiting anti brute-force

### `get_vote_recap()`

Mengembalikan total suara per kandidat (aggregate).

### `get_participation_stats()`

Statistik partisipasi per fakultas.

## Rate Limiting

- **Max fail**: 25
- **Window**: 10 menit
- **Key**: `sha256(IP + User-Agent)`

Saat sukses voting, state rate limit dihapus.

## Checklist Verifikasi

- [ ] Kandidat tampil di halaman vote
- [ ] Pemilih tidak bisa akses tabel `voters` langsung
- [ ] Voting ditolak saat `is_voting_open=false`
- [ ] Brute force kena rate limit
- [ ] Admin bisa kelola DPT, kandidat, lihat audit log
