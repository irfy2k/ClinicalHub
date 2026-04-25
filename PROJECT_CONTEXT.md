# SMD-Project — Health Application Context

## 1. Project Overview
This project is a deterministic healthcare application built for both **Patients** and **Doctors (Providers)**. It acts as an end-to-end clinical workflow app bridging patient booking, medical record holding, medication reminders, tele-health management, and real-time provider queueing. 

**Strict Design Rule:** No AI, machine learning, or LLM-based predictive features are present. All logic is standard, deterministic CRUD based.

## 2. Technology Stack
* **Framework:** React Native + Expo (SDK 54) + Expo Router
* **Language:** TypeScript
* **Styling:** NativeWind (Tailwind CSS for React Native) + `constants/theme.ts`
* **Icons:** `@expo/vector-icons` (FontAwesome)
* **Backend Strategy:** Currently running on a **Mock Service Layer** (`services/mock/*`), fully abstracted so it can be seamlessly swapped to **Supabase** in the final phase.
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
  index.ts       # Registration hub. UI components ONLY import from here.

/types
  database.ts    # TypeScript definitions for expected Supabase DB Schema
```

## 4. Completed Features (By Role)

### 🏥 Patient Interface
* **Dashboard:** Vitals display with mock editable modal, "Upcoming Care" quick links to workflow hub.
* **Appointments:** Full booking wizard linking symptoms + pain scale (1-10) directly into a scheduled slot.
* **EHR (Medical Vault):** Category filtered document view (Labs, Reports, Prescriptions) that parses native file uploads (`expo-image-picker`) locally. 
* **Medications Tracker:** Live adherence calculator dynamically derived from an internal logging array array mapping against daily time slots. Handles "Taken" vs "Skipped".
* **Finances Ledger:** Custom SVG pie chart rendering categorized medical spending (Consults vs Meds vs Labs). Tracks fully simulated transactional statements.

### 🩺 Doctor Interface
* **Daily Queue:** Main hub. Calculates identical day-of total/waiting patients. Provides an interactive overlay modal routing to messaging, calls, or prescribing functionalities.
* **Prescriptions:** Integrated tab allowing the localized creation of structured prescriptions targeting unique patients with multi-select delivery schedules. Deep-links from the daily queue parameter pulls.
* **Appointments:** Chronological log overviewing active versus historical bookings alongside basic filter hooks.
* **Telemedicine:** PIP-style time-gated call initiation screen that blocks entry until 5-minutes prior to slot limits. Currently mimics calls via native URI linking.

### 🔐 Shared Elements
* **Authentication Route Guarding:** Secure contexts guaranteeing Patients cannot access Doctor specific paths, automatically enforcing fallback bounds.
* **Messaging (Chat):** Lightweight timeline threaded inside an appointment_id channel rendering chat bubbles natively.

## 5. Upcoming Roadmap & Next Operations (Pending)

1. **Push Notifications:** Install and inject `expo-notifications` handling background/local alerts bridging individual prescription arrays against scheduled triggers natively.
2. **WebRTC Integration:** Replacing the current dummy telemedicine stub (`tel:` linking / layout shells) with an actual active Agora/LiveKit/WebRTC socket stream connection logic.
3. **Database Migration (Supabase):** 
    * Replace `services/mock/*` arrays with live `@supabase/supabase-js` endpoints inside `services/supabase/*`.
    * Map to `users`, `appointments`, `prescriptions`, `medication_logs`, and `health_expenses` tables alongside strict RLS policies isolating multitenant rows.
    * Establish an active Supabase Storage bucket handling physical file payloads currently mocked by the image picker.
