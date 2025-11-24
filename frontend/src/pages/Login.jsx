import React, { useState } from 'react';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  }

  async function sendOtp() {
    try {
      await api.post('/auth/otp/send', { email });
      navigate('/otp-verify', { state: { email } });
    } catch (err) {
      alert('Failed to send OTP');
    }
  }
  function signInWithGoogle() {
    // open backend OAuth start endpoint
    window.location.href = `${import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'}/auth/google`;
  }

  return (
    <div className="container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" type="password"/>
        <button type="submit">Login</button>
        <button type="button" onClick={signInWithGoogle}>Sign in with Google</button>
      </form>
      <hr/>
      <div>
        <p>Or login with OTP</p>
        <button onClick={sendOtp}>Send OTP</button>
      </div>
    </div>
  );
}
