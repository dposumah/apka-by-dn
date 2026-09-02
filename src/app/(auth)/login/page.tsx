'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email atau kata sandi salah');
        setLoading(false);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Terjadi kesalahan yang tidak terduga');
      setLoading(false);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-3xl p-8 sm:p-10 w-full relative overflow-hidden">
      {/* Shine effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-white/0 pointer-events-none rounded-3xl"></div>
      
      <div className="relative z-10 text-center mb-8 flex flex-col items-center">
        <div className="bg-white/80 p-3 rounded-2xl mb-4 shadow-lg inline-block">
          <img src="/login-logo.png" alt="PT. JTR Explorer Logo" className="h-16 w-auto" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md mb-2">PT. JTR Explorer</h1>
      </div>

      <form onSubmit={handleLogin} className="relative z-10 space-y-6">
        {error && (
          <div className="p-3 text-sm font-medium text-white bg-red-500/50 backdrop-blur-md rounded-xl border border-red-500/50 text-center">
            {error}
          </div>
        )}
        
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-blue-50 ml-1 drop-shadow-sm">Email</label>
          <input
            id="email"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white/10 border border-white/20 text-white placeholder:text-blue-100/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all shadow-inner"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-blue-50 ml-1 drop-shadow-sm">Kata Sandi</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/10 border border-white/20 text-white placeholder:text-blue-100/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all shadow-inner pr-12"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-1"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md font-semibold rounded-xl px-4 py-3.5 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? 'Memproses...' : 'Masuk ke Sistem'}
        </button>
      </form>
    </div>
  );
}
