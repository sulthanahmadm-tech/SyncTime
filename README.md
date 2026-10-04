# ⏰ SyncTime

**Personal Time Management Dashboard**

SyncTime adalah ekosistem manajemen waktu terpusat berbasis visual. Sistem ini menggunakan dashboard kalender web dan notifikasi email untuk manajemen jadwal yang proaktif.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------| 
| Frontend | React (Vite) + TypeScript + Tailwind CSS |
| Backend | Node.js + Express.js + TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email + Password) |
| Notifications | Resend API (Email) |

## 📁 Project Structure

```
SyncTime/
├── client/          # React frontend (Vite)
├── server/          # Express.js API backend
├── supabase/        # Database schema & RLS policies
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- Supabase account (free tier works)
- npm or yarn

### 1. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase/schema.sql`
3. Copy your project URL, anon key, and service role key

### 2. Setup Backend

```bash
cd server
cp .env.example .env    # Edit with your Supabase credentials
npm install
npm run dev             # Start dev server on :3001
```

### 3. Setup Frontend

```bash
cd client
cp .env.example .env    # Edit with your Supabase URL and anon key
npm install
npm run dev             # Start dev server on :5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Register & Login

1. Open the app and register with email + password
2. Complete the onboarding wizard (set semester period + add matkul wajib)
3. Start managing your schedule!

## 📊 Features

### ✅ Phase 1 — Core Calendar (MUST-HAVE)
- [x] Weekly drag-and-drop calendar view
- [x] Color-coded schedule blocks (by category)
- [x] Split data: Kegiatan Rutin (recurring) vs Dinamis (one-time)
- [x] Conflict detection with Force Save option
- [x] Multi-user authentication (Supabase Auth)
- [x] Onboarding wizard (semester setup + matkul wajib)
- [x] Matkul Wajib management modal

### 🔜 Phase 2 — Automation (SHOULD-HAVE)
- [x] Email Notifications (20 menit sebelum jadwal via Resend)

### 💡 Phase 3 — Analytics (NICE-TO-HAVE)
- [x] Time Balance Analytics (pie/bar chart)
- [x] Shareable Free-Time Link

## 🔐 Authentication Flow

1. User registers/logs in via Email + Password (Supabase Auth)
2. Client gets JWT token from Supabase
3. JWT is sent to Express backend via `Authorization: Bearer <token>` header
4. Express verifies token using Supabase Admin SDK
5. All API queries are filtered by `user_id` for data isolation

## 📦 Database Schema

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with semester period & onboarding status |
| `kategori` | Schedule categories with color coding (per user) |
| `kegiatan_rutin` | Recurring weekly events with matkul wajib flag (per user) |
| `kegiatan_dinamis` | One-time events with completion status (per user) |
| `rutin_exceptions` | Temporary schedule modifications |

## 📄 License

Private project — All rights reserved.
