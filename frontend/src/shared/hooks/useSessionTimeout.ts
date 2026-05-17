// frontend/src/shared/hooks/useSessionTimeout.ts
import { useEffect, useState } from 'react';
import { getToken, logout } from '../services/auth';

export function useSessionTimeout() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    try {
      // Decode JWT token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      const timeUntilExpiry = expiryTime - Date.now();

      if (timeUntilExpiry <= 0) {
        logout();
        window.location.href = '/login';
        return;
      }

      // Show warning 5 minutes before expiry
      const warningTime = 5 * 60 * 1000;
      if (timeUntilExpiry <= warningTime) {
        setShowWarning(true);
        setTimeLeft(Math.floor(timeUntilExpiry / 1000 / 60));
      }

      // Set timeout for logout
      const logoutTimer = setTimeout(() => {
        logout();
        window.location.href = '/login';
      }, timeUntilExpiry);

      return () => clearTimeout(logoutTimer);
    } catch (err) {
      console.error('Error parsing token:', err);
    }
  }, []);

  const extendSession = () => {
    // Refresh token by making an API call
    // This will reset the expiry
    window.location.reload();
  };

  return { showWarning, timeLeft, extendSession };
}