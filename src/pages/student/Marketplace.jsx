import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import api from '../../lib/api'
import { C } from '../../lib/cn'
import { getUser } from '../../lib/auth'
import { DISCIPLINES } from '../Onboarding'

const DIFFICULTY_LABEL = {
  beginner:     { label: 'Principiante', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-800' },
  intermediate: { label: 'Intermedio',   color: 'text-orange-400  bg-orange-500/10  border-orange-800'  },
  advanced:     { label: 'Avanzado',     color: 'text-red-400     bg-red-500/10     border-red-800'     },
}

const DISCIPLINE_FILTERS = [
  { key: 'all',  label: 'Todos' },
  { key: 'free', label: 'Gratis' },
  ...DISCIPLINES.map(d => ({ key: d.value, label: d.label })),
]

const DIFFICULTY_KEYS = ['beginner', 'intermediate', 'advanced']

export default function StudentMarketplace() {
  const qc   = useQueryClient()
  const user = getUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const [disciplineFilter, setDisciplineFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [selected, setSelected]   = useState(null)
  const [statusMsg, setStatusMsg] = useState(null)

  const hasProfile = !!(user?.disciplines?.length > 0)

  // Detectar retorno de Mercado Pago
  useEffect(() => {
    const payment   = searchParams.get('payment')
    const routineId = searchParams.get('routine')
    if (!payment) return

    if (payment === 'success') {
      setStatusMsg({ type: 'success', text: '¡Pago confirmado! La rutina ya aparece en tus rutinas.' })
      if (routineId) {
        const checkInterval = setInterval(async () => {
          try {
            const res = await api.get(`/marketplace/${routineId}/purchase-status`)
            if (res.data.purchased) {
              qc.invalidateQueries(['marketplace'])
              qc.invalidateQueries(['marketplace-recommended'])
              qc.invalidateQueries(['routines'])
              clearInterval(checkInterval)
            }
          } catch {}
        }, 2000)
        setTimeout(() => clearInterval(checkInterval), 20000)
      }
    } else if (payment === 'failure') {
      setStatusMsg({ type: 'error', text: 'El pago no fue procesado. Podés intentarlo de nuevo.' })
    } else if (payment === 'pending') {
      setStatusMsg({ type: 'warning', text: 'El pago está pendiente de confirmación.' })
    }

    setSearchParams({})
    setTimeout(() => setStatusMsg(null), 6000)
  }, [])

  // Rutinas recomendadas (solo si el usuario tiene perfil configurado)
  const { data: recommendedData } = useQuery({
    queryKey: ['marketplace-recommended'],
    queryFn: () => api.get('/marketplace/recommended').then(r => r.data),
    enabled: hasProfile,
  })
  const recommended = recommendedData ?? []

  // Rutinas filtradas
  const { data, isLoading } = useQuery({
    queryKey: ['marketplace', disciplineFilter, difficultyFilter],
    queryFn: () => {
      const params = {}
      if (disciplineFilter === 'free') {
        params.free = 1
      } else if (disciplineFilter !== 'all') {
        params.discipline = disciplineFilter
      }
      if (difficultyFilter) params.difficulty = difficultyFilter
      return api.get('/marketplace', { params }).then(r => r.data)
    },
  })

  const routines = data?.data ?? []

  const checkout = useMutation({
    mutationFn: (routineId) => api.post(`/marketplace/${routineId}/checkout`).then(r => r.data),
    onSuccess: (data) => {
      if (data.purchased) {
        qc.invalidateQueries(['marketplace'])
        qc.invalidateQueries(['marketplace-recommended'])
        qc.invalidateQueries(['routines'])
        setSelected(null)
        setStatusMsg({ type: 'success', text: '¡Rutina gratuita adquirida! Ya aparece en tu lista.' })
        setTimeout(() => setStatusMsg(null), 4000)
        return
      }
      const url = data.is_sandbox ? data.sandbox_url : data.checkout_url
      window.location.href = url
    },
    onError: (err) => {
      setStatusMsg({ type: 'error', text: err.response?.data?.message ?? 'Error al iniciar el pago.' })
      setTimeout(() => setStatusMsg(null), 4000)
    },
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Marketplace</h1>
        <span className="text-xs text-zinc-500">{routines.length} rutinas</span>
      </div>

      {/* Toast de estado */}
      {statusMsg && (
        <div className={`px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 ${
          statusMsg.type === 'success' ? 'bg-emerald-600 text-white' :
          statusMsg.type === 'error'   ? 'bg-red-600 text-white'     :
                                         'bg-orange-500 text-white'
        }`}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={
              statusMsg.type === 'success' ? "M5 13l4 4L19 7" : "M12 9v4m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z"
            } />
          </svg>
          {statusMsg.text}
        </div>
      )}

      {/* Sección "Para vos" — solo si tiene perfil y hay resultados */}
      {hasProfile && recommended.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Para vos</p>
            {(user?.disciplines ?? []).slice(0, 3).map(d => (
              <span key={d} className="text-xs text-zinc-500">
                · {DISCIPLINES.find(x => x.value === d)?.label ?? d}
              </span>
            ))}
          </div>
          <div className="space-y-2">
            {recommended.slice(0, 3).map(routine => (
              <RoutineCard
                key={`rec-${routine.id}`}
                routine={routine}
                onSelect={() => setSelected(routine)}
                highlight
              />
            ))}
          </div>
          <div className="border-t border-zinc-800 pt-3" />
        </div>
      )}

      {/* Prompt si no tiene perfil */}
      {!hasProfile && (
        <div className="px-4 py-3 rounded-2xl bg-zinc-800/60 border border-zinc-700 flex items-center gap-3">
          <svg className="w-5 h-5 text-orange-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-xs text-zinc-400">
            Completá tu perfil con tu deporte y objetivo para ver rutinas recomendadas para vos.
          </p>
        </div>
      )}

      {/* Filtros por disciplina */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 pt-1">
        {DISCIPLINE_FILTERS.map(f => (
          <button key={f.key} onClick={() => setDisciplineFilter(f.key)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              disciplineFilter === f.key
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Filtros por dificultad */}
      <div className="flex gap-2 -mt-2">
        <button
          onClick={() => setDifficultyFilter('')}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
            difficultyFilter === ''
              ? 'bg-zinc-700 border-zinc-600 text-white'
              : 'border-zinc-800 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400'
          }`}>
          Cualquier nivel
        </button>
        {DIFFICULTY_KEYS.map(k => (
          <button key={k} onClick={() => setDifficultyFilter(k === difficultyFilter ? '' : k)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              difficultyFilter === k
                ? `${DIFFICULTY_LABEL[k].color} border-current`
                : 'border-zinc-800 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400'
            }`}>
            {DIFFICULTY_LABEL[k].label}
          </button>
        ))}
      </div>

      {/* Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className={`${C.cardP} animate-pulse h-28`} />)}
        </div>
      )}

      {/* Vacío */}
      {!isLoading && !routines.length && (
        <div className={`${C.cardP} text-center py-12`}>
          <p className="text-zinc-500 text-sm">No hay rutinas disponibles con ese filtro.</p>
        </div>
      )}

      {/* Grid de rutinas */}
      {!isLoading && routines.length > 0 && (
        <div className="space-y-3">
          {routines.map(routine => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              onSelect={() => setSelected(routine)}
            />
          ))}
        </div>
      )}

      {/* Modal de detalle */}
      {selected && (
        <RoutineDetailModal
          routine={selected}
          isPurchasing={checkout.isPending}
          onClose={() => setSelected(null)}
          onPurchase={() => checkout.mutate(selected.id)}
        />
      )}
    </div>
  )
}

