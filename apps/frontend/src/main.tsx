import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'

export function App() {
  const [healthStatus, setHealthStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setHealthStatus(JSON.stringify(data, null, 2))
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Angora</h1>
      <p>Welcome to the Angora frontend.</p>

      <h2>Backend Health Check</h2>
      {loading && <p>Loading health status...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {healthStatus && (
        <pre
          style={{
            background: '#f5f5f5',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
          }}
        >
          {healthStatus}
        </pre>
      )}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
