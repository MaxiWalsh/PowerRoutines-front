import { Routes, Route, Navigate } from 'react-router-dom'
import { getToken, isTrainer } from './lib/auth'

// Public
import LandingPage   from './pages/LandingPage'
import LoginPage     from './pages/LoginPage'
import RegisterPage  from './pages/RegisterPage'
import JoinPage      from './pages/JoinPage'

// Shared
import Layout from './components/Layout'

// Student pages
import StudentRoutines       from './pages/student/Routines'
import StudentRoutineDetail  from './pages/student/RoutineDetail'
import StudentRoutineEdit    from './pages/student/RoutineEdit'
import StudentRoutineSession from './pages/student/RoutineSession'
import StudentLogs           from './pages/student/Logs'
import StudentProgress       from './pages/student/Progress'
import StudentMarketplace    from './pages/student/Marketplace'
import StudentProfile        from './pages/student/Profile'

// Trainer pages
import TrainerRoutines      from './pages/trainer/Routines'
import TrainerRoutineEdit   from './pages/trainer/RoutineEdit'
import TrainerStudents      from './pages/trainer/Students'
import TrainerStudentDetail from './pages/trainer/StudentDetail'
import TrainerMarketplace   from './pages/trainer/Marketplace'
import TrainerProfile       from './pages/trainer/Profile'

function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />
}

function HomePage() {
  if (!getToken()) return <LandingPage />
  return isTrainer()
    ? <Navigate to="/trainer/routines" replace />
    : <Navigate to="/student/routines" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"         element={<HomePage />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/join"     element={<JoinPage />} />

      {/* Student */}
      <Route path="/student" element={<RequireAuth><Layout role="student" /></RequireAuth>}>
        <Route path="routines"                            element={<StudentRoutines />} />
        <Route path="routines/:id"                        element={<StudentRoutineDetail />} />
        <Route path="routines/:id/edit"                   element={<StudentRoutineEdit />} />
        <Route path="routines/:id/session/:dayId"         element={<StudentRoutineSession />} />
        <Route path="logs"                                element={<StudentLogs />} />
        <Route path="progress"                            element={<StudentProgress />} />
        <Route path="marketplace"                         element={<StudentMarketplace />} />
        <Route path="profile"                             element={<StudentProfile />} />
        <Route index element={<Navigate to="routines" replace />} />
      </Route>

      {/* Trainer */}
      <Route path="/trainer" element={<RequireAuth><Layout role="trainer" /></RequireAuth>}>
        <Route path="routines"                            element={<TrainerRoutines />} />
        <Route path="routines/:id"                        element={<TrainerRoutineEdit />} />
        {/* Trainer también puede hacer sesiones como si fuera alumno */}
        <Route path="routines/:id/session/:dayId"         element={<StudentRoutineSession />} />
        <Route path="logs"                                element={<StudentLogs />} />
        <Route path="students"                            element={<TrainerStudents />} />
        <Route path="students/:id"                        element={<TrainerStudentDetail />} />
        <Route path="marketplace"                         element={<TrainerMarketplace />} />
        <Route path="profile"                             element={<TrainerProfile />} />
        <Route index element={<Navigate to="routines" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
