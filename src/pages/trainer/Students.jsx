import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { C } from '../../lib/cn'

export default function TrainerStudents() {
  const [copied, setCopied] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then(r => r.data),
  })

  const gymId = me?.owned_gym?.id

  const { data: students, isLoading } = useQuery({
    queryKey: ['gym-students', gymId],
    enabled: !!gymId,
    queryFn: () => api.get(`/gyms/${gymId}/students`).then(r => r.data.data),
  })

  function copyCode() {
    navigator.clipboard?.writeText(me.owned_gym.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyUrl() {
    const url = `${window.location.origin}/join?code=${me.owned_gym.invite_code}`
    navigator.clipboard?.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  if (isLoading || !me) return (
    <div className="space-y-4">
      <div className="h-6 bg-zinc-800 rounded animate-pulse w-1/3" />
      {[1,2,3].map(i => <div key={i} className={`${C.cardP} animate-pulse h-20`} />)}
    </div>
  )

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-white">Alumnos</h1>

      {/* Sin gym */}
      {!me?.owned_gym && (
        <div className={`${C.cardP} text-center py-10`}>
          <p className="text-zinc-500 text-sm">Todavía no creaste un gimnasio.</p>
          <p className="text-zinc-600 text-xs mt-1">Andá a tu perfil para crear uno.</p>
        </div>
      )}

      {/* Código + URL de invitación */}
      {me?.owned_gym && (
        <div className={`${C.cardP} space-y-4`}>
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">{me.owned_gym.name} — Código de invitación</p>
            <div className="flex items-center gap-3">
              <p className="font-mono font-bold text-orange-400 text-2xl tracking-[0.25em] flex-1">
                {me.owned_gym.invite_code ?? '—'}
              </p>
              <button
                onClick={copyCode}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
                  copied
                    ? 'border-emerald-600 text-emerald-400 bg-emerald-500/10'
                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                }`}>
                {copied ? '¡Copiado!' : 'Copiar código'}
              </button>
            </div>
          </div>

          {/* URL compartible */}
          <div className="pt-3 border-t border-zinc-800 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-500 mb-1">URL de invitación</p>
              <p className="text-xs text-zinc-600 truncate font-mono">
                {window.location.origin}/join?code={me.owned_gym.invite_code}
              </p>
            </div>
            <button
              onClick={copyUrl}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
                copiedUrl
                  ? 'border-emerald-600 text-emerald-400 bg-emerald-500/10'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
              }`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {copiedUrl ? '¡Copiada!' : 'Compartir URL'}
            </button>
          </div>
        </div>
      )}

      {/* Sin alumnos */}
      {me?.owned_gym && !students?.length && (
        <div className={`${C.cardP} text-center py-10`}>
          <p className="text-zinc-500 text-sm">No tenés alumnos todavía.</p>
          <p className="text-zinc-600 text-xs mt-1">Compartí el código o la URL de invitación.</p>
        </div>
      )}

      {/* Lista de alumnos */}
      {students?.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            {students.length} alumno{students.length !== 1 ? 's' : ''}
          </p>
          {students.map(student => (
            <Link key={student.id} to={`/trainer/students/${student.id}`} className="block">
              <div className={`${C.cardP} flex items-center gap-4 hover:border-zinc-600 transition-colors`}>
                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl bg-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                  {student.avatar
                    ? <img src={student.avatar} className="w-full h-full object-cover" alt="" />
                    : <span className="text-base font-bold text-zinc-400">{student.name?.[0]?.toUpperCase()}</span>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white">{student.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">{student.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {student.weight_kg && (
                      <span className="text-xs text-zinc-600">{student.weight_kg} kg</span>
                    )}
                    {student.height_cm && (
                      <span className="text-xs text-zinc-600">{student.height_cm} cm</span>
                    )}
                    {student.gender && (
                      <span className="text-xs text-zinc-600 capitalize">{
                        student.gender === 'male' ? 'Masculino'
                        : student.gender === 'female' ? 'Femenino'
                        : 'Otro'
                      }</span>
                    )}
                  </div>
                </div>

                <svg className="w-4 h-4 text-zinc-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
