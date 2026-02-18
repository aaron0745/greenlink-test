# Green-link 🌿

**Green-link** is a modern, full-stack Smart Waste Management System designed for digital transformation. It replaces traditional manual logbooks with a robust, QR-verified digital workflow, empowering administrators with real-time analytics and providing residents with a seamless portal for tracking and payments.

## 🚀 Key Features

### 🔐 Role-Based Access Control (RBAC)
- **Admin Portal**: Centralized dashboard for monitoring panchayat-wide metrics, managing collector routes, and maintaining household records.
- **Collector App**: Optimized mobile interface for workers to manage daily routes, verify visits via QR scanning, and log payments.
- **Resident Portal**: Personalized dashboard for households to view collection history, download digital receipts, and pay fees online.

### 📲 QR-Verified Workflow
- Every household has a unique, system-generated QR code.
- Collectors **must scan** the physical QR code at the doorstep to unlock the "Collected" status, ensuring 100% verified visits.
- Misclick prevention: Error handling alerts collectors if they scan a house that doesn't match their current selection.

### 💰 Hybrid Payment System
- **Offline (Cash)**: Collectors can collect cash on the spot and mark the record as "Paid," instantly updating the central database.
- **Online (Digital)**: Collectors can mark a preference for online payment, which enables a "Pay Online" button on the Resident's personal dashboard.
- **Simulated Gateway**: Ready-to-use digital payment flow that logs transactions with `SYSTEM` verification.

### 📊 Real-time Analytics & Mapping
- **Live Coverage Map**: Visual representation of household points (GPS-based) showing collected vs. pending areas.
- **Dynamic Charts**: Performance tracking via weekly collection bars and monthly revenue trends.
- **Data Export**: Generate and download comprehensive CSV reports for transparency and auditing.

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite.
- **Styling**: Tailwind CSS, shadcn/ui (Material Design principles).
- **Backend-as-a-Service**: Appwrite (Auth, Database).
- **State Management**: TanStack Query (React Query) for real-time synchronization.
- **Utilities**: Lucide React (Icons), Recharts (Data Viz), html5-qrcode (Scanning).

---

## 📂 Database Schema (Appwrite)

### 1. Households
Tracks the core data for every residence.
- `residentName`, `address`, `phone`, `ward`
- `paymentStatus`: (paid, pending, overdue)
- `collectionStatus`: (collected, pending, not-available)
- `paymentMode`: (online, offline, none)
- `assignedCollector`: Linked to Collector ID.
- `lat`, `lng`: GPS coordinates for mapping.

### 2. Collectors
Worker profiles and auth accounts.
- `name`, `phone`, `email`, `avatar`
- `ward`: Array of integers representing covered areas.
- `totalCollections`: Aggregated count of successful visits.

### 3. CollectionLogs
Audit trail for every single event.
- `householdId`, `residentName`, `timestamp`, `location`
- `status`: (collected, not-available, skipped)
- `paymentMode`: (online, offline)
- `amountCollected`: Decimal value of the transaction.

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=your_database_id
VITE_APPWRITE_COLLECTION_HOUSEHOLDS=your_id
VITE_APPWRITE_COLLECTION_COLLECTORS=your_id
VITE_APPWRITE_COLLECTION_TRANSACTIONS=your_id
VITE_APPWRITE_COLLECTION_ROUTES=your_id
APPWRITE_API_KEY=your_secret_api_key
```

---

## 🛠 Management Scripts

The project includes a suite of Node.js scripts for rapid environment setup:

1.  **`node scripts/setup_appwrite.cjs`**: Creates all collections and defines strict attribute schemas/types.
2.  **`node scripts/reset_and_seed.cjs`**: Performs a full database wipe and seeds 50 fresh households and 6 collectors with randomized, authentic Keralite data.
3.  **`node scripts/fix_assignments.cjs`**: Logic-check script that re-syncs household assignments based on ward numbers and collector coverage.

---

## 🏁 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Initialize Database**:
   ```bash
   node scripts/setup_appwrite.cjs
   node scripts/reset_and_seed.cjs
   ```
3. **Run Development Server**:
   ```bash
   npm run dev
   ```
4. **Access Portals**:
   - **Admin**: Login with your Appwrite admin email.
   - **Collector**: Use `sumesh@panchayat.in` / `password123`.
   - **Resident**: Use any phone number generated in the seeding script (e.g., `984...`).
