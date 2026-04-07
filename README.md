# 🌊 Smart Marine Pollution Alert System

An AI-powered full-stack application built to autonomously monitor marine water quality, detect pollution level trends, and automatically trigger emergency response alerts. 

By unifying a dynamic React dashboard with a LangGraph Python intelligence layer, this system doesn't just read data—it makes autonomous decisions and acts on them.

## ✨ Key Features
- **🧠 LangGraph AI Node**: Processes unstructured data to determine if an action is required and generates human-readable reasoning for transparency.
- **📊 Live Dynamics Dashboard**: A glassmorphic React (Vite) interface that fetches environmental metrics every 5 seconds. Includes colored Risk Badges and live Trend Bar Charts.
- **📍 Multi-Location Simulation**: Instantly swap between "Coastal Zone", "River A", and "River B" to view isolated environments with changing threat profiles.
- **🚨 Native Automation Webhooks**: Automatically dispatches asynchronous HTTP POST requests to external workflow tools (like n8n) the millisecond critical pollution is detected to notify authorities via Email, Telegram, or Slack.
- **📄 Instant Reporting**: Generates localized mathematical summary reports (Avg, Max, Alert frequency) within the UI instantly.

## 🛠 Tech Stack
- **Frontend**: React.js, Vite, Vanilla CSS (Glassmorphism design)
- **Backend**: Python, FastAPI, LangGraph, Pydantic
- **Integrations**: Fully n8n Webhook ready

## 🚀 Quickstart

**1. Start the Backend (FastAPI)**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**2. Start the Frontend (React / Vite)**
```bash
cd frontend
npm install
npm run dev
```

*Ensure your backend is running on port 8000 (default) before interacting with the frontend dashboard.*
