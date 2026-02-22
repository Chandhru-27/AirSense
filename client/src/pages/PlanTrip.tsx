import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Map, MapPin, Navigation, Compass, Search } from 'lucide-react'

export default function PlanTrip() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50 p-6 lg:p-10">
            <div className="max-w-5xl mx-auto w-full space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Map className="text-teal-500 size-8" />
                        Plan a Safe Trip
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">Check the air quality of your destination before you travel.</p>
                </div>

                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Main Content: Search & Route */}
                    <div className="space-y-6">
                        <Card className="border-0 shadow-lg shadow-slate-200/50 rounded-3xl overflow-hidden">
                            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-8 text-white relative overflow-hidden">
                                <div className="absolute right-0 top-0 opacity-10">
                                    <Compass className="size-48 -mr-12 -mt-12" />
                                </div>
                                <div className="relative z-10">
                                    <h2 className="text-2xl font-bold mb-2">Where are you going?</h2>
                                    <p className="text-teal-50">Enter your route to see a personalized air quality forecast.</p>
                                </div>
                            </div>
                            <CardContent className="p-8 space-y-6">
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                        <MapPin className="text-slate-400 size-5" />
                                    </div>
                                    <Input
                                        placeholder="Starting point (e.g., Downtown Seattle)"
                                        className="pl-12 h-14 bg-slate-50 border-slate-200 text-base rounded-2xl focus-visible:ring-teal-500"
                                        defaultValue="Downtown Seattle"
                                    />
                                </div>

                                <div className="relative flex justify-center py-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-slate-100 border-dashed" />
                                    </div>
                                    <div className="relative bg-white px-4 text-slate-400">
                                        <Navigation className="size-5 transform rotate-180" />
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                        <MapPin className="text-teal-500 size-5" />
                                    </div>
                                    <Input
                                        placeholder="Destination (e.g., Portland, OR)"
                                        className="pl-12 h-14 bg-slate-50 border-slate-200 text-base rounded-2xl focus-visible:ring-teal-500"
                                    />
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <Button className="flex-1 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl shadow-md shadow-teal-500/20 text-lg font-medium">
                                        <Search className="mr-2" />
                                        Analyze Route
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Mock Route Results */}
                        <Card className="border-0 shadow-sm border-slate-100 rounded-3xl bg-white/50 backdrop-blur-sm">
                            <CardContent className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
                                <div className="size-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                                    <Map className="size-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-700 w-full mb-1">No active route</h3>
                                <p>Enter a destination above to generate your health-aware travel plan.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
