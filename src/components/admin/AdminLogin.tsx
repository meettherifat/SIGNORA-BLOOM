import React, { useState } from 'react';
import { Lock, ShieldCheck, Eye, EyeOff, KeyRound, AlertCircle, ArrowLeft } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (token: string, user: any) => void;
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToStore }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedRemaining, setLockedRemaining] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !password) {
      setError('Please enter both Admin ID and Password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id.trim(), pass: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setLockedRemaining(data.remainingSec || 600);
        }
        setError(data.error || 'Authentication failed. Please verify credentials.');
        setIsLoading(false);
        return;
      }

      // Success
      sessionStorage.setItem('sb_admin_token', data.token);
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError('Network connection error. Ensure the server is reachable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF5F0] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none">
      
      {/* Subtle luxury ambient pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#EADFD5] blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#E5D7CA] blur-3xl" />
      </div>

      {/* Back to public store button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          type="button"
          onClick={onBackToStore}
          className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#736767] hover:text-[#2A2323] transition-colors py-2 px-3 rounded-xs cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Return to Boutique</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white border border-[#EFE8DF] shadow-[0_20px_50px_rgba(51,43,43,0.08)] rounded-xs p-8 sm:p-10 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-[#FAF5F0] border border-[#E2D5C8] flex items-center justify-center mx-auto mb-4 text-[#2A2323] shadow-xs">
            <Lock className="w-5 h-5 stroke-[1.5]" />
          </div>
          
          <h1 className="font-serif text-2xl sm:text-3xl text-[#2A2323] font-light tracking-[0.15em] uppercase mb-1.5">
            SIGNORA BLOOM
          </h1>
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#8E8080]">
            Executive Atelier Admin Portal
          </p>
        </div>

        {/* Security Alert Badge */}
        <div className="mb-6 bg-[#FAF6F1] border border-[#E9DFD3] rounded-xs p-3 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#8C6B52] shrink-0 mt-0.5" />
          <div className="text-[11px] text-[#665959] leading-tight">
            <span className="font-medium text-[#2A2323]">Protected Administration System</span>
            <br />
            Protected by server-side 256-bit session encryption and brute-force intrusion defense.
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-3 bg-[#FCF0F0] border border-[#F5C2C2] text-[#A63A3A] rounded-xs flex items-start gap-2.5 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Admin ID Field */}
          <div>
            <label 
              htmlFor="admin-id-input"
              className="block text-[10px] uppercase tracking-[0.2em] text-[#554A4A] font-medium mb-1.5"
            >
              Administrator ID
            </label>
            <div className="relative">
              <input
                id="admin-id-input"
                type="text"
                autoComplete="username"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Enter authorized ID"
                disabled={isLoading || (lockedRemaining !== null && lockedRemaining > 0)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2D5C8] focus:border-[#2A2323] focus:bg-white text-sm text-[#2A2323] placeholder-[#A09292] outline-none transition-all rounded-xs"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label 
              htmlFor="admin-password-input"
              className="block text-[10px] uppercase tracking-[0.2em] text-[#554A4A] font-medium mb-1.5"
            >
              Access Passcode
            </label>
            <div className="relative">
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter secure passcode"
                disabled={isLoading || (lockedRemaining !== null && lockedRemaining > 0)}
                className="w-full pl-3.5 pr-10 py-2.5 bg-[#FAF8F5] border border-[#E2D5C8] focus:border-[#2A2323] focus:bg-white text-sm text-[#2A2323] placeholder-[#A09292] outline-none transition-all rounded-xs font-mono tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8080] hover:text-[#2A2323] p-1 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <div className="pt-2">
            <button
              id="admin-submit-login-btn"
              type="submit"
              disabled={isLoading || (lockedRemaining !== null && lockedRemaining > 0)}
              className="w-full py-3 bg-[#2A2323] hover:bg-[#433737] text-white text-xs uppercase tracking-[0.24em] font-medium transition-all shadow-sm rounded-xs cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Authenticate & Enter CMS</span>
                </>
              )}
            </button>
          </div>

        </form>

        {/* Footer Security Note */}
        <div className="mt-8 pt-6 border-t border-[#F0EBE4] text-center text-[10px] text-[#9E9090] tracking-wider uppercase">
          Authorized personnel only • IP Logged & Monitored
        </div>

      </div>
      
    </div>
  );
};
