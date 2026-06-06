import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, Mail, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    })

    if (error) {
      setAuthError(error.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen bg-white text-gray-900">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f1117] flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-green-500" />
          <span className="text-2xl font-bold tracking-tight">VendorBridge</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 leading-tight">
              Simplify. Digitize. Procure.
            </h1>
            <p className="text-gray-400 text-lg">
              Procurement & Vendor Management ERP for modern organizations.
            </p>
          </div>

          <div className="space-y-4">
            {[
              'Manage vendor profiles and gst compliance',
              'Track RFQs and deadlines transparently',
              'Automate quotations comparison and purchase orders',
              'Generate tax invoices and track spend analytics'
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <span className="text-gray-300 text-base">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} VendorBridge. All rights reserved. Version 1.0.0
          </p>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16">
        <div className="w-full max-w-md space-y-8">
          <div>
            {/* Mobile Logo */}
            <div className="flex items-center gap-2 lg:hidden mb-6">
              <ShieldCheck className="w-6 h-6 text-green-500" />
              <span className="text-lg font-bold tracking-tight">VendorBridge</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Welcome Back
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Sign in to your VendorBridge ERP account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {authError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
                {authError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  placeholder="name@company.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <a href="#" className="text-sm font-medium text-green-600 hover:text-green-500">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <span className="text-sm text-gray-500">Don't have an account? </span>
            <Link to="/register" className="text-sm font-semibold text-green-600 hover:text-green-500">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
