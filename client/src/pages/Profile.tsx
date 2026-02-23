import { useAuthStore } from '../stores/authStore'
import { useProfile, useHealthProfile } from '../lib/hooks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Activity, HeartPulse, Wind, Calendar, MapPin, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
    const { user } = useAuthStore()
    const { data: profile, isLoading: profileLoading } = useProfile()
    const { data: health, isLoading: healthLoading } = useHealthProfile()
    const navigate = useNavigate()

    const isLoading = profileLoading || healthLoading

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Profile</h1>
                    <p className="text-slate-500 mt-2">Manage your personal details and health preferences.</p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="size-8 animate-spin text-teal-500" />
                    </div>
                ) : (
                    <>
                        {/* User Info Card */}
                        <Card className="border-0 shadow-lg shadow-slate-200/50 overflow-hidden rounded-xs">
                            <div className="h-32 bg-gradient-to-r from-teal-500 to-blue-600"></div>
                            <CardContent className="px-8 pb-8 -mt-12">
                                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
                                    <div className="size-24 bg-white rounded-full p-1.5 shadow-xl">
                                        <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-teal-600">
                                            <User className="size-10" />
                                        </div>
                                    </div>
                                    <div className="flex-1 pt-10 text-center sm:text-left">
                                        <h2 className="text-2xl font-bold text-slate-800">
                                            {profile?.full_name || user?.name || 'No name set'}
                                        </h2>
                                        <p className="text-slate-500 font-medium">{profile?.email || user?.email}</p>
                                        <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                                            {profile?.age && (
                                                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-xs font-medium">
                                                    Age {profile.age}
                                                </span>
                                            )}
                                            {profile?.gender && (
                                                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-xs font-medium">
                                                    {profile.gender}
                                                </span>
                                            )}
                                            {profile?.address && (
                                                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-xs font-medium flex items-center gap-1">
                                                    <MapPin className="size-3" /> {profile.address}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="rounded-xs shadow-sm hover:bg-slate-50"
                                        onClick={() => navigate('/personalize')}
                                    >
                                        Edit Profile
                                    </Button>
                                </div>

                                {/* Personal Details row */}
                                {profile?.phone && (
                                    <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Phone</p>
                                            <p className="text-slate-700 font-medium mt-0.5">{profile.phone}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Username</p>
                                            <p className="text-slate-700 font-medium mt-0.5">@{profile.username}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Member since</p>
                                            <p className="text-slate-700 font-medium mt-0.5">
                                                {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Health Profile & Lifestyle */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <Card className="border-0 shadow-md shadow-slate-200/40 rounded-xs">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <HeartPulse className="text-teal-500 size-5" />
                                        Health Profile
                                    </CardTitle>
                                    <CardDescription>Factors influencing your air quality insights</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {!health ? (
                                        <div className="text-center py-6 text-slate-400">
                                            <HeartPulse className="size-10 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">No health profile yet</p>
                                            <Button
                                                onClick={() => navigate('/personalize')}
                                                className="mt-3 rounded-xs text-sm"
                                                size="sm"
                                            >
                                                Complete Health Setup
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <ProfileItem icon={<Wind className="size-4" />} label="Asthma" value={health.has_asthma ? 'Yes' : 'No'} highlight={health.has_asthma} />
                                            <ProfileItem icon={<Wind className="size-4" />} label="COPD" value={health.has_copd ? 'Yes' : 'No'} highlight={health.has_copd} />
                                            <ProfileItem icon={<HeartPulse className="size-4" />} label="Heart Condition" value={health.has_heart_condition ? 'Yes' : 'No'} highlight={health.has_heart_condition} />
                                            <ProfileItem icon={<HeartPulse className="size-4" />} label="Allergies" value={health.has_allergies ? 'Yes' : 'No'} />
                                            <ProfileItem icon={<Calendar className="size-4" />} label="Inhaler User" value={health.takes_inhaler ? 'Yes' : 'No'} />
                                            {health.is_pregnant && (
                                                <ProfileItem icon={<HeartPulse className="size-4" />} label="Pregnant" value="Yes" highlight />
                                            )}
                                        </>
                                    )}

                                    {health && (
                                        <Button
                                            onClick={() => navigate('/personalize')}
                                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-none font-medium text-sm rounded-xl mt-2"
                                        >
                                            Update Health Details
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-md shadow-slate-200/40 rounded-xs">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="text-blue-500 size-5" />
                                        Lifestyle & Habits
                                    </CardTitle>
                                    <CardDescription>Activity levels and outdoor exposure</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {!health ? (
                                        <div className="text-slate-400 text-sm text-center py-6">Complete your health profile to see lifestyle data</div>
                                    ) : (
                                        <>
                                            <ProfileItem icon={<Activity className="size-4" />} label="Fitness Level" value={health.fitness_level || 'Not set'} />
                                            <ProfileItem icon={<MapPin className="size-4" />} label="Outdoor Exposure" value={health.outdoor_exposure || 'Not set'} />
                                            <ProfileItem icon={<Wind className="size-4" />} label="Breathing Difficulty" value={health.breathing_difficulty || 'Never'} highlight={health.breathing_difficulty === 'Often'} />
                                            <ProfileItem icon={<Activity className="size-4" />} label="Smoking Status" value={health.smoking_status || 'Never'} />
                                        </>
                                    )}

                                    {health?.custom_notes && (
                                        <div className="bg-slate-50 p-4 rounded-xs border border-slate-100 mt-2">
                                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Custom Notes</h4>
                                            <p className="text-slate-600 text-sm italic">"{health.custom_notes}"</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function ProfileItem({
    icon,
    label,
    value,
    highlight = false,
}: {
    icon: React.ReactNode
    label: string
    value: string
    highlight?: boolean
}) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100/50 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3 text-slate-600">
                <div className="bg-white p-1.5 rounded-lg shadow-sm">
                    {icon}
                </div>
                <span className="font-medium text-sm">{label}</span>
            </div>
            <span className={`font-semibold text-sm ${highlight ? 'text-orange-600' : 'text-slate-800'}`}>
                {value}
            </span>
        </div>
    )
}
