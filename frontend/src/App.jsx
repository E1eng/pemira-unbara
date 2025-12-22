import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'
import ThankYouPage from './pages/ThankYouPage.jsx'
import VotePage from './pages/VotePage.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import AdminCandidatesPage from './pages/admin/AdminCandidatesPage.jsx'
import AdminAuditPage from './pages/admin/AdminAuditPage.jsx'
import AdminVotersPage from './pages/admin/AdminVotersPage.jsx'

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route
            path="/vote"
            element={
              <RequireAuth>
                <VotePage />
              </RequireAuth>
            }
          />

          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="candidates" element={<AdminCandidatesPage />} />
            <Route path="audit" element={<AdminAuditPage />} />
            <Route path="voters" element={<AdminVotersPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
