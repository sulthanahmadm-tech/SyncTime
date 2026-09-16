# SyncTime Migration Tasks

## Fase 1: Supabase Setup & Database Migration
- [x] Create `supabase/schema.sql`
- [x] Refactor `server/src/db/connection.ts` → Supabase client
- [x] Delete `server/src/db/migrate.ts`
- [x] Delete `server/src/db/seed.ts`

## Fase 2: Authentication (Client-Side)
- [x] Create `client/src/lib/supabase.ts`
- [x] Create `client/src/contexts/AuthContext.tsx`
- [x] Create `client/src/pages/LoginPage.tsx`
- [x] Modify `client/src/App.tsx` (routing + AuthProvider)
- [x] Modify `client/src/lib/api.ts` (add JWT header)

## Fase 3: Authentication (Server-Side)
- [x] Create `server/src/middleware/authMiddleware.ts`
- [x] Create `server/src/routes/auth.ts`
- [x] Modify `server/src/index.ts` (apply auth middleware)

## Fase 4: Refactor Routes to Supabase + Multi-User
- [x] Refactor `server/src/routes/kategori.ts`
- [x] Refactor `server/src/routes/kegiatanRutin.ts`
- [x] Refactor `server/src/routes/kegiatanDinamis.ts`
- [x] Refactor `server/src/routes/calendar.ts`
- [x] Refactor `server/src/routes/analytics.ts`
- [x] Refactor `server/src/routes/magicPaste.ts`
- [x] Refactor `server/src/routes/scheduleMove.ts`
- [x] Refactor `server/src/routes/shared.ts`
- [x] Refactor `server/src/routes/iot.ts`
- [x] Refactor `server/src/utils/conflictChecker.ts`
- [x] Refactor `server/src/services/cronJobs.ts`
- [x] Refactor `server/src/services/telegramBot.ts`

## Fase 5: Onboarding Wizard
- [x] Create `server/src/routes/onboarding.ts`
- [x] Create `client/src/pages/OnboardingPage.tsx`

## Fase 6: Tombol "Matkul Wajib" di Dashboard
- [x] Create `client/src/components/Forms/MatkulWajibModal.tsx`
- [x] Modify `client/src/components/Layout/Sidebar.tsx`
- [x] Modify `client/src/pages/Dashboard.tsx`
- [x] Modify `client/src/components/Layout/Header.tsx`

## Fase 7: Cleanup & Environment
- [x] Update `server/package.json`
- [x] Update `client/package.json`
- [x] Update `.env` files
- [x] Update type definitions (server + client)
- [x] Delete SQLite files
- [x] Update `README.md`
- [/] Build & verify
