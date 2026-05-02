# Implementation Plan: Firebase Cleanup & Enhancements

This plan details the steps required to transition the application fully away from mock data, resolve UI/UX edge cases, and ensure robust end-to-end functionality on the live Firebase database.

## Phase 1: Total Mock Data Removal

Currently, the application relies heavily on `mockUsers` and mock arrays to populate dropdowns, avatars, and patient details across the doctor screens. We need to purge this and rely solely on Firebase.

**Files to modify:**
1. `services/index.ts`: Remove the `mockServices` object entirely. `BACKEND` toggle should be removed or strictly hardcoded to Firebase.
2. `services/mock/mockData.ts` & `services/mock/mock*Service.ts`: Delete the entire `mock` directory.
3. `app/(doctor)/telemedicine.tsx`: 
   - Remove `mockUsers` import.
   - Fetch the active patient's profile directly via `Services.auth.getUser(activeAppointment.patient_id)`.
4. `app/(doctor)/prescriptions.tsx`:
   - Remove `mockUsers` import.
   - Implement a new Firebase query in `firebaseAuthService` (e.g., `getPatients()`) to populate the `patientUsers` selection list dynamically.
   - When mapping over active prescriptions, fetch the patient name asynchronously or store patient names directly on the prescription document to avoid N+1 queries.
5. `app/(patient)/appointments.tsx`:
   - Remove mock logic.
   - Create a `getDoctors()` function in `firebaseAuthService` to load the list of available specialists.

## Phase 2: UI/UX Enhancements

### 1. Pakistani Phone Number Validation
**File:** `app/(auth)/register.tsx`
- **Action:** Update the phone number `Input` field.
- **Implementation:** 
  - Prefix the input with `+92 ` natively or visually.
  - Add Regex validation: `const phoneRegex = /^((\+92)|(0092))-{0,1}\d{3}-{0,1}\d{7}$|^\d{11}$|^\d{4}-\d{7}$/`.
  - Format the input mask automatically as the user types (e.g., `03XX-XXXXXXX`).

### 2. Default Vector Avatars
**Files:** `app/(patient)/dashboard.tsx`, `app/(patient)/profile.tsx`, `app/(doctor)/telemedicine.tsx`, `app/(doctor)/profile.tsx`.
- **Current Issue:** The app uses `https://i.pravatar.cc/` for placeholders. If the user doesn't upload a photo, this feels unpolished.
- **Action:** Replace `pravatar.cc` fallbacks with an SVG or FontAwesome vector placeholder.
- **Implementation:**
  - Create a reusable `Avatar` component that checks if `user.avatar_url` exists.
  - If null, render a fallback: `<FontAwesome name="user-circle" size={...} color="#94A3B8" />` wrapped in a styled `View`.

## Phase 3: Firebase Interaction Fixes & Database Changes

When migrating from synchronous mock arrays to asynchronous Firebase streams, several interaction edge cases emerge:

1. **Chat Screen (`app/chat/[id].tsx`):**
   - **Current Issue:** Uses `setInterval(loadMessages, 3000)` for pulling messages. This is inefficient and causes screen flashing.
   - **Fix:** Update `firebaseChatService` to use Firebase's native Realtime Database listener (`onValue` or `onChildAdded`) for true socket-based real-time messaging without manual polling.

2. **Prescription Linking (`app/(doctor)/prescriptions.tsx`):**
   - **Issue:** The doctor creates a prescription, but the patient name doesn't easily show up in the list without fetching the user document every time.
   - **Fix:** Denormalize the database. Update the `firebasePrescriptionService.create()` function to accept and store `patient_name` and `doctor_name` directly in the prescription object. Update `types/database.ts` to reflect this.

3. **Status Race Conditions (`app/(doctor)/queue.tsx`):**
   - **Issue:** Changing status and creating chat rooms require strict synchronization.
   - **Fix:** Ensure that `updateStatus` uses Firebase transactions if necessary, and ensure `create` triggers immediately reflect in the UI via state caching.

---

# Extensive End-to-End Testing Guide

Once the above changes are made, run through this protocol using **two physical devices or two separate simulators** (one acting as Patient, one as Doctor).

### Test Case 1: Onboarding & Authentication
1. **Patient Device:** Register a new account. Use a Pakistani number format. Ensure the avatar is the vector placeholder.
2. **Doctor Device:** Register a new account as a Doctor. 
3. **Validation:** Check the Firebase Console `users` collection to verify both accounts exist with correct roles.

### Test Case 2: Booking an Appointment
1. **Patient Device:** Navigate to Appointments -> "Find a Specialist".
2. **Patient Device:** Ensure the Doctor registered in Test Case 1 appears in the list.
3. **Patient Device:** Book a slot. Complete the symptom wizard.
4. **Validation:** Check the Firebase Console `appointments` collection. Verify the document links both `patient_id` and `doctor_id`.

### Test Case 3: Doctor Queue & Real-time Status
1. **Doctor Device:** Open the Daily Queue. Verify the patient's appointment appears.
2. **Doctor Device:** Change status to "Confirmed".
3. **Patient Device:** Verify a Push Notification arrives: "Appointment Confirmed".
4. **Patient Device:** Check the Appointments tab to see the status update to "Confirmed".

### Test Case 4: Real-time Chat Interactions
1. **Doctor Device:** From the queue, click "Message Patient". Send "Hello, are you ready?"
2. **Patient Device:** Open the appointment, tap to view messages. Verify the message appears instantly (without a 3-second delay).
3. **Patient Device:** Reply back. Verify the Doctor sees the reply instantly.

### Test Case 5: Prescriptions & Push Notifications
1. **Doctor Device:** From the queue, click "Prescribe Medicine". 
2. **Doctor Device:** Select the Patient, add "Panadol", select schedule times (e.g., 08:00, 20:00), and hit Issue.
3. **Patient Device:** Verify an instant Push Notification arrives: "New Prescription Issued".
4. **Patient Device:** Open the Medications tab. Verify Panadol is listed in active prescriptions.
5. **Patient Device:** Tap "Mark as Taken" on a timeline slot. 
6. **Validation:** Check the Firebase Console `medication_logs` to ensure the status is logged under the correct `prescription_id`.

### Test Case 6: Telemedicine (WebRTC/Call Stub)
1. **Doctor Device:** Start Call. Ensure the PIP overlay shows the doctor's vector placeholder (if no avatar uploaded).
2. **Doctor Device:** Click "Initiate Native Video Call". Verify it dials the Pakistani phone number accurately formatting the `tel:` URI.
