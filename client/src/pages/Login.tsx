import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Map, Leaf } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useLogin } from '../lib/hooks'

const loginSchema = z.object({
    username: z.string().min(2, 'Username must be at least 2 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState<Record<string, string>>({})
    const navigate = useNavigate()
    const { login } = useAuthStore()
    const { mutateAsync: loginApi, isPending: isLoading } = useLogin()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})

        try {
            loginSchema.parse({ username, password })

            const res = await loginApi({ username, password })

            login(
                { id: username, name: username, email: '' },
                res.access_token
            )

            navigate('/dashboard')
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const newErrors: Record<string, string> = {}
                error.issues.forEach((err: z.ZodIssue) => {
                    if (err.path[0]) newErrors[err.path[0].toString()] = err.message
                })
                setErrors(newErrors)
            } else {
                setErrors({ username: error?.response?.data?.error || 'Login failed. Please check your credentials.' })
            }
        }
    }

    const handleGoogleAuth = () => {
        login(
            { id: '2', name: 'Google User', email: 'user@google.com' },
            'mock_token_google'
        )
        navigate('/dashboard')
    }

    return (
        <div className="flex min-h-screen" style={{ backgroundColor: '#F4F9FF' }}>
            {/* LEFT: Branding Section */}
            <div className="hidden lg:flex flex-col flex-1 text-white p-12 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #89B6E3, #A7C7E7)' }}>
                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 p-40 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>

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
                    <p className="text-lg font-medium leading-relaxed" style={{ color: '#EAF4FF' }}>
                        Your hyper-local air quality intelligence platform. Breathe smarter with personalized insights and street-level forecasts.
                    </p>
                </div>

                <div className="relative z-10 flex items-center gap-2 text-sm font-medium" style={{ color: 'rgba(234,244,255,0.8)' }}>
                    <Leaf className="size-4" />
                    <span>Powered by advanced environmental AI</span>
                </div>
            </div>

            {/* RIGHT: Auth Form */}
            <div className="flex-1 flex items-center justify-center p-8" style={{ backgroundColor: '#F4F9FF' }}>
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:hidden mb-8">
                        <div className="inline-flex p-3 rounded-2xl mb-4" style={{ backgroundColor: '#CFE8FF', color: '#5F7A94' }}>
                            <Map className="size-8" />
                        </div>
                        <h2 className="text-3xl font-bold" style={{ color: '#2C3E50' }}>AirSense</h2>
                    </div>

                    <Card className="border shadow-xl bg-white/80 backdrop-blur-xl" style={{ borderColor: '#DCEBFA', boxShadow: '0 4px 12px rgba(167,199,231,0.25)' }}>
                        <CardHeader className="space-y-2 pb-6">
                            <CardTitle className="text-2xl font-bold" style={{ color: '#2C3E50' }}>Welcome back</CardTitle>
                            <CardDescription style={{ color: '#5F7A94' }}>
                                Enter your credentials to access your dashboard
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username" style={{ color: '#2C3E50' }}>Username</Label>
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="johndoe"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className={`h-11 ${errors.username ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                        style={{ backgroundColor: '#F0F7FF', borderColor: errors.username ? undefined : '#DCEBFA' }}
                                    />
                                    {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" style={{ color: '#2C3E50' }}>Password</Label>
                                        <a href="#" className="text-xs font-medium transition-colors" style={{ color: '#5F7A94' }}>
                                            Forgot password?
                                        </a>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`h-11 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                        style={{ backgroundColor: '#F0F7FF', borderColor: errors.password ? undefined : '#DCEBFA' }}
                                    />
                                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-11 text-white font-medium transition-all rounded-xl"
                                    style={{ backgroundColor: '#89B6E3', boxShadow: '0 4px 12px rgba(167,199,231,0.4)' }}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Signing in...' : 'Sign in'}
                                </Button>

                                <div className="relative py-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" style={{ borderColor: '#DCEBFA' }} />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-3 font-medium" style={{ color: '#8FA6BF' }}>Or continue with</span>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-11 font-medium"
                                    style={{ borderColor: '#DCEBFA', backgroundColor: '#F4F9FF', color: '#5F7A94' }}
                                    onClick={handleGoogleAuth}
                                >
                                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Google
                                </Button>
                            </form>
                        </CardContent>
                        <CardFooter className="justify-center pt-2 pb-6 flex-col gap-2" style={{ borderTop: '1px solid #DCEBFA' }}>
                            <p className="text-sm" style={{ color: '#5F7A94' }}>
                                Don't have an account?{' '}
                                <Link to="/signup" className="font-semibold transition-colors" style={{ color: '#89B6E3' }}>
                                    Sign up
                                </Link>
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}
