# 💓 PulseBoard Lite

An AI-powered personal health analytics Single Page Application (SPA) where users upload wearable/exported health data via CSV and get visual insights and AI-driven analysis on sleep, activity, HRV, resting heart rate, recovery, and training trends.

> Built with React + TypeScript + Node.js + Keycloak + Supabase PostgreSQL + Prisma + Groq (Qwen3 32B)

---

## 📋 Table of Contents

- [Overview](#overview)
- [AI Features](#ai-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Keycloak Setup](#2-keycloak-setup)
  - [3. Supabase Setup](#3-supabase-setup)
   -[4. Groq Setup](#4-groq-setup)
  - [5. Backend Setup](#4-backend-setup)
  - [6. Frontend Setup](#5-frontend-setup)
- [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)
- [CSV Format](#csv-format)
- [API Endpoints](#api-endpoints)


---

## Overview

PulseBoard Lite is a **device-agnostic AI health dashboard** — no Apple Health, Garmin, or Oura integration required. Users export their data as a CSV, upload it to the app, and get a clean visual breakdown of their health trends - enhanced by an AI layer powered by Qroq and Qwen3 32B.

The dashboard answers three core questions:
- 😴 **How am I sleeping?**
- 🏃 **How active am I?**
- 💚 **Am I recovering well?**

---
---

## AI Features

PulseBoard Lite includes four AI-powered features built on **Groq + Qwen3 32B**:

### 🤖 AI Health Coach
Analyses the user's last 14 days of health data and generates personalised written insights — specific to their actual numbers, not generic health advice. Triggered on demand via a "Generate Insights" button.

### 💬 RAG Health Chatbot
A floating chat interface where users ask natural language questions about their own data. Uses **Retrieval Augmented Generation (RAG)** — all health records are retrieved as context before every response, grounding the AI in real data.

Example questions:
- _"What was my best recovery week?"_
- _"Am I overtraining?"_
- _"How has my sleep trended this month?"_

Supports multi-turn conversation — follow-up questions work because the full conversation history is passed on each request.

### ⚠️ Anomaly Detection
Automatically scans health records using **Z-score analysis** — flagging values more than 2 standard deviations from the user's 30-day baseline. Anomalies are sent to Groq for plain-English explanation. Expands/collapses on click.

### 📝 Weekly AI Summary
A coach-style weekly health debrief generated every Monday. Covers the week's overall assessment, standout moments, biggest opportunity for improvement, and a recommendation for the coming week. **Cached in the database** — generated once per week and served instantly on repeat visits.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React + TypeScript + Vite |
| UI |   |
| Charts | Recharts |
| Auth | Keycloak (OIDC Authorization Code Flow + PKCE) |
| Backend | Node.js + Express |
| Database | PostgreSQL via Supabase (free tier) |
| ORM | Prisma |
| CSV Parsing | PapaParse |
| Validation | Zod |
| AI / LLM | Groq API + Qwen3 32B |
| Frontend Hosting |  |
| Backend Hosting |  |
| Local Auth Server | Keycloak via Docker |


---

## Project Structure


---

## Prerequisites

Make sure you have the following installed before starting:

- [Node.js](https://nodejs.org/) v18 or higher
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for Keycloak)
- A [Supabase](https://supabase.com/) account (free tier)
- A [Groq](https://console.groq.com) account (free tier) for AI features
- Git

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/IsabelBinu/Pulseboard-Lite.git
cd pulseboard-lite
```

---

### 2. Keycloak Setup

Keycloak is the identity provider. It runs locally via Docker.

**Start Keycloak:**
```bash
docker-compose up -d
```


**Configure Keycloak (one-time setup):**

1. Log in to the Admin Console
   - Set Username
   - Set Password

2. Create a Realm
   - Click the dropdown (top-left) → **Create Realm**
   - Set Name
   - Click **Create**

3. Create a Client
   - Go to **Clients** → **Create client**
   - Create Client_ID
   - Create Client type
   - Click **Next**
   - Enable **Standard flow**
   - Click **Next**
   - Valid redirect URIs:
   - Web origins: 
   - Click **Save**

4. Create a Test User
   - Go to **Users** → **Add user**
   - Set Username
   - Click **Create**
   - Go to **Credentials** tab → Set password → Turn OFF **Temporary**

---

### 3. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project**
   - set name
   - Set a strong database password and save it
   - Region:  closest to you
3. Wait for provisioning
4. Go to **Connect**  → **Transaction pooler** tab
5. Copy the URI — Set it as the DATABASE_URL
   
---

### 4. Groq Setup

Groq powers all four AI features using Qwen3 32B — it's free to use.

1. Go to [console.groq.com](https://console.groq.com) and create a free account
2. Click **API Keys** in the left sidebar
3. Click **Create API Key**
4. Copy the key 




---

### 5. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `backend/.env` with your values:
```env
DATABASE_URL=""
KEYCLOAK_REALM_URL=""
KEYCLOAK_CLIENT_ID=""
PORT=3001
GROQ_API_KEY=""
```

Run database migrations:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

This creates three tables in your Supabase database:
- `User` — stores Keycloak user identity
- `Upload` — tracks each CSV import batch
- `HealthRecord` — stores individual health data rows
- `WeeklySummary` — caches AI-generated weekly summaries

---

### 6. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

No `.env` file needed for the frontend — Keycloak config is set directly in `src/keycloak.ts`. If you change your realm name or client ID, update that file.

---

## Running the Application

You need **three terminals** running simultaneously:

**Terminal 1 — Keycloak**
```bash
# From project root
docker-compose up
```
Keycloak ready when you see: `Keycloak 24.0.1 on /`

**Terminal 2 — Backend**
```bash
cd backend
npx ts-node src/index.ts
```


**Terminal 3 — Frontend**
```bash
cd frontend
npm run dev
```


T
---

## Environment Variables

### `backend/.env`

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string (pooler URL) | `postgresql://postgres......` |
| `KEYCLOAK_REALM_URL` | Keycloak realm base URL | `http://localhost:8080/realms/pulseboard` |
| `KEYCLOAK_CLIENT_ID` | Keycloak client ID | `pulseboard-frontend` |
| `GROQ_API_KEY` | Groq API key for AI features | `` |
| `PORT` | Express server port | `3001` |


---

## CSV Format

Download the template from the app or use the format below:

```csv
date,sleep_hours,hrv_ms,resting_hr,steps,active_minutes,workout_type,distance_km,calories
2024-01-01,7.5,58,54,9200,45,Running,5.2,420
2024-01-02,6.8,52,56,7800,30,Walking,3.1,320
```

### Required Columns

| Column | Type | Required | Description |
|---|---|---|---|
| `date` | YYYY-MM-DD | ✅ | Date of the record |
| `sleep_hours` | number (0–24) | ✅ | Hours of sleep |
| `hrv_ms` | number | ✅ | Heart rate variability in ms |
| `resting_hr` | number | ✅ | Resting heart rate in bpm |
| `steps` | integer | ✅ | Daily step count |
| `active_minutes` | integer | ✅ | Active minutes |
| `workout_type` | string | ❌ | e.g. Running, Cycling |
| `distance_km` | number | ❌ | Distance in km |
| `calories` | integer | ❌ | Calories burned |

---

## API Endpoints

All `/api/*` endpoints require a valid Keycloak Bearer token.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | ❌ | Health check |
| `GET` | `/api/me` | ✅ | Returns authenticated user info |
| `GET` | `/api/template` | ✅ | Download CSV template |
| `POST` | `/api/uploads` | ✅ | Upload + parse + validate CSV |
| `POST` | `/api/uploads/import` | ✅ | Import valid rows to database |
| `GET` | `/api/dashboard?days=7\|30\|90` | ✅ | Fetch dashboard data |


### AI Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/ai/insights` | ✅ | Generate AI health insights from last 14 days |
| `GET` | `/api/ai/anomalies` | ✅ | Detect anomalies using Z-score + AI explanation |
| `GET` | `/api/ai/weekly-summary` | ✅ | Get or generate weekly AI summary (cached) |
| `POST` | `/api/ai/chat` | ✅ | RAG chatbot — answer questions using user's data |


---

## License

MIT — free to use and modify.

---

## Author

**Isabel Binu**

