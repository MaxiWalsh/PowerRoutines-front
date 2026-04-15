import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { C } from '../../lib/cn'

export default function StudentRoutineEdit() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const qc       = useQueryClient()

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
      </div>

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
          onDeleteDay={() => { if (confirm(`¿Eliminar "${day.name}"?`)) deleteDay.mutate(day.id) }}
          onRefresh={() => qc.invalidateQueries(['routine-edit', id])}
        />
      ))}

      <button
        className={C.primary}
        onClick={() => addDay.mutate()}
        disabled={addDay.isPending}>
        {addDay.isPending ? 'Agregando...' : `+ Agregar día ${(routine.blocks?.length ?? 0) + 1}`}
      </button>
    </div>
  )
}

// ─── DayCard ─────────────────────────────────────────────────────────────────

function DayCard({ day, dayNumber, routineId, onDeleteDay, onRefresh }) {
  const [editingName, setEditingName]       = useState(false)
  const [dayName, setDayName]               = useState(day.name)
  const [showAddSection, setShowAddSection] = useState(false)
  const [sectionName, setSectionName]       = useState('')

  const renameDay = useMutation({
    mutationFn: () => api.put(`/routines/${routineId}/blocks/${day.id}`, { name: dayName }),
    onSuccess: () => { onRefresh(); setEditingName(false) },
  })

  const addSection = useMutation({
    mutationFn: (name) => api.post(`/routines/${routineId}/blocks`, {
      name,
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

      {/* Secciones */}
      <div className="divide-y divide-zinc-800 bg-zinc-800/30">
        {day.sections?.length === 0 && (
          <p className="px-4 py-3 text-xs text-zinc-600">Sin secciones todavía.</p>
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
                placeholder="Nombre (ej: Calentamiento, Fuerza...)"
                value={sectionName}
                onChange={e => setSectionName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sectionName.trim() && addSection.mutate(sectionName.trim())}
                autoFocus
              />
              <button
                onClick={() => addSection.mutate(sectionName.trim())}
                disabled={!sectionName.trim() || addSection.isPending}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-40 transition-colors">
                {addSection.isPending ? '...' : 'Agregar'}
              </button>
              <button onClick={() => { setShowAddSection(false); setSectionName('') }}
                className="px-3 py-2 rounded-xl text-xs border border-zinc-700 text-zinc-400 hover:border-zinc-500 transition-colors">
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['Calentamiento', 'Zona Media', 'Fuerza', 'Complemento', 'Cardio', 'Vuelta a la calma'].map(s => (
                <button key={s}
                  onClick={() => addSection.mutate(s)}
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
      <div className="pl-3 pr-4 py-2.5 flex items-center justify-between bg-zinc-800/50">
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">{section.name}</span>
        <button onClick={onDeleteSection}
          className="p-1 rounded-lg hover:bg-red-500/10 text-zinc-700 hover:text-red-400 transition-colors">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

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
                  {ex.sets} × {repsLabel}
                  {ex.rest_sec ? ` · ${ex.rest_sec}s` : ''}
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

        {showAddEx ? (
          <div className="pl-5 pr-4 py-3 space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className={C.label}>Ejercicio</label>
                <select className={C.input} value={exForm.exercise_id}
                  onChange={e => setExForm(f => ({ ...f, exercise_id: e.target.value }))}>
                  <option value="">Seleccioná</option>
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
              <button className={C.primary} onClick={() => addEx.mutate()} disabled={!exForm.exercise_id || addEx.isPending}>
                {addEx.isPending ? 'Agregando...' : 'Agregar ejercicio'}
              </button>
              <button className={C.outline} onClick={() => { setShowAddEx(false); setShowNewEx(false) }}>Cancelar</button>
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
