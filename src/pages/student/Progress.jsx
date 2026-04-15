import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { C } from '../../lib/cn'
import PremiumGate from '../../components/PremiumGate'

export default function StudentProgress() {
  const { data, isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: () => api.get('/me/logs').then(r => r.data),
  })

  const logs = data?.data ?? []

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-6 bg-zinc-800 rounded animate-pulse w-1/3" />
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => <div key={i} className={`${C.cardP} animate-pulse h-16`} />)}
      </div>
      {[1,2,3].map(i => <div key={i} className={`${C.cardP} animate-pulse h-20`} />)}
    </div>
  )

  const stats    = computeStats(logs)
  const byExercise = computeByExercise(logs)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Mi progreso</h1>

      {/* Stats generales — siempre visibles */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Sesiones" value={stats.sessions} />
        <StatCard label="Series" value={stats.totalSets} />
        <StatCard label="Ejercicios distintos" value={byExercise.length} small />
      </div>

      {/* Racha */}
      {stats.streak > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-sm font-semibold text-white">{stats.streak} semana{stats.streak !== 1 ? 's' : ''} seguidas entrenando</p>
            <p className="text-xs text-zinc-500">¡Seguí así!</p>
          </div>
        </div>
      )}

      {/* Progreso por ejercicio — Premium */}
      <PremiumGate feature="el seguimiento detallado por ejercicio">
        <ExerciseProgress byExercise={byExercise} />
      </PremiumGate>
    </div>
  )
}

// ─── ExerciseProgress (contenido premium) ────────────────────────────────────

