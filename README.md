# Fofo Green 🌿 — Rwandan Farm-to-Table Organic Grocer

A full-stack grocery e-commerce and cold-chain distribution platform connecting smallholder cooperatives across Rwanda (Musanze, Bugesera, Rulindo, Gicumbi) directly with households in Kigali.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Google Cloud SQL / PostgreSQL credentials:
```env
SQL_HOST="localhost"
SQL_PORT=5432
SQL_DB_NAME="fofogreen"
SQL_ADMIN_USER="postgres"
SQL_ADMIN_PASSWORD="your-password"
```

### 3. Run Database Migrations
Sync the PostgreSQL database with Drizzle ORM:
```bash
npm run db:migrate
```

### 4. Start Development Server
Starts the full-stack Express server with integrated Vite HMR:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Architecture & Folder Structure

```text
├── drizzle/                    # Drizzle ORM SQL migration files
│   ├── 0000_fofogreen_tables.sql # PostgreSQL DDL table definitions
│   └── meta/                   # Migration journal metadata
├── server/                     # Backend persistence engine
│   └── db.ts                   # In-memory & JSON storage fallback engine
├── src/                        # Frontend React & Backend Database code
│   ├── components/             # 20+ React components & modal workflows
│   │   ├── AdminPanel.tsx      # Admin dashboard with SQL Studio & Apply System
│   │   ├── Navbar.tsx          # Top navigation with multi-currency & language
│   │   ├── ProductCard.tsx     # Fresh harvest produce cards
│   │   ├── FarmPassportModal.tsx # Rwanda Standards Board (RSB) traceability
│   │   ├── CartSidebar.tsx     # Shopping basket & voucher handling
│   │   ├── CheckoutModal.tsx   # Mobile Money (MTN MoMo, Airtel) checkout
│   │   └── DeliverySection.tsx # Cold-chain IoT vehicle temperature tracking
│   ├── db/                     # Cloud SQL (PostgreSQL) schema & Drizzle ORM
│   │   ├── schema.ts           # 12 relational database tables definitions
│   │   ├── migrate.ts          # Migration runner with connection pooling
│   │   ├── applySystem.ts      # Live schema status & safe analytical SQL runner
│   │   └── index.ts            # PostgreSQL pool configuration
│   ├── services/               # REST API service client
│   └── types/                  # TypeScript data contracts & models
├── server.ts                   # Express server entry point (Port 3000)
├── DATABASE_SCHEMA.md          # Full SQL Schema technical documentation
└── firestore.rules             # Firebase security rules (ABAC)
```

---

## 🗄️ Relational Database Schema (`fofogreen`)
Powered by **PostgreSQL 16** via **Drizzle ORM** with 12 relational tables:
1. `products` — Rwandan smallholder produce catalog with pricing in Rwandan Francs (FRW)
2. `categories` — Produce taxonomy (vegetables, fruits, meat, dairy, grains, snacks)
3. `orders` — Customer orders across Kigali districts (Gasabo, Kicukiro, Nyarugenge)
4. `order_items` — Normalized order line items with subtotal tracking
5. `farm_passports` — Traceability passport: cooperatives, volcanic elevation, soil type, RSB certification
6. `users` — Customer and Administrator accounts with RBAC
7. `delivery_zones` — Kigali delivery zones, tariffs, and courier dispatch
8. `meal_kits` — Traditional Rwandan recipe kits with step-by-step cooking instructions
9. `reviews` — Customer feedback with verified buyer badges
10. `activities` — System audit logging and telemetry
11. `schema_migrations` — Applied schema migrations ledger
12. `store_settings` — Delivery thresholds and store operational rules

---

## 📦 Scripts
- `npm run dev` — Start full-stack development server
- `npm run build` — Build production bundle with Vite
- `npm start` — Run production server
- `npm run db:migrate` — Execute Drizzle Kit database migrations
- `npm run lint` — Type check codebase with TypeScript compiler
