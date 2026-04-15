import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getUser } from '../../lib/auth'
import api from '../../lib/api'
import { C } from '../../lib/cn'

export default function StudentRoutineDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const user     = getUser()

  const { data: routine, isLoading } = useQuery({
    queryKey: ['routine', id],
    queryFn: () => api.get(`/routines/${id}`).then(r => r.data),
  })

  if (isLoading) return (
    <div className="space-y-3">
      <div className="h-6 bg-zinc-800 rounded animate-pulse w-1/2" />
      {[1,2].map(i => <div key={i} className={`${C.cardP} animate-pulse h-32`} />)}
    </div>
  )

  const isOwner = routine?.owner?.id === user?.id
  const days    = routine?.blocks ?? []

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
          {routine.description && <p className="text-zinc-500 text-xs mt-0.5">{routine.description}</p>}
        </div>
        {isOwner && (
          <Link to={`/student/routines/${id}/edit`}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-600 hover:border-zinc-400 text-zinc-300 transition-colors">
            Editar
          </Link>
        )}
      </div>

      {/* Estado vacío */}
      {days.length === 0 && (
        <div className={`${C.cardP} text-center py-10`}>
          <p className="text-zinc-500 text-sm">Esta rutina todavía no tiene días cargados.</p>
          {isOwner && (
            <Link to={`/student/routines/${id}/edit`}
              className="mt-3 inline-block text-xs text-orange-400 hover:underline">
              Agregar días →
            </Link>
          )}
        </div>
      )}

      {/* Días */}
      {days.map((day, idx) => (
        <DayPreviewCard
          key={day.id}
          day={day}
          dayNumber={idx + 1}
          routineId={id}
        />
      ))}
    </div>
  )
}

// ─── DayPreviewCard ────────────────────────────────────────────────────────────

function DayPreviewCard({ day, dayNumber, routineId }) {
  const navigate = useNavigate()

  // Count total exercises across sections
  const totalExercises = day.sections?.reduce((acc, s) => acc + (s.exercises?.length ?? 0), 0) ?? 0
  const sectionCount   = day.sections?.length ?? 0

  return (
    <div className="rounded-2xl border border-zinc-700 overflow-hidden">
      {/* Header del día */}
      <div className="bg-zinc-800 px-4 py-3 flex items-center gap-2">
        <span className="text-xs font-bold text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded-full">
          DÍA {dayNumber}
        </span>
        <span className="flex-1 text-sm font-semibold text-white">{day.name}</span>
      </div>

      {/* Preview de secciones */}
      <div className="bg-zinc-800/20 px-4 py-3 space-y-2">
        {sectionCount === 0 ? (
          <p className="text-xs text-zinc-600">Sin secciones cargadas.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {day.sections?.map(section => (
              <span key={section.id}
                className="px-2.5 py-1 rounded-lg text-xs bg-zinc-800 border border-zinc-700 text-zinc-400">
                {section.name}
                {section.exercises?.length > 0 &&
                  <span className="ml-1.5 text-zinc-600">({section.exercises.length})</span>
                }
              </span>
            ))}
          </div>
        )}

        {/* Resumen y botón */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-zinc-600">
            {sectionCount > 0
              ? `${sectionCount} sección${sectionCount !== 1 ? 'es' : ''} · ${totalExercises} ejercicio${totalExercises !== 1 ? 's' : ''}`
              : 'Día vacío'}
          </p>

          {totalExercises > 0 && (
            <button
              onClick={() => navigate(`/student/routines/${routineId}/session/${day.id}`)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Iniciar entrenamiento
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
