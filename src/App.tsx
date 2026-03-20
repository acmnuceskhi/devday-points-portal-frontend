import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './components/ProtectedRoute'
import { CompetitionDetailPage } from './pages/CompetitionDetailPage'
import { CompetitionsPage } from './pages/CompetitionsPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { MyCompetitionsPage } from './pages/MyCompetitionsPage'
import { NotFoundPage } from './pages/NotFoundPage'
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
          <Route path="my-competitions" element={<MyCompetitionsPage />} />
          <Route path="competitions" element={<CompetitionsPage />} />
          <Route path="competitions/:competitionId" element={<CompetitionDetailPage />} />
          <Route path="teams/:teamId" element={<TeamDetailPage />} />
          <Route path="rankings" element={<RankingsPage />} />
          <Route path="points" element={<PointsPage />} />
        </Route>
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
