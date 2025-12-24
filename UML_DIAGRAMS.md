# UML Diagrams - E-Voting PEMIRA System

Dokumen ini berisi diagram perancangan sistem menggunakan notasi UML (Unified Modeling Language) dalam format Mermaid.js. Anda dapat menggunakan diagram ini untuk BAB III (Perancangan Sistem) dalam skripsi.

---

## 1. Use Case Diagram
Menggambarkan interaksi antara Aktor (Pemilih & Admin) dengan fitur-fitur sistem.

```mermaid
usecaseDiagram
    actor "Pemilih (Voter)" as Voter
    actor "Administrator" as Admin

    usecase "Login (NIM & Access Code)" as UC1
    usecase "Melihat Daftar Kandidat" as UC2
    usecase "Melakukan Voting (Coblos)" as UC3
    usecase "Melihat Hasil Sementara (Real Count)" as UC4
    
    usecase "Login Admin" as UC5
    usecase "Kelola Data Kandidat" as UC6
    usecase "Kelola Data DPT (Import CSV)" as UC7
    usecase "Monitoring Hasil & Log Audit" as UC8
    usecase "Buka/Tutup Voting" as UC9

    Voter --> UC1
    Voter --> UC2
    Voter --> UC3
    Voter --> UC4
    
    Admin --> UC5
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
    Admin --> UC9
    
    UC3 .> UC1 : include
    UC4 .> UC1 : include (optional)
    UC6 .> UC5 : include
    UC7 .> UC5 : include
    UC8 .> UC5 : include
```

---

## 2. Activity Diagram (Proses Voting)
Menggambarkan alur aktivitas pemilih mulai dari login hingga selesai memilih.

```mermaid
flowchart TD
    Start((Mulai)) --> Login["Input NIM & Kode Akses"]
    Login --> Validasi{"Validasi Kredensial?"}
    
    Validasi -- "Gagal (Salah/Tidak Terdaftar)" --> ErrorLogin[Tampilkan Pesan Error]
    ErrorLogin --> Login
    
    Validasi -- Sukses --> CekStatus{"Sudah Memilih?"}
    CekStatus -- Ya --> RedirectResult[Redirect ke Hasil Sementara]
    RedirectResult --> Finish((Selesai))
    
    CekStatus -- Belum --> Dashboard[Halaman Daftar Kandidat]
    Dashboard --> Pilih["Pilih Kandidat (Klik tombol Pilih)"]
    Pilih --> Konfirmasi{"Konfirmasi Pilihan?"}
    
    Konfirmasi -- Batal --> Dashboard
    Konfirmasi -- Ya --> SubmitVote[Kirim Suara ke Server]
    
    SubmitVote --> CekServer{Validasi Server}
    CekServer -- Gagal/Race Condition --> ErrorVote[Tampilkan Error]
    ErrorVote --> Dashboard
    
    CekServer -- Sukses --> UpdateDB[Update Status: HasVoted]
    UpdateDB --> InsertSuara[Insert Data Suara]
    InsertSuara --> TampilSukses[Tampilkan Sukses / Thank You]
    TampilSukses --> Finish
```

---

## 3. Sequence Diagram (Proses Submit Vote)
Menggambarkan interaksi detail antar objek/komponen saat pemilih melakukan *Submit Vote*, termasuk validasi keamanan RPC dan RLS.

