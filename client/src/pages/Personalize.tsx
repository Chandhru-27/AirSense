import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Map, ChevronRight, ChevronLeft, Loader2, User, HeartPulse, Wind, Activity, CheckCircle2 } from 'lucide-react'
import { useUpdateProfile, useSaveHealthProfile } from '../lib/hooks'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonalData {
    full_name: string
    phone: string
    age: string
    gender: 'Male' | 'Female' | 'Other' | ''
    address: string
}

interface HealthData {
    // Respiratory
    has_asthma: boolean | null
    has_copd: boolean | null
    has_allergies: boolean | null
    // Cardiovascular
    has_heart_condition: boolean | null
    // Special
    is_pregnant: boolean | null
    takes_inhaler: boolean | null
    // Lifestyle
    smoking_status: 'Never' | 'Former' | 'Current' | ''
    fitness_level: 'Sedentary' | 'Moderate' | 'Active' | ''
    outdoor_exposure: 'Low' | 'Medium' | 'High' | ''
    // Breathing
    breathing_difficulty: 'Never' | 'Sometimes' | 'Often' | ''
    // Notes
    custom_notes: string
}

// ─── Helper Components ────────────────────────────────────────────────────────

function BoolQuestion({
    label,
    value,
    onChange,
}: {
    label: string
    value: boolean | null
    onChange: (v: boolean) => void
}) {
    return (
        <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">{label}</p>
            <div className="flex gap-3">
                {([true, false] as const).map((v) => (
                    <button
                        key={String(v)}
                        type="button"
                        onClick={() => onChange(v)}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${value === v
                            ? v
                                ? 'bg-teal-50 border-teal-500 text-teal-700'
                                : 'bg-slate-50 border-slate-400 text-slate-700'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                    >
                        {v ? 'Yes' : 'No'}
                    </button>
                ))}
            </div>
        </div>
    )
}

// ─── Phase definitions ────────────────────────────────────────────────────────

const TOTAL_STEPS = 7  // Phase 1: 1 step | Phase 2: 5 steps + summary
const PHASE2_START = 1

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Personalize() {
    const navigate = useNavigate()
    const { mutateAsync: updateProfile, isPending: savingProfile } = useUpdateProfile()
    const { mutateAsync: saveHealth, isPending: savingHealth } = useSaveHealthProfile()

    const [step, setStep] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const [personal, setPersonal] = useState<PersonalData>({
        full_name: '', phone: '', age: '', gender: '', address: '',
    })

    const [health, setHealth] = useState<HealthData>({
        has_asthma: null, has_copd: null, has_allergies: null,
        has_heart_condition: null,
        is_pregnant: null, takes_inhaler: null,
        smoking_status: '', fitness_level: '', outdoor_exposure: '',
        breathing_difficulty: '', custom_notes: '',
    })

    const isLastStep = step === TOTAL_STEPS - 1

    // ── Validation ──────────────────────────────────────────────────────────

    const canProceed = (): boolean => {
        if (step === 0) return !!personal.full_name.trim() && !!personal.gender
        if (step === 1) return health.has_asthma !== null && health.has_copd !== null && health.has_allergies !== null
        if (step === 2) return health.has_heart_condition !== null
        if (step === 3) return health.is_pregnant !== null && health.takes_inhaler !== null
        if (step === 4) return !!health.smoking_status && !!health.fitness_level && !!health.outdoor_exposure
        if (step === 5) return !!health.breathing_difficulty
        return true
    }

    // ── Navigation ──────────────────────────────────────────────────────────

    const handleNext = async () => {
        setError(null)

        if (step === 0) {
            // Save personal info before going to health questions
            try {
                await updateProfile({
                    full_name: personal.full_name || undefined,
                    phone: personal.phone || undefined,
                    age: personal.age ? parseInt(personal.age) : undefined,
                    gender: personal.gender || undefined,
                    address: personal.address || undefined,
                })
            } catch {
                setError('Failed to save personal info. Please try again.')
                return
            }
        }

        if (isLastStep) {
            // Save health profile, then go to dashboard
            try {
                const payload: any = {
                    has_asthma: health.has_asthma ?? false,
                    has_copd: health.has_copd ?? false,
                    has_allergies: health.has_allergies ?? false,
                    has_heart_condition: health.has_heart_condition ?? false,
                    is_pregnant: health.is_pregnant ?? false,
                    takes_inhaler: health.takes_inhaler ?? false,
                    smoking_status: health.smoking_status || 'Never',
                    fitness_level: health.fitness_level || 'Moderate',
                    outdoor_exposure: health.outdoor_exposure || 'Medium',
                    breathing_difficulty: health.breathing_difficulty || 'Never',
                    custom_notes: health.custom_notes || null,
                }
                await saveHealth(payload)
                navigate('/dashboard')
            } catch {
                setError('Failed to save health profile. Please try again.')
            }
            return
        }

        setStep(s => s + 1)
    }

    const handleBack = () => {
        setError(null)
        setStep(s => s - 1)
    }

    const phase = step < PHASE2_START + 1 ? 1 : 2
    const isPending = savingProfile || savingHealth

    // ── Step titles & icons ─────────────────────────────────────────────────
    const stepMeta = [
        { title: 'Your Personal Details', subtitle: 'Help us personalize your profile.', icon: User },
        { title: 'Respiratory Health', subtitle: 'Do you suffer from any breathing-related conditions?', icon: Wind },
        { title: 'Cardiovascular Health', subtitle: 'Heart conditions affect how you should respond to pollution spikes.', icon: HeartPulse },
        { title: 'Special Conditions', subtitle: 'Pregnancy and inhaler use impact your pollution sensitivity.', icon: HeartPulse },
        { title: 'Lifestyle', subtitle: 'Your daily habits help us tailor alerts and recommendations.', icon: Activity },
        { title: 'Breathing Patterns', subtitle: 'How often do you experience shortness of breath?', icon: Wind },
        { title: 'Anything else?', subtitle: 'Final step — optional notes and a summary of your profile.', icon: CheckCircle2 },
    ]

    const { title, subtitle, icon: StepIcon } = stepMeta[step]

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            {/* Decorative background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
            </div>

            <div className="w-full max-w-2xl relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 text-teal-600 mb-4 shadow-sm">
                        <Map className="size-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Set Up Your AirSense Profile</h1>
                    <p className="text-slate-500 mt-2 text-base">
                        Phase {phase} of 2 — {phase === 1 ? 'Personal Information' : 'Health Questionnaire'}
                    </p>
                </div>

                <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white/90 backdrop-blur-xl overflow-hidden">
                    {/* Progress bar */}
                    <div className="h-1.5 w-full bg-slate-100">
                        <div
                            className="h-full bg-teal-500 transition-all duration-500 ease-out"
                            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
                        />
                    </div>

                    <CardHeader className="pt-8 pb-4 text-center">
                        <div className="flex items-center justify-center mb-3">
                            <div className="size-12 rounded-2xl bg-teal-50 flex items-center justify-center">
                                <StepIcon className="size-6 text-teal-600" />
                            </div>
                        </div>
                        <div className="text-xs font-semibold text-teal-600 tracking-wider uppercase mb-1">
                            Step {step + 1} of {TOTAL_STEPS}
                        </div>
                        <CardTitle className="text-2xl text-slate-800">{title}</CardTitle>
                        <CardDescription className="text-sm mt-1">{subtitle}</CardDescription>
                    </CardHeader>

                    <CardContent className="px-8 pb-4">
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-400 space-y-5">

                            {/* ── Step 0: Personal Info ── */}
                            {step === 0 && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 space-y-1.5">
                                            <Label>Full Name <span className="text-red-400">*</span></Label>
                                            <Input placeholder="e.g. Priya Sharma" value={personal.full_name}
                                                onChange={e => setPersonal(p => ({ ...p, full_name: e.target.value }))} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Phone</Label>
                                            <Input type="tel" placeholder="+91 98765 43210" value={personal.phone}
                                                onChange={e => setPersonal(p => ({ ...p, phone: e.target.value }))} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Age</Label>
                                            <Input type="number" placeholder="25" min={1} max={120} value={personal.age}
                                                onChange={e => setPersonal(p => ({ ...p, age: e.target.value }))} />
                                        </div>
                                        <div className="col-span-2 space-y-1.5">
                                            <Label>Gender <span className="text-red-400">*</span></Label>
                                            <select
                                                value={personal.gender}
                                                onChange={e => setPersonal(p => ({ ...p, gender: e.target.value as 'Male' | 'Female' | 'Other' }))}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            >
                                                <option value="">Select gender...</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other / Prefer not to say</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2 space-y-1.5">
                                            <Label>Address / Area</Label>
                                            <Input placeholder="e.g. Anna Nagar, Chennai" value={personal.address}
                                                onChange={e => setPersonal(p => ({ ...p, address: e.target.value }))} />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* ── Step 1: Respiratory ── */}
                            {step === 1 && (
                                <>
                                    <BoolQuestion label="Have you been diagnosed with Asthma?" value={health.has_asthma}
                                        onChange={v => setHealth(h => ({ ...h, has_asthma: v }))} />
                                    <BoolQuestion label="Have you been diagnosed with COPD (Chronic Obstructive Pulmonary Disease)?" value={health.has_copd}
                                        onChange={v => setHealth(h => ({ ...h, has_copd: v }))} />
                                    <BoolQuestion label="Do you suffer from seasonal or environmental allergies (dust, pollen, pet dander)?" value={health.has_allergies}
                                        onChange={v => setHealth(h => ({ ...h, has_allergies: v }))} />
                                </>
                            )}

                            {/* ── Step 2: Cardiovascular ── */}
                            {step === 2 && (
                                <BoolQuestion label="Do you have a diagnosed cardiovascular (heart) condition such as coronary artery disease, arrhythmia, or hypertension?" value={health.has_heart_condition}
                                    onChange={v => setHealth(h => ({ ...h, has_heart_condition: v }))} />
                            )}

                            {/* ── Step 3: Special conditions ── */}
                            {step === 3 && (
                                <>
                                    {personal.gender === 'Female' && (
                                        <BoolQuestion label="Are you currently pregnant?" value={health.is_pregnant}
                                            onChange={v => setHealth(h => ({ ...h, is_pregnant: v }))} />
                                    )}
                                    {personal.gender !== 'Female' && health.is_pregnant === null && (
                                        // Auto-set non-females to false
                                        <div className="hidden">{(() => { setHealth(h => ({ ...h, is_pregnant: false })); return null })()}</div>
                                    )}
                                    <BoolQuestion label="Do you regularly use an inhaler or any respiratory medication?" value={health.takes_inhaler}
                                        onChange={v => setHealth(h => ({ ...h, takes_inhaler: v }))} />
                                </>
                            )}

                            {/* ── Step 4: Lifestyle ── */}
                            {step === 4 && (
                                <>
                                    <div className="space-y-1.5">
                                        <Label>Smoking Status</Label>
                                        <select
                                            value={health.smoking_status}
                                            onChange={e => setHealth(h => ({ ...h, smoking_status: e.target.value as 'Never' | 'Former' | 'Current' }))}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="">Select one...</option>
                                            <option value="Never">Never smoked</option>
                                            <option value="Former">Former smoker</option>
                                            <option value="Current">Current smoker</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Physical Fitness Level</Label>
                                        <select
                                            value={health.fitness_level}
                                            onChange={e => setHealth(h => ({ ...h, fitness_level: e.target.value as 'Sedentary' | 'Moderate' | 'Active' }))}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="">Select one...</option>
                                            <option value="Active">Active — exercise 4+ days a week</option>
                                            <option value="Moderate">Moderate — light exercise 1–3 days a week</option>
                                            <option value="Sedentary">Sedentary — little to no regular exercise</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Daily Outdoor Exposure</Label>
                                        <select
                                            value={health.outdoor_exposure}
                                            onChange={e => setHealth(h => ({ ...h, outdoor_exposure: e.target.value as 'Low' | 'Medium' | 'High' }))}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="">Select one...</option>
                                            <option value="High">High — most of the day outdoors</option>
                                            <option value="Medium">Medium — a few hours outdoors</option>
                                            <option value="Low">Low — mostly indoors</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* ── Step 5: Breathing patterns ── */}
                            {step === 5 && (
                                <div className="space-y-1.5">
                                    <Label>How often do you experience shortness of breath or chest tightness?</Label>
                                    <div className="grid grid-cols-3 gap-3 mt-2">
                                        {(['Never', 'Sometimes', 'Often'] as const).map(opt => (
                                            <button key={opt} type="button"
                                                onClick={() => setHealth(h => ({ ...h, breathing_difficulty: opt }))}
                                                className={`py-4 rounded-xl text-sm font-semibold border-2 transition-all ${health.breathing_difficulty === opt
                                                    ? 'bg-teal-50 border-teal-500 text-teal-700'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                                    }`}>
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 6: Summary + Notes ── */}
                            {step === 6 && (
                                <div className="space-y-6">
                                    {/* Summary chips */}
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Your Profile Summary</p>
                                        <div className="flex flex-wrap gap-2">
                                            {personal.full_name && <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">{personal.full_name}</span>}
                                            {personal.gender && <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100">{personal.gender}, {personal.age ? `age ${personal.age}` : ''}</span>}
                                            {health.has_asthma && <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm font-medium border border-orange-100">Asthma</span>}
                                            {health.has_copd && <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm font-medium border border-orange-100">COPD</span>}
                                            {health.has_allergies && <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium border border-yellow-100">Allergies</span>}
                                            {health.has_heart_condition && <span className="bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-sm font-medium border border-rose-100">Heart Condition</span>}
                                            {health.is_pregnant && <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium border border-purple-100">Pregnant</span>}
                                            {health.takes_inhaler && <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm font-medium border border-teal-100">Inhaler User</span>}
                                            {health.fitness_level && <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-100">{health.fitness_level} Fitness</span>}
                                            {health.smoking_status && health.smoking_status !== 'Never' && <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">{health.smoking_status} Smoker</span>}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>Any other conditions or notes? <span className="text-slate-400 font-normal">(optional)</span></Label>
                                        <Textarea
                                            placeholder="E.g. I have pet allergies, or I'm recovering from a respiratory infection..."
                                            className="min-h-[100px] resize-none focus-visible:ring-teal-500 text-sm p-4 bg-slate-50"
                                            value={health.custom_notes}
                                            onChange={e => setHealth(h => ({ ...h, custom_notes: e.target.value }))}
                                        />
                                    </div>

                                    <div className="bg-teal-50 text-teal-800 p-4 rounded-xl flex items-start gap-3 border border-teal-100">
                                        <Wind className="size-5 shrink-0 mt-0.5" />
                                        <p className="text-sm leading-relaxed">
                                            Your health profile is used to personalize alerts, route recommendations, and AQI thresholds. You can edit it anytime from your profile settings.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Error message */}
                            {error && (
                                <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-3 rounded-xl border border-red-100">{error}</p>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="px-8 pb-8 pt-2 flex justify-between">
                        <Button variant="ghost" onClick={handleBack} disabled={step === 0 || isPending}
                            className={`text-slate-500 hover:text-slate-900 hover:bg-slate-100 ${step === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                            <ChevronLeft className="mr-2 size-4" />
                            Back
                        </Button>

                        <Button onClick={handleNext} disabled={!canProceed() || isPending}
                            className="bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/20 px-8 disabled:opacity-50 transition-all rounded-full">
                            {isPending
                                ? <><Loader2 className="mr-2 size-4 animate-spin" /> Saving...</>
                                : isLastStep
                                    ? <><CheckCircle2 className="mr-2 size-4" /> Go to Dashboard</>
                                    : <>Next <ChevronRight className="ml-2 size-4" /></>}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
