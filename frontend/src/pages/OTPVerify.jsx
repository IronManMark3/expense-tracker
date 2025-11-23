import React, { useState } from 'react';
import api from '../lib/api';
import { useLocation, useNavigate } from 'react-router-dom';

export default function OTPVerify() {
  const [code, setCode] = useState('');
  const loc = useLocation();
  const email = loc.state?.email || '';
  const navigate = useNavigate();

  async function verify() {
    try {
      const res = await api.post('/auth/otp/verify', { email, code });
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'OTP invalid');
    }
  }

  return (
    <div className="container">
      <h2>Verify OTP</h2>
      <p>OTP sent to: {email}</p>
      <input value={code} onChange={e=>setCode(e.target.value)} placeholder="6-digit OTP"/>
      <button onClick={verify}>Verify</button>
    </div>
  );
}
