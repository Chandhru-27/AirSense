import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, User, Send, MapPin, Loader2, AlertCircle, HeartPulse } from 'lucide-react'
import { useHealthProfile } from '../lib/hooks'

const N8N_WEBHOOK = 'https://chandhru27.app.n8n.cloud/webhook-test/chat-assistant'

interface Message {
    role: 'user' | 'bot'
    content: string
}

const SUGGESTED_PROMPTS = [
    'Is it safe to go jogging outside today?',
    'What areas should I avoid in Chennai right now?',
    'Should I wear a mask today?',
    'When is the best time to exercise outdoors?',
]

export default function ChatBot() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'bot',
            content: "Hello! I'm AirSense AI — your personalized air quality health assistant. Ask me anything about outdoor safety, travel routes, or pollution impacts based on your health profile and current location.",
        },
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
    const [locationStatus, setLocationStatus] = useState<'detecting' | 'found' | 'denied'>('detecting')
    const bottomRef = useRef<HTMLDivElement>(null)

    const { data: healthProfile, isLoading: healthLoading } = useHealthProfile()

    // Get user's geolocation on mount
    useEffect(() => {
        if (!('geolocation' in navigator)) {
            setLocationStatus('denied')
            return
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
                setLocationStatus('found')
            },
            () => {
                // Fallback: Chennai coords if denied
                setUserLocation({ lat: 13.0827, lon: 80.2707 })
                setLocationStatus('denied')
            },
            { timeout: 8000 }
        )
    }, [])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isTyping])

    const buildHealthPayload = () => {
        if (!healthProfile) return {}
        return {
            has_asthma: healthProfile.has_asthma ?? false,
            has_copd: healthProfile.has_copd ?? false,
            has_allergies: healthProfile.has_allergies ?? false,
            has_heart_condition: healthProfile.has_heart_condition ?? false,
            is_pregnant: healthProfile.is_pregnant ?? false,
            takes_inhaler: healthProfile.takes_inhaler ?? false,
            smoking_status: healthProfile.smoking_status ?? 'Never',
            fitness_level: healthProfile.fitness_level ?? 'Moderate',
            outdoor_exposure: healthProfile.outdoor_exposure ?? 'Medium',
            breathing_difficulty: healthProfile.breathing_difficulty ?? 'Never',
            sensitive_to_pollution:
                (healthProfile.has_asthma ?? false) ||
                (healthProfile.has_copd ?? false) ||
                (healthProfile.has_heart_condition ?? false) ||
                (healthProfile.breathing_difficulty === 'Often'),
        }
    }

    const handleSend = async (messageText?: string) => {
        const text = (messageText ?? input).trim()
        if (!text || isTyping) return

        setInput('')
        setError(null)
        setMessages((prev) => [...prev, { role: 'user', content: text }])
        setIsTyping(true)

        const payload = {
            message: text,
            lat: userLocation?.lat ?? 13.0827,
            lon: userLocation?.lon ?? 80.2707,
            health_profile: buildHealthPayload(),
        }

        try {
            const res = await fetch(N8N_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) throw new Error(`Webhook responded with ${res.status}`)

            const rawText = await res.text()

            // n8n sometimes returns content-type: text/html even for JSON payloads,
            // so we always read as text first and try to JSON-parse manually.
            let botText: string
            try {
                const json = JSON.parse(rawText)
                botText =
                    json?.output ||
                    json?.message ||
                    json?.text ||
                    json?.response ||
                    (Array.isArray(json) && (json[0]?.output || json[0]?.message || json[0]?.text)) ||
                    JSON.stringify(json)
            } catch {
                // Not JSON — likely plain text or HTML from n8n; use raw response
                botText = rawText.trim() || "I received your message but couldn't generate a response."
            }

            setMessages((prev) => [...prev, { role: 'bot', content: String(botText) }])
        } catch (err: any) {
            console.error('[ChatBot] Webhook error:', err)
            setError('Failed to reach the AI assistant. Please check your connection and try again.')
            // Remove the user message if we couldn't get a response
        } finally {
            setIsTyping(false)
        }
    }

    const isReady = locationStatus !== 'detecting' && !healthLoading

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] lg:min-h-screen bg-slate-50 p-4 lg:p-8">
            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col h-full space-y-4">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <Bot className="text-teal-500 size-8" />
                            AirSense AI
                        </h1>
                        <p className="text-slate-500 mt-1">Your personalized environmental health assistant.</p>
                    </div>

                    {/* Location & Profile Status */}
                    <div className="flex flex-col items-end gap-1.5 mt-1">
                        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                            locationStatus === 'found'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : locationStatus === 'denied'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                            <MapPin className="size-3" />
                            {locationStatus === 'found' ? 'Location detected'
                                : locationStatus === 'denied' ? 'Using default location'
                                : 'Detecting location...'}
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                            healthProfile
                                ? 'bg-teal-50 text-teal-700 border-teal-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                            <HeartPulse className="size-3" />
                            {healthLoading ? 'Loading profile...' : healthProfile ? 'Health profile loaded' : 'No health profile'}
                        </div>
                    </div>
                </div>

                {/* Chat Interface */}
                <Card className="flex-1 flex flex-col border border-black/10 shadow-xl shadow-slate-200/50 rounded-xs overflow-hidden bg-white/80 backdrop-blur-xl">
                    <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0" style={{ maxHeight: 'calc(100vh - 340px)' }}>

                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                                    msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-teal-100 text-teal-600'
                                }`}>
                                    {msg.role === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
                                </div>
                                <div className={`max-w-[80%] px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap ${
                                    msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-500/10'
                                        : 'bg-slate-100 text-slate-800 rounded-tl-sm border border-slate-200/50'
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {isTyping && (
                            <div className="flex gap-3">
                                <div className="size-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                                    <Bot className="size-4" />
                                </div>
                                <div className="bg-slate-100 px-5 py-4 rounded-2xl rounded-tl-sm border border-slate-200/50 flex space-x-1.5 items-center">
                                    <div className="size-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="size-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="size-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}

                        {/* Error banner */}
                        {error && (
                            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </CardContent>

                    {/* Suggested prompts — only show when no user messages yet */}
                    {messages.length === 1 && (
                        <div className="px-6 pb-4 flex flex-wrap gap-2">
                            {SUGGESTED_PROMPTS.map((p) => (
                                <button
                                    key={p}
                                    onClick={() => handleSend(p)}
                                    disabled={!isReady || isTyping}
                                    className="text-xs bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 px-3 py-1.5 rounded-full transition-colors font-medium disabled:opacity-50"
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}

                    <CardFooter className="p-4 bg-white border-t border-slate-100">
                        <form
                            className="flex w-full items-end gap-3"
                            onSubmit={(e) => { e.preventDefault(); handleSend() }}
                        >
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={isReady ? 'Ask about air quality, health recommendations...' : 'Initialising...'}
                                disabled={!isReady}
                                className="h-14 bg-slate-50 border-slate-200 text-base rounded-2xl focus-visible:ring-teal-500"
                            />
                            <Button
                                type="submit"
                                disabled={!input.trim() || isTyping || !isReady}
                                className="h-14 w-14 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/20 shrink-0"
                            >
                                {isTyping ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
