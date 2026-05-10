# Swazi Cultural Heritage Platform

Full-stack digital platform for preserving Swazi cultural heritage.

## Stack
| Layer    | Tech                                  |
|----------|---------------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS        |
| Backend  | Node.js + Express (ES modules)        |
| Database | MySQL 8                               |
| AI       | Google Gemini 1.5 Flash (free tier)   |
| Auth     | JWT (access + refresh tokens)         |

## Quick Start

```bash
# 1. Server setup
cd server
cp .env.example .env          # fill in DB creds + GEMINI_API_KEY
npm install
npm run migrate               # creates DB, tables, seeds admin + presets

# 2. Client setup
cd ../client
cp .env.example .env
npm install

# 3. Run both (two terminals)
# Terminal 1:
cd server && npm run dev      # http://localhost:5000

# Terminal 2:
cd client && npm run dev      # http://localhost:5173
```

## Default admin account
Email: admin@swaziheritage.sz
Password: Admin@1234
**Change this immediately after first login.**

## Roles
| Role             | Access                                           |
|------------------|--------------------------------------------------|
| admin            | Full control, content review, analytics          |
| user             | Browse, AI chat, cinema bookings                 |
| history_keeper   | Lineage records and clan management              |
| ceremony_keeper  | Ceremonies, songs, imvunulo                      |
