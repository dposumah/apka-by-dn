'use client'

import { useState } from 'react'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email atau kata sandi salah')
        setLoading(false)
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      setError('Terjadi kesalahan yang tidak terduga')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex">
      {/* Left Panel - Image Section */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        {/* Back Button */}
        <div className="absolute top-6 left-6 z-10">
          <button
            onClick={() => router.push('/')}
            className="w-10 h-10 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/30 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="absolute inset-0">
          <img
            src="https://cdn.21st.dev/assets/mirror/0d/0d205a1a31d40e927885b0ec5f603407caa10585b5bc6e8b08240402c7417e86.png"
            alt="Brand Asset"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Right Panel - Form Section */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white relative">
        {/* Back Button for mobile */}
        <div className="lg:hidden absolute top-6 left-6 z-10">
          <button
            onClick={() => router.push('/')}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="w-full max-w-md p-8">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <img src="/login-logo.png" alt="PT. JTR Explorer Logo" className="h-16 w-auto" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              PT. JTR Explorer
            </h1>
            <p className="text-gray-600">
              Silakan masuk ke akun Anda
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm font-medium text-white bg-red-500 rounded-xl text-center">
                {error}
              </div>
            )}
          
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email Address"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <span>Remember me</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 px-4 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
