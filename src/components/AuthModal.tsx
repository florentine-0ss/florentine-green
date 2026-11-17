import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { X, ShieldCheck, User as UserIcon, ArrowRight, ShoppingBag } from 'lucide-react';
import { User, Language } from '../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../data/mockData';
import { auth, googleAuthProvider, syncFirebaseUserProfile } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  onOpenSystemLogin: () => void;
  currentLang: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onOpenSystemLogin,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'admin'>('customer');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+250');
  const [mobileNumber, setMobileNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleIdentityChange = (val: string) => {
    setIdentity(val);
    const lower = val.toLowerCase().trim();
    if (lower === 'admin' || lower.includes('florentine') || lower.includes('admin@')) {
      setSelectedRole('admin');
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const profile = await syncFirebaseUserProfile(
        result.user,
        selectedRole,
        mobileNumber ? `${countryCode} ${mobileNumber}` : undefined
      );
      onLogin(profile);
      onClose();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed before completing.');
      } else if (code === 'auth/popup-blocked') {
        setError('Popup was blocked by the browser. Please allow popups or use the customer sign-in form below.');
      } else {
        setError(err?.message || 'Unable to complete Google Sign-In. You can still sign in below.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity.trim() || !password.trim()) {
      setError('Please provide your username/email and password.');
      return;
    }

    const isAdmin =
      selectedRole === 'admin' ||
      identity.toLowerCase().includes('admin') ||
      identity.toLowerCase().includes('florentine');
    const role = isAdmin ? 'admin' : 'customer';

    const loggedUser: User = {
      id: isAdmin ? 'usr-admin-1' : `usr-${Date.now().toString().slice(-4)}`,
      name: isAdmin
        ? 'Florentine Mushimiyimana (Admin)'
        : identity.includes('@')
        ? identity.split('@')[0]
        : identity,
      email: isAdmin
        ? 'florentinemushimiyimana1@gmail.com'
        : identity.includes('@')
        ? identity
        : `${identity}@fofo.rw`,
      phone: `${countryCode} ${mobileNumber || (isAdmin ? '788 234 567' : '788 123 456')}`,
      role,
      status: 'active',
      department: isAdmin ? 'Executive Administration' : 'Verified Shopper',
      permissions: DEFAULT_ROLE_PERMISSIONS[role],
      joinedDate: isAdmin ? 'Jan 15, 2024' : 'Today',
      ordersCount: isAdmin ? 42 : 1,
      lastLogin: 'Just now',
    };

    onLogin(loggedUser);
    onClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !identity.trim() || !password.trim()) {
      setError('Please fill out all required fields.');
      return;
    }

    const isAdmin = selectedRole === 'admin';
    const role = isAdmin ? 'admin' : 'customer';

    const registeredUser: User = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: fullName.trim() + (isAdmin ? ' (Admin)' : ''),
      email: identity.trim(),
      phone: `${countryCode} ${mobileNumber || '788 123 456'}`,
      role,
      status: 'active',
      department: isAdmin ? 'Executive Administration' : 'Verified Shopper',
      permissions: DEFAULT_ROLE_PERMISSIONS[role],
      joinedDate: 'Today',
      ordersCount: 0,
      lastLogin: 'Just now',
    };

    onLogin(registeredUser);
    onClose();
  };

  const handleQuickCustomer = () => {
    onLogin({
      id: 'usr-divine',
      name: 'Divine Uwase',
      email: 'divine.uwase@gmail.com',
      phone: '+250 789 112 334',
      role: 'customer',
      status: 'active',
      department: 'Verified Shopper',
      permissions: DEFAULT_ROLE_PERMISSIONS.customer,
      joinedDate: 'Feb 2024',
      ordersCount: 18,
      lastLogin: 'Just now',
    });
    onClose();
  };

  const handleQuickAdmin = () => {
    onLogin({
      id: 'usr-admin',
      name: 'Florentine Mushimiyimana (Admin)',
      email: 'florentinemushimiyimana1@gmail.com',
      phone: '+250 788 234 567',
      role: 'admin',
      status: 'active',
      department: 'Executive Administration',
      permissions: DEFAULT_ROLE_PERMISSIONS.admin,
      joinedDate: 'Jan 15, 2024',
      ordersCount: 42,
      lastLogin: 'Just now',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-stone-100 flex items-start justify-between bg-stone-50/50">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Account Sign In</span>
            </div>
            <h2 className="text-xl font-black text-stone-900 mt-1">Fofo Green Account</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Sign in as a Customer for immediate access to purchasable products
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Close sign in"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Sign In vs Register */}
        <div className="flex border-b border-stone-200">
          <button
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors cursor-pointer ${
              tab === 'login'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors cursor-pointer ${
              tab === 'register'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Register Account
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Primary Google Sign-In via Firebase Auth */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-900 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.39 0 3.41 2.64 1.46 6.49l3.66 2.84C6 6.72 8.76 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.54-1.15 2.84-2.45 3.71l3.77 2.93c2.2-2.03 3.7-5.02 3.7-8.88z"
              />
              <path
                fill="#FBBC05"
                d="M5.12 14.67A7.22 7.22 0 0 1 4.74 12c0-.93.16-1.83.45-2.67L1.53 6.49A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.46 5.51l3.66-2.84z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.77-2.93c-1.08.72-2.45 1.15-4.16 1.15-3.24 0-6-2.18-6.98-5.12l-3.66 2.84C3.41 21.36 7.39 24 12 24z"
              />
            </svg>
            <span>
              {isGoogleLoading
                ? 'Signing in with Google...'
                : `Continue with Google (${selectedRole === 'admin' ? 'Admin' : 'Customer'})`}
            </span>
          </button>

          <div className="relative flex items-center py-0.5">
            <div className="flex-grow border-t border-stone-200" />
            <span className="shrink mx-3 text-[11px] text-stone-400 font-medium">
              or sign in with credentials
            </span>
            <div className="flex-grow border-t border-stone-200" />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Role Selection Box */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl">
            <label className="block text-xs font-bold text-stone-700 mb-2">
              Select Account Capacity:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('customer')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                  selectedRole === 'customer'
                    ? 'bg-white border-emerald-600 text-emerald-900 shadow-2xs ring-2 ring-emerald-500/20'
                    : 'bg-white/60 border-stone-200 text-stone-600 hover:bg-white'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    selectedRole === 'customer'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div>Customer</div>
                  <span className="text-[10px] font-normal text-stone-500 block">
                    Buy permitted products
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('admin');
                  if (!identity) {
                    setIdentity('florentinemushimiyimana1@gmail.com');
                  }
                  if (!password) {
                    setPassword('admin123');
                  }
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-amber-50 border-amber-600 text-amber-950 shadow-2xs ring-2 ring-amber-500/20'
                    : 'bg-white/60 border-stone-200 text-stone-600 hover:bg-white'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    selectedRole === 'admin'
                      ? 'bg-amber-500 text-white'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span>Admin Role</span>
                  </div>
                  <span className="text-[10px] font-normal text-stone-500 block">
                    Manage store &amp; access
                  </span>
                </div>
              </button>
            </div>

            {selectedRole === 'customer' ? (
              <div className="mt-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-start gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  Once signed in as a <strong>Customer</strong>, all retail-permitted products in stock become immediately available for purchase.
                </span>
              </div>
            ) : (
              <div className="mt-2.5 p-2 bg-amber-100/70 border border-amber-300 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <span>
                  <strong>Admin Role Active:</strong> Logging in grants full privileges to manage products, customer permissions, orders, and audit logs.
                </span>
              </div>
            )}
          </div>

          {/* Form Content */}
          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {selectedRole === 'admin' ? 'Admin Email / Username' : 'Username or Email'}
                </label>
                <input
                  type="text"
                  required
                  value={identity}
                  onChange={(e) => handleIdentityChange(e.target.value)}
                  placeholder={
                    selectedRole === 'admin'
                      ? 'florentinemushimiyimana1@gmail.com'
                      : 'Username or email'
                  }
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    selectedRole === 'admin' ? 'Enter admin password' : 'Enter your password'
                  }
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Mobile Number (Rwanda / East Africa)
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-stone-100 border border-stone-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-stone-700 outline-hidden"
                  >
                    <option value="+250">RW +250</option>
                    <option value="+254">KE +254</option>
                    <option value="+255">TZ +255</option>
                    <option value="+256">UG +256</option>
                  </select>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="78 123 4567"
                    className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full font-bold py-3 rounded-xl text-sm transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 ${
                  selectedRole === 'admin'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                    : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-emerald-800/20'
                }`}
              >
                {selectedRole === 'admin' ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Sign In as Administrator</span>
                  </>
                ) : (
                  <span>Sign In as Customer &amp; Shop</span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={
                    selectedRole === 'admin' ? 'Florentine Mushimiyimana' : 'Jane Smith'
                  }
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder={selectedRole === 'admin' ? 'admin@fofo.rw' : 'you@example.com'}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Mobile Number *
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-stone-100 border border-stone-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-stone-700 outline-hidden"
                  >
                    <option value="+250">RW +250</option>
                    <option value="+254">KE +254</option>
                    <option value="+255">TZ +255</option>
                    <option value="+256">UG +256</option>
                  </select>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="78 123 4567"
                    className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full font-bold py-3 rounded-xl text-sm transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 ${
                  selectedRole === 'admin'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                    : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-emerald-800/20'
                }`}
              >
                {selectedRole === 'admin' ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Create Administrator Account</span>
                  </>
                ) : (
                  <span>Create Customer Account &amp; Shop</span>
                )}
              </button>
            </form>
          )}

          {/* Quick 1-Click Role Logins */}
          <div className="pt-3 border-t border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <span>Quick Demo Sign-In</span>
              <span>Instant Access</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={handleQuickCustomer}
                className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-950 rounded-xl font-bold transition-all text-left flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="block text-[11px] font-black text-emerald-900">
                    Sign In Customer
                  </span>
                  <span className="text-[10px] text-emerald-700 block truncate">Divine Uwase</span>
                </div>
              </button>

              <button
                type="button"
                onClick={handleQuickAdmin}
                className="p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 rounded-xl font-bold transition-all text-left flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="block text-[11px] font-black text-amber-900">
                    Sign In Admin
                  </span>
                  <span className="text-[10px] text-amber-700 block truncate">Florentine M.</span>
                </div>
              </button>
            </div>

            {/* Direct private system access link */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSystemLogin();
              }}
              className="w-full py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Dedicated System Access Terminal</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
