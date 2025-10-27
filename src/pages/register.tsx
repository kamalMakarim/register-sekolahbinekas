import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [retypePassword, setRetypePassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showRetypePassword, setShowRetypePassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrorMsg('Invalid email format')
      return
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long')
      return
    }
    if (password !== retypePassword) {
      setErrorMsg('Passwords do not match')
      return
    }

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setErrorMsg(error.message)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <img src="./LogoBinekas.png" alt="Binekas Logo" className="h-32 mx-auto mb-6" />

        {errorMsg && (
          <p className="text-red-500 text-sm mb-4 text-center">{errorMsg}</p>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Enter your email"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-2 text-sm text-gray-600"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Retype Password */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Retype Password</label>
            <div className="relative">
              <input
                type={showRetypePassword ? 'text' : 'password'}
                value={retypePassword}
                onChange={e => setRetypePassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Retype your password"
              />
              <button
                type="button"
                onClick={() => setShowRetypePassword(v => !v)}
                className="absolute right-3 top-2 text-sm text-gray-600"
              >
                {showRetypePassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 shadow"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  )
}
