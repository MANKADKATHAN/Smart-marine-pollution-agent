import operator
from typing import TypedDict, Annotated, Sequence
from langgraph.graph import StateGraph, START, END

# Define the state for the LangGraph
class AgentState(TypedDict):
    pollution_value: int
    history: list[int]
    status: str | None
    alert: str | None
    trend: str | None
    action: str | None
    reason: str | None
    action_taken: list[str] | None

# Node function to process the pollution data
def agent_node(state: AgentState) -> AgentState:
    val = state["pollution_value"]
    history = state.get("history", [])
    
    # Calculate trend
    trend = "Stable"
    if len(history) >= 2:
        if val > history[-1] and history[-1] > history[-2]:
            trend = "Increasing"
    
    # Determine status & action
    if val > 70:
        status = "HIGH"
        alert = "Immediate action required: Pollution levels critically high!"
        action = "Evacuate area and deploy cleanup crew."
        reason = f"Pollution levels critically high ({val} > 70)."
        action_taken = ["Alert sent to authority", "Cleanup team notified"]
    elif 40 <= val <= 70:
        status = "MEDIUM"
        alert = "Warning: Moderate pollution detected."
        action = "Monitor situation closely."
        reason = f"Pollution is moderate ({val}). Adjusting monitoring."
        action_taken = ["Increased monitoring frequency"]
    else:
        status = "SAFE"
        alert = None
        action = "No action needed."
        reason = "Pollution levels are low and stable over recent readings."
        action_taken = ["None"]
        
    return {
        "pollution_value": val,
        "history": history,
        "status": status,
        "alert": alert,
        "trend": trend,
        "action": action,
        "reason": reason,
        "action_taken": action_taken
    }

# Build the LangGraph graph
builder = StateGraph(AgentState)

# Add the agent node
builder.add_node("agent", agent_node)

# Set up edges
builder.add_edge(START, "agent")
builder.add_edge("agent", END)

# Compile graph
pollution_agent = builder.compile()
