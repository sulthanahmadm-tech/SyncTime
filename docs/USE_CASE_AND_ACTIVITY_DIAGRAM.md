# Dokumentasi Use Case & Activity Diagram — SyncTime

Dokumentasi ini menyajikan arsitektur sistem, pemetaan Use Case Diagram, serta Activity Diagram mendalam untuk seluruh alur bisnis utama platform **SyncTime** dengan persona target pengguna utama: **Mahasiswa**.

---

## 1. Ringkasan Arsitektur Sistem (System Architecture Overview)

SyncTime dirancang untuk membantu mahasiswa mengoptimalkan manajemen waktu, mengintegrasikan jadwal perkuliahan mingguan (rutin) dan agenda tugas/kegiatan insidental (dinamis), memitigasi jadwal yang saling bertabrakan (conflict detection), serta menyediakan integrasi AI (Magic Paste) dan notifikasi otomatis (email reminder berbasis WIB).

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT (SPA)                                     |
|  React 18 + Vite + Tailwind CSS + @dnd-kit (Weekly Drag & Drop Calendar)           |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ HTTPS / REST API
+-----------------------------------------------------------------------------------+
|                                SERVER (API BACKEND)                               |
|  Express.js + TypeScript                                                          |
|  - Routes: /api/calendar, /api/rutin, /api/dinamis, /api/shared, /api/ai/magic-paste|
|  - Engine: conflictChecker.ts (Semester Bounds, Week Limits, Exception Filtering) |
|  - Worker: cronJobs.ts (WIB +20 mins Reminders via Resend API)                     |
+-----------------------------------------------------------------------------------+
                                         │
                     ┌───────────────────┴───────────────────┐
                     ▼                                       ▼
+-----------------------------------------+ +---------------------------------------+
|           PERSISTENCE & AUTH            | |            EXTERNAL SERVICES          |
|  Supabase (PostgreSQL 15 + Row Auth)    | |  - Google Gemini AI (2.5 Flash)       |
|  - profiles (semester bounds & status)  | |  - Resend Mail API (Notifikasi Email) |
|  - kegiatan_rutin & kegiatan_dinamis    | |                                       |
|  - rutin_exceptions (reschedule track)  | |                                       |
+-----------------------------------------+ +---------------------------------------+
```

---

## 2. Use Case Diagram (Sistem Manajemen Waktu Mahasiswa)

Diagram berikut memetakan relasi antara 3 aktor utama sistem:
1. **🧑‍🎓 Mahasiswa**: Pengguna utama terotentikasi yang mengatur kalender, jadwal kuliah, tugas, dan preferensi.
2. **⏰ Cron Worker / Resend**: Service background yang memeriksa jadwal aktif dan mendistribusikan notifikasi email.
3. **👥 Rekan Mahasiswa (Publik)**: Pengguna eksternal yang melihat slot ketersediaan waktu luang (free time) tanpa hak edit.

```mermaid
flowchart LR
    actorMahasiswa["🧑‍🎓 Mahasiswa"]
    actorCron["⏰ Cron Worker / Resend"]
    actorRekan["👥 Rekan Mahasiswa (Publik)"]

    subgraph SyncTimeSystem ["Sistem SyncTime"]
        UC1["UC-01: Onboarding Semester & Matkul Wajib"]
        UC2["UC-02: Manajemen Jadwal Rutin (Kuliah)"]
        UC3["UC-03: Manajemen Jadwal Dinamis (Tugas/Kegiatan)"]
        UC4["UC-04: Deteksi Bentrok & Force Save"]
        UC5["UC-05: Pindah Jadwal Sementara (rutin_exceptions)"]
        UC6["UC-06: Ekstraksi Otomatis AI (Magic Paste)"]
        UC7["UC-07: Pengiriman Pengingat Jadwal (Email WIB)"]
        UC8["UC-08: Berbagi Waktu Luang (Shared Calendar)"]
        UC9["UC-09: Analisis Distribusi Waktu Mingguan"]
    end

    actorMahasiswa --> UC1
    actorMahasiswa --> UC2
    actorMahasiswa --> UC3
    actorMahasiswa --> UC4
    actorMahasiswa --> UC5
    actorMahasiswa --> UC6
    actorMahasiswa --> UC8
    actorMahasiswa --> UC9

    actorCron --> UC7
    actorRekan --> UC8

    UC2 -.->|includes| UC4
    UC3 -.->|includes| UC4
    UC5 -.->|extends| UC2
    UC6 -.->|creates| UC2
    UC6 -.->|creates| UC3
