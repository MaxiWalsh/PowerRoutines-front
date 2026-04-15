import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { C } from '../../lib/cn'

export default function TrainerRoutineEdit() {
  const { id }  = useParams()
  const navigate = useNavigate()
  const qc       = useQueryClient()
  const [assignModal, setAssignModal] = useState(false)

  const { data: routine, isLoading } = useQuery({
    queryKey: ['routine-edit', id],
    queryFn: () => api.get(`/routines/${id}`).then(r => r.data),
  })

  const addDay = useMutation({
    mutationFn: () => {
      const n = (routine?.blocks?.length ?? 0) + 1
      return api.post(`/routines/${id}/blocks`, { name: `Día ${n}`, order: n })
    },
    onSuccess: () => qc.invalidateQueries(['routine-edit', id]),
  })

  const deleteDay = useMutation({
    mutationFn: dayId => api.delete(`/routines/${id}/blocks/${dayId}`),
    onSuccess: () => qc.invalidateQueries(['routine-edit', id]),
  })

  if (isLoading) return (
    <div className="space-y-3 animate-pulse">
      {[1,2].map(i => <div key={i} className={`${C.cardP} h-24`} />)}
    </div>
  )

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
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{routine.name}</h1>
          {routine.description && <p className="text-zinc-500 text-xs">{routine.description}</p>}
        </div>
        <button
          className="px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-700 hover:border-zinc-500 text-zinc-300 transition-colors"
          onClick={() => setAssignModal(true)}>
          Asignar
        </button>
      </div>

      {/* Días */}
      {routine.blocks?.length === 0 && (
        <div className={`${C.cardP} text-center py-8`}>
          <p className="text-zinc-500 text-sm">Rutina vacía. Agregá días para empezar.</p>
        </div>
      )}

      {routine.blocks?.map((day, idx) => (
        <DayCard
          key={day.id}
          day={day}
          dayNumber={idx + 1}
          routineId={id}
          onDeleteDay={() => { if (confirm(`¿Eliminar "${day.name}" y todas sus secciones?`)) deleteDay.mutate(day.id) }}
          onRefresh={() => qc.invalidateQueries(['routine-edit', id])}
        />
      ))}

      {/* Botón agregar día */}
      <button
        className={`${C.primary}`}
        onClick={() => addDay.mutate()}
        disabled={addDay.isPending}>
        {addDay.isPending ? 'Agregando...' : `+ Agregar día ${(routine.blocks?.length ?? 0) + 1}`}
      </button>

      {assignModal && <AssignModal routineId={id} onClose={() => setAssignModal(false)} />}
    </div>
  )
}

// ─── DayCard ─────────────────────────────────────────────────────────────────

