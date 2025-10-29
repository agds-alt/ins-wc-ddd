// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { authStorage } from '../lib/authStorage'; 

export function LoginPage() {
  const navigate = useNavigate();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

 const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (isLoading) return;
  
  setError(null);
  setSuccessMessage(null);
  
  if (!email || !password) {
    setError('Email dan kata sandi wajib diisi');
    return;
  }

  setIsLoading(true);

  try {
    // ✅ CLEAR old storage before new login
    authStorage.clear();

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (signInError) {
      throw signInError;
    }

    if (data?.user) {
      setSuccessMessage('Berhasil masuk! Mengalihkan...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    }
  } catch (err: any) {
    console.error('Login error:', err);

    if (err.message.includes('Invalid login credentials')) {
      setError('Email atau kata sandi tidak valid. Silakan coba lagi.');
    } else if (err.message.includes('Email not confirmed')) {
      setError('Harap verifikasi alamat email Anda sebelum masuk.');
    } else {
      setError(err.message || 'Gagal masuk. Silakan coba lagi.');
    }
  } finally {
    setIsLoading(false);
  }
};

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!email) {
      setError('Harap masukkan alamat email Anda terlebih dahulu');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setSuccessMessage('Tautan reset kata sandi telah dikirim! Periksa email Anda.');
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim email reset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Login Container */}
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src="/logo.svg"
              alt="WC Check Logo"
              className="h-20 w-auto"
              onError={(e) => {
                // Fallback to PNG if SVG fails
                const img = e.target as HTMLImageElement;
                if (img.src.endsWith('.svg')) {
                  img.src = '/logo.png';
                } else {
                  // If both fail, hide and show text fallback
                  img.style.display = 'none';
                  const fallback = img.nextElementSibling;
                  if (fallback) fallback.className = '';
                }
              }}
            />
            <div className="hidden w-16 h-16 bg-blue-600 rounded-2xl shadow-lg flex items-center justify-center">
              <span className="text-3xl">🚽</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WC Check
          </h1>
          <p className="text-gray-600">
            Masuk untuk mengelola fasilitas Anda
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Kesalahan</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">Berhasil</p>
                <p className="text-sm text-green-700 mt-1">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="your.email@example.com"
                  disabled={isLoading}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Masukkan kata sandi Anda"
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                {/* Toggle Password Visibility */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-600 transition-colors"
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                disabled={isLoading}
              >
                Lupa Kata Sandi?
              </button>
            </div>

            {/* Login Button - 3D Effect */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              style={{
                boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Masuk...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Masuk</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Belum punya akun?
              </span>
            </div>
          </div>

          {/* Register Button */}
          <Link
            to="/register"
            className="w-full bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-4 rounded-lg border-2 border-blue-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-2"
          >
            <span>Buat Akun Baru</span>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            © 2025 WC Check. Hak cipta dilindungi.
          </p>
          <p className="mt-2">
            <a href="#" className="text-blue-600 hover:text-blue-700">
              Kebijakan Privasi
            </a>
            {' · '}
            <a href="#" className="text-blue-600 hover:text-blue-700">
              Ketentuan Layanan
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}