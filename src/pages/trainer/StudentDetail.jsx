import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { C } from '../../lib/cn'

export default function TrainerStudentDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()

  const { data: student } = useQuery({
    queryKey: ['student-info', id],
    queryFn: () => api.get(`/students/${id}`).then(r => r.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['student-logs', id],
    // El endpoint pagina; tomamos data del wrapper de paginación Laravel
    queryFn: () => api.get(`/students/${id}/logs`).then(r => r.data.data ?? r.data),
  })

  const logs    = data ?? []
  const grouped = logs.length ? groupByRoutine(logs) : []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">
            {student?.name ?? 'Alumno'}
          </h1>
          {student?.email && (
            <p className="text-xs text-zinc-500 truncate">{student.email}</p>
          )}
        </div>
        {/* Stats rápidas */}
        {logs.length > 0 && (
          <div className="text-right shrink-0">
            <p className="text-xs text-zinc-500">Entrenos</p>
            <p className="text-sm font-bold text-orange-400">{countSessions(logs)}</p>
          </div>
        )}
      </div>

      {/* Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <div className="h-4 bg-zinc-800 rounded animate-pulse w-1/4" />
          {[1, 2].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-zinc-800 rounded animate-pulse w-1/3" />
              {[1, 2].map(j => <div key={j} className={`${C.cardP} animate-pulse h-14`} />)}
            </div>
          ))}
        </div>
      )}

      {/* Sin registros */}
      {!isLoading && !logs.length && (
        <div className={`${C.cardP} text-center py-12`}>
          <p className="text-zinc-500 text-sm">Este alumno todavía no registró entrenos.</p>
        </div>
      )}

      {/* Grupos por rutina */}
      {grouped.map(({ routineId, routineName, sessions }) => (
        <RoutineGroup key={routineId} routineName={routineName} sessions={sessions} />
      ))}
    </div>
  )
}

// ─── RoutineGroup ─────────────────────────────────────────────────────────────

function RoutineGroup({ routineName, sessions }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
        <h2 className="text-sm font-semibold text-white">{routineName}</h2>
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-xs text-zinc-600">
          {sessions.length} sesión{sessions.length !== 1 ? 'es' : ''}
        </span>
      </div>

      <div className="space-y-2">
        {sessions.map(session => (
          <SessionCard key={session.key} session={session} />
        ))}
      </div>
    </div>
  )
}

// ─── SessionCard (colapsible) ─────────────────────────────────────────────────

function SessionCard({ session }) {
  const [open, setOpen] = useState(false)
  const { date, logs: sessionLogs } = session

  const totalKg   = sessionLogs.reduce((s, l) => s + (l.weight_kg > 0 ? l.weight_kg : 0), 0)
  const totalSets = sessionLogs.reduce((s, l) => s + (l.sets ?? 0), 0)

  return (
    <div className="rounded-2xl border border-zinc-800 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-left bg-zinc-800/40 hover:bg-zinc-800/70 px-4 py-3 flex items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-1.5 h-8 rounded-full bg-orange-500/40 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">{formatDate(date)}</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {sessionLogs.length} ejercicio{sessionLogs.length !== 1 ? 's' : ''}
              {' · '}{totalSets} series
              {totalKg > 0 && ` · ${totalKg.toLocaleString('es-AR')} kg`}
            </p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="divide-y divide-zinc-800/60">
          {sessionLogs.map(log => (
            <div key={log.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{log.exercise?.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {log.sets} series × {log.reps} reps
                  {log.weight_kg > 0
                    ? <> · <span className="text-orange-400 font-medium">{log.weight_kg} kg</span></>
                    : <span className="text-zinc-600"> · peso corporal</span>
                  }
                </p>
                {log.notes && (
                  <p className="text-xs text-zinc-600 italic mt-0.5 truncate">{log.notes}</p>
                )}
              </div>
              <p className="text-xs text-zinc-700 shrink-0 tabular-nums">
                {formatTime(log.logged_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupByRoutine(logs) {
  const routineMap = new Map()

  for (const log of logs) {
    const routineId   = log.routine_id ?? 'none'
    const routineName = log.routine?.name ?? 'Sin rutina'
    const sessionKey  = log.session_id ?? fallbackSessionKey(log)

    if (!routineMap.has(routineId)) {
      routineMap.set(routineId, { routineId, routineName, sessionMap: new Map() })
    }

    const entry = routineMap.get(routineId)
    if (!entry.sessionMap.has(sessionKey)) {
      const dateStr = (log.logged_at ?? log.created_at ?? '').split('T')[0]
      entry.sessionMap.set(sessionKey, { key: sessionKey, date: dateStr, logs: [] })
    }
    entry.sessionMap.get(sessionKey).logs.push(log)
  }

  return [...routineMap.values()].map(({ routineId, routineName, sessionMap }) => ({
    routineId,
    routineName,
    sessions: [...sessionMap.values()].sort((a, b) => b.date.localeCompare(a.date)),
  }))
}

function fallbackSessionKey(log) {
  const ts = log.logged_at ?? log.created_at
  if (!ts) return `${log.routine_id}-unknown`
  const d   = new Date(ts)
  const day = d.toISOString().split('T')[0]
  const blk = Math.floor(d.getHours() / 3)
  return `${log.routine_id}-${day}-${blk}`
}

function countSessions(logs) {
  const keys = new Set(logs.map(l => l.session_id ?? fallbackSessionKey(l)))
  return keys.size
}

function formatDate(dateStr) {
  if (!dateStr || dateStr === 'unknown') return 'Fecha desconocida'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(isoStr) {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}
