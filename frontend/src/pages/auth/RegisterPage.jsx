import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { authService } from '../../services/authService'
import { User, IdCard, Mail, Lock, Eye, EyeOff, ArrowRight, BookOpen, GraduationCap, Briefcase, Check, X, AlertCircle } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', referenceId: '', email: '', password: '', role: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const passwordChecks = useMemo(() => ({
    length: form.password.length >= 8,
    letter: /[a-zA-Z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(form.password),
  }), [form.password])

  const passwordValid = Object.values(passwordChecks).every(Boolean)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.role) { addToast('Please select your role — Student or Faculty', 'error'); return }
    if (!passwordValid) { addToast('Please meet all password requirements', 'error'); return }

    setLoading(true)
    setError('')
    try {
      await authService.register(form)
      addToast('Registration successful! Please login with your credentials.', 'success')
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Decorative Panel */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 items-center justify-center p-12">
        {/* Animated background shapes */}
        <div className="absolute top-32 right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-32 left-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />

        <div className="relative z-10 text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500 mb-8 shadow-lg shadow-emerald-500/30">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Join EduCloud</h1>
          <p className="text-slate-400 text-lg mb-10 leading-relaxed">
            Register with your institution-provided ID to access your personalized dashboard.
          </p>

          {/* Steps */}
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">Choose Your Role</h3>
                <p className="text-slate-500 text-xs">Select Student or Faculty</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500/70 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">Verify Your Identity</h3>
                <p className="text-slate-500 text-xs">Enter Name & ID from admin records</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">Create Password</h3>
                <p className="text-slate-500 text-xs">Set a strong, secure password</p>
              </div>
            </div>
          </div>

          <div className="mt-10 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-slate-400 text-xs">
              <span className="text-emerald-400 font-semibold">Note:</span> Only students and faculty whose details have been added by the admin can register.
            </p>
          </div>
        </div>
      </div>

      {/* Right Registration Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500 mb-3">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">EduCloud</h1>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-500">Register using your institution-provided ID</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Role Selection Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, role: 'STUDENT' }))}
              className={`relative p-5 rounded-xl border-2 transition-all text-left group ${
                form.role === 'STUDENT'
                  ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                form.role === 'STUDENT' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
              }`}>
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className={`font-semibold mb-1 ${
                form.role === 'STUDENT' ? 'text-emerald-700' : 'text-gray-700'
              }`}>Student</h3>
              <p className="text-xs text-gray-500">Register as a student</p>
              {form.role === 'STUDENT' && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, role: 'FACULTY' }))}
              className={`relative p-5 rounded-xl border-2 transition-all text-left group ${
                form.role === 'FACULTY'
                  ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                form.role === 'FACULTY' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
              }`}>
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className={`font-semibold mb-1 ${
                form.role === 'FACULTY' ? 'text-emerald-700' : 'text-gray-700'
              }`}>Faculty</h3>
              <p className="text-xs text-gray-500">Register as faculty</p>
              {form.role === 'FACULTY' && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  placeholder="Enter your full name as per records"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {form.role === 'FACULTY' ? 'Faculty ID' : 'Student ID'}
              </label>
              <div className="relative">
                <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="referenceId"
                  value={form.referenceId}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  placeholder={`Enter your ${form.role === 'FACULTY' ? 'faculty' : 'student'} ID`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Requirements */}
              {form.password.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { key: 'length', label: 'Min 8 characters' },
                    { key: 'letter', label: 'Contains letters' },
                    { key: 'number', label: 'Contains numbers' },
                    { key: 'special', label: 'Special character' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      {passwordChecks[key] ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <X className="w-4 h-4 text-gray-300" />
                      )}
                      <span className={`text-xs ${passwordChecks[key] ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !form.role}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-600 font-semibold hover:text-emerald-700 transition">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
