import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePersonalizationStore } from '../stores/personalizationStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Map, Wind, Activity, ChevronRight, ChevronLeft, HeartPulse, User } from 'lucide-react'

// Define the steps and their fields
const steps = [
    {
        id: 'category',
        title: 'Who are you?',
        subtitle: 'Help us tailor your air quality recommendations.',
        options: [
            { value: 'Normal Adult', label: 'Normal Adult', icon: User },
            { value: 'Elderly', label: 'Elderly (65+)', icon: User },
            { value: 'Pregnant', label: 'Pregnant', icon: HeartPulse },
            { value: 'Asthma Patient', label: 'Asthma Patient', icon: Wind },
            { value: 'Outdoor Worker', label: 'Outdoor Worker', icon: Activity },
        ]
    },
    {
        id: 'breathing',
        title: 'Respiratory Health',
        subtitle: 'Do you experience breathing difficulties frequently?',
        options: [
            { value: 'yes', label: 'Yes, often', icon: HeartPulse },
            { value: 'sometimes', label: 'Sometimes', icon: Wind },
            { value: 'no', label: 'No, rarely or never', icon: Activity },
        ]
    },
    {
        id: 'outdoor',
        title: 'Outdoor Activity',
        subtitle: 'How frequently are you outdoors?',
        options: [
            { value: 'high', label: 'Most of the day', icon: Activity },
            { value: 'medium', label: 'A few hours a day', icon: User },
            { value: 'low', label: 'Rarely (mostly indoors)', icon: HeartPulse },
        ]
    },
    {
        id: 'fitness',
        title: 'Fitness Level',
        subtitle: 'How would you describe your fitness level?',
        options: [
            { value: 'Active', label: 'Active (Exercise regularly)', icon: Activity },
            { value: 'Moderate', label: 'Moderate (Occasional exercise)', icon: User },
            { value: 'Sedentary', label: 'Sedentary (Little to no exercise)', icon: HeartPulse },
        ]
    },
    {
        id: 'final',
        title: 'Almost done!',
        subtitle: 'Anything else we should know?',
    }
]

export default function Personalize() {
    const [currentStep, setCurrentStep] = useState(0)
    const [answers, setAnswers] = useState<Record<string, any>>({
        category: '',
        breathing: '',
        outdoor: '',
        fitness: '',
        notes: ''
    })

    const navigate = useNavigate()
    const { setAnswers: saveAnswersToStore } = usePersonalizationStore()

    const currentStepData = steps[currentStep]

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(curr => curr + 1)
        } else {
            // Final step submit
            saveAnswersToStore({
                medicalCategory: answers.category,
                asthma: answers.category === 'Asthma Patient' || answers.breathing === 'yes',
                pregnancy: answers.category === 'Pregnant',
                fitnessLevel: answers.fitness,
                customNotes: answers.notes,
                ageGroup: answers.category === 'Elderly' ? '65+' : '18-64', // derived mock
            })
            navigate('/dashboard')
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(curr => curr - 1)
        }
    }

    const canProceed = () => {
        if (currentStepData.id === 'final') return true
        return !!answers[currentStepData.id]
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
            </div>

            <div className="w-full max-w-2xl relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 text-teal-600 mb-4 shadow-sm">
                        <Map className="size-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Let's Personalize AirSense</h1>
                    <p className="text-slate-500 mt-2 text-lg">Help us customize your air quality insights.</p>
                </div>

                <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white/90 backdrop-blur-xl overflow-hidden transition-all duration-500">
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-100">
                        <div
                            className="h-full bg-teal-500 transition-all duration-500 ease-out"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>

                    <CardHeader className="pt-8 pb-4 text-center">
                        <div className="text-sm font-semibold text-teal-600 tracking-wider uppercase mb-2">
                            Step {currentStep + 1} of {steps.length}
                        </div>
                        <CardTitle className="text-2xl text-slate-800">{currentStepData.title}</CardTitle>
                        <CardDescription className="text-base">{currentStepData.subtitle}</CardDescription>
                    </CardHeader>

                    <CardContent className="px-8 pb-8 pt-4">
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {currentStepData.id !== 'final' ? (
                                <RadioGroup
                                    value={answers[currentStepData.id]}
                                    onValueChange={(val: string) => setAnswers(prev => ({ ...prev, [currentStepData.id]: val }))}
                                    className="gap-4"
                                >
                                    {currentStepData.options?.map((option) => (
                                        <div key={option.value}>
                                            <RadioGroupItem
                                                value={option.value}
                                                id={option.value}
                                                className="peer sr-only"
                                            />
                                            <Label
                                                htmlFor={option.value}
                                                className="flex items-center justify-between p-4 bg-slate-50 border-2 border-slate-100 rounded-xl cursor-pointer hover:bg-teal-50 hover:border-teal-100 peer-data-[state=checked]:border-teal-500 peer-data-[state=checked]:bg-teal-50/50 peer-data-[state=checked]:shadow-sm transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg ${answers[currentStepData.id] === option.value ? 'bg-teal-100 text-teal-700' : 'bg-white text-slate-500 shadow-sm'}`}>
                                                        <option.icon className="size-5" />
                                                    </div>
                                                    <span className={`text-base font-medium ${answers[currentStepData.id] === option.value ? 'text-teal-900' : 'text-slate-700'}`}>
                                                        {option.label}
                                                    </span>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${answers[currentStepData.id] === option.value ? 'border-teal-500' : 'border-slate-300'}`}>
                                                    {answers[currentStepData.id] === option.value && (
                                                        <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                                                    )}
                                                </div>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            ) : (
                                <div className="space-y-4">
                                    <Label htmlFor="notes" className="text-slate-700 text-base">Any custom notes or conditions?</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="E.g., I have pet allergies, or I'm sensitive to dust..."
                                        className="min-h-[150px] resize-none focus-visible:ring-teal-500 text-base p-4 bg-slate-50"
                                        value={answers.notes}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAnswers(prev => ({ ...prev, notes: e.target.value }))}
                                    />
                                    <div className="bg-teal-50 text-teal-800 p-4 rounded-xl flex items-start gap-3 mt-6 border border-teal-100">
                                        <Wind className="size-5 shrink-0 mt-0.5" />
                                        <p className="text-sm leading-relaxed">
                                            We'll use these settings to send you hyper-local alerts and personalize your daily dashboard insights. You can always change these later in your profile.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="px-8 pb-8 pt-0 flex justify-between">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className={`text-slate-500 hover:text-slate-900 hover:bg-slate-100 ${currentStep === 0 ? 'opacity-0' : 'opacity-100'}`}
                        >
                            <ChevronLeft className="mr-2 size-4" />
                            Back
                        </Button>

                        <Button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className="bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/20 px-8 disabled:opacity-50 transition-all rounded-full"
                        >
                            {currentStep === steps.length - 1 ? 'Go to Dashboard' : 'Next'}
                            {currentStep !== steps.length - 1 && <ChevronRight className="ml-2 size-4" />}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
