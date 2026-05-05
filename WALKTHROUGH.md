# ClinicalHub Walkthrough

This walkthrough is a teammate-ready overview of the repository structure, key files, and the main product flows (auth, appointments, chat, prescriptions, documents, finances). It is written for the current codebase as of today.

## Tech stack (what runs the app)
- Expo + React Native for UI and routing (see [package.json](package.json)).
- Expo Router for file-based navigation (see [app/_layout.tsx](app/_layout.tsx) and [app/index.tsx](app/index.tsx)).
- Firebase Auth + Realtime Database for backend data (see [services/firebase/firebaseConfig.ts](services/firebase/firebaseConfig.ts)).
- NativeWind + Tailwind for styling (see [tailwind.config.js](tailwind.config.js) and [global.css](global.css)).
- Expo Notifications for reminders and alerts (see [services/notificationService.ts](services/notificationService.ts)).

## Root files (project configuration)
- [app.json](app.json) - Expo app config (name, icons, splash, router plugin).
- [package.json](package.json) - dependencies and scripts.
- [babel.config.js](babel.config.js) - enables NativeWind with Expo.
- [metro.config.js](metro.config.js) - NativeWind Metro config.
- [tailwind.config.js](tailwind.config.js) - theme colors + content globs.
- [tsconfig.json](tsconfig.json) - TypeScript config with Expo base.
- [eslint.config.js](eslint.config.js) - lint config.
- [global.css](global.css) - Tailwind base/components/utilities.
- [database.rules.json](database.rules.json) - Firebase Realtime Database rules.
- [expo-env.d.ts](expo-env.d.ts) - Expo types reference.
- [nativewind-env.d.ts](nativewind-env.d.ts) - NativeWind types reference.
- assets/ - icons and splash assets referenced by [app.json](app.json).

## App routing and navigation
- [app/_layout.tsx](app/_layout.tsx) - root layout, sets up notifications and auth provider, declares route groups.
- [app/index.tsx](app/index.tsx) - initial redirect based on auth and role.
- Role-based tab layouts:
  - Admin tabs in [app/(admin)/_layout.tsx](app/(admin)/_layout.tsx)
  - Doctor tabs in [app/(doctor)/_layout.tsx](app/(doctor)/_layout.tsx)
  - Patient tabs in [app/(patient)/_layout.tsx](app/(patient)/_layout.tsx)
- Auth stack in [app/(auth)/_layout.tsx](app/(auth)/_layout.tsx)
- Chat screen in [app/chat/[id].tsx](app/chat/[id].tsx)

## Authentication and user context
- [context/AuthContext.tsx](context/AuthContext.tsx)
  - Wraps the app with `AuthProvider`.
  - `useProtectedRoute` guards routes by role.
  - `login`, `register`, `logout`, `updateUser` delegate to Firebase services.
- [services/firebase/firebaseAuthService.ts](services/firebase/firebaseAuthService.ts)
  - Auth: sign-in, register, reset password, auth listener.
  - User profile storage under `users/{uid}` in Realtime Database.

### Auth screens (patient and doctor onboarding)
- [app/(auth)/welcome.tsx](app/(auth)/welcome.tsx) - landing with sign-in/sign-up.
- [app/(auth)/login.tsx](app/(auth)/login.tsx) - sign-in + password reset.
- [app/(auth)/register.tsx](app/(auth)/register.tsx) - role select, registration, Pakistani phone formatting.
- [app/(auth)/onboarding.tsx](app/(auth)/onboarding.tsx) - patient intake and medical history capture.

## Data model (Realtime Database schema)
- [types/database.ts](types/database.ts) defines the main types used across services and screens:
  - `User`, `Appointment`, `Prescription`, `MedicationLog`, `HealthExpense`, `ChatMessage`, `DocumentRecord`.
  - `DocumentRecord` includes `visit_summary` with structured fields.

## Services (Firebase access layer)
- [services/index.ts](services/index.ts) - exports Firebase services in a single hub.
- [services/firebase/firebaseConfig.ts](services/firebase/firebaseConfig.ts) - Firebase app, auth, DB, and a `cleanObject` helper.
- Appointments: [services/firebase/firebaseAppointmentService.ts](services/firebase/firebaseAppointmentService.ts)
- Prescriptions + logs: [services/firebase/firebasePrescriptionService.ts](services/firebase/firebasePrescriptionService.ts)
- Expenses: [services/firebase/firebaseExpenseService.ts](services/firebase/firebaseExpenseService.ts)
- Documents: [services/firebase/firebaseDocumentService.ts](services/firebase/firebaseDocumentService.ts)
- Chat: [services/firebase/firebaseChatService.ts](services/firebase/firebaseChatService.ts)
- Notifications: [services/notificationService.ts](services/notificationService.ts)

## Core flows (end-to-end)

