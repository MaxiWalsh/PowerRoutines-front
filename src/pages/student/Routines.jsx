import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { C } from '../../lib/cn'

const DIFFICULTY_LABEL = {
  beginner:     { label: 'Principiante', color: 'text-emerald-400' },
  intermediate: { label: 'Intermedio',   color: 'text-orange-400'  },
  advanced:     { label: 'Avanzado',     color: 'text-red-400'     },
}

export default function StudentRoutines() {
  const qc       = useQueryClient()
  const navigate = useNavigate()
  const [showNew, setShowNew]     = useState(false)
  const [showPhoto, setShowPhoto] = useState(false)
  const [form, setForm]           = useState({ name: '', description: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['routines'],
    queryFn: () => api.get('/routines').then(r => r.data.data),
  })

  const create = useMutation({
    mutationFn: () => api.post('/routines', { ...form, scope: 'personal' }),
    onSuccess: ({ data: routine }) => {
      qc.invalidateQueries(['routines'])
      setShowNew(false)
      setForm({ name: '', description: '' })
      navigate(`/student/routines/${routine.id}/edit`)
    },
  })

  const remove = useMutation({
    mutationFn: id => api.delete(`/routines/${id}`),
    onSuccess: () => qc.invalidateQueries(['routines']),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }) => api.put(`/routines/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries(['routines']),
  })

  if (isLoading) return <PageSkeleton />

  const own         = data?.filter(r => r.source === 'own')         ?? []
  const trainer     = data?.filter(r => r.source === 'trainer')     ?? []
  const marketplace = data?.filter(r => r.source === 'marketplace') ?? []
  const total       = data?.length ?? 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Mis rutinas</h1>
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
            qc.invalidateQueries(['routines'])
            navigate(`/student/routines/${id}/edit`)
          }}
        />
      )}

      {/* Formulario nueva rutina */}
      {showNew && (
        <div className={`${C.cardP} space-y-3`}>
          <p className="font-semibold text-sm text-white">Nueva rutina</p>
          <div>
            <label className={C.label}>Nombre</label>
            <input className={C.input} placeholder="Ej: Mi rutina de fuerza"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
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

      {/* ── Mis rutinas propias ─────────────────────────────────────────────── */}
      {own.length > 0 && (
        <Section
          icon="✏️"
          title="Mis rutinas"
          subtitle="Creadas por vos">
          {own.map(routine => (
            <OwnRoutineCard
              key={routine.id}
              routine={routine}
              onToggle={() => toggleActive.mutate({ id: routine.id, is_active: !routine.is_active })}
              onDelete={() => { if (confirm('¿Eliminar rutina?')) remove.mutate(routine.id) }}
            />
          ))}
        </Section>
      )}

      {/* ── Asignadas por trainer / gym ─────────────────────────────────────── */}
      {trainer.length > 0 && (
        <Section
          icon="🏋️"
          title="De tu entrenador"
          subtitle="Asignadas por tu entrenador o gimnasio">
          {trainer.map(routine => (
            <AssignedRoutineCard key={routine.id} routine={routine} />
          ))}
        </Section>
      )}

      {/* ── Obtenidas en el Marketplace ─────────────────────────────────────── */}
      {marketplace.length > 0 && (
        <Section
          icon="🛒"
          title="Del marketplace"
          subtitle="Rutinas que adquiriste">
          {marketplace.map(routine => (
            <MarketplaceRoutineCard key={routine.id} routine={routine} />
          ))}
        </Section>
      )}

      {/* Estado vacío */}
      {!total && !showNew && (
        <div className={`${C.cardP} text-center py-12`}>
          <p className="text-zinc-500 text-sm">Todavía no tenés rutinas.</p>
          <p className="text-zinc-600 text-xs mt-1">
            Creá una propia, pedile a tu entrenador que te asigne una, o explorá el marketplace.
          </p>
          <Link to="/student/marketplace"
            className="inline-block mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors">
            Ver marketplace
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ icon, title, subtitle, children }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{icon}</span>
        <div>
          <p className="text-xs font-semibold text-zinc-300">{title}</p>
          {subtitle && <p className="text-xs text-zinc-600">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

// ─── OwnRoutineCard ───────────────────────────────────────────────────────────

function OwnRoutineCard({ routine, onToggle, onDelete }) {
  return (
    <div className={`${C.cardP} flex items-center gap-2 ${!routine.is_active ? 'opacity-60' : ''}`}>
      <Link to={`/student/routines/${routine.id}`} className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-white truncate">{routine.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-zinc-500 text-xs">
            {routine.blocks?.length ?? 0} día{(routine.blocks?.length ?? 0) !== 1 ? 's' : ''}
          </p>
          <span className={`text-xs ${routine.is_active ? 'text-emerald-400' : 'text-zinc-600'}`}>
            {routine.is_active ? '● Activa' : '○ Inactiva'}
          </span>
        </div>
      </Link>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onToggle}
          title={routine.is_active ? 'Desactivar' : 'Activar'}
          className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            routine.is_active ? 'text-zinc-500 hover:text-orange-400' : 'text-zinc-600 hover:text-emerald-400'
          }`}>
          {routine.is_active ? 'Desactivar' : 'Activar'}
        </button>
        <Link to={`/student/routines/${routine.id}/edit`}
          className="px-2 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors">
          Editar
        </Link>
        <button className={C.danger} onClick={onDelete}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── AssignedRoutineCard ──────────────────────────────────────────────────────

function AssignedRoutineCard({ routine }) {
  return (
    <Link to={`/student/routines/${routine.id}`} className="block">
      <div className={`${C.cardP} flex items-center justify-between hover:border-zinc-600 transition-colors active:scale-[0.99]`}>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-white truncate">{routine.name}</p>
          <p className="text-zinc-500 text-xs mt-0.5">
            {routine.blocks?.length ?? 0} día{(routine.blocks?.length ?? 0) !== 1 ? 's' : ''}
            {routine.owner?.name ? ` · por ${routine.owner.name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {routine.is_active && <span className={C.badgeGreen}>Activa</span>}
          <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

// ─── MarketplaceRoutineCard ───────────────────────────────────────────────────

function MarketplaceRoutineCard({ routine }) {
  const diff = DIFFICULTY_LABEL[routine.difficulty]

  return (
    <Link to={`/student/routines/${routine.id}`} className="block">
      <div className={`${C.cardP} hover:border-zinc-600 transition-colors active:scale-[0.99]`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-white truncate">{routine.name}</p>
            <p className="text-zinc-500 text-xs mt-0.5">
              {routine.blocks?.length ?? 0} día{(routine.blocks?.length ?? 0) !== 1 ? 's' : ''}
              {routine.owner?.name ? ` · por ${routine.owner.name}` : ''}
            </p>
          </div>
          <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-800 px-2 py-0.5 rounded-lg shrink-0">
            🛒 Comprada
          </span>
        </div>
        {/* Tags */}
        {(diff || routine.days_per_week || routine.duration_weeks) && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {diff && (
              <span className={`text-xs font-medium ${diff.color}`}>{diff.label}</span>
            )}
            {routine.days_per_week && (
              <span className="text-xs text-zinc-600">{routine.days_per_week}d/sem</span>
            )}
            {routine.duration_weeks && (
              <span className="text-xs text-zinc-600">{routine.duration_weeks} sem</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-3">
      {[1,2,3].map(i => (
        <div key={i} className={`${C.cardP} animate-pulse`}>
          <div className="h-4 bg-zinc-700 rounded w-1/2 mb-2" />
          <div className="h-3 bg-zinc-700 rounded w-1/4" />
        </div>
      ))}
    </div>
  )
}

// ─── PhotoRoutineModal ────────────────────────────────────────────────────────

function PhotoRoutineModal({ onClose, onSuccess }) {
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError]     = useState(null)
  const inputRef              = useRef(null)

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
