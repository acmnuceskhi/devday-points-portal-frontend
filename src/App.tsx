import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminProtectedRoute } from './components/AdminProtectedRoute'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { AdminPointsPage } from './pages/AdminPointsPage'
import { PointsPage } from './pages/PointsPage'
import { RankingsPage } from './pages/RankingsPage'
import { TeamDetailPage } from './pages/TeamDetailPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="teams/:teamId" element={<TeamDetailPage />} />
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