```

---

## 3. Activity Diagram 1: Onboarding Semester & Matkul Wajib

Diagram ini mengilustrasikan alur mahasiswa baru setelah menyelesaikan otentikasi registrasi hingga masuk ke dashboard kalender mingguan. Alur ini menjamin data semester (`semester_start`, `semester_end`) tersimpan sebelum mahasiswa memasukkan jadwal rutin.

```mermaid
flowchart TD
    Start([Mulai: Registrasi Berhasil]) --> CheckOnboarding{"Apakah onboarding_completed == true?"}
    CheckOnboarding -- Ya --> GoDashboard["Redirect ke /dashboard"]
    CheckOnboarding -- Tidak --> OpenWizard["Buka /onboarding Wizard"]

    OpenWizard --> Step1["Step 1: Input Tanggal Mulai & Akhir Semester"]
    Step1 --> SaveStep1["Kirim PUT /api/onboarding/semester"]
    SaveStep1 --> Step2["Step 2: Input Matkul Wajib (Nama, Hari, Jam)"]
    
    Step2 --> ActionChoice{"Pilihan Aksi"}
    ActionChoice -- Tambah Matkul --> AddList["Masukkan ke Daftar Antrean Matkul"] --> Step2
    ActionChoice -- Lewati --> SkipOnboarding["Kirim PUT /api/onboarding/complete"] --> GoDashboard
    ActionChoice -- Simpan Semua --> BulkSave["Kirim POST /api/onboarding/matkul"]

    BulkSave --> SetBatasMinggu["Hitung batas_minggu_berulang (Max 16 Minggu)"]
    SetBatasMinggu --> FlagWajib["Set is_matkul_wajib = true"]
    FlagWajib --> MarkComplete["Kirim PUT /api/onboarding/complete"]
    MarkComplete --> GoDashboard
    GoDashboard --> End([Selesai: Kalender Aktif])
