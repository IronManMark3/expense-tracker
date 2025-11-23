import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      // remove tokens from URL (clean history)
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login');
    }
  }, [search, navigate]);

  return <div style={{ padding: 20 }}>Signing you in...</div>;
}
