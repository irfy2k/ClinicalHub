# SMD-Project — Health Application Context

## 1. Project Overview
This project is a deterministic healthcare application built for both **Patients** and **Doctors (Providers)**. It acts as an end-to-end clinical workflow app bridging patient booking, medical record holding, medication reminders, tele-health management, and real-time provider queueing. 

**Strict Design Rule:** No AI, machine learning, or LLM-based predictive features are present. All logic is standard, deterministic CRUD based.

## 2. Technology Stack
* **Framework:** React Native + Expo (SDK 54) + Expo Router
* **Language:** TypeScript
* **Styling:** NativeWind (Tailwind CSS for React Native) + `constants/theme.ts`
* **Icons:** `@expo/vector-icons` (FontAwesome)
* **Backend Strategy:** Currently running on a **Mock Service Layer** (`services/mock/*`), fully abstracted so it can be seamlessly swapped to **Firebase** in the final phase.
* **Component Library:** Custom-built React Native components (`Button`, `Card`, `Input`, `Avatar`, `Badge`, `PieChart` using `react-native-svg`).

## 3. Directory Architecture
```
/app
  /(auth)        # Login, Register, Onboarding flows
  /(patient)     # Patient hub: Dashboard, Appointments, Medications, EHR, Finances, Profile
  /(doctor)      # Doctor hub: Queue, Appointments, Prescriptions, Telemedicine, Profile
  /chat          # Secure messaging threads linked tightly to Appointments
  _layout.tsx    # Root layout & AuthProvider wrapper
  index.tsx      # Auth-aware automatic redirector

/components
  /ui            # Reusable atomic design elements (Cards, Badges, etc.)
  /symptoms      # 3-Step interactive intake wizard components

/context
  AuthContext.tsx # Centralized Role-Based Access Control (RBAC) linking mock authentication

/services
  /mock          # In-memory CRUD mock implementation holding fake logic for testing
  /firebase      # (Planned) Firebase Realtime Database & Auth implementation
  index.ts       # Registration hub. UI components ONLY import from here.

/types
  database.ts    # TypeScript definitions for expected Firebase DB Schema
```

## 4. Completed Features (By Role)

### 🏥 Patient Interface
* **Dashboard:** Vitals display with mock editable modal, "Upcoming Care" quick links to workflow hub.
* **Appointments:** Full booking wizard linking symptoms + pain scale (1-10) directly into a scheduled slot.
* **EHR (Medical Vault):** Category filtered document view (Labs, Reports, Prescriptions) that parses native file uploads (`expo-image-picker`) locally. 
* **Medications Tracker:** Live adherence calculator dynamically derived from an internal logging array mapping against daily time slots. Handles "Taken" vs "Skipped".
* **Finances Ledger:** Custom SVG pie chart rendering categorized medical spending (Consults vs Meds vs Labs). Tracks fully simulated transactional statements.

### 🩺 Doctor Interface
* **Daily Queue:** Main hub. Calculates identical day-of total/waiting patients. Provides an interactive overlay modal routing to messaging, calls, or prescribing functionalities.
* **Prescriptions:** Integrated tab allowing the localized creation of structured prescriptions targeting unique patients with multi-select delivery schedules. Deep-links from the daily queue parameter pulls.
* **Appointments:** Chronological log overviewing active versus historical bookings alongside basic filter hooks.
* **Telemedicine:** PIP-style time-gated call initiation screen that blocks entry until 15-minutes prior to slot limits. Currently mimics calls via native URI linking.

### 🔐 Shared Elements
* **Authentication Route Guarding:** Secure contexts guaranteeing Patients cannot access Doctor specific paths, automatically enforcing fallback bounds.
* **Messaging (Chat):** Lightweight timeline threaded inside an appointment_id channel rendering chat bubbles natively.

## 5. Implementation Progress

### ✅ Phase 1 — Core App Foundation (COMPLETE)
- All patient screens implemented
- All doctor screens implemented
- Mock service layer fully operational
- Auth context with RBAC route guarding
- Chat messaging system
- Custom UI component library

### ✅ Phase 2 — Push Notifications (COMPLETE)
- Installed `expo-notifications` and `expo-device`
- Created `services/notificationService.ts` singleton with full API:
  - Daily repeating medication reminders per prescription schedule_time
  - One-shot appointment reminders (30 minutes before)
  - Instant notification API for status updates and confirmations
  - Android notification channels (medication-reminders, appointments)
- Root layout requests permissions on launch with foreground/tap listeners
- Medications screen: toggle switch for enabling/disabling reminders, auto-schedules on load
- Appointments: booking confirmation + 30min-before reminder on new appointment
- Doctor Queue: fires status notifications on confirm/complete/cancel
- Doctor Prescriptions: auto-schedules reminders on new prescription creation

### ✅ Phase 3 — Firebase Integration (COMPLETE)
- Installed `firebase` and `@react-native-async-storage/async-storage`
- Created `services/firebase/firebaseConfig.ts` with Auth, Realtime Database, and Storage initialization
- Implemented 6 Firebase service modules matching mock service interfaces:
  - `firebaseAuthService`: email/password login, register, profile CRUD, `onAuthStateChanged`
  - `firebaseAppointmentService`: CRUD with indexed `patient_id`/`doctor_id` queries
  - `firebasePrescriptionService`: CRUD for prescriptions + medication logs with upsert
  - `firebaseExpenseService`: patient-scoped health expense CRUD
  - `firebaseDocumentService`: EHR document CRUD
  - `firebaseChatService`: appointment-linked messaging with chronological sort
- Created `services/index.ts` backend toggle (`BACKEND = 'mock' | 'firebase'`)
- Added `firebase-database-rules.json` with multi-tenant security rules and indexes
- Updated AuthContext with optional password support for Firebase auth
- Updated login/register screens with password field support
- Updated `types/database.ts` with Firebase schema documentation

### 🔲 Phase 4 — WebRTC Integration (PENDING)
- Replacing the current dummy telemedicine stub (`tel:` linking / layout shells) with actual active Agora/LiveKit/WebRTC socket stream connection logic

## 6. Current Status
**Last Updated:** 2026-05-02
**Active Phase:** Phase 3 Complete — Firebase integration fully implemented. To activate, set `BACKEND = 'firebase'` in `services/index.ts` and fill in Firebase credentials in `services/firebase/firebaseConfig.ts`.
