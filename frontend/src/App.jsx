import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import OTPVerify from './pages/OTPVerify';
import Dashboard from './pages/Dashboard';
import OAuthCallback from './pages/OAuthCallback';

// Small protected route wrapper
function RequireAuth({ children }) {
  const token = localStorage.getItem('accessToken');
  // If you later move to httpOnly cookies, replace this check with an auth-status endpoint.
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <div className="app-root">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/otp-verify" element={<OTPVerify />} />
        <Route
          path="/dashboard/*"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route path="*" element={<div style={{ padding: 20 }}>404 — page not found</div>} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
      </Routes>
    </div>
  );
}
