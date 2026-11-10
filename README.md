# AttendX – AI-Powered Smart Attendance Management Platform

[![Tech Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Vite%20%2B%20Tailwind%20%2B%20Gemini%20AI-indigo.svg)](https://github.com)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com)

**AttendX** is a modern, full-stack, college-independent smart attendance management and timetable tracking web platform designed for university and college students.

---

## 🌟 The Core USP: AI-Powered Timetable Scanner

Students are **never required to manually input their entire semester timetable**. With AttendX:
1. Students simply upload a photo, screenshot, or PDF of their timetable (typed, handwritten, or college portal export).
2. The backend utilizes **Gemini Vision AI / OCR** to automatically identify weekly schedules, subjects, course codes, lecture timings, rooms, and faculty.
3. AttendX displays an **Editable Timetable Verification Interface** with confidence highlights, ensuring users review and correct information before activating.
4. **Zero-friction activation**: Once confirmed, AttendX automatically monitors today's classes, countdowns, push notifications, and attendance thresholds.

AttendX works for students from **ANY college or university** worldwide. No institution name or academic hierarchy is hardcoded.

---

## 🚀 Key Features

### 1. User Authentication & 3-Step Onboarding
* **Authentication**: Email/Password registration, bcrypt hashing, JWT authentication, Google Sign-in integration, Forgot & Reset Password workflow.
* **Step 1: Personal Details**: Name, email, profile picture.
* **Step 2: College Details**: Any college name, university, course (B.Tech, BCA, MBBS, etc.), department/branch, academic year, semester, section.
* **Step 3: Attendance Preferences**: Target threshold (default 75%), reminder lead time (5, 10, 15, 30 mins), post-class completion reminder toggle, theme preference (Light/Dark/System).

### 2. AI Timetable Scanner & Schedule Management
* Supports **JPG, JPEG, PNG, and PDF** document uploads up to 10MB.
* Drag-and-drop file upload with live document preview and progress indicator.
* **Timetable Verification UI**: Prevents auto-activation; provides inline editing for subject names, days, timings, rooms, and class types.
* **Manual Timetable Creation**: Add, edit, or delete subjects and weekly slots manually.
* **Schedule Exceptions**: Add one-off compensation lectures or cancel classes on specific dates without corrupting historical records.
* **Import & Export**: Instant JSON timetable import and export.

### 3. Student Dashboard
* Greeting tailored to time of day with academic overview.
* **4 Stat Cards**: Overall Attendance %, Total Conducted, Attended, Missed.
* **Today's Scheduled Classes**: Displays real-time status indicators (Upcoming, Ongoing, Completed, Missed, Pending) with 1-click Present/Absent buttons.
* **Next Class Countdown**: Live countdown timer to the upcoming lecture.
* **Low Attendance Warnings**: Proactive warning cards calculating the exact number of classes required to recover above target.
* **Subject-wise Performance Cards**: Progress bars, percentage badges, and quick-link to the bunk calculator.

### 4. Smart Attendance Marking System
* **Rules Engine**:
  * **Present**: +1 Attended, +1 Conducted.
  * **Absent**: +0 Attended, +1 Conducted.
  * **Pending**: Excluded from percentage calculation until resolved.
  * **Cancelled / Holiday**: Excluded from conducted count.
* **Duplicate Prevention**: Compound database indexing prevents duplicate marks for the same scheduled class on the same date.
* **Audit History**: Modifying an attendance record requires a reason and stores a full change history log with timestamps.
* **Class Completion Prompt**: Interactive prompt triggered when a lecture ends: *"Did you attend today's lecture? (Present / Absent / Later)"*.

### 5. Advanced Attendance Analytics (Recharts)
* **Bar Chart**: Subject-wise comparison vs. the 75% target reference line.
* **Pie Chart**: Visual distribution of Attended vs. Missed vs. Pending sessions.
* **Trend Line Chart**: Historical progression curve over time.
* **Monthly Attendance Calendar**: Color-coded date indicators (Green = Present, Red = Absent, Yellow = Pending, Grey = Cancelled) with clickable date inspection modals.
* **Trend Classifier**: Dynamically tags attendance momentum as *Improving*, *Declining*, or *Stable*.

### 6. Mathematically Accurate Smart Bunk Calculator
Accurately computes safe bunks and recovery requirements with exact formulas:
* **Safe Bunk Formula** ($P/C \ge T$):
  $$\text{Safe Bunks} = \left\lfloor \frac{\text{Present}}{\text{Threshold} / 100} - \text{Conducted} \right\rfloor$$
* **Recovery Formula** ($P/C < T$):
  $$\text{Classes Needed} = \left\lceil \frac{(\text{Threshold} / 100) \times \text{Conducted} - \text{Present}}{1 - (\text{Threshold} / 100)} \right\rceil$$
* **Multi-Target Breakdown**: Real-time milestones for 75%, 80%, 85%, and 90%.

### 7. Automated Push Notifications & Scheduler
* **Server-side Cron Job**: Runs every minute checking scheduled classes.
* **Pre-Class Alert**: Sends browser Web Push notification $X$ minutes before lecture start.
* **Class Start Alert**: Notifies when lecture starts.
* **Post-Class Reminder**: Prompts student to mark attendance after lecture ends.
* **Daily Low Attendance Check**: Evening scan alerting students of subjects below threshold.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router DOM 6, Axios, Recharts, Lucide React, React Hot Toast, Canvas Confetti |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, Multer, Zod, Morgan, Helmet |
| **AI & OCR** | Google Gemini Vision API (`@google/generative-ai`), `pdf-parse`, Intelligent Pattern Extraction Fallback |
| **Notifications** | Web Push API (`web-push`), Service Workers (`sw.js`), Node-Cron Scheduler |

---

## 📂 Project Structure

```
AttendX/
├── client/
│   ├── public/
│   │   ├── manifest.json       # PWA Manifest
│   │   ├── sw.js               # Service Worker for Web Push
│   │   └── logo.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Button, Input, Card, Modal, Badge, ProgressBar
│   │   │   ├── layout/         # Navbar, Sidebar, NotificationDropdown
│   │   │   ├── dashboard/      # OverviewCards, TodayTimetable, Countdown, Warnings
│   │   │   ├── timetable/      # TimetableUploader, AIPreviewVerification, WeeklyGrid
│   │   │   ├── attendance/     # AttendanceCalendar, EditAttendanceModal
│   │   │   └── calculator/     # BunkCalculatorCard
│   │   ├── context/            # AuthContext, ThemeContext, NotificationContext
│   │   ├── pages/              # Landing, Login, Register, Onboarding, Dashboard, etc.
│   │   ├── services/           # Axios API services for all modules
│   │   └── utils/              # Math calculations, date formatters, push helpers
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/
│   ├── config/
│   │   ├── db.js               # MongoDB connection (Atlas / Local + Memory fallback)
│   │   └── constants.js
│   ├── controllers/            # Auth, User, Subject, Timetable, Attendance, Notifications
│   ├── middleware/             # JWT Protect, Multer Upload, Zod Validation, ErrorHandler
│   ├── models/                 # User, Subject, Timetable, Attendance, Notification, Push
│   ├── routes/                 # REST endpoints
│   ├── services/               # AI Scanner, Web Push, Attendance Analytics
│   ├── jobs/                   # Node-cron reminder scheduler
│   ├── utils/
│   │   └── seedData.js         # Comprehensive demo student seeder
│   ├── server.js
│   └── .env.example
```

---

## ⚙️ Installation & Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **MongoDB**: A local MongoDB instance, MongoDB Atlas URI, or the automated built-in in-memory MongoDB fallback.

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/attendx.git
cd AttendX

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Variables Configuration

Copy `.env.example` in the `server` directory:

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development

# MongoDB URI (Atlas or Local). If unreachable, AttendX automatically starts an in-memory database!
MONGODB_URI=mongodb://localhost:27017/attendx

# JWT Secret
JWT_SECRET=attendx_super_secret_jwt_key_2026_production

# Google Cloud / Gemini API Key for Timetable AI Scanner
# Get a free key at https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

*(Note: If VAPID keys for Web Push are omitted, AttendX auto-generates dynamic session VAPID keys on startup).*

---

## 🚦 Running AttendX

### 1. Seed Demo Data (Recommended for Testing)

Populate a realistic student account (`alex.chen@stanford.edu` / `attendx123`) with 5 subjects, timetable slots, and 4 weeks of attendance history:

```bash
cd server
node utils/seedData.js
```

### 2. Start the Backend API Server

```bash
cd server
npm run dev
# Starts on http://localhost:5000
```

### 3. Start the Frontend Vite Client

```bash
cd client
npm run dev
# Starts on http://localhost:5173
```

Open `http://localhost:5173` in your browser. You can click **"Demo Student"** on the login page to immediately explore the fully populated dashboard with analytics and live class cards!

---

## 🔒 Security & Scalability Best Practices

* **Password Security**: Passwords hashed with bcrypt (salt rounds = 10).
* **Token Security**: Stateless JWTs with 30-day expiration, protected via HTTP headers.
* **Data Isolation**: Strict user-level authorization checks verify `userId` ownership across subjects, timetables, and attendance records.
* **Rate Limiting**: `express-rate-limit` guards authentication endpoints against brute force attempts.
* **File Upload Security**: Multer restricts file types to images/PDF and caps upload size at 10MB.
* **Security Headers**: Helmet enabled for XSS, frameguard, and content security policy headers.

---

## 🌐 Production Deployment

### Backend (Railway, Render, AWS, or DigitalOcean)
1. Set environment variables (`NODE_ENV=production`, `PORT`, `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `CLIENT_URL`).
2. Run `npm start`.

### Frontend (Vercel, Netlify, or Cloudflare Pages)
1. Set build command: `npm run build`.
2. Set output directory: `dist`.
3. Set environment variable: `VITE_API_URL=https://your-api-domain.com/api`.

---

## 📄 License
This project is licensed under the MIT License.