```

### Penjelasan Bisnis & Komponen Teknis:
- **Komponen Frontend**: `client/src/pages/OnboardingPage.tsx`, `client/src/App.tsx` (Protected Routing & Guard).
- **Endpoint Backend**: `PUT /api/onboarding/semester`, `POST /api/onboarding/matkul`, `PUT /api/onboarding/complete`.
- **Aturan Validasi**:
  * `semester_end` harus lebih besar dari `semester_start`.
  * `jam_selesai` matkul wajib harus lebih besar dari `jam_mulai`.
  * Default `batas_minggu_berulang` disetel maksimal 16 minggu perkuliahan.

---

## 4. Activity Diagram 2: Manajemen Jadwal Rutin & Dinamis (Conflict Detection & `rutin_exceptions`)

Diagram ini mendokumentasikan penambahan atau pemindahan jadwal (via modal form maupun drag-and-drop `@dnd-kit`), evaluasi bentrok waktu (`checkConflicts`), serta mekanisme pemindahan sementara jadwal rutin ke tanggal lain (`rutin_exceptions`).

```mermaid
flowchart TD
    Start([Mulai: Tambah / Geser Jadwal]) --> ValidateInput{"Validasi Jam: jam_selesai > jam_mulai?"}
    ValidateInput -- Tidak --> ShowValidationError["Tampilkan Error: Waktu selesai harus lebih besar"] --> End([Selesai])
    
    ValidateInput -- Ya --> CheckSemesterLimit{"Jadwal Rutin: Apakah dalam rentang semester valid?"}
    CheckSemesterLimit -- Tidak --> RejectSemester["Tolak / Batasi di luar semester"] --> End

    CheckSemesterLimit -- Ya --> RunConflictCheck["Panggil checkConflicts()"]
    RunConflictCheck --> CheckException{"Apakah slot jadwal rutin ada di rutin_exceptions?"}
    CheckException -- Ya --> ExcludeConflict["Abaikan bentrok untuk slot pengecualian"] --> ConflictEval
    CheckException -- Tidak --> ConflictEval{"Terjadi Bentrok (hasConflict)?"}

    ConflictEval -- Tidak --> SaveDirectly["Simpan Jadwal ke Database"] --> RefreshUI["Update Tampilan Kalender"] --> End
    
    ConflictEval -- Ya --> PromptModal["Tampilkan ConflictModal (Status 409)"]
    PromptModal --> UserDecision{"Keputusan Mahasiswa"}
    UserDecision -- Batal --> AbortChange["Batalkan Aksi / Revert Posisi"] --> End
    UserDecision -- Force Save --> ForceFlag["Kirim Request dengan parameter ?force=true"]
    ForceFlag --> SaveDirectly

    subgraph DragAndDropExceptionFlow ["Alur Khusus: Drag Rutin ke Tanggal Lain"]
        MoveChoice{"Tipe Pemindahan?"}
        MoveChoice -- Permanen --> UpdateRutinDay["Update hari_mingguan & jam kegiatan_rutin"]
        MoveChoice -- Sementara --> CreateException["Insert ke tabel rutin_exceptions (tanggal_dilewati)"]
        CreateException --> CreateDinamis["Insert kegiatan_dinamis baru di waktu target"]
    end
```

### Penjelasan Bisnis & Komponen Teknis:
- **Komponen Frontend**: `client/src/components/Calendar/TimeBlock.tsx`, `client/src/hooks/useDragAndDrop.ts`, `client/src/components/Forms/RutinForm.tsx`, `client/src/components/Forms/DinamisForm.tsx`, `client/src/components/Calendar/ConflictModal.tsx`.
- **Endpoint Backend**: `POST /api/rutin`, `PUT /api/rutin/:id`, `POST /api/dinamis`, `PUT /api/dinamis/:id`, `POST /api/calendar/move`.
- **Aturan Bebas Double-Counting**:
  * Ketika kuliah rutin digeser sementara ke tanggal lain, entri dicatat pada `rutin_exceptions`.
  * `/api/analytics` dan `/api/calendar/weekly` mengecualikan slot asli pada tanggal tersebut sehingga durasi jam belajar tidak terhitung ganda.

---

## 5. Activity Diagram 3: Ekstraksi Jadwal AI (Magic Paste)

Diagram ini menggambarkan konversi otomatis pengumuman perkuliahan tidak terstruktur atau pesan obrolan grup WhatsApp dosen/asisten menjadi jadwal terstruktur menggunakan Google Gemini AI.

```mermaid
flowchart TD
    Start([Mulai: Buka Modal Magic Paste]) --> InputText["Paste Teks Jadwal / Pengumuman Kuliah"]
    InputText --> Submit["Klik 'Ekstrak Jadwal' (POST /api/ai/magic-paste)"]
    Submit --> CallGemini["Backend panggil Gemini AI (gemini-flash-latest / gemini-2.5-flash)"]
    
    CallGemini --> ParseJSON{"Validasi & Parsing JSON Array?"}
    ParseJSON -- Gagal --> ReturnError["Kembalikan Pesan Error 400"] --> ShowError["Tampilkan Notifikasi Gagal Parsing"] --> End([Selesai])
    
    ParseJSON -- Berhasil --> IterateSchedules["Iterasi Setiap Item Hasil Ekstraksi"]
    IterateSchedules --> CheckDate{"Apakah memiliki tanggal spesifik?"}
    
    CheckDate -- Ya --> InsertDinamis["Simpan sebagai kegiatan_dinamis"]
    CheckDate -- Tidak (Hari Mingguan) --> InsertRutin["Simpan sebagai kegiatan_rutin"]
    InsertRutin --> SetWajib["Set is_matkul_wajib = true & kategori = Kuliah"]
    
    InsertDinamis --> CommitBatch["Simpan Data ke Database Supabase"]
    SetWajib --> CommitBatch
    CommitBatch --> SuccessNotice["Tampilkan Pesan Berhasil & Refresh Kalender"]
    SuccessNotice --> End
