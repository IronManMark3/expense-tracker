import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NavBar() {
  const navigate = useNavigate();
  
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if(el) el.scrollIntoView({behavior:'smooth'});
  };

  return (
    <header className="site-header">
      <div className="brand">
        <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--q-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.48 0-4.5-2.02-4.5-4.5s2.02-4.5 4.5-4.5 4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5zm-2.5-4.5l5 0"/>
          </svg>
          <h1>Expensio</h1>
        </div>
        <p className="small-muted" style={{marginLeft:'40px',marginTop:'5px',fontSize:'12px'}}>QUANTUM ACCESS // EXECUTIVE TIER</p>
      </div>
      <div className="top-actions" style={{display:'flex', gap:'10px'}}>
        <button className="btn ghost" onClick={logout}>Terminate Session</button>
        <button className="btn primary" onClick={() => scrollToSection('section-add')}>Log New Transfer</button>
      </div>
    </header>
  );
}