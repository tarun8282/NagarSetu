# 🇮🇳 NagarSetu — National Civic Complaint Platform

<div align="center">

**नगरसेतु** — *City Bridge*

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.2-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.2-blue)
![Supabase](https://img.shields.io/badge/supabase-postgres-green)

*A unified platform bridging Indian citizens with their municipal corporations*

[Features](#features) • [Quick Start](#quick-start) • [Tech Stack](#tech-stack) • [Architecture](#architecture) • [Setup Guide](#setup-guide) • [Demo](#demo-tips)

</div>

---

## 🎯 What is NagarSetu?

**NagarSetu** (नगरसेतु — from Hindi *नगर* meaning "city" and *सेतु* meaning "bridge") is a national civic complaint management platform for India. It enables any citizen to report municipal issues — potholes, water leakage, garbage overflow, broken streetlights, illegal construction, and more — directly to their local municipal corporation.

### The Problem

Indian citizens currently have no unified, transparent way to report civic issues:
- Complaints are scattered across WhatsApp groups, ward offices, and unanswered helplines
- No tracking, no accountability, no data
- Municipal corporations have no visibility into complaint patterns
- State governments cannot compare city performance

### The Solution

NagarSetu creates a single platform where every complaint is:
- 📝 **Logged** — Submitted with photos, GPS location, and detailed description
- 🤖 **AI-Classified** — Automatically categorized by Gemini 2.5 Flash
- 🎯 **Routed** — Assigned to the correct department with SLA tracking
- 📊 **Tracked** — Status updates in real-time until resolution
- 📈 **Measured** — Performance metrics at every government level

---

## ✨ Features

### For Citizens
- 📱 Phone OTP-based registration (accessible to everyone)
- 📸 Submit complaints with photos, video, and precise GPS location
- 🤖 Instant AI classification with department and helpline info
- 🔔 Real-time status updates without page refresh
- ⭐ Rate department performance after resolution
- 🗺️ View complaint heatmaps in your city

### For Department Officers
- 📋 Dashboard showing assigned complaints only
- 📊 Department-level performance metrics
- ✅ Update status with remarks and resolution photos
- ⏰ SLA deadline tracking and alerts

### For MC Administrators
- 🏙️ City-wide complaint visibility across all departments
- 📈 Department performance leaderboard
- 🔄 Reassign misclassified complaints
- 👥 Manage department officer accounts
- 🗺️ City-scoped heatmap

### For State Administrators
- 📊 Aggregate metrics across all cities in state
- 🏆 City performance comparison leaderboard
- 🔍 Drill-down into specific city data
- 🗺️ State-wide complaint heatmap

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 + Vite | UI Framework |
| TypeScript | Type Safety |
| React Router v6 | Navigation |
| Tailwind CSS | Styling |
| Leaflet.js + OpenStreetMap | Maps |
| leaflet.heat | Heatmap Visualization |
| TanStack React Query | Data Fetching & Caching |
| React Hook Form + Zod | Form Validation |
| Supabase JS Client | Realtime & Storage |
| Axios | HTTP Client |
| Lucide React | Icons |
| date-fns | Date Formatting |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express | API Server |
| Supabase JS Client (Service Role) | Database Operations |
| Google Generative AI SDK | Gemini 2.5 Flash Integration |
| Multer | File Handling |
| Nodemailer | Email Service |
| cors, helmet, morgan | Middleware |
| express-validator | Input Validation |

### Services (All Free Tier)
| Service | Purpose |
|---------|---------|
| **Supabase** | PostgreSQL + Auth + Storage + Realtime |
| **Gemini 2.5 Flash** | AI Classification (free at aistudio.google.com) |
| **Nominatim** | Reverse Geocoding |
| **OpenStreetMap** | Map Tiles (no API key needed) |
| **Vercel** | Frontend Hosting |

---

## 📁 Project Structure

```
MEGAHACK-2026_FRESHERS/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── api/              # Axios API functions
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # Global state (Auth)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Supabase client setup
│   │   └── pages/            # Page components
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── server/                    # Express Backend
│   ├── src/
│   │   ├── lib/              # Supabase & Gemini config
│   │   ├── routes/           # URL definitions
│   │   ├── services/         # Business logic
│   │   └── utils/            # Helper functions
│   ├── .env.example
│   └── package.json
│
└── supabase/                  # Database
    ├── schema.sql            # Full database schema
    ├── seed.sql              # Initial data (states, cities, departments)
    ├── MIGRATION.sql         # Schema updates
    └── migrations/           # Migration files
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Supabase Account** (free tier)
- **Google AI Studio Account** (for Gemini API key)

### 1. Clone the Repository

```bash
git clone https://github.com/tarun8282/MEGAHACK-2026_FRESHERS.git
cd MEGAHACK-2026_FRESHERS
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the following files in order:
   ```
   supabase/schema.sql      # Creates all tables
   supabase/seed.sql        # Seeds states, cities, departments
   supabase/MIGRATION.sql   # Applies any schema updates
   ```
3. Note your project credentials:
   - `Project URL` (Settings → API → Project URL)
   - `anon/public key` (Settings → API → anon/public)
   - `service_role key` (Settings → API → service_role)

### 3. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Click "Get API Key"
3. Create a new API key (no billing needed for free tier)

### 4. Configure Environment Variables

**Server** — Copy and edit the environment file:

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
# Supabase Configuration
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SERVICE_ROLE_KEY=your_service_role_key

# Email Configuration (Gmail)
EMAIL_PROVIDER=gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Server Configuration
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# AI Service
GEMINI_API_KEY=your_gemini_api_key
```

**Client** — Create `client/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key
VITE_API_URL=http://localhost:5000
```

### 5. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 6. Start Development Servers

**Terminal 1 — Start Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Start Frontend:**
```bash
cd client
npm run dev
```

The application will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

---

## 📐 Architecture

### Complaint Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMPLAINT JOURNEY                                  │
└─────────────────────────────────────────────────────────────────────────────┘

 1. CITIZEN SUBMITS          2. AI PROCESSES              3. DEPARTMENT WORKS
┌──────────────────┐      ┌──────────────────┐       ┌──────────────────┐
│ • Title & Desc   │      │ • Gemini 2.5     │       │ • Officer sees   │
│ • GPS Location   │ ──▶  │ • Classifies     │ ──▶   │   complaint      │
│ • Photos/Video   │      │ • Assigns Dept   │       │ • Updates status │
│ • Submit         │      │ • Sets SLA       │       │ • Uploads proof  │
└──────────────────┘      └──────────────────┘       └──────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │   REAL-TIME UPDATES      │
                    │ • Status changes appear  │
                    │ • No page refresh needed │
                    │ • Citizen rates service  │
                    └──────────────────────────┘
```

### Status Lifecycle

```
submitted ──▶ ai_processing ──▶ under_review ──▶ in_progress ──▶ resolved
                                     │                              
                                     └──▶ rejected (if invalid)
                                     └──▶ escalated (if SLA breached)
```

### Database Schema

```
states ◀──┬── cities ◀──┬── departments ◀──┬── officers
          │             │                   │
          │             └── complaints ◀────┼── complaint_media
          │                    │            │
          │                    ├── ai_classifications
          │                    └── status_history
          │
          └── citizens
```

### Security: Row Level Security (RLS)

All data access is controlled at the database level:

| Role | Data Access |
|------|-------------|
| **Citizen** | Only their own complaints |
| **Dept Officer** | Complaints in their city AND department |
| **MC Admin** | All complaints in their city |
| **State Admin** | All complaints in their state |

---

## 👥 User Roles

### Creating Test Users

For development and demo, create users in Supabase:

1. **Citizens** — Sign up through the app using phone OTP
2. **Officers/Admins** — Create manually in Supabase Auth, then add profile:

```sql
-- After creating user in Supabase Auth, add officer profile
INSERT INTO public.officers (id, full_name, email, role, city_id, department_id)
VALUES (
  'user-uuid-from-auth',
  'Officer Name',
  'officer@email.com',
  'dept_officer',  -- or 'mc_admin', 'state_admin'
  'city-uuid',
  'department-uuid'
);
```

---

## 🗺️ Maps & Heatmap

The platform uses **Leaflet.js** with **OpenStreetMap** (completely free, no API key):

- **Location Picker:** Citizens click on map or use GPS to pin issue location
- **Heatmap:** Shows complaint density across the city/state
  - Critical = weight 1.0 (red)
  - High = weight 0.75
  - Medium = weight 0.5
  - Low = weight 0.25 (blue)

### Important: leaflet.heat Loading

The `leaflet.heat` plugin must be loaded in `index.html` **before** React loads:

```html
<!-- In client/index.html -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.heat/dist/leaflet-heat.js"></script>
```

---

## 🤖 AI Integration

### Gemini 2.5 Flash Classification

The AI receives:
- Complaint title and description
- Location (city, state)
- Up to 3 images (base64 encoded)

And returns:
```json
{
  "category": "road_pothole",
  "severity": "high",
  "department_name": "BMC Roads Department",
  "authority_contact": {
    "title": "Executive Engineer",
    "helpline": "1800-xxx-xxxx",
    "email": "roads@bmc.gov.in"
  },
  "reasoning": "Large pothole on main road affecting traffic safety",
  "confidence_score": 0.92
}
```

### Complaint Categories

| Category | Department |
|----------|------------|
| road_pothole, road_damage | Roads |
| water_leakage, water_shortage | Water Supply |
| garbage_overflow, garbage_collection | Solid Waste |
| electricity_outage, streetlight | Electricity |
| sanitation_drain, sanitation_toilet | Sanitation |
| illegal_construction, encroachment | Planning/Building |
| stray_animals, tree_fallen, flooding, noise_pollution | Other |

---

## ⏱️ SLA Deadlines

| Category | SLA (Hours) |
|----------|-------------|
| Electricity Outage | 6 |
| Garbage Collection | 12 |
| Water Issues | 24 |
| Sanitation | 36 |
| Roads | 48 |
| Illegal Construction | 72 |

Complaints not resolved by deadline are automatically **escalated** and flagged to MC Admin.

---

## 🎬 Demo Tips

### 1. AI Classification (Most Impressive)
Submit a complaint and watch the AI result card appear in ~10 seconds without page refresh.

### 2. Real-Time Cross-Role Updates
Open citizen view and officer view side by side. When officer updates status, citizen's screen updates instantly.

### 3. Heatmap Visualization
Pre-seed 50-100 complaints across Mumbai with realistic coordinates. The heatmap will show striking density patterns.

### Pre-Demo Checklist
- [ ] Seed database with states, cities, departments
- [ ] Create test accounts for each role
- [ ] Pre-seed 50+ complaints for heatmap visualization
- [ ] Test the complete complaint flow end-to-end
- [ ] Have two browser tabs ready for real-time demo

---

## 🔧 Development Commands

### Client

```bash
cd client

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Server

```bash
cd server

# Start with nodemon (auto-reload)
npm run dev

# Start production server
npm start
```

---

## 📦 Deployment

### Frontend (Vercel)

1. Connect your GitHub repo to Vercel
2. Set root directory to `client`
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (your backend URL)
4. Deploy

### Backend (Railway/Render/Fly.io)

1. Connect your GitHub repo
2. Set root directory to `server`
3. Add all environment variables from `.env`
4. Deploy

### Database (Supabase)

Your Supabase project is already production-ready on their free tier:
- 500MB database
- 1GB storage
- 50,000 monthly active users

---

## ⚠️ Known Issues & Solutions

| Issue | Solution |
|-------|----------|
| **Gemini returns wrong contacts** | AI only determines category; contacts come from verified `departments` table |
| **Nominatim rate limiting** | Server continues without geocoded address if call fails |
| **RLS misconfiguration** | Test each role's data scope before demo |
| **Gemini slow response** | Complaint saves immediately; AI result arrives via Realtime |
| **leaflet.heat undefined** | Ensure script loads in index.html before React |

---

## 🏗️ Build Order (For Teams)

1. ✅ Supabase setup + schema + seed data
2. ✅ Express server + health check
3. ✅ React app + Tailwind + Auth
4. ✅ Complaint submission form
5. ✅ Gemini integration
6. ✅ Citizen complaint detail + Realtime
7. ✅ Officer dashboard
8. ✅ Heatmap component
9. ✅ MC Admin dashboard
10. ✅ State Admin dashboard
11. ✅ Landing page + UI polish

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Supabase** for the amazing free tier PostgreSQL + Auth + Realtime
- **Google AI Studio** for free Gemini 2.5 Flash API access
- **OpenStreetMap** for free map tiles
- **Nominatim** for free geocoding

---

<div align="center">

Made with ❤️ for India's cities

**नगरसेतु — Bridging Citizens & Municipalities**

</div>
