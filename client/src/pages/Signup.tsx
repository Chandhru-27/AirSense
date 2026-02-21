import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Map, Leaf } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useRegister, useLogin } from '../lib/hooks'

const signupSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export default function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { mutateAsync: registerApi, isPending: isRegistering } = useRegister()
  const { mutateAsync: loginApi, isPending: isLoggingIn } = useLogin()

  const isLoading = isRegistering || isLoggingIn;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      signupSchema.parse(formData)

      // Send the registration request to /auth/signup
      const res = await registerApi({
        username: formData.username,
        email: formData.email,
        password: formData.password
      })

      // The registration returns user info, but we must login to get the access tokens.
      const loginRes = await loginApi({
        username: formData.username,
        password: formData.password
      })

      // Update local auth state with the new tokens
      login(
        { id: res.user_id || formData.username, name: formData.username, email: formData.email },
        loginRes.access_token
      )

      // Redirect to personalization flow for new users
      navigate('/personalize')
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.issues.forEach((err: z.ZodIssue) => {
          if (err.path[0]) newErrors[err.path[0].toString()] = err.message
        })
        setErrors(newErrors)
      } else {
        setErrors({ username: error?.response?.data?.error || 'Signup failed. Username or email might already exist.' })
      }
    }
  }

  const handleGoogleAuth = () => {
    login(
      { id: '2', name: 'Google User', email: 'user@google.com' },
      'mock_token_google'
    )
    navigate('/personalize')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* LEFT: Branding/Image Section */}
      <div className="hidden lg:flex flex-col flex-1 bg-gradient-to-br from-teal-500 to-blue-600 text-white p-12 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 p-40 bg-teal-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>

        <div className="relative z-10 flex items-center gap-3 mb-auto">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <Map className="size-8" />
          </div>
          <span className="text-3xl font-bold tracking-tight">AirSense</span>
        </div>

        <div className="relative z-10 max-w-lg mb-12">
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Predict. Personalize. Protect.
          </h1>
          <p className="text-lg text-teal-50 font-medium leading-relaxed">
            Join the movement. Get hyper-local, personalized air quality intelligence to protect your health and plan your day safely.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-sm text-teal-100/80 font-medium">
          <Leaf className="size-4" />
          <span>Powered by advanced environmental AI</span>
        </div>
      </div>

      {/* RIGHT: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden mb-8">
            <div className="inline-flex bg-teal-100 p-3 rounded-2xl mb-4 text-teal-600">
              <Map className="size-8" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">AirSense</h2>
          </div>

          <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-2xl font-bold text-slate-800">Create an account</CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Enter your details to get started with AirSense
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-700">Username</Label>
                  <Input
                    id="username"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={handleChange}
                    className={`h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-teal-500 ${errors.username ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={`h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-teal-500 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className={`h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-teal-500 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-700">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-teal-500 ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-md shadow-teal-500/20 transition-all rounded-lg mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                </Button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-slate-500 font-medium">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium"
                  onClick={handleGoogleAuth}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
              </form>
            </CardContent>
            <CardFooter className="justify-center pt-2 pb-6 border-t border-slate-100 flex-col gap-2">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="text-teal-600 hover:text-teal-700 font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
