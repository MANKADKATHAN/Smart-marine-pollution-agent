from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import random
import datetime
import os
import aiosmtplib
from email.message import EmailMessage
from fastapi.middleware.cors import CORSMiddleware
from agent import pollution_agent

app = FastAPI(title="Smart Marine Pollution Alert System (AI Powered)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisResult(BaseModel):
    pollution_value: int
    status: str
    alert: str | None
    trend: str
    action: str
    timestamp: str
    reason: str
    action_taken: list[str]

# Load environment variables
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

# Simple in-memory history tracking
history_tracking = []

async def send_email_alert(payload: dict, target_email: str):
    """Sends an actual emergency email using aiosmtplib"""
    if not target_email:
        print("⚠️ NOTICE: High pollution detected, but no Alert Email was provided in the UI.")
        return
        
    if not EMAIL_USER or not EMAIL_PASS:
        print("⚠️ ERROR: EMAIL_USER or EMAIL_PASS not found in .env file.")
        return
        
    print(f"⏳ Attempting to send REAL email alert to {target_email} via Google SMTP...")

    message = EmailMessage()
    message["From"] = EMAIL_USER
    message["To"] = target_email
    message["Subject"] = f"🚨 CRITICAL POLLUTION ALERT: {payload['location']}"
    
    body = f"""Hello,

The AI Agent has detected critical pollution levels at {payload['location']}.
Severity Index: {payload['pollution_value']}/100

AI Reason: {payload['alert']}
Recommended Action: {payload['action']}

Timestamp: {payload['timestamp']}

- Smart Marine Pollution Alert System
"""
    message.set_content(body)

    try:
        await aiosmtplib.send(
            message,
            hostname="smtp.gmail.com",
            port=587,
            start_tls=True,
            username=EMAIL_USER,
            password=EMAIL_PASS,
        )
        print(f"✅ REAL EMAIL SUCCESSFULLY SENT TO {target_email}!")
    except Exception as e:
        print(f"❌ FAILED TO SEND EMAIL: {e}")

@app.get("/analyze", response_model=AnalysisResult)
async def analyze_pollution(background_tasks: BackgroundTasks, location: str = "Coastal Zone", email: str = None):
    global history_tracking
    
    # Generate mock reading based on location
    if location == "River A":
        val = random.randint(10, 45) # Usually safe
    elif location == "River B":
        val = random.randint(30, 80) # Moderate to High
    else:
        val = random.randint(10, 100) # Full range for Coastal Zone
    
    # Update agent state
    state_input = {
        "pollution_value": val,
        "history": history_tracking[-5:], # Keep last 5 for context
        "status": None,
        "alert": None,
        "trend": None,
        "action": None,
        "reason": None,
        "action_taken": None
    }
    
    # Invoke LangGraph agent
    result = pollution_agent.invoke(state_input)
    
    # 🚨 AUTOMATION PIPELINE: Trigger native Email if HIGH
    if result["status"] == "HIGH":
        alert_payload = {
            "location": location,
            "pollution_value": result["pollution_value"],
            "alert": result["alert"],
            "action": result["action"],
            "timestamp": datetime.datetime.now().isoformat()
        }
        # Run this in the background so it doesn't slow down the React UI!
        background_tasks.add_task(send_email_alert, alert_payload, email)
    
    # Update global history
    history_tracking.append(val)
    if len(history_tracking) > 20: 
        history_tracking = history_tracking[-20:] # avoid unbounded growth
        
    return {
        "pollution_value": result["pollution_value"],
        "status": result["status"],
        "alert": result["alert"],
        "trend": result["trend"],
        "action": result["action"],
        "reason": result["reason"],
        "action_taken": result["action_taken"],
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/predict")
async def get_prediction():
    global history_tracking
    
    if len(history_tracking) < 2:
        trend = "Stable"
    elif history_tracking[-1] > history_tracking[-2]:
        trend = "Increasing"
    else:
        trend = "Decreasing"
        
    predictions = [random.randint(10, 100) for _ in range(5)]
    return {
        "recent_history": history_tracking[-5:],
        "trend_analysis": trend,
        "future_predictions": predictions
    }