function DayCard({ day, dayNumber, routineId, onDeleteDay, onRefresh }) {
  const [editingName, setEditingName] = useState(false)
  const [dayName, setDayName]         = useState(day.name)
  const hasExercises = day.sections?.some(s => s.exercises?.length > 0)
  const [showAddSection, setShowAddSection] = useState(false)
  const [sectionName, setSectionName]       = useState('')

  const renameDay = useMutation({
    mutationFn: () => api.put(`/routines/${routineId}/blocks/${day.id}`, { name: dayName }),
    onSuccess: () => { onRefresh(); setEditingName(false) },
  })

  const addSection = useMutation({
    mutationFn: () => api.post(`/routines/${routineId}/blocks`, {
      name:      sectionName.trim(),
      parent_id: day.id,
      order:     (day.sections?.length ?? 0) + 1,
    }),
    onSuccess: () => { onRefresh(); setSectionName(''); setShowAddSection(false) },
  })

  const deleteSection = useMutation({
    mutationFn: secId => api.delete(`/routines/${routineId}/blocks/${secId}`),
    onSuccess: onRefresh,
  })

  return (
    <div className="rounded-2xl border border-zinc-700 overflow-hidden">
      {/* Header del día */}
      <div className="bg-zinc-800 px-4 py-3 flex items-center gap-2">
        <span className="text-xs font-bold text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded-full">
          DÍA {dayNumber}
        </span>
        {editingName ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              className="flex-1 bg-zinc-700 border border-zinc-600 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-orange-500"
              value={dayName}
              onChange={e => setDayName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && renameDay.mutate()}
              autoFocus
            />
            <button onClick={() => renameDay.mutate()} disabled={renameDay.isPending}
              className="text-xs text-orange-400 hover:text-orange-300 font-semibold">
              Guardar
            </button>
            <button onClick={() => { setEditingName(false); setDayName(day.name) }}
              className="text-xs text-zinc-500 hover:text-zinc-300">
              Cancelar
            </button>
          </div>
        ) : (
          <>
            <span className="flex-1 text-sm font-semibold text-white">{day.name}</span>
            {/* Botón iniciar entrenamiento */}
            {hasExercises && (
              <Link
                to={`/trainer/routines/${routineId}/session/${day.id}`}
                className="p-1.5 rounded-lg hover:bg-orange-500/15 text-zinc-500 hover:text-orange-400 transition-colors"
                title="Iniciar entrenamiento">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </Link>
            )}
            <button onClick={() => setEditingName(true)}
              className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={onDeleteDay}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Secciones dentro del día */}
      <div className="divide-y divide-zinc-800 bg-zinc-800/30">
        {day.sections?.length === 0 && (
          <p className="px-4 py-3 text-xs text-zinc-600">Sin secciones. Agregá calentamiento, fuerza, etc.</p>
        )}

        {day.sections?.map(section => (
          <SectionCard
            key={section.id}
            section={section}
            routineId={routineId}
            onDeleteSection={() => deleteSection.mutate(section.id)}
            onRefresh={onRefresh}
          />
        ))}

        {/* Agregar sección */}
        {showAddSection ? (
          <div className="p-3 space-y-2">
            <div className="flex gap-2">
              <input
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-orange-500"
                placeholder="Nombre de la sección (ej: Calentamiento, Fuerza...)"
                value={sectionName}
                onChange={e => setSectionName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sectionName.trim() && addSection.mutate()}
                autoFocus
              />
              <button
                onClick={() => addSection.mutate()}
                disabled={!sectionName.trim() || addSection.isPending}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-40 transition-colors">
                {addSection.isPending ? '...' : 'Agregar'}
              </button>
              <button onClick={() => { setShowAddSection(false); setSectionName('') }}
                className="px-3 py-2 rounded-xl text-xs border border-zinc-700 text-zinc-400 hover:border-zinc-500 transition-colors">
                ✕
              </button>
            </div>
            {/* Sugerencias rápidas */}
            <div className="flex flex-wrap gap-1.5">
              {['Calentamiento', 'Zona Media', 'Fuerza', 'Complemento', 'Cardio', 'Vuelta a la calma'].map(s => (
                <button key={s}
                  onClick={() => { setSectionName(s); addSection.mutate() }}
                  className="px-2 py-1 rounded-lg text-xs bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            className="w-full px-4 py-2.5 text-xs text-zinc-500 hover:text-orange-400 transition-colors text-left"
            onClick={() => setShowAddSection(true)}>
            + Agregar sección (calentamiento, fuerza, etc.)
          </button>
        )}
      </div>
    </div>
  )
}

// ─── SectionCard ─────────────────────────────────────────────────────────────

function SectionCard({ section, routineId, onDeleteSection, onRefresh }) {
  const [showAddEx, setShowAddEx] = useState(false)
  const [exForm, setExForm]       = useState({ exercise_id: '', sets: 3, reps: '', reps_max: '', rest_sec: 60 })
  const [showNewEx, setShowNewEx] = useState(false)
  const [newExForm, setNewExForm] = useState({ name: '', muscle_group: '', equipment: '', video_url: '', photo_url: '' })

  const { data: exercises, refetch: refetchEx } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => api.get('/exercises').then(r => r.data.data ?? r.data),
  })

  const createExercise = useMutation({
    mutationFn: () => api.post('/exercises', { ...newExForm, is_global: true }),
    onSuccess: async ({ data: ex }) => {
      await refetchEx()
      setExForm(f => ({ ...f, exercise_id: String(ex.id) }))
      setShowNewEx(false)
      setNewExForm({ name: '', muscle_group: '', equipment: '', video_url: '', photo_url: '' })
    },
  })

  const addEx = useMutation({
    mutationFn: () => api.post(`/routines/${routineId}/blocks/${section.id}/exercises`, {
      exercise_id: parseInt(exForm.exercise_id),
      sets:        parseInt(exForm.sets),
      reps:        exForm.reps     ? parseInt(exForm.reps)     : undefined,
      reps_max:    exForm.reps_max ? parseInt(exForm.reps_max) : undefined,
      rest_sec:    parseInt(exForm.rest_sec),
      order:       (section.exercises?.length ?? 0) + 1,
    }),
    onSuccess: () => { onRefresh(); setShowAddEx(false); setExForm({ exercise_id: '', sets: 3, reps: '', reps_max: '', rest_sec: 60 }) },
  })

  const removeEx = useMutation({
    mutationFn: exId => api.delete(`/routines/${routineId}/blocks/${section.id}/exercises/${exId}`),
    onSuccess: onRefresh,
  })

  return (
    <div className="border-l-2 border-zinc-700 ml-3">
      {/* Header de la sección */}
      <div className="pl-3 pr-4 py-2.5 flex items-center justify-between bg-zinc-800/50">
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">{section.name}</span>
        <button onClick={onDeleteSection}
          className="p-1 rounded-lg hover:bg-red-500/10 text-zinc-700 hover:text-red-400 transition-colors">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Ejercicios */}
      <div className="divide-y divide-zinc-800/50">
        {section.exercises?.map(ex => {
          const repsLabel = ex.reps_max
            ? `${ex.reps}–${ex.reps_max} reps`
            : ex.reps ? `${ex.reps} reps` : `${ex.duration_sec}s`
          return (
            <div key={ex.id} className="pl-5 pr-4 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-sm text-white">{ex.name}</p>
                <p className="text-xs text-zinc-500">
                  {ex.sets} series × {repsLabel}
                  {ex.rest_sec ? ` · ${ex.rest_sec}s desc.` : ''}
                </p>
              </div>
              <button className={C.danger} onClick={() => removeEx.mutate(ex.id)}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )
        })}

        {/* Formulario agregar ejercicio */}
        {showAddEx ? (
          <div className="pl-5 pr-4 py-3 space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className={C.label}>Ejercicio</label>
                <select className={C.input} value={exForm.exercise_id}
                  onChange={e => setExForm(f => ({ ...f, exercise_id: e.target.value }))}>
                  <option value="">Seleccioná un ejercicio</option>
                  {exercises?.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
              </div>
              <button
                className="px-3 py-3 rounded-xl text-xs font-semibold border border-zinc-600 hover:border-orange-500 text-zinc-300 hover:text-orange-400 transition-colors whitespace-nowrap"
                onClick={() => setShowNewEx(v => !v)}>
                {showNewEx ? 'Cancelar' : '+ Nuevo'}
              </button>
            </div>

            {showNewEx && (
              <div className="bg-zinc-800/60 rounded-xl p-3 space-y-2 border border-zinc-700">
                <p className="text-xs font-semibold text-orange-400">Crear ejercicio nuevo</p>
                <input className={C.input} placeholder="Nombre *"
                  value={newExForm.name} onChange={e => setNewExForm(f => ({ ...f, name: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <input className={C.input} placeholder="Músculo (ej: Pecho)"
                    value={newExForm.muscle_group} onChange={e => setNewExForm(f => ({ ...f, muscle_group: e.target.value }))} />
                  <input className={C.input} placeholder="Equipo (ej: Barra)"
                    value={newExForm.equipment} onChange={e => setNewExForm(f => ({ ...f, equipment: e.target.value }))} />
                </div>
                <input className={C.input} placeholder="Video explicativo (URL YouTube/Vimeo)"
                  value={newExForm.video_url} onChange={e => setNewExForm(f => ({ ...f, video_url: e.target.value }))} />
                <input className={C.input} placeholder="Foto del ejercicio (URL de imagen)"
                  value={newExForm.photo_url} onChange={e => setNewExForm(f => ({ ...f, photo_url: e.target.value }))} />
                <button className={C.primary}
                  onClick={() => createExercise.mutate()}
                  disabled={!newExForm.name.trim() || createExercise.isPending}>
                  {createExercise.isPending ? 'Creando...' : 'Crear y seleccionar'}
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={C.label}>Series</label>
                <input className={C.input} type="number" placeholder="3" min="1"
                  value={exForm.sets} onChange={e => setExForm(f => ({ ...f, sets: e.target.value }))} />
              </div>
              <div>
                <label className={C.label}>Desc. (s)</label>
                <input className={C.input} type="number" placeholder="60" min="0"
                  value={exForm.rest_sec} onChange={e => setExForm(f => ({ ...f, rest_sec: e.target.value }))} />
              </div>
              <div>
                <label className={C.label}>Reps mín</label>
                <input className={C.input} type="number" placeholder="8" min="1"
                  value={exForm.reps} onChange={e => setExForm(f => ({ ...f, reps: e.target.value }))} />
              </div>
              <div>
                <label className={C.label}>Reps máx <span className="text-zinc-600 font-normal">(opcional)</span></label>
                <input className={C.input} type="number" placeholder="12" min="1"
                  value={exForm.reps_max} onChange={e => setExForm(f => ({ ...f, reps_max: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <button className={C.primary}
                onClick={() => addEx.mutate()}
                disabled={!exForm.exercise_id || addEx.isPending}>
                {addEx.isPending ? 'Agregando...' : 'Agregar ejercicio'}
              </button>
              <button className={C.outline} onClick={() => { setShowAddEx(false); setShowNewEx(false) }}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button className="w-full pl-5 pr-4 py-2 text-xs text-zinc-600 hover:text-orange-400 transition-colors text-left"
            onClick={() => setShowAddEx(true)}>
            + Agregar ejercicio
          </button>
        )}
      </div>
    </div>
  )
}

// ─── AssignModal ─────────────────────────────────────────────────────────────

function AssignModal({ routineId, onClose }) {
  const [mode, setMode]           = useState('student') // 'student' | 'gym'
  const [studentId, setStudentId] = useState('')
  const [notes, setNotes]         = useState('')
  const [done, setDone]           = useState(false)
  const [doneMsg, setDoneMsg]     = useState('')
  const [error, setError]         = useState('')

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then(r => r.data),
  })

  const gymId   = me?.owned_gym?.id
  const gymName = me?.owned_gym?.name

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['gym-students', gymId],
    enabled: !!gymId,
    queryFn: () => api.get(`/gyms/${gymId}/students`).then(r => r.data.data),
  })

  const assign = useMutation({
    mutationFn: () => {
      if (mode === 'gym') {
        if (!gymId) throw new Error('No tenés un gimnasio creado.')
        return api.post(`/routines/${routineId}/assign/gym/${gymId}`, { notes: notes || undefined })
      }
      if (!studentId) throw new Error('Seleccioná un alumno.')
      return api.post(`/routines/${routineId}/assign/student/${studentId}`, { notes: notes || undefined })
    },
    onSuccess: () => {
      setDoneMsg(mode === 'gym'
        ? `¡Rutina asignada a todos los alumnos de ${gymName}!`
        : '¡Rutina asignada al alumno!')
      setDone(true)
    },
    onError: err => setError(err.response?.data?.message ?? err.message ?? 'Error al asignar.'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-lg bg-zinc-900 rounded-t-2xl p-5 space-y-4 border-t border-zinc-800"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Asignar rutina</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-400 font-semibold">{doneMsg}</p>
            <button className="mt-4 px-4 py-2 rounded-xl text-sm text-zinc-400 hover:bg-zinc-800 transition-colors"
              onClick={onClose}>Cerrar</button>
          </div>
        ) : (
          <>
            {/* Selector de modo */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-800/60 rounded-xl">
              {[
                { value: 'student', label: 'Alumno específico', icon: '👤' },
                { value: 'gym',     label: 'Todo el gimnasio',  icon: '🏋️' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setMode(opt.value); setStudentId(''); setError('') }}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    mode === opt.value
                      ? 'bg-orange-500 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}>
                  <span>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Contenido según modo */}
            {!gymId ? (
              <p className="text-xs text-zinc-500 py-2">Creá un gimnasio primero para poder asignar rutinas.</p>
            ) : mode === 'gym' ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-800/60 border border-zinc-700">
                <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{gymName}</p>
                  <p className="text-xs text-zinc-500">
                    {students?.length
                      ? `${students.length} alumno${students.length !== 1 ? 's' : ''} recibirán esta rutina`
                      : 'Todos los alumnos actuales y futuros'}
                  </p>
                </div>
              </div>
            ) : loadingStudents ? (
              <div className="h-10 bg-zinc-800 rounded-xl animate-pulse" />
            ) : !students?.length ? (
              <p className="text-xs text-zinc-500 py-2">No tenés alumnos en tu gimnasio todavía.</p>
            ) : (
              <div>
                <label className={C.label}>Alumno</label>
                <select className={C.input} value={studentId}
                  onChange={e => setStudentId(e.target.value)}>
                  <option value="">Seleccioná un alumno</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — {s.email}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className={C.label}>Notas (opcional)</label>
              <input className={C.input}
                placeholder={mode === 'gym' ? 'Instrucciones generales...' : 'Instrucciones para el alumno...'}
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button className={C.primary}
              onClick={() => assign.mutate()}
              disabled={(mode === 'student' && !studentId) || assign.isPending || !gymId}>
              {assign.isPending ? 'Asignando...' : mode === 'gym' ? 'Asignar a todo el gimnasio' : 'Asignar al alumno'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
