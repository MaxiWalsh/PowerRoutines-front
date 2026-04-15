import { useState, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { C } from '../../lib/cn'

export default function RoutineSession() {
  const { id, dayId } = useParams()
  const navigate      = useNavigate()
  const location      = useLocation()
  const qc            = useQueryClient()

  // Detectar si se accede desde el panel de trainer
  const isTrainer = location.pathname.startsWith('/trainer')
  const backPath  = isTrainer ? `/trainer/routines/${id}` : `/student/routines/${id}`

  const [logModal, setLogModal]   = useState(null)
  const [doneExIds, setDoneExIds] = useState(new Set())
  const [toast, setToast]         = useState(null)  // null | string del mensaje

  // UUID de sesión único — garantiza que sesiones distintas sean entradas separadas en logs
  const sessionId = useMemo(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
  }, []) // se genera UNA vez cuando se monta el componente

  const { data: routine, isLoading } = useQuery({
    queryKey: ['routine', id],
    queryFn: () => api.get(`/routines/${id}`).then(r => r.data),
  })

  // Mutación rápida: marcar ejercicio como hecho sin abrir modal
  const quickComplete = useMutation({
    mutationFn: ({ ex, section }) => {
      const w = 0
      const r = ex.reps ?? 1
      const s = ex.sets ?? 1
      return api.post('/logs', {
        exercise_id: ex.id,
        routine_id:  parseInt(id),
        block_id:    section.id,
        session_id:  sessionId,
        weight_kg:   w,
        reps:        r,
        sets:        s,
      })
    },
    onSuccess: (_, { ex }) => {
      setDoneExIds(prev => new Set([...prev, ex.id]))
      qc.invalidateQueries(['logs'])
      showToast()
    },
  })

  function showToast(msg = '¡Ejercicio registrado!') {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  if (isLoading) return (
    <div className="space-y-3">
      <div className="h-6 bg-zinc-800 rounded animate-pulse w-1/2" />
      {[1,2].map(i => <div key={i} className={`${C.cardP} animate-pulse h-28`} />)}
    </div>
  )

  const day = routine?.blocks?.find(b => String(b.id) === String(dayId))

  if (!day) return (
    <div className={`${C.cardP} text-center py-10`}>
      <p className="text-zinc-500 text-sm">No se encontró el día solicitado.</p>
      <button className="mt-3 text-xs text-orange-400 hover:underline" onClick={() => navigate(backPath)}>Volver</button>
    </div>
  )

  const allExercises = day.sections?.flatMap(s => s.exercises ?? []) ?? []
  const totalDone    = doneExIds.size
  const totalEx      = allExercises.length
  const progress     = totalEx > 0 ? Math.round((totalDone / totalEx) * 100) : 0

  function handleLogSaved(exId) {
    setDoneExIds(prev => new Set([...prev, exId]))
    setLogModal(null)
    qc.invalidateQueries(['logs'])
    showToast()
  }

  return (
    <div className="space-y-5">
      {/* Toast de confirmación */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-semibold shadow-xl flex items-center gap-2 animate-fade-in">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(backPath)}
          className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-500 truncate">{routine.name}</p>
          <h1 className="text-xl font-bold text-white">{day.name}</h1>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-zinc-500">Progreso</p>
          <p className="text-sm font-bold text-orange-400">{totalDone}/{totalEx}</p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Estado vacío */}
      {(!day.sections || day.sections.length === 0) && (
        <div className={`${C.cardP} text-center py-8`}>
          <p className="text-zinc-500 text-sm">Este día no tiene ejercicios cargados.</p>
        </div>
      )}

      {/* Secciones y ejercicios */}
      {day.sections?.map(section => (
        <div key={section.id} className="rounded-2xl border border-zinc-700 overflow-hidden">
          <div className="bg-zinc-800/60 px-4 py-2.5 border-b border-zinc-700">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              {section.name}
            </span>
          </div>

          {(!section.exercises || section.exercises.length === 0) && (
            <p className="px-4 py-3 text-xs text-zinc-600">Sin ejercicios en esta sección.</p>
          )}

          <div className="divide-y divide-zinc-800/60">
            {section.exercises?.map(ex => {
              const done = doneExIds.has(ex.id)
              const isQuickLoading = quickComplete.isPending && quickComplete.variables?.ex?.id === ex.id
              const repsLabel = ex.reps_max
                ? `${ex.reps}–${ex.reps_max} reps`
                : ex.reps ? `${ex.reps} reps` : `${ex.duration_sec}s`

              return (
                <div key={ex.id} className={`transition-colors ${done ? 'bg-emerald-500/5' : ''}`}>
                {/* Media del ejercicio (video/foto) */}
                {(ex.video_url || ex.photo_url) && !done && <ExerciseMedia ex={ex} />}
                <div className="px-4 py-3.5 flex items-center gap-3">

                  {/* Círculo de completado — click rápido */}
                  <button
                    onClick={() => !done && quickComplete.mutate({ ex, section })}
                    disabled={done || isQuickLoading}
                    title={done ? 'Completado' : 'Marcar como hecho'}
                    className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                      done
                        ? 'border-emerald-500 bg-emerald-500 cursor-default'
                        : isQuickLoading
                          ? 'border-orange-400 animate-pulse cursor-wait'
                          : 'border-zinc-600 hover:border-orange-400 cursor-pointer'
                    }`}>
                    {done && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${done ? 'text-zinc-500 line-through' : 'text-white'}`}>
                      {ex.name}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {ex.sets} series × {repsLabel}
                      {ex.rest_sec ? ` · ${ex.rest_sec}s desc.` : ''}
                    </p>
                    {ex.muscle_group && (
                      <span className="text-xs text-zinc-600">{ex.muscle_group}</span>
                    )}
                  </div>

                  <button
                    onClick={() => setLogModal({
                      exerciseId:   ex.id,
                      exerciseName: ex.name,
                      blockId:      section.id,
                      routineId:    parseInt(id),
                      sessionId,
                      sets:         ex.sets,
                      reps:         ex.reps,
                    })}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      done
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}>
                    {done ? '✎' : 'Registrar'}
                  </button>
                </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Finalizar sesión */}
      <div className="pt-2">
        <button
          onClick={() => {
            if (totalDone > 0) {
              const msg = totalDone === totalEx
                ? '🎉 ¡Entrenamiento completado!'
                : `¡Sesión finalizada! (${totalDone}/${totalEx} registrados)`
              showToast(msg)
              setTimeout(() => navigate(backPath), 1800)
            } else {
              navigate(backPath)
            }
          }}
          className={`w-full py-3 rounded-2xl text-sm font-semibold transition-colors ${
            totalDone > 0
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
          }`}>
          {totalDone === totalEx && totalEx > 0
            ? '🎉 ¡Entrenamiento completo! Finalizar'
            : totalDone > 0
              ? `Finalizar sesión (${totalDone}/${totalEx} registrados)`
              : 'Finalizar sin registrar'}
        </button>
      </div>

      {logModal && (
        <LogModal
          data={logModal}
          onClose={() => setLogModal(null)}
          onSaved={() => handleLogSaved(logModal.exerciseId)}
        />
      )}
    </div>
  )
}

// ─── VideoEmbed ────────────────────────────────────────────────────────────────

function getYouTubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

function ExerciseMedia({ ex }) {
  const ytId = getYouTubeId(ex.video_url)
  if (!ytId && !ex.photo_url) return null

  return (
    <div className="mx-4 mb-2">
      {ytId ? (
        <div className="relative w-full rounded-xl overflow-hidden bg-zinc-900" style={{ paddingTop: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${ytId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={ex.name}
          />
        </div>
      ) : ex.photo_url ? (
        <img src={ex.photo_url} alt={ex.name}
          className="w-full rounded-xl object-cover max-h-48" />
      ) : null}
    </div>
  )
}

// ─── LogModal ─────────────────────────────────────────────────────────────────

function LogModal({ data, onClose, onSaved }) {
  const [form, setForm] = useState({
    weight_kg: '',
    reps:      data.reps ?? '',
    sets:      data.sets ?? 3,
    notes:     '',
  })
  const [error, setError] = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const mutation = useMutation({
    mutationFn: () => {
      const w = form.weight_kg === '' || form.weight_kg === null ? 0 : parseFloat(form.weight_kg)
      const r = parseInt(form.reps)
      const s = parseInt(form.sets)
      if (isNaN(w) || w < 0) throw new Error('El peso debe ser 0 o mayor.')
      if (isNaN(r) || r < 1) throw new Error('Ingresá las repeticiones.')
      if (isNaN(s) || s < 1) throw new Error('Ingresá las series.')

      return api.post('/logs', {
        exercise_id: data.exerciseId,
        routine_id:  data.routineId,
        block_id:    data.blockId,
        session_id:  data.sessionId,
        weight_kg:   w,
        reps:        r,
        sets:        s,
        notes:       form.notes || undefined,
      })
    },
    onSuccess: onSaved,
    onError: err => setError(err.message || 'Error al guardar. Revisá los datos.'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-lg bg-zinc-900 rounded-t-2xl p-5 space-y-4 border-t border-zinc-800"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Registrar — {data.exerciseName}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              Peso (kg) <span className="text-zinc-600 font-normal">opc.</span>
            </label>
            <input className={C.input} type="number" step="0.5" min="0" placeholder="0"
              value={form.weight_kg} onChange={set('weight_kg')} />
          </div>
          {[
            ['reps',  'Reps',   '8', '1'],
            ['sets',  'Series', '3', '1'],
          ].map(([k, lbl, ph, step]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-zinc-400 mb-2">{lbl}</label>
              <input className={C.input} type="number" step={step} min="1" placeholder={ph}
                value={form[k]} onChange={set(k)} />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">Notas (opcional)</label>
          <input className={C.input} type="text" placeholder="¿Cómo te sentiste?"
            value={form.notes} onChange={set('notes')} />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button className={C.primary} onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando...' : 'Guardar entreno'}
        </button>
      </div>
    </div>
  )
}
