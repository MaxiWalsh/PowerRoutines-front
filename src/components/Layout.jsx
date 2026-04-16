import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { clearSession } from '../lib/auth'
import api from '../lib/api'

const studentNav = [
  { to: '/student/routines',    label: 'Rutinas',     icon: <IconRoutines /> },
  { to: '/student/logs',        label: 'Entrenos',    icon: <IconLogs /> },
  { to: '/student/progress',    label: 'Progreso',    icon: <IconProgress /> },
  { to: '/student/marketplace', label: 'Marketplace', icon: <IconMarket /> },
  { to: '/student/profile',     label: 'Perfil',      icon: <IconProfile /> },
]

const trainerNav = [
  { to: '/trainer/routines',    label: 'Rutinas',     icon: <IconRoutines /> },
  { to: '/trainer/logs',        label: 'Entrenos',    icon: <IconLogs /> },
  { to: '/trainer/students',    label: 'Alumnos',     icon: <IconStudents /> },
  { to: '/trainer/marketplace', label: 'Marketplace', icon: <IconMarket /> },
  { to: '/trainer/profile',     label: 'Perfil',      icon: <IconProfile /> },
]

export default function Layout({ role }) {
  const navigate  = useNavigate()
  const navItems  = role === 'trainer' ? trainerNav : studentNav
  const homeRoute = role === 'trainer' ? '/trainer/routines' : '/student/routines'

  async function handleLogout() {
    try { await api.post('/users/logout') } catch {}
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex flex-col md:flex-row">

      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 xl:w-64 shrink-0 border-r border-zinc-800 sticky top-0 h-screen">
        {/* Logo — clickeable → home */}
        <Link to={homeRoute} className="px-5 py-5 border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
              <DumbbellIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-sm text-white tracking-tight">Power Routines</span>
          </div>
        </Link>

        {/* Nav vertical */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                 ${isActive
                   ? 'bg-orange-500/15 text-orange-400'
                   : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`
              }>
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-zinc-800">
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Salir
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-10 bg-[#1e1e1e]/95 backdrop-blur border-b border-zinc-700 px-4 py-3 flex items-center justify-between">
        {/* Logo clickeable */}
        <Link to={homeRoute} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
            <DumbbellIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-sm text-white tracking-tight">Power Routines</span>
        </Link>
        <button onClick={handleLogout}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors">
          Salir
        </button>
      </header>

      {/* ── Contenido principal ─────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 px-4 md:px-8 xl:px-12 pt-5 md:pt-8 min-w-0">
        <div className="max-w-3xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile bottom nav — scrollable ──────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-800/95 backdrop-blur border-t border-zinc-700 z-10
                      flex items-center overflow-x-auto scrollbar-none">
        {navItems.map(({ to, label, icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-3 shrink-0 text-xs font-medium transition-colors
               flex-1 min-w-[64px]
               ${isActive ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`
            }>
            {icon}
            <span className="truncate w-full text-center px-1">{label}</span>
          </NavLink>
        ))}
      </nav>
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

function IconRoutines() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}
function IconLogs() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}
function IconStudents() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function IconProgress() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  )
}
function IconMarket() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}
function IconProfile() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}
