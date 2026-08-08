import { useEffect } from 'react';

export const useInactivityTimer = (
  isAuthenticated: boolean,
  logout: () => void,
  inactivityDuration: number = 15 * 60 * 1000
) => {
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeout);
      if (isAuthenticated) {
        timeout = setTimeout(() => {
          logout();
          alert('Anda telah logout karena tidak ada aktivitas.');
        }, inactivityDuration);
      }
    };

    if (isAuthenticated) {
      window.addEventListener('mousemove', resetTimeout);
      window.addEventListener('keydown', resetTimeout);
      window.addEventListener('click', resetTimeout);
      resetTimeout();
    } else {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keydown', resetTimeout);
      window.removeEventListener('click', resetTimeout);
    }

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keydown', resetTimeout);
      window.removeEventListener('click', resetTimeout);
    };
  }, [isAuthenticated, logout, inactivityDuration]);
};