```

### Penjelasan Bisnis & Komponen Teknis:
- **Komponen Frontend**: `client/src/components/Forms/MagicPasteBox.tsx`.
- **Endpoint Backend**: `POST /api/ai/magic-paste` (didukung service `server/src/routes/magicPaste.ts`).
- **Aturan Ekstraksi**:
  * Jika teks memuat hari mingguan berulang (misal: "Setiap Senin 08:00 - 10:00"), disimpan sebagai `kegiatan_rutin` dengan flag `is_matkul_wajib: true` dan kategori otomatis dikaitkan ke "Kuliah".
  * Jika teks memuat tanggal kalender spesifik (misal: "Kuis 28 Oktober 2026 13:00 - 15:00"), disimpan sebagai `kegiatan_dinamis`.

---

## 6. Activity Diagram 4: Pengingat Email Otomatis (WIB Timezone)

Diagram ini mengilustrasikan alur pemrosesan background cron job untuk mendeteksi agenda mahasiswa 20 menit ke depan (berbasis zona waktu Indonesia Barat/WIB) dan mengirimkan email notifikasi melalui Resend API.

```mermaid
flowchart TD
    Start([Trigger: Cron Job Setiap Menit / Endpoint /api/cron/reminders]) --> CalcTime["Hitung target waktu: Current Time + 20 Menit"]
    CalcTime --> ConvertWIB["Konversi target waktu ke WIB (UTC+7)"]
    ConvertWIB --> ExtractParts["Ekstrak hari_mingguan, targetDateStr, targetTimeStr"]
    
    ExtractParts --> FetchUsers["Ambil Semua User dengan Email Aktif di profiles"]
    FetchUsers --> LoopUsers["Loop Setiap User"]
    
    LoopUsers --> CheckActiveSemester{"Apakah targetDateStr dalam rentang semester user?"}
    CheckActiveSemester -- Tidak --> SkipUser["Lanjut ke User Berikutnya"]
    
    CheckActiveSemester -- Ya --> QueryRutin["Query kegiatan_rutin (hari_mingguan & jam_mulai == targetTimeStr)"]
    QueryRutin --> FilterExceptions["Filter ID yang terdaftar di rutin_exceptions pada targetDateStr"]
    FilterExceptions --> QueryDinamis["Query kegiatan_dinamis (waktu_mulai == targetWib ISO)"]
    
    QueryDinamis --> CheckEvent{"Apakah ada kegiatan yang perlu diingatkan?"}
    CheckEvent -- Tidak --> SkipUser
    CheckEvent -- Ya --> RenderHTML["Generate Template HTML Email Notifikasi"]
    RenderHTML --> SendResend["Kirim Email melalui Resend API"]
    SendResend --> LogStatus["Catat Log Pengiriman"]
    LogStatus --> NextUser{"Semua User Selesai?"}
    NextUser -- Belum --> LoopUsers
    NextUser -- Selesai --> End([Selesai])
