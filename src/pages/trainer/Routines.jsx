import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { C } from '../../lib/cn'

export default function TrainerRoutines() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [showNew, setShowNew] = useState(false)
  const [showPhoto, setShowPhoto] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', scope: 'personal' })

  const { data, isLoading } = useQuery({
    queryKey: ['trainer-routines'],
    queryFn: () => api.get('/routines').then(r => r.data.data),
  })

  const create = useMutation({
    mutationFn: () => api.post('/routines', form),
    onSuccess: () => {
      qc.invalidateQueries(['trainer-routines'])
      setShowNew(false)
      setForm({ name: '', description: '', scope: 'personal' })
    },
  })

  const remove = useMutation({
    mutationFn: id => api.delete(`/routines/${id}`),
    onSuccess: () => qc.invalidateQueries(['trainer-routines']),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }) => api.put(`/routines/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries(['trainer-routines']),
  })

  if (isLoading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className={`${C.cardP} animate-pulse h-16`} />)}
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Rutinas</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPhoto(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors">
            📷 Desde foto
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors">
            + Nueva
          </button>
        </div>
      </div>

      {showPhoto && (
        <PhotoRoutineModal
          onClose={() => setShowPhoto(false)}
          onSuccess={id => {
            setShowPhoto(false)
            qc.invalidateQueries(['trainer-routines'])
            navigate(`/trainer/routines/${id}/edit`)
          }}
        />
      )}

      {showNew && (
        <div className={`${C.cardP} space-y-3`}>
          <p className="font-semibold text-sm text-white">Nueva rutina</p>
          <div>
            <label className={C.label}>Nombre</label>
            <input className={C.input} placeholder="Ej: Fuerza A — Push Pull Legs"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className={C.label}>Descripción (opcional)</label>
            <input className={C.input} placeholder="Descripción..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button className={C.primary} onClick={() => create.mutate()} disabled={!form.name || create.isPending}>
              {create.isPending ? 'Creando...' : 'Crear rutina'}
            </button>
            <button className={C.outline} onClick={() => setShowNew(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {!data?.length && !showNew && (
        <div className={`${C.cardP} text-center py-12`}>
          <p className="text-zinc-500 text-sm">No tenés rutinas todavía.</p>
        </div>
      )}

      <div className="space-y-3">
        {data?.map(routine => (
          <div key={routine.id} className={`${C.cardP} flex items-center justify-between gap-2`}>
            <Link to={`/trainer/routines/${routine.id}`} className="flex-1 min-w-0">
              <p className={`font-semibold text-sm truncate ${routine.is_active ? 'text-white' : 'text-zinc-500'}`}>
                {routine.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-zinc-600 text-xs">
                  {routine.blocks?.length ?? 0} día{routine.blocks?.length !== 1 ? 's' : ''}
                </p>
                <span className={`text-xs font-medium ${routine.is_active ? 'text-emerald-400' : 'text-zinc-600'}`}>
                  {routine.is_active ? '● Activa' : '○ Inactiva'}
                </span>
              </div>
            </Link>
            {/* Toggle activa/inactiva */}
            <button
              onClick={() => toggleActive.mutate({ id: routine.id, is_active: !routine.is_active })}
              title={routine.is_active ? 'Desactivar (se oculta a los alumnos)' : 'Activar'}
              className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                routine.is_active
                  ? 'border-emerald-800 text-emerald-400 hover:bg-red-500/10 hover:border-red-800 hover:text-red-400'
                  : 'border-zinc-700 text-zinc-500 hover:border-emerald-700 hover:text-emerald-400'
              }`}>
              {routine.is_active ? 'Desactivar' : 'Activar'}
            </button>
            <button className={C.danger}
              onClick={() => { if (confirm('¿Eliminar rutina?')) remove.mutate(routine.id) }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── PhotoRoutineModal ────────────────────────────────────────────────────────

function PhotoRoutineModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const fromPhoto = useMutation({
    mutationFn: (photo) => {
      const fd = new FormData()
      fd.append('photo', photo)
      return api.post('/routines/from-photo', fd)
    },
    onSuccess: ({ data }) => {
      onSuccess(data.routine_id)
    },
    onError: (err) => {
      setError(err.response?.data?.message ?? 'Error al analizar la imagen.')
    },
  })

  function handleFile(e) {
    const selected = e.target.files[0]
    if (!selected) return
    setFile(selected)
    setError(null)
    setPreview(URL.createObjectURL(selected))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className={`${C.cardP} w-full max-w-sm space-y-4`}>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm text-white">Crear rutina desde foto</p>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors">
          {preview ? (
            <img src={preview} alt="Vista previa" className="w-full max-h-40 object-contain rounded-lg" />
          ) : (
            <>
              <span className="text-3xl">📷</span>
              <p className="text-zinc-400 text-xs text-center">Tocá para seleccionar una foto de entrenamiento</p>
            </>
          )}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        {file && (
          <p className="text-zinc-500 text-xs truncate">📎 {file.name}</p>
        )}

        {error && (
          <p className="text-red-400 text-xs">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            className={C.primary}
            onClick={() => fromPhoto.mutate(file)}
            disabled={!file || fromPhoto.isPending}>
            {fromPhoto.isPending ? 'Analizando imagen con IA...' : 'Generar rutina'}
          </button>
          <button className={C.outline} onClick={onClose} disabled={fromPhoto.isPending}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
