---
trigger: manual
---

# PROJECT: E-Voting Pilkades (Secure Thesis Project)

## 1. CORE TECH STACK
- **Framework:** React + Vite
- **Language:** JavaScript (ES6+)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Backend:** Supabase (PostgreSQL + RLS + RPC)

## 2. SECURITY RULES (OWASP TOP 10 - STRICT ENFORCEMENT)
You are acting as a Security Engineer. You must adhere to these rules without exception to satisfy the Thesis requirements.

- **A01: Broken Access Control (Database Firewall)**
  - NEVER write code that queries the `voters` table directly from the client (e.g., `supabase.from('voters').select('*')`).
  - The `voters` table is protected by RLS (Row Level Security).
  - All voting actions must go through the Stored Procedure: `supabase.rpc('submit_vote', { ... })`.

- **A07: Identification Failures (Session Management)**
  - **CRITICAL:** NEVER store the User's NIK or Access Code in `localStorage`, `sessionStorage`, or `cookies`.
  - Store sensitive credentials ONLY in React State (Memory) via `AuthContext`.
  - If the user refreshes the page, they must be logged out automatically. This is a desired security feature (Session-based).

- **A04: Insecure Design (Business Logic)**
  - Do NOT implement "Double Voting Check" logic on the frontend.
  - Rely entirely on the backend RPC to throw an error if a user votes twice.
  - Handle RPC errors gracefully: If `error` returns from Supabase, display a user-friendly Toast/Alert based on the error message.

## 3. ARCHITECTURE PATTERNS
- **Client-Server Separation:** Treat the React app as an untrusted client.
- **Supabase Client:** Always import from `src/lib/supabaseClient.js`.
- **Environment Variables:** Use `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never hardcode keys.

## 4. UI/UX GUIDELINES ("Gen Z Government")
Create an interface that feels official yet modern, clean, and trustworthy.

- **Color Palette:**
  - **Backgrounds:** White (`bg-white`) or very light slate (`bg-slate-50`).
  - **Text:** Dark Slate for headings (`text-slate-900`), Medium Slate for body (`text-slate-600`).
  - **Primary Action:** Royal Blue (`bg-blue-600` hover: `bg-blue-700`).
  - **Error/Destructive:** Red (`bg-red-600`).
  
- **Component Style:**
  - Use `rounded-lg` or `rounded-xl` (avoid sharp corners).
  - Use soft shadows (`shadow-sm` or `shadow-md`).
  - Inputs must have clear focus states (`focus:ring-2 focus:ring-blue-500`).
  - Buttons must have a loading state (disabled + spinner) when submitting.

- **Responsiveness:**
  - Mobile-first approach.
  - Grids should be 1 column on mobile (`grid-cols-1`) and 2-3 columns on desktop (`md:grid-cols-3`).

## 5. CODING STANDARDS
- Use Functional Components with Hooks.
- Use `const` over `let` whenever possible.
- File naming: PascalCase for components (e.g., `VotingCard.jsx`), camelCase for logic/utils.
- Directory Structure:
  - `src/components/` (Reusable UI parts)
  - `src/pages/` (Full views)
  - `src/layouts/` (Page wrappers)
  - `src/context/` (Global state)
  - `src/lib/` (Supabase config)

## 6. BEHAVIOR
- If I ask for a feature that violates the Security Rules (e.g., "Save token to local storage"), YOU MUST REFUSE and explain why it violates OWASP A07.
- Always explain the "Why" behind security implementation details.