```mermaid
sequenceDiagram
    autonumber
    actor Voter
    participant Frontend as React Frontend
    participant Supabase as Supabase Client
    participant RPC as DB Function (submit_vote)
    participant Tables as Database Tables
    
    Voter->>Frontend: Klik "Konfirmasi Pilih"
    Frontend->>Frontend: Get Client Info (IP/UserAgent)
    Frontend->>Supabase: rpc('submit_vote', {nim, code, candidate_id})
    
    Supabase->>RPC: Execute Function
    
    rect rgb(240, 248, 255)
        Note over RPC: Server-Side Validation Layer
        
        RPC->>Tables: SELECT * FROM election_settings WHERE id=1
        
        alt Voting Closed
            Tables-->>RPC: is_voting_open = false
            RPC-->>Frontend: Returns Error "Voting Ditutup"
            Frontend-->>Voter: Toast Error
        else Voting Open
            
            RPC->>Tables: SELECT * FROM voters WHERE nim = $nim FOR UPDATE
            
            alt NIM Invalid / Salah Token
                Tables-->>RPC: Data Mismatch / Null
                RPC-->>Frontend: Returns Error "Kredensial Salah"
            else User Valid
                
                alt Already Voted (Double Voting Check)
                    Tables-->>RPC: has_voted = true
                    RPC-->>Frontend: Returns Error "Sudah Memilih"
                else Belum Memilih
                    
                    RPC->>Tables: UPDATE voters SET has_voted = true
                    RPC->>Tables: INSERT INTO votes (candidate_id)
                    RPC->>Tables: INSERT INTO audit_logs (VOTE_SUCCESS)
                    
                    RPC-->>Frontend: Returns Success JSON
                    Frontend->>Frontend: Navigate('/thank-you')
                    Frontend-->>Voter: Halaman Terima Kasih
                end
            end
        end
    end
```

---

## 4. Class Diagram (Skema Database)
Menggambarkan struktur tabel database dan relasi antar entitas.

```mermaid
classDiagram
    %% Tabel Voters
    class Voters {
        +text nim (PK)
        +text name
        +text faculty
        +text major
        +text access_code_hash
        +boolean has_voted
        +timestamp voted_at
        +timestamp created_at
    }

    %% Tabel Candidates
    class Candidates {
        +int id (PK)
        +int candidate_number
        +text chairman_name
        +text vice_chairman_name
        +text vision
        +text mission
        +text photo_url
    }

    %% Tabel Votes
    class Votes {
        +bigint id (PK)
        +bigint candidate_id (FK)
        +timestamp created_at
    }

    %% Tabel Admin Users
    class AdminUsers {
        +uuid id (PK)
        +uuid user_id (FK Auth)
        +text email
        +text role
    }

    %% Tabel Logs
    class AuditLogs {
        +bigint id (PK)
        +enum action
        +jsonb details
        +timestamp created_at
    }

    %% Tabel Settings
    class ElectionSettings {
        +int id (PK)
        +boolean is_voting_open
        +text announcement
    }

    %% Relations
    Candidates "1" -- "0..*" Votes : receives >
    Voters "1" -- "0..1" Votes : casts (Logic only, no FK for anonymity) >
    AdminUsers "1" -- "0..*" AuditLogs : generates >
```

---

## 5. Deployment Diagram (Arsitektur Sistem)
Menggambarkan arsitektur fisik deployment aplikasi di Vercel dan Supabase.

```mermaid
graph TD
    subgraph Client_Device [Perangkat Pengguna]
        Browser["Web Browser (Chrome/Safari)"]
    end

    subgraph Cloud_Infrastructure [Cloud Infrastructure]
        subgraph Vercel_Cloud [Vercel (Frontend Hosting)]
            ReactApp[React JS Application]
            CDN[CDN & Static Assets]
        end
        
        subgraph Supabase_Cloud [Supabase (Backend as a Service)]
            Postgres[PostgreSQL Database]
            Auth["Supabase Auth (JWT)"]
            Storage["Supabase Storage (Images)"]
            
            subgraph Security_Layer [Security Layer]
                RLS[Row Level Security]
                RPC["RPC Functions (Logic)"]
            end
        end
    end

    Browser -- HTTPS/TLS 1.3 --> ReactApp
    ReactApp -- REST/WebSocket (HTTPS) --> Supabase_Cloud
    
    Security_Layer -.-> Postgres
    ReactApp --> Auth
    ReactApp --> Storage
```
