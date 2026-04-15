import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { C } from '../../lib/cn'

const DIFFICULTY_OPTIONS = [
  { value: 'beginner',     label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced',     label: 'Avanzado' },
]

export default function TrainerMarketplace() {
  const qc = useQueryClient()
  const [publishModal, setPublishModal] = useState(null) // routine object

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['trainer-marketplace-stats'],
    queryFn: () => api.get('/trainer/marketplace/stats').then(r => r.data),
  })

  const { data: routines, isLoading: loadingRoutines } = useQuery({
    queryKey: ['trainer-routines'],
    queryFn: () => api.get('/routines').then(r => r.data.data),
  })

  const unpublish = useMutation({
    mutationFn: (id) => api.delete(`/routines/${id}/publish`),
    onSuccess: () => {
      qc.invalidateQueries(['trainer-routines'])
      qc.invalidateQueries(['trainer-marketplace-stats'])
    },
  })

  const published   = routines?.filter(r => r.is_published) ?? []
  const unpublished = routines?.filter(r => !r.is_published) ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Mi marketplace</h1>

      {/* Stats de ventas */}
      {!loadingStats && stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className={`${C.cardP} text-center`}>
            <p className="text-2xl font-black text-white">{stats.total_sales}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Ventas totales</p>
          </div>
          <div className={`${C.cardP} text-center`}>
            <p className="text-2xl font-black text-orange-400">
              ${stats.trainer_earnings.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">Mis ganancias (70%)</p>
          </div>
        </div>
      )}

      {stats?.total_sales > 0 && (
        <div className={`${C.cardP} space-y-2`}>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Por rutina</p>
          {stats.by_routine.map((r, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <p className="text-sm text-white truncate flex-1">{r.routine_name}</p>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-zinc-500">{r.sales} ventas</span>
                <span className="text-sm font-semibold text-orange-400">${(r.revenue * 0.7).toFixed(2)}</span>
              </div>
            </div>
          ))}
          <p className="text-xs text-zinc-700 pt-1 border-t border-zinc-800">
            La plataforma retiene el 30% · Vos recibís el 70%
          </p>
        </div>
      )}

      {/* Rutinas publicadas */}
      {published.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Publicadas en marketplace</p>
          {published.map(routine => (
            <div key={routine.id} className={`${C.cardP} space-y-2`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white truncate">{routine.name}</p>
                  <p className="text-xs text-zinc-500">
                    {routine.difficulty ? DIFFICULTY_OPTIONS.find(d => d.value === routine.difficulty)?.label : ''}
                    {routine.price > 0 ? ` · $${routine.price}` : ' · Gratis'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-800 px-2 py-1 rounded-lg">
                    ● Publicada
                  </span>
                  <button
                    onClick={() => setPublishModal(routine)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors">
                    Editar
                  </button>
                  <button
                    onClick={() => { if (confirm('¿Retirar esta rutina del marketplace?')) unpublish.mutate(routine.id) }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                    Retirar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rutinas no publicadas */}
      {unpublished.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Mis rutinas · Sin publicar</p>
          {unpublished.map(routine => (
            <div key={routine.id} className={`${C.cardP} flex items-center justify-between gap-2`}>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">{routine.name}</p>
                <p className="text-xs text-zinc-500">
                  {routine.blocks?.length ?? 0} día{(routine.blocks?.length ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setPublishModal(routine)}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors">
                Publicar
              </button>
            </div>
          ))}
        </div>
      )}

      {!loadingRoutines && !routines?.length && (
        <div className={`${C.cardP} text-center py-10`}>
          <p className="text-zinc-500 text-sm">Creá rutinas primero para poder publicarlas.</p>
        </div>
      )}

      {publishModal && (
        <PublishModal
          routine={publishModal}
          onClose={() => setPublishModal(null)}
          onSuccess={() => {
            setPublishModal(null)
            qc.invalidateQueries(['trainer-routines'])
            qc.invalidateQueries(['trainer-marketplace-stats'])
          }}
        />
      )}
    </div>
  )
}

// ─── PublishModal ─────────────────────────────────────────────────────────────

function PublishModal({ routine, onClose, onSuccess }) {
  const [form, setForm] = useState({
    price:                   routine.price ?? 0,
    marketplace_description: routine.marketplace_description ?? '',
    difficulty:              routine.difficulty ?? 'intermediate',
    duration_weeks:          routine.duration_weeks ?? '',
    days_per_week:           routine.days_per_week ?? '',
    cover_image:             routine.cover_image ?? '',
  })
  const [error, setError] = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const publish = useMutation({
    mutationFn: () => api.post(`/routines/${routine.id}/publish`, {
      ...form,
      price:          parseFloat(form.price) || 0,
      duration_weeks: form.duration_weeks ? parseInt(form.duration_weeks) : undefined,
      days_per_week:  form.days_per_week  ? parseInt(form.days_per_week)  : undefined,
      cover_image:    form.cover_image    || undefined,
    }),
    onSuccess,
    onError: err => setError(err.response?.data?.message ?? 'Error al publicar.'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-lg bg-zinc-900 rounded-t-2xl border-t border-zinc-800 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        <div className="sticky top-0 bg-zinc-900 px-5 pt-5 pb-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">
              {routine.is_published ? 'Editar publicación' : 'Publicar en marketplace'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">{routine.name}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Precio */}
          <div>
            <label className={C.label}>Precio (ARS)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
              <input className={`${C.input} pl-7`} type="number" step="100" min="0"
                value={form.price} onChange={set('price')}
                placeholder="0 = gratis" />
            </div>
            <p className="text-xs text-zinc-600 mt-1">Vos recibís el 70% por cada venta. 0 = rutina gratuita.</p>
          </div>

          {/* Descripción para el marketplace */}
          <div>
            <label className={C.label}>Descripción para el marketplace</label>
            <textarea
              className={`${C.input} resize-none`}
              rows={3}
              placeholder="Describí brevemente para quién es esta rutina, qué resultados puede esperar, qué equipo necesita..."
              value={form.marketplace_description}
              onChange={set('marketplace_description')}
            />
            <p className="text-xs text-zinc-600 mt-1">{form.marketplace_description.length}/600</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Dificultad */}
            <div>
              <label className={C.label}>Dificultad</label>
              <select className={C.input} value={form.difficulty} onChange={set('difficulty')}>
                {DIFFICULTY_OPTIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Días por semana */}
            <div>
              <label className={C.label}>Días / semana <span className="text-zinc-600 font-normal">(opc.)</span></label>
              <input className={C.input} type="number" min="1" max="7" placeholder="3"
                value={form.days_per_week} onChange={set('days_per_week')} />
            </div>

            {/* Duración */}
            <div>
              <label className={C.label}>Duración (semanas) <span className="text-zinc-600 font-normal">(opc.)</span></label>
              <input className={C.input} type="number" min="1" max="52" placeholder="12"
                value={form.duration_weeks} onChange={set('duration_weeks')} />
            </div>

            {/* Imagen de portada */}
            <div>
              <label className={C.label}>Portada (URL imagen) <span className="text-zinc-600 font-normal">(opc.)</span></label>
              <input className={C.input} type="url" placeholder="https://..."
                value={form.cover_image} onChange={set('cover_image')} />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            className={C.primary}
            onClick={() => publish.mutate()}
            disabled={!form.marketplace_description.trim() || publish.isPending}>
            {publish.isPending
              ? 'Publicando...'
              : routine.is_published
                ? 'Guardar cambios'
                : `Publicar${form.price > 0 ? ` por $${form.price}` : ' gratis'}`}
          </button>
        </div>
      </div>
    </div>
  )
}
