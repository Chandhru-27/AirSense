import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Phone, Mail, MessageSquare, Heart, Shield, Loader2, CheckCircle2, X, User } from 'lucide-react'
import { useSendMessage } from '../lib/hooks'

const COUNSELLORS = [
    {
        name: 'Dr. Priya Ramesh',
        role: 'Clinical Psychologist',
        phone: '+91 98413 22801',
        email: 'priya.ramesh@airsense.com',
        availability: 'Mon – Fri, 9 AM – 6 PM',
    },
    {
        name: 'Mr. Arjun Mehta',
        role: 'Mental Health Counsellor',
        phone: '+91 77180 56342',
        email: 'arjun.mehta@airsense.com',
        availability: '24 / 7 Emergency',
    },
]

export default function Helpline() {
    const [isSent, setIsSent] = useState(false)
    const [formData, setFormData] = useState({ full_name: '', email: '', message: '' })
    const { mutateAsync: sendMessage, isPending: isSending } = useSendMessage()
    const [showCounsellorModal, setShowCounsellorModal] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await sendMessage(formData)
            setIsSent(true)
            setFormData({ full_name: '', email: '', message: '' })
        } catch (error) {
            console.error('Failed to send message:', error)
        }
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
                                            <p className="text-xl font-bold text-slate-900">+91 91234 43219</p>
                                            <p className="text-xl font-bold text-slate-900">+91 91774 01243</p>
                                            <p className="text-xl font-bold text-slate-900"><span className='font-medium text-blue-500'>Landline</span> 044 8183 4178</p>
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
                        <Card className="border-0 shadow-xl shadow-teal-100/50 rounded-3xl overflow-hidden bg-gradient-to-br from-teal-600 to-blue-700 text-white">
                            <CardContent className="p-8 space-y-6 relative overflow-hidden">
                                <Heart className="absolute -right-8 -bottom-8 size-48 opacity-10" />
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Shield className="size-6" />
                                        <h3 className="text-2xl font-bold">Mental Health Help</h3>
                                    </div>
                                    <p className="text-teal-50 text-base leading-relaxed font-medium">
                                        Air quality can impact your mental well-being. If you're feeling overwhelmed, anxious, or just need to talk, we can connect you with a professional counsellor immediately.
                                    </p>
                                    <Button
                                        onClick={() => setShowCounsellorModal(true)}
                                        className="w-full bg-white text-teal-700 hover:bg-teal-50 h-14 rounded-2xl font-bold text-lg shadow-lg"
                                    >
                                        Connect with a Counsellor
                                    </Button>
                                    <p className="text-xs text-teal-100 text-center">Your privacy is our priority. All conversations are confidential.</p>
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
                                        <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="John Doe" required className="h-12 border-slate-200 rounded-xl focus-visible:ring-teal-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Your Email</label>
                                        <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} type="email" placeholder="john@example.com" required className="h-12 border-slate-200 rounded-xl focus-visible:ring-teal-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">How can we help?</label>
                                        <Textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder="Type your message here..." required className="min-h-[150px] border-slate-200 rounded-xl focus-visible:ring-teal-500 resize-none" />
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

            {/* ── Counsellor Contact Modal ───────────────────────────────────────── */}
            {showCounsellorModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
                    onClick={(e) => { if (e.target === e.currentTarget) setShowCounsellorModal(false) }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-teal-600 to-blue-700 p-6 text-white relative">
                            <button
                                onClick={() => setShowCounsellorModal(false)}
                                className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                            >
                                <X className="size-4" />
                            </button>
                            <div className="flex items-center gap-3 mb-1">
                                <Shield className="size-5" />
                                <h2 className="text-xl font-bold">Our Counsellors</h2>
                            </div>
                            <p className="text-teal-100 text-sm">All conversations are strictly confidential</p>
                        </div>

                        {/* Counsellor Cards */}
                        <div className="p-6 space-y-4">
                            {COUNSELLORS.map((c) => (
                                <div
                                    key={c.email}
                                    className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="size-11 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
                                            <User className="size-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{c.name}</p>
                                            <p className="text-xs text-slate-500">{c.role}</p>
                                        </div>
                                        <span className="ml-auto text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                                            {c.availability}
                                        </span>
                                    </div>

                                    <div className="space-y-2 pl-1">
                                        <a
                                            href={`tel:${c.phone.replace(/\s/g, '')}`}
                                            className="flex items-center gap-3 text-sm font-semibold text-slate-700 hover:text-teal-600 transition-colors group"
                                        >
                                            <span className="size-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-teal-500 group-hover:bg-teal-50 transition-colors">
                                                <Phone className="size-4" />
                                            </span>
                                            {c.phone}
                                        </a>
                                        <a
                                            href={`mailto:${c.email}`}
                                            className="flex items-center gap-3 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors group"
                                        >
                                            <span className="size-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-500 group-hover:bg-blue-50 transition-colors">
                                                <Mail className="size-4" />
                                            </span>
                                            {c.email}
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="px-6 pb-6">
                            <Button
                                onClick={() => setShowCounsellorModal(false)}
                                className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
