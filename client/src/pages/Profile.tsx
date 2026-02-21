import { useAuthStore } from '../stores/authStore'
import { usePersonalizationStore } from '../stores/personalizationStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Activity, HeartPulse, Wind, Calendar, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
    const { user } = useAuthStore()
    const personalization = usePersonalizationStore()
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Profile</h1>
                    <p className="text-slate-500 mt-2">Manage your personal details and health preferences.</p>
                </div>

                {/* User Info Card */}
                <Card className="border-0 shadow-lg shadow-slate-200/50 overflow-hidden rounded-3xl">
                    <div className="h-32 bg-gradient-to-r from-teal-500 to-blue-600"></div>
                    <CardContent className="px-8 pb-8 -mt-12">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
                            <div className="size-24 bg-white rounded-full p-1.5 shadow-xl">
                                <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-teal-600">
                                    <User className="size-10" />
                                </div>
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <h2 className="text-2xl font-bold text-slate-800">{user?.name || 'Guest User'}</h2>
                                <p className="text-slate-500 font-medium">{user?.email}</p>
                            </div>
                            <Button variant="outline" className="rounded-full shadow-sm hover:bg-slate-50">
                                Edit Profile
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Health Preferences */}
                <div className="grid md:grid-cols-2 gap-8">
                    <Card className="border-0 shadow-md shadow-slate-200/40 rounded-3xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HeartPulse className="text-teal-500 size-5" />
                                Health Profile
                            </CardTitle>
                            <CardDescription>Factors influencing your air quality insights</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <ProfileItem icon={<User className="size-4" />} label="Category" value={personalization.medicalCategory || 'Not set'} />
                                <ProfileItem icon={<Wind className="size-4" />} label="Asthma Status" value={personalization.asthma ? 'Asthma Patient' : 'No history'} />
                                <ProfileItem icon={<HeartPulse className="size-4" />} label="Pregnancy" value={personalization.pregnancy ? 'Yes' : 'No'} />
                                <ProfileItem icon={<Calendar className="size-4" />} label="Age Group" value={personalization.ageGroup || 'Adult'} />
                            </div>

                            <Button onClick={() => navigate('/personalize')} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-none font-medium text-base rounded-xl">
                                Update Health Details
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md shadow-slate-200/40 rounded-3xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="text-blue-500 size-5" />
                                Lifestyle & Defaults
                            </CardTitle>
                            <CardDescription>Activity levels and base locations</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <ProfileItem icon={<Activity className="size-4" />} label="Fitness Level" value={personalization.fitnessLevel || 'Not set'} />
                                <ProfileItem icon={<MapPin className="size-4" />} label="Primary Location" value="Downtown Seattle (Default)" />
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <h4 className="text-sm font-semibold text-slate-700 mb-2">Custom Notes</h4>
                                <p className="text-slate-600 text-sm italic">
                                    "{personalization.customNotes || 'No custom notes added.'}"
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function ProfileItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100/50 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3 text-slate-600">
                <div className="bg-white p-1.5 rounded-lg shadow-sm">
                    {icon}
                </div>
                <span className="font-medium text-sm">{label}</span>
            </div>
            <span className="text-slate-800 font-semibold">{value}</span>
        </div>
    )
}
