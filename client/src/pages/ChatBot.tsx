import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, User, Send, Sparkles, Wind, Leaf } from 'lucide-react'
import { usePersonalizationStore } from '../stores/personalizationStore'

export default function ChatBot() {
    const [messages, setMessages] = useState([
        {
            role: 'bot',
            content: 'Hello! I am AirSense AI. I noticed your primary location is Seattle. How can I help you plan your day around the air quality?'
        }
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const personalization = usePersonalizationStore()

    const handleSend = () => {
        if (!input.trim()) return

        const userMessage = input
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setInput('')
        setIsTyping(true)

        // Mock AI Response
        setTimeout(() => {
            let botResponse = "I recommend checking the dashboard heatmap for precise local data."

            if (userMessage.toLowerCase().includes('run') || userMessage.toLowerCase().includes('exercise')) {
                botResponse = `Since you mentioned being ${personalization.fitnessLevel || 'Active'}, I recommend running before 10 AM or after 6 PM today when PM2.5 levels drop below 40. ${personalization.asthma ? 'Also, keep your inhaler handy!' : ''}`
            } else if (userMessage.toLowerCase().includes('tomorrow')) {
                botResponse = "Tomorrow morning looks crisp. AQI is forecasted to be around 35 (Good). No special precautions needed!"
            }

            setMessages(prev => [...prev, { role: 'bot', content: botResponse }])
            setIsTyping(false)
        }, 1500)
    }

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] lg:min-h-screen bg-slate-50 p-4 lg:p-8">
            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col h-full space-y-4">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Bot className="text-teal-500 size-8" />
                        AirSense AI
                    </h1>
                    <p className="text-slate-500 mt-1 text-lg">Your personalized environmental health assistant.</p>
                </div>

                {/* Chat Interface */}
                <Card className="flex-1 flex flex-col border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
                    <CardHeader className="bg-gradient-to-r from-teal-50 to-blue-50 border-b border-slate-100/50 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 shadow-sm relative">
                                    <Bot className="size-5" />
                                    <span className="absolute bottom-0 right-0 size-2.5 bg-emerald-400 border-2 border-white rounded-full"></span>
                                </div>
                                <div>
                                    <CardTitle className="text-lg">AirSense Assistant</CardTitle>
                                    <CardDescription className="flex items-center gap-1.5 text-xs">
                                        <Sparkles className="size-3 text-amber-500" /> Powered by HealthAI
                                    </CardDescription>
                                </div>
                            </div>

                            {/* Quick Prompts Container */}
                            <div className="hidden sm:flex gap-2">
                                <Badge label="Best time to run?" icon={<Wind className="size-3" />} onClick={() => setInput("When is the best time to go for a run today?")} />
                                <Badge label="Daily Summary" icon={<Leaf className="size-3" />} onClick={() => setInput("Give me a summary of today's air quality.")} />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-teal-100 text-teal-600'
                                    }`}>
                                    {msg.role === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
                                </div>

                                <div className={`max-w-[80%] px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-500/10'
                                        : 'bg-slate-100 text-slate-800 rounded-tl-sm border border-slate-200/50'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex gap-4">
                                <div className="size-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                                    <Bot className="size-4" />
                                </div>
                                <div className="bg-slate-100 px-5 py-4 rounded-2xl rounded-tl-sm border border-slate-200/50 flex space-x-1.5 items-center">
                                    <div className="size-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="size-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="size-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="p-4 bg-white border-t border-slate-100">
                        <form
                            className="flex w-full items-end gap-3"
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        >
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about air quality, health recommendations..."
                                className="h-14 bg-slate-50 border-slate-200 text-base rounded-2xl focus-visible:ring-teal-500"
                            />
                            <Button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="h-14 w-14 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/20 shrink-0"
                            >
                                <Send className="size-5" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

function Badge({ label, icon, onClick }: { label: string, icon: React.ReactNode, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-teal-100 hover:border-teal-300 hover:bg-teal-50 text-teal-800 text-xs font-medium rounded-full transition-all shadow-sm"
        >
            {icon}
            {label}
        </button>
    )
}
