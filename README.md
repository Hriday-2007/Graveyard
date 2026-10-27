# Startup Graveyard 🪦

A MERN stack web application that archives and analyzes failed startups. Given a startup name, the backend gathers intelligence from public sources (Tavily search, Wikipedia, Hacker News), processes an autopsy, and displays post-mortems in an interactive graveyard UI.

---

## Architecture Overview

```
Startup Graveyard/
├── server/          # Node.js + Express backend (ES modules)
│   ├── src/
│   │   ├── config/      # Database connection (MongoDB Atlas)
│   │   ├── middleware/  # Error handlers & middleware
│   │   ├── models/      # Mongoose schemas (User, Autopsy, Tribute)
│   │   ├── routes/      # Express API routes
│   │   ├── scripts/     # Test & utility scripts
│   │   ├── services/    # Collector services (Tavily, Wikipedia, Hacker News)
│   │   └── index.js     # Server entry point
│   └── package.json
├── client/          # Vite + React frontend with Tailwind CSS
│   ├── src/
│   └── package.json
├── .gitignore
└── README.md
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB Atlas](https://www.mongodb.com/atlas) connection URI
- [Tavily Search API key](https://tavily.com/)

---

## Setup & Running

### 1. Server Setup

Navigate to `/server`:
```bash
cd server
npm install
```

Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Fill in your configuration:
- `PORT=5000`
- `MONGODB_URI=your_mongodb_atlas_connection_string`
- `TAVILY_API_KEY=your_tavily_api_key`
- `LLM_API_KEY=your_llm_api_key`
- `CLIENT_URL=http://localhost:5173`

Start the server in development mode:
```bash
npm run dev
```
Healthcheck endpoint: `http://localhost:5000/api/health`

To run the source collector test script directly:
```bash
npm run test:collect "Quibi"
```

### 2. Client Setup

Navigate to `/client`:
```bash
cd client
npm install
npm run dev
```
The client will be running on `http://localhost:5173`.
