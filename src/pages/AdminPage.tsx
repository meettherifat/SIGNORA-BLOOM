import React, { useState, useEffect, useCallback } from 'react';
import { AdminLogin } from '../components/admin/AdminLogin';
import { AdminDashboard } from '../components/admin/AdminDashboard';

interface AdminPageProps {
  onNavigateHome: () => void;
}

export interface AdminUser {
  id: string;
  role: string;
}

// Session storage key constants for token persistence across page reloads
const SESSION_TOKEN_KEYS = ['sb_admin_token', 'admin_token'] as const;

/**
 * Helper to retrieve stored token from sessionStorage
 */
const getStoredToken = (): string | null => {
  try {
    for (const key of SESSION_TOKEN_KEYS) {
      const val = sessionStorage.getItem(key);
      if (val && typeof val === 'string' && val.trim().length > 0) {
        return val.trim();
      }
    }
  } catch (err) {
    console.warn('Unable to access sessionStorage:', err);
  }
  return null;
};

/**
 * Helper to store token in sessionStorage
 */
const setStoredToken = (token: string): void => {
  try {
    for (const key of SESSION_TOKEN_KEYS) {
      sessionStorage.setItem(key, token);
    }
  } catch (err) {
    console.warn('Unable to write to sessionStorage:', err);
  }
};

/**
 * Helper to clear token from sessionStorage
 */
const clearStoredToken = (): void => {
  try {
    for (const key of SESSION_TOKEN_KEYS) {
      sessionStorage.removeItem(key);
    }
  } catch (err) {
    console.warn('Unable to clear sessionStorage:', err);
  }
};

/**
 * AdminPage component implements a strict token-based authentication mechanism.
 *
 * Direct URL navigation protection:
 * 1. Checks sessionStorage for a cryptographically issued session token on mount.
 * 2. If no token exists, the user is immediately flagged as unauthenticated and rendered the secure login gate.
 * 3. If a token exists, it asynchronously verifies the token with the server's /api/auth/verify endpoint.
 * 4. If verification succeeds, access to AdminDashboard is granted with the valid token.
 * 5. If verification fails (expired/forged/invalid token), the session storage is purged and access is blocked.
 * 6. Basic string comparisons are strictly avoided in favor of server-validated bearer tokens.
 */
export const AdminPage: React.FC<AdminPageProps> = ({ onNavigateHome }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Verify token on mount (protecting direct URL navigation)
  useEffect(() => {
    let isSubscribed = true;

    async function verifyExistingToken() {
      const stored = getStoredToken();

      if (!stored) {
        if (isSubscribed) {
          setToken(null);
          setUser(null);
          setIsVerifying(false);
        }
        return;
      }

      try {
        const res = await fetch('/api/auth/verify', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${stored}`,
            'Cache-Control': 'no-cache',
          },
        });

        if (!isSubscribed) return;

        if (res.ok) {
          const data = await res.json();
          if (data.valid) {
            setToken(stored);
            setUser(data.user || { id: 'admin', role: 'SUPER_ADMIN' });
            setAuthNotice(null);
          } else {
            clearStoredToken();
            setToken(null);
            setUser(null);
            setAuthNotice('Your previous administrator session has expired. Please sign in.');
          }
        } else {
          clearStoredToken();
          setToken(null);
          setUser(null);
          setAuthNotice('Session authorization failed. Please sign in to verify your credentials.');
        }
      } catch (err) {
        if (isSubscribed) {
          console.warn('Token verification error:', err);
          clearStoredToken();
          setToken(null);
          setUser(null);
          setAuthNotice('Unable to verify session with server. Please sign in again.');
        }
      } finally {
        if (isSubscribed) {
          setIsVerifying(false);
        }
      }
    }

    verifyExistingToken();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Handle successful login from AdminLogin
  const handleLoginSuccess = useCallback((newToken: string, userData: any) => {
    setStoredToken(newToken);
    setToken(newToken);
    setUser(userData || { id: 'admin', role: 'SUPER_ADMIN' });
    setAuthNotice(null);
  }, []);

  // Handle explicit logout
  const handleLogout = useCallback(async () => {
    const currentToken = token || getStoredToken();
    if (currentToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });
      } catch (err) {
        console.warn('Server logout error:', err);
      }
    }
    clearStoredToken();
    setToken(null);
    setUser(null);
    setAuthNotice('You have been securely signed out.');
  }, [token]);

  // Handle automatic session expiration triggered by 401 API responses
  const handleSessionExpired = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
    setAuthNotice('Your administrator session has expired or was revoked. Please log in again.');
  }, []);

  // Verification loading spinner (prevents flash of dashboard or login before token status is determined)
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#FAF5F0] flex items-center justify-center select-none">
        <div className="text-center space-y-4">
          <div className="w-9 h-9 border-2 border-[#2A2323]/20 border-t-[#2A2323] rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.25em] text-[#2A2323] font-medium">
              SIGNORA BLOOM ATELIER
            </p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8E8080]">
              Verifying Authorization Token...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If no valid token, strictly block AdminDashboard and present login screen
  if (!token) {
    return (
      <AdminLogin
        onLoginSuccess={handleLoginSuccess}
        onBackToStore={onNavigateHome}
        notice={authNotice}
      />
    );
  }

  // Token is verified: Render Admin Dashboard
  return (
    <AdminDashboard
      token={token}
      user={user}
      onLogout={handleLogout}
      onSessionExpired={handleSessionExpired}
      onViewPublicSite={onNavigateHome}
    />
  );
};
