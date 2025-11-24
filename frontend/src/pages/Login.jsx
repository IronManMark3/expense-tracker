import React, { useState } from 'react';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (isLoginMode) {
        // --- LOGIN LOGIC ---
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        navigate('/dashboard');
      } else {
        // --- REGISTRATION LOGIC ---
        // 1. Register the user
        await api.post('/auth/register', { email, password, name });
        
        // 2. Auto-login immediately using the same credentials
        const loginRes = await api.post('/auth/login', { email, password });
        
        // 3. Store tokens and redirect
        localStorage.setItem('accessToken', loginRes.data.accessToken);
        localStorage.setItem('refreshToken', loginRes.data.refreshToken);
        navigate('/dashboard');
      }
    } catch (err) {
      // FIX: Properly handle backend validation errors (arrays) vs generic messages
      const responseData = err.response?.data;
      let errorMessage = 'Access Denied';

      if (responseData?.errors && Array.isArray(responseData.errors)) {
        // Join array of validation errors (e.g. "Password must be 8 chars")
        errorMessage = responseData.errors.join('\n');
      } else if (responseData?.message) {
        // Handle standard error message (e.g. "Email exists")
        errorMessage = responseData.message;
      }

      alert(errorMessage);
    }
  }

  function signInWithGoogle() {
    window.location.href = `${import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'}/auth/google`;
  }

  return (
    <div id="auth-screen">
      <div className="auth-console">
        <h2>{isLoginMode ? 'ACCESS CONSOLE LOGIN' : 'CREATE ACCESS PROFILE'}</h2>
        <p className="small-muted">
          {isLoginMode ? 'Enter credentials to breach security perimeter.' : 'Establish new profile for Expensio access.'}
        </p>
        
        <form onSubmit={handleSubmit} style={{marginTop:'20px'}}>
          {!isLoginMode && (
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Operative Name" required />
          )}
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Secure Username (Email)" required />
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Decryption Key (Password)" type="password" required />
          
          <button className="btn primary" type="submit" style={{width:'100%', marginTop:'30px', padding:'16px'}}>
            {isLoginMode ? 'SECURE LOGIN' : 'CREATE PROFILE & ENTER'}
          </button>
        </form>

        <div style={{marginTop:'15px', display:'flex', flexDirection:'column', gap:'10px'}}>
           <button type="button" className="btn ghost" onClick={signInWithGoogle} style={{width:'100%'}}>
             Access via Google Protocol
           </button>
        </div>

        <div className="auth-toggle" onClick={() => setIsLoginMode(!isLoginMode)}>
          {isLoginMode ? 'New User? Establish Access Profile.' : 'Already Registered? Secure Login.'}
        </div>
      </div>
    </div>
  );
}