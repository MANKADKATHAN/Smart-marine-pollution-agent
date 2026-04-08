import { useState, useEffect, useRef } from 'react'

function App() {
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [location, setLocation] = useState('Coastal Zone')
  const [showReport, setShowReport] = useState(false)
  const [alertEmail, setAlertEmail] = useState('')
  const [alertLog, setAlertLog] = useState([])
  const emailRef = useRef('')

  // Using useEffect to reliably handle interval + dependency
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const urlParams = new URLSearchParams()
        urlParams.append('location', location)
        if (emailRef.current) urlParams.append('email', emailRef.current)

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_URL}/analyze?${urlParams.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch data')
        const result = await response.json()
        
        if (isMounted) {
          setData(result)
          setHistory(prev => {
            const newHistory = [...prev, result.pollution_value]
            if (newHistory.length > 10) return newHistory.slice(newHistory.length - 10)
            return newHistory
          })
          
          if (result.status === 'HIGH' || result.status === 'MEDIUM') {
            setAlertLog(prev => {
              const newLog = [{
                status: result.status, 
                value: result.pollution_value, 
                time: new Date(result.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                action: result.status === 'HIGH' ? (emailRef.current ? 'Email Sent' : 'Authority Alerted') : 'Monitoring'
              }, ...prev];
              if (newLog.length > 20) return newLog.slice(0, 20);
              return newLog;
            });
          }
          
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message)
          console.error(err)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => {
      isMounted = false;
      clearInterval(interval);
    }
  }, [location])

  const getStatusClass = (status) => {
    if (status === 'SAFE') return 'status-safe'
    if (status === 'MEDIUM') return 'status-medium'
    return 'status-high'
  }

  const getRiskIndicator = (val) => {
    const baseStyle = { padding: '4px 10px', borderRadius: '4px', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap', flexShrink: 0 };
    if (val > 70) return <span style={{...baseStyle, background: 'var(--accent-high)'}}>🔴 Critical Risk</span>;
    if (val >= 40) return <span style={{...baseStyle, background: 'var(--accent-medium)'}}>🟡 Moderate Risk</span>;
    return <span style={{...baseStyle, background: 'var(--accent-safe)'}}>🟢 Low Risk</span>;
  }

  const handleLocationChange = (e) => {
    setLocation(e.target.value);
    setHistory([]);
    setAlertLog([]);
    setLoading(true);
    setData(null);
    setShowReport(false);
  }

  const handleGenerateReport = () => {
    setShowReport(true);
  }

  return (
    <>
      <div className="header">
        <h1>Marine Pollution System</h1>
        <p>AI-Powered Autonomous Monitoring</p>
        <div style={{marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap'}}>
          <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
            <label style={{color: 'var(--text-muted)'}}>Deploy Location: </label>
            <select 
              value={location} 
              onChange={handleLocationChange} 
              style={{padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', outline: 'none', cursor: 'pointer', fontSize: '1rem'}}
            >
              <option value="Coastal Zone" style={{color: 'black'}}>Coastal Zone</option>
              <option value="River A" style={{color: 'black'}}>River A</option>
              <option value="River B" style={{color: 'black'}}>River B</option>
            </select>
          </div>
          <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
            <label style={{color: 'var(--text-muted)'}}>📧 Alert Email: </label>
            <input 
              type="email"
              value={alertEmail}
              onChange={(e) => { setAlertEmail(e.target.value); emailRef.current = e.target.value; }}
              placeholder="Enter destination email..."
              style={{padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', outline: 'none', fontSize: '1rem', width: '220px'}}
            />
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div style={{textAlign: 'center', margin: '4rem'}}>Connecting to LangGraph Agent...</div>
      ) : error && !data ? (
        <div className="glass-card" style={{borderColor: 'var(--accent-high)', textAlign: 'center'}}>
          <h3 style={{color: 'var(--accent-high)'}}>Connection Error</h3>
          <p>Please ensure the FastAPI backend is running on port 8000.</p>
        </div>
      ) : data ? (
        <>
          <div className="dashboard-grid">
            {/* Main Pollution Card */}
            <div className="glass-card">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1rem'}}>
                <div className="metric-label" style={{lineHeight: '1.2'}}>Current Pollution Index</div>
                {getRiskIndicator(data.pollution_value)}
              </div>
              <div className="metric-value" style={{ 
                color: data.status === 'HIGH' ? 'var(--accent-high)' : 
                       data.status === 'MEDIUM' ? 'var(--accent-medium)' : 'var(--accent-safe)'
              }}>
                {data.pollution_value}
              </div>
              <div>
                <span className={`status-badge ${getStatusClass(data.status)}`}>
                  {data.status}
                </span>
                <span style={{marginLeft: '1rem', color: 'var(--text-muted)'}}>
                  {data.trend === 'Increasing' ? '📈 Increasing' : 
                   data.trend === 'Decreasing' ? '📉 Decreasing' : '➡️ Stable'}
                </span>
              </div>
            </div>

            {/* AI Agent Recommendation Card */}
            <div className="glass-card">
               <div className="metric-label">AI Agent Decision</div>
               <div style={{marginTop: '1rem', fontSize: '1.2rem', fontWeight: '500'}}>
                 System Action: {data.action}
               </div>

               <div style={{marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px'}}>
                 <div style={{fontSize: '0.95rem', color: 'var(--text-light)', marginBottom: '0.5rem'}}>
                   💡 <strong>Reason:</strong> {data.reason}
                 </div>
                 {data.action_taken && data.action_taken[0] !== "None" && (
                   <div style={{marginTop: '0.5rem', fontSize: '0.9rem'}}>
                     <strong style={{color: 'var(--accent-high)'}}>⚡ Automated Actions Taken:</strong>
                     <ul style={{margin: '0.25rem 0 0 0', paddingLeft: '1.5rem', color: 'var(--text-light)'}}>
                       {data.action_taken.map((act, i) => <li key={i}>{act}</li>)}
                     </ul>
                   </div>
                 )}
               </div>
               
               {data.alert && (
                 <div className="alert-message">
                   <strong>⚠️ ALERT:</strong> {data.alert}
                 </div>
               )}
            </div>

            {/* Trend Chart Card */}
            <div className="glass-card" style={{gridColumn: '1 / -1'}}>
              <div className="metric-label">Live Pollution Trend (Last 10 Readings)</div>
              <div className="chart-container">
                {history.map((val, idx) => (
                   <div 
                     key={idx} 
                     className="chart-bar" 
                     style={{
                       height: `${Math.max(10, val)}%`,
                       background: val > 70 ? 'var(--accent-high)' : 
                                   val >= 40 ? 'var(--accent-medium)' : 'var(--accent-safe)'
                     }}
                     data-value={val}
                   ></div>
                ))}
              </div>
            </div>

            {/* Recent Action Log */}
            <div className="glass-card" style={{gridColumn: '1 / -1'}}>
              <div className="metric-label" style={{marginBottom: '1rem'}}>Recent Alerts & Actions</div>
              {alertLog.length === 0 ? (
                <div style={{color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0', textAlign: 'center'}}>
                  No alerts detected yet...
                </div>
              ) : (
                <div style={{maxHeight: '220px', overflowY: 'auto', paddingRight: '0.5rem'}}>
                  {alertLog.map((logItem, i) => (
                    <div key={i} style={{
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '0.75rem 1rem', 
                      marginBottom: '0.5rem',
                      background: logItem.status === 'HIGH' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      borderLeft: `4px solid ${logItem.status === 'HIGH' ? 'var(--accent-high)' : 'var(--accent-medium)'}`,
                      borderRadius: '4px'
                    }}>
                      <span style={{flex: 1, fontWeight: 'bold', color: logItem.status === 'HIGH' ? 'var(--accent-high)' : 'var(--accent-medium)'}}>
                        {logItem.status === 'HIGH' ? '🚨 HIGH' : '⚠️ MEDIUM'}
                      </span>
                      <span style={{flex: 0.5, textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem'}}>{logItem.value}</span>
                      <span style={{flex: 1, textAlign: 'center', color: 'var(--text-muted)'}}>{logItem.time}</span>
                      <span style={{flex: 1, textAlign: 'right', fontWeight: '500'}}>{logItem.action}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <button className="btn-report" onClick={handleGenerateReport} style={{marginBottom: showReport ? '2rem' : '0'}}>
            Generate Analysis Report
          </button>

          {showReport && (
            <div className="glass-card" style={{marginTop: '2rem', background: 'rgba(30, 41, 59, 0.95)', border: '1px solid var(--accent-blue)'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                 <h3 style={{margin: 0, color: 'var(--accent-blue)'}}>📄 Comprehensive Location Report: {location}</h3>
                 <button onClick={() => setShowReport(false)} style={{background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem'}}>&times;</button>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem'}}>
                <div style={{padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center'}}>
                  <div className="metric-label">Avg Pollution</div>
                  <div style={{fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem'}}>{(history.reduce((a,b)=>a+b,0)/Math.max(1, history.length)).toFixed(1)}</div>
                </div>
                <div style={{padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center'}}>
                  <div className="metric-label">Max Pollution</div>
                  <div style={{fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem', color: 'var(--accent-high)'}}>{Math.max(0, ...history)}</div>
                </div>
                <div style={{padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center'}}>
                  <div className="metric-label">Critical Alerts</div>
                  <div style={{fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem', color: 'var(--accent-medium)'}}>{history.filter(v => v > 70).length}</div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </>
  )
}

export default App