### 1) Patient booking and intake
- Entry point: [app/(patient)/appointments.tsx](app/(patient)/appointments.tsx)
- Steps:
  1. Patient opens booking modal, searches doctors.
  2. Selects date and a slot (slots pulled from doctor `available_times`).
  3. Intake wizard collects symptoms, pain score, duration, optional photo.
  4. Appointment created with slot lock and appointment reminders scheduled.
- Intake wizard UI: [components/symptoms/IntakeWizard.tsx](components/symptoms/IntakeWizard.tsx)
- Pain scale component: [components/symptoms/PainScale.tsx](components/symptoms/PainScale.tsx)

### 2) Doctor queue and visit completion
- Queue screen: [app/(doctor)/queue.tsx](app/(doctor)/queue.tsx)
- Steps:
  1. Doctor selects an appointment.
  2. Completes the Visit Summary form.
  3. Summary is saved as a document and appointment marked completed.
- Visit summaries are saved as `DocumentRecord` with `file_type = visit_summary`.

### 3) Patient medical vault (documents)
- Vault screen: [app/(patient)/ehr.tsx](app/(patient)/ehr.tsx)
- Shows documents by type and renders visit summaries inline.
- PDF viewing is not used in Expo Go; summary text is displayed directly.

### 4) Prescriptions and reminders
- Doctor creates prescriptions: [app/(doctor)/prescriptions.tsx](app/(doctor)/prescriptions.tsx)
- Patient sees meds and marks taken/skipped: [app/(patient)/medications.tsx](app/(patient)/medications.tsx)
- Reminders scheduled through [services/notificationService.ts](services/notificationService.ts)

### 5) Chat tied to appointments
- Chat UI: [app/chat/[id].tsx](app/chat/[id].tsx)
- Real-time listener in [services/firebase/firebaseChatService.ts](services/firebase/firebaseChatService.ts)
- Unread counts stored on appointments.

### 6) Finances
- Patient finances: [app/(patient)/finances.tsx](app/(patient)/finances.tsx)
- Finance repair for admins: [app/(admin)/settings.tsx](app/(admin)/settings.tsx)
- Expense records created by prescriptions and manual entry.

## Role-based UI walkthrough

### Patient
- Dashboard: [app/(patient)/dashboard.tsx](app/(patient)/dashboard.tsx)
  - Vitals input modal and quick actions for appointments, meds, vault, finances, chat.
- Appointments: [app/(patient)/appointments.tsx](app/(patient)/appointments.tsx)
- Medications: [app/(patient)/medications.tsx](app/(patient)/medications.tsx)
- Medical Vault: [app/(patient)/ehr.tsx](app/(patient)/ehr.tsx)
- Finances: [app/(patient)/finances.tsx](app/(patient)/finances.tsx)
- Profile: [app/(patient)/profile.tsx](app/(patient)/profile.tsx)

### Doctor
- Queue: [app/(doctor)/queue.tsx](app/(doctor)/queue.tsx)
- Appointments: [app/(doctor)/appointments.tsx](app/(doctor)/appointments.tsx)
- Prescriptions: [app/(doctor)/prescriptions.tsx](app/(doctor)/prescriptions.tsx)
- Telemedicine placeholder: [app/(doctor)/telemedicine.tsx](app/(doctor)/telemedicine.tsx)
- Profile and schedule: [app/(doctor)/profile.tsx](app/(doctor)/profile.tsx)

### Admin
- Overview: [app/(admin)/dashboard.tsx](app/(admin)/dashboard.tsx)
- Users: [app/(admin)/users.tsx](app/(admin)/users.tsx)
- Appointments: [app/(admin)/appointments.tsx](app/(admin)/appointments.tsx)
- Prescriptions: [app/(admin)/prescriptions.tsx](app/(admin)/prescriptions.tsx)
- Settings and finance repair: [app/(admin)/settings.tsx](app/(admin)/settings.tsx)

## UI building blocks
- Buttons: [components/ui/Button.tsx](components/ui/Button.tsx)
- Inputs: [components/ui/Input.tsx](components/ui/Input.tsx)
- Card wrapper: [components/ui/Card.tsx](components/ui/Card.tsx)
- Default avatar: [components/ui/DefaultAvatar.tsx](components/ui/DefaultAvatar.tsx)
- Theme tokens: [constants/theme.ts](constants/theme.ts)

## Security and access rules
- Realtime Database rules in [database.rules.json](database.rules.json)
  - Role-based reads and writes for users, appointments, prescriptions, chat, docs, expenses.
  - `appointment_slots` used to prevent double-booking.

## Notes and known constraints
- Expo Go does not render PDFs; visit summaries are rendered as inline text in the vault.
- Media (photos) are stored as base64 strings in the database for now.
- Appointment time logic uses Pakistan time offsets in the patient booking screen.

## File structure quick map
- app/ - screens and route groups for auth, patient, doctor, admin, and chat.
- components/ - UI building blocks and the intake wizard.
- constants/ - theme tokens.
- context/ - auth provider and route guarding.
- services/ - Firebase services and notifications.
- types/ - TypeScript data models.
- assets/ - icons and splash images.
