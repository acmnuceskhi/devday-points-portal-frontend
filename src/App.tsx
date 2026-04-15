import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminProtectedRoute } from './components/AdminProtectedRoute'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { AdminPointsPage } from './pages/AdminPointsPage'
import { CompetitionsPage } from './pages/CompetitionsPage'
import { CompetitionDetailPage } from './pages/CompetitionDetailPage'
import { MyCompetitionsPage } from './pages/MyCompetitionsPage'
import { PointsPage } from './pages/PointsPage'
import { RankingsPage } from './pages/RankingsPage'
import { SignupPage } from './pages/SignupPage'
import { SignupVerifyPage } from './pages/SignupVerifyPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup/verify" element={<SignupVerifyPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          {/* <Route path="my-competitions" element={<MyCompetitionsPage />} /> */}
          {/* <Route path="competitions" element={<CompetitionsPage />} />
          <Route path="competitions/:competitionId" element={<CompetitionDetailPage />} /> */}
          <Route path="rankings" element={<RankingsPage />} />
          <Route path="points" element={<PointsPage />} />
        </Route>
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/points"
          element={
            <AdminProtectedRoute>
              <AdminPointsPage />
            </AdminProtectedRoute>
          }
        />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
