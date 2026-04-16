import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-10 bg-[#1a1a1a]/90 backdrop-blur border-b border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
              <DumbbellIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">Power Routines</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"
              className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Iniciar sesión
            </Link>
            <Link to="/register"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors">
              Registrarse
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="px-6 pt-20 pb-24 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/20">
            🏋️ App de gestión de entrenamientos
          </span>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Rutinas{' '}
            <span className="text-orange-400">pensadas para vos,</span>
            <br />según tu deporte y objetivos.
          </h1>

          <p className="text-zinc-400 text-lg leading-relaxed max-w-xl mx-auto">
            Power Routines conecta entrenadores y alumnos. Personalizá tu perfil, seguí tu progreso
            y descubrí rutinas adaptadas a tu disciplina y nivel en el marketplace.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Link to="/register"
              className="px-6 py-3 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-all active:scale-95 shadow-lg shadow-orange-500/20">
              Empezar gratis
            </Link>
            <Link to="/login"
              className="px-6 py-3 rounded-xl text-sm font-semibold border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white transition-colors">
              Tengo una cuenta
            </Link>
          </div>
        </div>

        {/* Decoración — pantalla de onboarding */}
        <div className="mt-16 max-w-sm mx-auto">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-2xl">
            <div className="bg-zinc-800 px-4 py-3 flex items-center gap-2 border-b border-zinc-700">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-zinc-600" />
                <div className="w-3 h-3 rounded-full bg-zinc-600" />
                <div className="w-3 h-3 rounded-full bg-zinc-600" />
              </div>
              <span className="text-xs text-zinc-500 ml-2">Paso 1 de 3 — Tu perfil</span>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-zinc-400 font-medium mb-2">¿Qué deportes practicás?</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Gym ✓', 'Fútbol ✓', 'CrossFit', 'Natación'].map((d, i) => (
                    <span key={i} className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                      d.includes('✓')
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'border-zinc-700 text-zinc-500'
                    }`}>{d}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium mb-2">¿Cuáles son tus objetivos?</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Ganar músculo ✓', 'Rendimiento deportivo ✓', 'Resistencia'].map((g, i) => (
                    <span key={i} className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                      g.includes('✓')
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'border-zinc-700 text-zinc-500'
                    }`}>{g}</span>
                  ))}
                </div>
              </div>
              <div className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold text-center">
                Continuar →
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Personalization highlight ──────────────────────────────── */}
      <section className="px-6 py-20 border-y border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/20 mb-4">
              ✨ Totalmente personalizable
            </span>
            <h2 className="text-2xl font-bold text-white mb-2">No más rutinas genéricas</h2>
            <p className="text-zinc-500 text-sm max-w-xl mx-auto">
              Configurá tu perfil con tu deporte, objetivos, nivel y condiciones físicas.
              La app te recomienda rutinas exactas para vos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="text-2xl">🎯</div>
              <h3 className="text-sm font-semibold text-white">Por disciplina</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Gym, fútbol, atletismo, CrossFit, natación, artes marciales y más. El marketplace
                filtra por tu deporte automáticamente.
              </p>
              <div className="flex flex-wrap gap-1">
                {['Gym', 'Fútbol', 'Atletismo', 'CrossFit'].map(d => (
                  <span key={d} className="px-2 py-0.5 rounded-full text-xs bg-zinc-800 border border-zinc-700 text-zinc-400">{d}</span>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="text-2xl">📈</div>
              <h3 className="text-sm font-semibold text-white">Por objetivo y nivel</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Fuerza, músculo, pérdida de peso, resistencia o rendimiento deportivo.
                Las recomendaciones se adaptan a tu nivel actual.
              </p>
              <div className="flex flex-wrap gap-1">
                {['Principiante', 'Intermedio', 'Avanzado'].map(l => (
                  <span key={l} className="px-2 py-0.5 rounded-full text-xs bg-zinc-800 border border-zinc-700 text-zinc-400">{l}</span>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="text-2xl">🩺</div>
              <h3 className="text-sm font-semibold text-white">Por condición física</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Indicá lesiones, hipertensión, diabetes u otras condiciones. Las rutinas con
                contraindicaciones se marcan automáticamente.
              </p>
              <div className="flex flex-wrap gap-1">
                {['Rodilla', 'Espalda', 'Hombro', 'Tobillo'].map(c => (
                  <span key={c} className="px-2 py-0.5 rounded-full text-xs bg-zinc-800 border border-zinc-700 text-zinc-400">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-zinc-900/50 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-2">Todo lo que necesitás</h2>
          <p className="text-zinc-500 text-sm text-center mb-12">Para entrenadores y alumnos, en una sola app.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: '📋',
                title: 'Rutinas estructuradas',
                desc: 'Organizá entrenamientos por días y secciones. Definí ejercicios con series, reps y descanso.',
              },
              {
                icon: '▶️',
                title: 'Sesiones de entrenamiento',
                desc: 'Iniciá un día de la rutina, registrá cada ejercicio y seguí tu progreso en tiempo real.',
              },
              {
                icon: '📊',
                title: 'Historial de entrenos',
                desc: 'Visualizá todos tus registros agrupados por rutina y sesión. Ver el avance de cada ejercicio.',
              },
              {
                icon: '🏬',
                title: 'Marketplace por disciplina',
                desc: 'Comprá y vendé rutinas organizadas por deporte. Filtros por disciplina, nivel y objetivos.',
              },
              {
                icon: '🏋️',
                title: 'Gestión de gimnasio',
                desc: 'Creá tu gimnasio, invitá alumnos con un código y asignales rutinas individualmente o en grupo.',
              },
              {
                icon: '📱',
                title: 'Diseño mobile-first',
                desc: 'Pensado para el gimnasio: navegación por barra inferior en móvil, sidebar en desktop.',
              },
            ].map((feat, i) => (
              <div key={i} className="p-5 rounded-2xl bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="text-2xl mb-3">{feat.icon}</div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{feat.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ────────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-10">¿Quién sos?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Alumno */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/15 flex items-center justify-center text-2xl">🙋</div>
              <div>
                <h3 className="font-bold text-white text-lg">Soy alumno</h3>
                <p className="text-zinc-500 text-sm mt-1">
                  Completá tu perfil con tu deporte y objetivos. Recibí rutinas personalizadas y seguí tu progreso.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-400">
                {[
                  'Perfil con disciplina, objetivos y nivel',
                  'Rutinas recomendadas para vos',
                  'Registrar sesiones de entrenamiento',
                  'Historial y progreso de cada ejercicio',
                  'Marketplace con filtros por deporte',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>{item}
                  </li>
                ))}
              </ul>
              <Link to="/register"
                className="block text-center py-2.5 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors">
                Registrarse como alumno
              </Link>
            </div>

            {/* Entrenador */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-700/50 flex items-center justify-center text-2xl">🏋️</div>
              <div>
                <h3 className="font-bold text-white text-lg">Soy entrenador</h3>
                <p className="text-zinc-500 text-sm mt-1">
                  Creá rutinas categorizadas por disciplina. Publicalas en el marketplace con contraindicaciones y nivel objetivo.
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-400">
                {[
                  'Crear y gestionar gimnasio',
                  'Rutinas con disciplina, nivel y contraindicaciones',
                  'Asignar rutinas a alumnos',
                  'Ver progreso de cada alumno',
                  'Publicar y vender en el marketplace',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>{item}
                  </li>
                ))}
              </ul>
              <Link to="/register"
                className="block text-center py-2.5 rounded-xl text-sm font-semibold border border-zinc-600 hover:border-zinc-400 text-zinc-200 transition-colors">
                Registrarse como entrenador
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────── */}
      <section className="px-6 py-16 text-center bg-zinc-900/50 border-t border-zinc-800">
        <div className="max-w-lg mx-auto space-y-4">
          <h2 className="text-2xl font-bold text-white">¿Listo para empezar?</h2>
          <p className="text-zinc-500 text-sm">Gratis, sin tarjeta. Creá tu cuenta en segundos.</p>
          <Link to="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-all active:scale-95 shadow-lg shadow-orange-500/20">
            Crear cuenta gratis
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="px-6 py-6 border-t border-zinc-800 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center">
            <DumbbellIcon className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs text-zinc-600">Power Routines © 2026</span>
        </div>
      </footer>

    </div>
  )
}

function DumbbellIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 32 16" fill="currentColor">
      <rect x="0" y="2" width="7" height="12" rx="2"/>
      <rect x="25" y="2" width="7" height="12" rx="2"/>
      <rect x="5" y="4" width="4" height="8" rx="1.5" opacity="0.6"/>
      <rect x="23" y="4" width="4" height="8" rx="1.5" opacity="0.6"/>
      <rect x="9" y="6" width="14" height="4" rx="1.5"/>
    </svg>
  )
}
