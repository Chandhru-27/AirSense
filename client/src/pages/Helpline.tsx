import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Phone, Mail, MessageSquare, Heart, Shield, Loader2, CheckCircle2 } from 'lucide-react'

export default function Helpline() {
    const [isSending, setIsSending] = useState(false)
    const [isSent, setIsSent] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setIsSending(true)
        // Simulate email sending
        setTimeout(() => {
            setIsSending(false)
            setIsSent(true)
        }, 1500)
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 p-6 lg:p-10">
            <div className="max-w-4xl mx-auto w-full space-y-10">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Need Help?</h1>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                        We're here to support you. Whether it's a technical query, health concern, or emergency, reach out to us.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Contact Info */}
                    <div className="space-y-6">
                        <Card className="border-0 shadow-lg shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
                            <CardContent className="p-8 space-y-8">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600">
                                            <Phone className="size-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Call Us</p>
                                            <p className="text-xl font-bold text-slate-900">+1 (800) AIR-SENSE</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Mail className="size-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Email Us</p>
                                            <p className="text-xl font-bold text-slate-900">contact@airsense.com</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <h3 className="font-semibold text-slate-900 mb-2">Office Hours</h3>
                                    <p className="text-slate-500">Monday - Friday: 9:00 AM - 6:00 PM</p>
                                    <p className="text-slate-500">24/7 Emergency Support</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Mental Health Section */}
                        <Card className="border-0 shadow-xl shadow-rose-100/50 rounded-3xl overflow-hidden bg-gradient-to-br from-rose-500 to-pink-600 text-white">
                            <CardContent className="p-8 space-y-6 relative overflow-hidden">
                                <Heart className="absolute -right-8 -bottom-8 size-48 opacity-10" />
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Shield className="size-6" />
                                        <h3 className="text-2xl font-bold">Mental Health Help</h3>
                                    </div>
                                    <p className="text-rose-50 text-base leading-relaxed">
                                        Air quality can impact your mental well-being. If you're feeling overwhelmed, anxious, or just need to talk, we can connect you with a professional counsellor immediately.
                                    </p>
                                    <Button className="w-full bg-white text-rose-600 hover:bg-rose-50 h-14 rounded-2xl font-bold text-lg shadow-lg">
                                        Connect with a Counsellor
                                    </Button>
                                    <p className="text-xs text-rose-100 text-center">Your privacy is our priority. All conversations are confidential.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Email Form */}
                    <Card className="border-0 shadow-lg shadow-slate-200/50 rounded-3xl bg-white">
                        <CardHeader className="p-8 pb-0">
                            <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <MessageSquare className="text-teal-500" />
                                Send a Message
                            </CardTitle>
                            <CardDescription className="text-slate-500 mt-2">
                                Have a specific question? Fill out the form below and we'll get back to you within 24 hours.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-6">
                            {isSent ? (
                                <div className="text-center py-12 space-y-4 animate-in fade-in zoom-in duration-500">
                                    <div className="size-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                                        <CheckCircle2 className="size-10" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900">Message Sent!</h3>
                                    <p className="text-slate-500">Thank you for reaching out. We've received your query and will be in touch soon.</p>
                                    <Button onClick={() => setIsSent(false)} variant="outline" className="rounded-xl px-8 mt-4">
                                        Send Another
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">To:</label>
                                        <Input disabled value="contact@airsense.com" className="bg-slate-50 border-slate-200 h-12 rounded-xl text-slate-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Your Name</label>
                                        <Input placeholder="John Doe" required className="h-12 border-slate-200 rounded-xl focus-visible:ring-teal-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Your Email</label>
                                        <Input type="email" placeholder="john@example.com" required className="h-12 border-slate-200 rounded-xl focus-visible:ring-teal-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">How can we help?</label>
                                        <Textarea placeholder="Type your message here..." required className="min-h-[150px] border-slate-200 rounded-xl focus-visible:ring-teal-500 resize-none" />
                                    </div>
                                    <Button type="submit" disabled={isSending} className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg rounded-2xl shadow-lg transition-all active:scale-[0.98]">
                                        {isSending ? <Loader2 className="animate-spin mr-2" /> : null}
                                        {isSending ? 'Sending...' : 'Send Message'}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
