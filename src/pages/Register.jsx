import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ShieldCheck, User, Camera } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [regError, setRegError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'officer',
      country: 'India',
      additionalInfo: ''
    }
  })

  const onSubmit = async (values) => {
    setLoading(true)
    setRegError('')

    // 1. Sign up user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password
    })

    if (signUpError) {
      setRegError(signUpError.message)
      setLoading(false)
      return
    }

    if (data?.user) {
      // 2. Insert into profiles table
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: `${values.firstName} ${values.lastName}`.trim(),
        role: values.role,
        phone: values.phone,
        country: values.country
      })

      if (profileError) {
        setRegError(profileError.message)
        setLoading(false)
      } else {
        // Redirect to dashboard
        navigate('/dashboard')
      }
    } else {
      setRegError('An unknown error occurred during sign up.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center p-6 sm:p-10">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-gray-200 p-8 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-green-500" />
            <span className="text-xl font-bold tracking-tight text-gray-900">VendorBridge</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
          <p className="text-sm text-gray-500">Join VendorBridge to manage procurement processes</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {regError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
              {regError}
            </div>
          )}

          {/* Profile Photo Placeholder */}
          <div className="flex justify-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 overflow-hidden">
                <User className="w-10 h-10" />
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 p-1.5 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-sm"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="John"
                {...register('firstName', { required: 'First name is required' })}
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="Doe"
                {...register('lastName', { required: 'Last name is required' })}
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="name@company.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="+91-9876543210"
                {...register('phone', { required: 'Phone number is required' })}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="•••••••• (Min 6 characters)"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Role Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white transition"
                {...register('role')}
              >
                <option value="admin">Admin</option>
                <option value="officer">Procurement Officer</option>
                <option value="manager">Manager / Approver</option>
                <option value="vendor">Vendor</option>
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white transition"
                {...register('country')}
              >
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Germany">Germany</option>
                <option value="Singapore">Singapore</option>
              </select>
            </div>

            {/* Additional Info */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Information (Optional)</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                rows={3}
                placeholder="Tell us about your organization..."
                {...register('additionalInfo')}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Register'
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <span className="text-sm text-gray-500">Already have an account? </span>
          <Link to="/" className="text-sm font-semibold text-green-600 hover:text-green-500">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