// ─── RoutineCard ──────────────────────────────────────────────────────────────

function RoutineCard({ routine, onSelect, highlight = false }) {
  const diff       = DIFFICULTY_LABEL[routine.difficulty]
  const discipline = DISCIPLINES.find(d => d.value === routine.discipline)

  return (
    <button onClick={onSelect} className={`w-full text-left ${C.cardP} space-y-3 hover:border-zinc-600 transition-colors active:scale-[0.99] ${highlight ? 'border-orange-900/40 bg-orange-500/5' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{routine.name}</p>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">
            por {routine.owner?.name ?? 'Entrenador'}
          </p>
        </div>

        <div className="text-right shrink-0">
          {routine.is_purchased ? (
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-800 px-2 py-1 rounded-lg">
              ✓ Adquirida
            </span>
          ) : (
            <span className={`text-base font-black ${routine.price > 0 ? 'text-white' : 'text-emerald-400'}`}>
              {routine.price > 0 ? `$${routine.price}` : 'Gratis'}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {discipline && (
          <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
            {discipline.label}
          </span>
        )}
        {diff && (
          <span className={`text-xs font-medium border px-2 py-0.5 rounded-full ${diff.color}`}>
            {diff.label}
          </span>
        )}
        {routine.days_per_week && (
          <span className="text-xs text-zinc-500">{routine.days_per_week}d/semana</span>
        )}
        {routine.duration_weeks && (
          <span className="text-xs text-zinc-500">{routine.duration_weeks} semanas</span>
        )}
        {routine.purchases_count > 0 && (
          <span className="text-xs text-zinc-600">{routine.purchases_count} compras</span>
        )}
      </div>

      {routine.marketplace_description && (
        <p className="text-xs text-zinc-500 line-clamp-2">{routine.marketplace_description}</p>
      )}
    </button>
  )
}

// ─── RoutineDetailModal ───────────────────────────────────────────────────────

function RoutineDetailModal({ routine, onClose, onPurchase, isPurchasing }) {
  const diff       = DIFFICULTY_LABEL[routine.difficulty]
  const discipline = DISCIPLINES.find(d => d.value === routine.discipline)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-lg bg-zinc-900 rounded-t-2xl border-t border-zinc-800 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        <div className="sticky top-0 bg-zinc-900 px-5 pt-5 pb-4 border-b border-zinc-800 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-white text-lg truncate">{routine.name}</h2>
            <p className="text-sm text-zinc-500">por {routine.owner?.name}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {discipline && (
              <span className="text-xs text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-700">
                {discipline.label}
              </span>
            )}
            {diff && (
              <span className={`text-xs font-medium border px-2.5 py-1 rounded-full ${diff.color}`}>
                {diff.label}
              </span>
            )}
            {routine.days_per_week && (
              <span className="text-xs text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-full">
                {routine.days_per_week} días / semana
              </span>
            )}
            {routine.duration_weeks && (
              <span className="text-xs text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-full">
                {routine.duration_weeks} semanas
              </span>
            )}
            {(routine.blocks?.length ?? 0) > 0 && (
              <span className="text-xs text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-full">
                {routine.blocks.length} día{routine.blocks.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {routine.marketplace_description && (
            <p className="text-sm text-zinc-400 leading-relaxed">{routine.marketplace_description}</p>
          )}

          <div className="pt-2">
            {routine.is_own_routine ? (
              <div className="text-center py-3 text-zinc-500 text-sm">
                Esta es tu propia rutina.
              </div>
            ) : routine.is_purchased ? (
              <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-800">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold text-emerald-400">Ya adquiriste esta rutina</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">Precio</span>
                  <span className={`text-2xl font-black ${routine.price > 0 ? 'text-white' : 'text-emerald-400'}`}>
                    {routine.price > 0 ? `$${routine.price}` : 'Gratis'}
                  </span>
                </div>
                <button
                  onClick={onPurchase}
                  disabled={isPurchasing}
                  className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-colors ${
                    routine.price > 0
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  } disabled:opacity-60`}>
                  {isPurchasing
                    ? 'Procesando...'
                    : routine.price > 0
                      ? `Comprar por $${routine.price}`
                      : 'Obtener gratis'}
                </button>
                {routine.price > 0 && (
                  <p className="text-xs text-zinc-600 text-center">Pago único · Acceso de por vida</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