function ExerciseProgress({ byExercise }) {
  const [selected, setSelected] = useState(null)

  if (!byExercise.length) return (
    <div className={`${C.cardP} text-center py-10`}>
      <p className="text-zinc-500 text-sm">Todavía no hay datos suficientes.</p>
      <p className="text-zinc-600 text-xs mt-1">Registrá entrenamientos para ver tu progreso.</p>
    </div>
  )

  const current = selected ? byExercise.find(e => e.name === selected) : null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Progreso por ejercicio</h2>
        {selected && (
          <button onClick={() => setSelected(null)}
            className="text-xs text-zinc-500 hover:text-orange-400 transition-colors">
            ← Todos
          </button>
        )}
      </div>

      {current ? (
        <ExerciseDetail exercise={current} />
      ) : (
        <div className="space-y-2">
          {byExercise.map(ex => (
            <button key={ex.name} onClick={() => setSelected(ex.name)}
              className={`w-full text-left ${C.cardP} flex items-center justify-between hover:border-zinc-600 transition-colors active:scale-[0.99]`}>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{ex.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {ex.sessions} sesión{ex.sessions !== 1 ? 'es' : ''}
                  {ex.pr > 0 && <> · PR: <span className="text-orange-400 font-medium">{ex.pr} kg</span></>}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                {ex.trend !== 0 && (
                  <span className={`text-xs font-semibold ${ex.trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {ex.trend > 0 ? '▲' : '▼'} {Math.abs(ex.trend)} kg
                  </span>
                )}
                {ex.chartData.length >= 2 && (
                  <MiniSparkline data={ex.chartData} />
                )}
                <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ExerciseDetail ───────────────────────────────────────────────────────────

function ExerciseDetail({ exercise }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`${C.cardP} space-y-1`}>
        <p className="font-bold text-white text-base">{exercise.name}</p>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-zinc-500">Récord personal</p>
            <p className="text-xl font-black text-orange-400">{exercise.pr > 0 ? `${exercise.pr} kg` : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Sesiones</p>
            <p className="text-xl font-black text-white">{exercise.sessions}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Tendencia</p>
            <p className={`text-xl font-black ${exercise.trend > 0 ? 'text-emerald-400' : exercise.trend < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
              {exercise.trend > 0 ? `+${exercise.trend}` : exercise.trend === 0 ? '—' : exercise.trend} kg
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      {exercise.chartData.length >= 2 && (
        <div className={`${C.cardP}`}>
          <p className="text-xs font-medium text-zinc-500 mb-3">Peso máximo por sesión (kg)</p>
          <LineChart data={exercise.chartData} />
          {/* Etiquetas eje X */}
          <div className="flex justify-between mt-1">
            <span className="text-xs text-zinc-700">{exercise.chartData[0].label}</span>
            <span className="text-xs text-zinc-700">{exercise.chartData[exercise.chartData.length - 1].label}</span>
          </div>
        </div>
      )}

      {/* Historial de sesiones */}
      <div className={`${C.card} overflow-hidden`}>
        <div className="px-4 py-2.5 border-b border-zinc-800">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Historial</p>
        </div>
        <div className="divide-y divide-zinc-800">
          {exercise.history.slice(0, 10).map((s, i) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">{s.maxWeight > 0 ? `${s.maxWeight} kg` : 'Peso corporal'}</p>
                <p className="text-xs text-zinc-500">{s.sets} series × {s.reps} reps</p>
              </div>
              <p className="text-xs text-zinc-600">{formatDateShort(s.date)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Gráfico SVG ─────────────────────────────────────────────────────────────

function LineChart({ data }) {
  const W = 300, H = 80, PAD = 12

  const values = data.map(d => d.value)
  const minV   = Math.min(...values)
  const maxV   = Math.max(...values)
  const rangeV = maxV - minV || 1

  const pts = data.map((d, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((d.value - minV) / rangeV) * (H - PAD * 2),
  }))

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  // Área bajo la curva
  const areaD = pathD + ` L${pts[pts.length - 1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#chartGrad)" />
      <path d={pathD} fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#f97316" />
      ))}
      {/* Línea de mínimo */}
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#3f3f46" strokeWidth="1" />
    </svg>
  )
}

function MiniSparkline({ data }) {
  const W = 48, H = 20
  const values = data.map(d => d.value)
  const minV   = Math.min(...values)
  const maxV   = Math.max(...values)
  const rangeV = maxV - minV || 1
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((d.value - minV) / rangeV) * H,
  }))
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const improving = values[values.length - 1] >= values[0]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <path d={pathD} fill="none"
        stroke={improving ? '#34d399' : '#f87171'}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, small = false }) {
  return (
    <div className={`${C.cardP} text-center`}>
      <p className={`font-black text-white ${small ? 'text-lg' : 'text-2xl'}`}>{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5 leading-tight">{label}</p>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeStats(logs) {
  const sessions = new Set(logs.map(l => l.session_id ?? `${l.routine_id}-${l.logged_at?.slice(0, 10)}`)).size
  const totalLogs = logs.length
  const totalSets = logs.reduce((s, l) => s + (l.sets ?? 0), 0)

  // Racha semanal (semanas con al menos 1 sesión)
  const weeks = new Set(logs.map(l => {
    const d = new Date(l.logged_at ?? l.created_at)
    const week = Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000))
    return week
  }))
  const sortedWeeks = [...weeks].sort((a, b) => b - a)
  let streak = 0
  let prev = null
  for (const w of sortedWeeks) {
    if (prev === null || prev - w === 1) { streak++; prev = w }
    else break
  }

  return { sessions, totalLogs, totalSets, streak }
}

function computeByExercise(logs) {
  const map = new Map()

  for (const log of logs) {
    const name = log.exercise?.name ?? 'Ejercicio desconocido'
    const dateStr = (log.logged_at ?? log.created_at ?? '').slice(0, 10)
    const sessionKey = log.session_id ?? `${log.routine_id}-${dateStr}`

    if (!map.has(name)) {
      map.set(name, { name, sessions: new Map() })
    }

    const exEntry = map.get(name)
    if (!exEntry.sessions.has(sessionKey)) {
      exEntry.sessions.set(sessionKey, { date: dateStr, maxWeight: 0, sets: 0, reps: 0 })
    }

    const sess = exEntry.sessions.get(sessionKey)
    if ((log.weight_kg ?? 0) > sess.maxWeight) {
      sess.maxWeight = log.weight_kg ?? 0
      sess.sets = log.sets ?? 0
      sess.reps = log.reps ?? 0
    }
  }

  return [...map.entries()]
    .map(([name, { sessions }]) => {
      const history = [...sessions.values()].sort((a, b) => b.date.localeCompare(a.date))
      const weights = history.map(s => s.maxWeight).filter(w => w > 0)
      const pr      = weights.length ? Math.max(...weights) : 0
      const chartData = history
        .filter(s => s.maxWeight > 0)
        .slice(0, 10)
        .reverse()
        .map(s => ({ value: s.maxWeight, label: formatDateShort(s.date) }))
      const trend = chartData.length >= 2
        ? +(chartData[chartData.length - 1].value - chartData[chartData.length - 2].value).toFixed(1)
        : 0

      return { name, sessions: history.length, pr, trend, chartData, history }
    })
    .filter(e => e.sessions > 0)
    .sort((a, b) => b.sessions - a.sessions)
}

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}
