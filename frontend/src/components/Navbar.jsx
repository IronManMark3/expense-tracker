import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NavBar({ title = 'Expense Tracker' }) {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };
  return (
    <header className="app-header container">
      <div className="app-title">{title}</div>
      <div>
        <button className="secondary" onClick={() => navigate('/dashboard')}>Dashboard</button>
        <button style={{ marginLeft: 8 }} onClick={logout}>Logout</button>
      </div>
    </header>
  );
}
