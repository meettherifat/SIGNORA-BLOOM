import React, { useState, useEffect } from 'react';
import { AdminLogin } from '../components/admin/AdminLogin';
import { AdminDashboard } from '../components/admin/AdminDashboard';

interface AdminPageProps {
  onNavigateHome: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigateHome }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);

  useEffect(() => {
    async function checkExistingAuth() {
      const stored = sessionStorage.getItem('sb_admin_token');
      if (!stored) {
        setIsVerifying(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/verify', {
          headers: {
            Authorization: `Bearer ${stored}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.valid) {
            setToken(stored);
          } else {
            sessionStorage.removeItem('sb_admin_token');
          }
        } else {
          sessionStorage.removeItem('sb_admin_token');
        }
      } catch (err) {
        console.warn('Could not verify existing session token', err);
        sessionStorage.removeItem('sb_admin_token');
      } finally {
        setIsVerifying(false);
      }
    }

    checkExistingAuth();
  }, []);

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.warn('Logout request failed', err);
      }
    }
    sessionStorage.removeItem('sb_admin_token');
    setToken(null);
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#FAF5F0] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#2A2323]/20 border-t-[#2A2323] rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-[0.25em] text-[#786C6C]">
            Verifying Secure Session...
          </p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <AdminLogin
        onLoginSuccess={handleLoginSuccess}
        onBackToStore={onNavigateHome}
      />
    );
  }

  return (
    <AdminDashboard
      token={token}
      onLogout={handleLogout}
      onViewPublicSite={onNavigateHome}
    />
  );
};