```

### Penjelasan Bisnis & Komponen Teknis:
- **Service Backend**: `server/src/services/cronJobs.ts`, `server/src/routes/cron.ts`.
- **Integrasi**: Resend Mail API (`resend.emails.send`).
- **Penanganan Timezone**: Perhitungan eksplisit offset `+07:00` (WIB) untuk mencegah perbedaan waktu antara server hosting (UTC) dan waktu lokal mahasiswa di Indonesia.

---

## 7. Activity Diagram 5: Berbagi Waktu Luang (Shared Calendar & Privacy Masking)

Diagram ini mendokumentasikan alur fitur berbagi jadwal waktu luang (free time) kepada rekan atau kelompok belajar, dengan mekanisme penyamaran privasi (data masking) agar judul kegiatan privat dan detail kategori tidak bocor ke publik.

```mermaid
flowchart TD
    Start([Mulai: Mahasiswa di Dashboard]) --> ClickShare["Klik tombol '🔗 Copy Share Link' di Sidebar"]
    ClickShare --> GenerateURL["Generate URL: /shared?week_start=YYYY-MM-DD&user_id=UUID"]
    GenerateURL --> CopyClip["Tersalin ke Clipboard & Tampilkan Indikator Sukses"]
    
    CopyClip --> ShareLink["Mahasiswa membagikan URL ke Rekan"]
    ShareLink --> OpenLink["Rekan Mahasiswa membuka link di Browser"]
    
    OpenLink --> ParseParams["Client SharedCalendar membaca week_start & user_id"]
    ParseParams --> FetchFreeTime["Kirim GET /api/shared/free-time?week_start=...&user_id=..."]
    
    FetchFreeTime --> QueryData["Backend memproses jadwal rutin & dinamis user_id"]
    QueryData --> MaskPrivacy["Ganti judul menjadi 'Sibuk' & warna menjadi abu-abu (#6B7280)"]
    MaskPrivacy --> FilterExceptionsShared["Abaikan slot yang ada di rutin_exceptions"]
    
    FilterExceptionsShared --> ReturnBlocks["Kirim Blocks Jadwal Sibuk ke Client"]
    ReturnBlocks --> RenderCalendar["WeeklyCalendar merender slot sibuk & slot kosong (Free Time)"]
    RenderCalendar --> ReadonlyView["Tampilan bersifat Read-Only (Tanpa Form Edit / Drag & Drop)"]
    
    ReadonlyView --> NavWeek{"Rekan Navigasi Minggu (Prev / Next)?"}
    NavWeek -- Ya --> NavAction["Gunakan parseLocalDate() untuk geser minggu tanpa shift UTC"] --> FetchFreeTime
    NavWeek -- Tidak --> End([Selesai])
```

### Penjelasan Bisnis & Komponen Teknis:
- **Komponen Frontend**: `client/src/pages/SharedCalendar.tsx`, `client/src/components/Calendar/WeeklyCalendar.tsx` (`readonly={true}`).
- **Endpoint Backend**: `GET /api/shared/free-time`.
- **Privacy Masking**:
  * Seluruh judul kegiatan disamarkan menjadi `"Sibuk"`.
  * Seluruh warna kategori diseragamkan menjadi abu-abu (`#6B7280`).
  * Slot yang tidak memiliki kegiatan dianggap sebagai slot waktu luang ("Free Time") yang dapat digunakan oleh rekan untuk mengajak kerja kelompok atau berdiskusi.
  * Navigasi minggu di client menggunakan fungsi `parseLocalDate()` untuk menjamin kalender tidak mengalami pergeseran satu hari ke belakang akibat zona waktu UTC.

---

## 8. Ringkasan Kepatuhan & Status Pengujian

Dokumentasi ini telah diverifikasi dan diselaraskan penuh dengan implementasi kode pada SyncTime:
1. **Semester Filtering**: Memastikan kepatuhan terhadap profil semester mahasiswa (`semester_start` s/d `semester_end`).
2. **Exception Handling**: Memastikan slot yang dibatalkan/dipindahkan sementara terdata di `rutin_exceptions`.
3. **AI Magic Paste Alignment**: Mengintegrasikan flag otomatis `is_matkul_wajib` pada hasil ekstraksi mata kuliah rutin.
4. **Contrast & Accessibility**: Seluruh antarmuka pendukung pada diagram telah diuji dan memenuhi kontras warna Light Mode dan Dark Mode.
