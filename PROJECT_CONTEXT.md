# SMD-Project — Health Application Context

## 1. Project Overview
This project is a deterministic healthcare application built for both **Patients** and **Doctors (Providers)**. It acts as an end-to-end clinical workflow app bridging patient booking, medical record holding, medication reminders, tele-health management, and real-time provider queueing. 

**Strict Design Rule:** No AI, machine learning, or LLM-based predictive features are present. All logic is standard, deterministic CRUD based.

## 2. Technology Stack
* **Framework:** React Native + Expo (SDK 54) + Expo Router
* **Language:** TypeScript
* **Styling:** NativeWind (Tailwind CSS for React Native) + `constants/theme.ts`
* **Icons:** `@expo/vector-icons` (FontAwesome)
* **Backend Strategy:** Fully migrated to **Firebase Realtime Database** and **Firebase Auth**.
* **Storage Solution:** Implemented **Base64 Image Encoding** to store profile pictures, symptom photos, and EHR documents directly as strings in the database, bypassing the need for Firebase Cloud Storage and paid billing plans.
* **Component Library:** Custom-built React Native components (`Button`, `Card`, `Input`, `Avatar`, `Badge`, `PieChart` using `react-native-svg`). Includes a `DefaultAvatar` system with FontAwesome fallbacks.

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
  database.ts    # TypeScript definitions for Firebase DB Schema. Expanded with MRN logic and photo_data.
```

## 4. Completed Features (By Role)

### 🏥 Patient Interface
* **Dashboard:** Real-time vitals display and a dynamic **Upcoming Care** widget that fetches the actual next scheduled appointment.
* **Appointments:** Full booking wizard linking symptoms + pain scale (1-10) + **Symptom Photo Upload (Base64)** directly into a scheduled slot.
* **EHR (Medical Vault):** Category filtered document view with **Real-time Preview Modal** for viewing uploaded Base64 image reports.
* **Medications Tracker:** Live adherence tracker. Integrated with push notifications and auto-billed by doctors.
* **Finances Ledger:** Integrated spending tracker. Now automatically generates expenses when doctors issue priced prescriptions.
* **Identity:** Uses a readable **Medical Record Number (MRN)** format (MRN-XXXXXX) instead of raw UIDs.

### 🩺 Doctor Interface
* **Daily Queue:** Main hub displaying all **Upcoming** appointments. Optimized to show patients scheduled for tomorrow if current day slots have passed.
* **Prescriptions:** Integrated tab allowing the creation of structured prescriptions. Restricted to **treated patients only** to ensure medical accuracy. 
* **Auto-Billing:** Issuing a prescription with a cost estimate automatically injects a billing record into the Patient's finance ledger.
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

### ✅ Phase 3.5 — Clinical Polishing & Production Readiness (COMPLETE)
- **ID Reform:** Replaced raw Firebase UIDs with readable `MRN-XXXXXX` (Medical Record Number) formats across all screens.
- **Image Integration:** Implemented Base64 encoding for:
  - User profile avatars
  - Symptom photo uploads in Intake Wizard
  - EHR document uploads
- **Dashboard Synchronization:** Replaced hardcoded "Dr. Sarah Smith" widget with a real-time `useEffect` hook that fetches the actual next appointment.
- **Workflow Security:** Restricted the Doctor's prescription list to patients they have an existing appointment record with.
- **Automated Billing:** Linked the Prescription module to the Finance module. Entering a price for a medicine now auto-generates a patient expense.
- **UI Feedback:** Added `disabled` state support to the `Button` component. Integrated form validation across all screens to prevent submission of empty or invalid data.
- **Navigation Stability:** Explicitly defined the `chat/[id]` route in the Root Layout Stack to resolve navigation context errors.
- **EHR Preview:** Added a Modal-based image previewer to the Medical Vault for instant document viewing.

### 🔲 Phase 4 — WebRTC Integration (PENDING)
- Replacing the current dummy telemedicine stub (`tel:` linking / layout shells) with actual active Agora/LiveKit/WebRTC socket stream connection logic

## 6. Current Status
**Last Updated:** 2026-05-02
**Active Phase:** Phase 3.5 Complete — App is polished, validated, and fully integrated with clinical workflows.

**Completed Refactoring Tasks:**
- Integrated Base64 image storage to bypass Cloud Storage billing requirements.
- Implemented MRN (Medical Record Number) readable identifiers.
- Added automated billing (Prescriptions -> Finances).
- Optimized Doctor Queue for "Upcoming" visibility rather than strictly "Today".
- Finalized visual feedback/disabled states for all primary action buttons.

**Next Steps:**
- Phase 4: Implement WebRTC for actual telemedicine video calling.
- Phase 5: Hardware sensor integration (stubs for vitals sync).
- User Testing: Conduct a full end-to-end walkthrough from Registration to Final Billing.
