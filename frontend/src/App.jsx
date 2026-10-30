import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  validateStatus: () => true,
})

function formatTime(date) {
  if (!date) return '—'
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function getDatabaseLabel(health) {
  if (!health) return 'Consultando'
  if (health.database?.status === 'up') return 'Conectada'
  if (health.database?.status === 'down') return 'Sin conexión'
  return 'Desconocida'
}

async function requestHealth() {
  try {
    const response = await api.get('/api/health')
    return { ...response.data, reachable: true }
  } catch (error) {
    return {
      status: 'error',
      message: 'No se pudo conectar con el backend.',
      detail: error.message,
      database: { status: 'unknown' },
      reachable: false,
    }
  }
}

function App() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkedAt, setCheckedAt] = useState(null)

  useEffect(() => {
    let cancelled = false

    requestHealth().then((result) => {
      if (cancelled) return
      setHealth(result)
      setCheckedAt(new Date())
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const checkHealth = async () => {
    setLoading(true)
    const result = await requestHealth()
    setHealth(result)
    setCheckedAt(new Date())
    setLoading(false)
  }

  const apiReachable = health?.reachable === true
  const databaseOnline = health?.database?.status === 'up'
  const healthy = apiReachable && health?.status === 'ok' && databaseOnline
  const statusClass = loading ? 'is-loading' : healthy ? 'is-ok' : 'is-error'
  const badgeClass = loading ? 'badge-loading' : healthy ? 'badge-ok' : 'badge-error'

  return (
    <main className="app">
      <header className="hero">
        <p className="eyebrow">Radar de reputación en crisis</p>
        <h1>RepuSense</h1>
        <p className="lead">
          Scaffold listo para desarrollo. El dashboard de prospección, la extracción
          de datos y el análisis con IA se implementan sobre esta base.
        </p>
      </header>

      <section className={`status-card ${statusClass}`} aria-live="polite">
        <div className="status-header">
          <div>
            <p className="status-label">Estado del sistema</p>
            <h2>
              {loading ? 'Verificando…' : healthy ? 'Todo operativo' : 'Revisar configuración'}
            </h2>
          </div>
          <span className={`badge ${badgeClass}`}>
            {loading ? 'Consultando' : healthy ? 'OK' : 'Con errores'}
          </span>
        </div>

        <dl className="status-grid">
          <div>
            <dt>API backend</dt>
            <dd>{loading ? 'Consultando' : apiReachable ? 'Conectada' : 'Sin conexión'}</dd>
          </div>
          <div>
            <dt>Base de datos</dt>
            <dd>{getDatabaseLabel(health)}</dd>
          </div>
          <div>
            <dt>Latencia DB</dt>
            <dd>
              {health?.database?.latencyMs != null
                ? `${health.database.latencyMs} ms`
                : '—'}
            </dd>
          </div>
          <div>
            <dt>Última verificación</dt>
            <dd>{formatTime(checkedAt)}</dd>
          </div>
        </dl>

        {health?.message && <p className="status-message">{health.message}</p>}
        {health?.detail && <p className="status-message status-detail">{health.detail}</p>}

        <div className="actions">
          <button type="button" onClick={checkHealth} disabled={loading}>
            {loading ? 'Verificando…' : 'Volver a probar'}
          </button>
          <a href={`${API_URL}/api/health`} target="_blank" rel="noreferrer">
            Ver respuesta JSON
          </a>
        </div>
      </section>

      <section className="next-steps">
        <h2>Base lista para implementar</h2>
        <ul>
          <li>
            <strong>Backend:</strong> Express 5 con <code>/api/health</code> y conexión
            real a PostgreSQL.
          </li>
          <li>
            <strong>Frontend:</strong> React + Vite consumiendo el estado del backend.
          </li>
          <li>
            <strong>Base de datos:</strong> PostgreSQL limpia, con migraciones SQL
            versionadas y sin tablas de negocio.
          </li>
        </ul>
        <p className="hint">
          API: <code>{API_URL}</code> · Guía: <code>docs/como-correr.md</code>
        </p>
      </section>

      <footer>
        <span>RepuSense</span>
        <span>Scaffold Docker Compose</span>
      </footer>
    </main>
  )
}

export default App
