import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getToken, saveSession } from '../lib/auth'
import api from '../lib/api'

/**
 * PremiumGate — bloquea contenido hasta que el usuario tenga plan premium.
 * Muestra el contenido difuminado de fondo + un card de upgrade encima.
 */
export default function PremiumGate({ children, feature = 'esta función' }) {
  const qc = useQueryClient()

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then(r => r.data),
  })

  const upgrade = useMutation({
    mutationFn: () => api.post('/users/me/upgrade'),
    onSuccess: ({ data }) => {
      saveSession(data, getToken())
      qc.invalidateQueries(['me'])
    },
  })

  if (isLoading) return (
    <div className="space-y-2">
      {[1,2,3].map(i => <div key={i} className="h-14 bg-zinc-800 rounded-2xl animate-pulse" />)}
    </div>
  )

  // Usuario premium: renderiza el contenido normal
  if (me?.plan === 'premium') return <>{children}</>

  // Usuario free: card de upgrade directa (sin overlay problemático)
  return (
    <div className="rounded-2xl border border-orange-500/25 bg-zinc-900 overflow-hidden">
      {/* Preview difuminada del contenido */}
      <div className="pointer-events-none select-none blur-[3px] opacity-25 px-4 pt-4 space-y-2" aria-hidden>
        {[
          { w: 'w-full', h: 'h-14' },
          { w: 'w-full', h: 'h-14' },
          { w: 'w-3/4',  h: 'h-10' },
        ].map((s, i) => (
          <div key={i} className={`${s.w} ${s.h} bg-zinc-700 rounded-xl`} />
        ))}
      </div>

      {/* Card de upgrade */}
      <div className="px-5 py-6 border-t border-orange-500/20 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/15 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-white">Función Premium ⭐</p>
            <p className="text-sm text-zinc-400 mt-0.5 leading-relaxed">
              <span className="text-orange-400 font-medium capitalize">{feature}</span> es parte del plan Premium.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            'Progreso por ejercicio',
            'Récords personales (PR)',
            'Estadísticas de volumen',
            'Rutinas ilimitadas',
          ].map(f => (
            <div key={f} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
              <span className="text-xs text-zinc-400">{f}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => upgrade.mutate()}
          disabled={upgrade.isPending}
          className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors disabled:opacity-60">
          {upgrade.isPending ? 'Activando...' : '⭐ Activar Premium — Gratis por ahora'}
        </button>
        <p className="text-zinc-700 text-xs text-center">Sin tarjeta de crédito · Cancelá cuando quieras</p>
      </div>
    </div>
  )
}
