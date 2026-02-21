import { useAQIStore, type TimeFrame } from '../stores/aqiStore'
import { usePersonalizationStore } from '../stores/personalizationStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Wind, CloudRain, Sun, Cloud, AlertCircle, Thermometer, Info, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { MapContainer, TileLayer, Circle } from 'react-leaflet'

const chennaiCenter: [number, number] = [13.0827, 80.2707];

const generateMockHeatmapData = () => {
    const points = [];
    const numPoints = 150;

    // Seeded random for consistent data points
    let seed = 1;
    const random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    for (let i = 0; i < numPoints; i++) {
        // Distribute points around Chennai (approx 30km spread)
        const lat = 13.0827 + (random() - 0.5) * 0.3;
        const lng = 80.2707 + (random() - 0.5) * 0.3;

        let aqi = random() * 100;

        // Industrial North is usually worse
        if (lat > 13.15) aqi += 80 + random() * 50;
        // Coastal areas are usually better
        else if (lng > 80.25 && lat < 13.05) aqi = Math.max(20, aqi - 30);
        // Commercial areas
        else aqi += random() * 60;

        let color = '#10b981'; // green (Good)
        if (aqi > 150) color = '#ef4444'; // red (Unhealthy)
        else if (aqi > 100) color = '#f97316'; // orange (Unhealthy for Sensitive)
        else if (aqi > 50) color = '#f59e0b'; // yellow (Moderate)

        points.push({ lat, lng, color, aqi, radius: 600 + random() * 1200 });
    }
    return points;
}
const heatmapData = generateMockHeatmapData();


const mockWeeklyWeather = [
    { day: 'Mon', condition: 'Sunny', temp: 24, icon: Sun },
    { day: 'Tue', condition: 'Cloudy', temp: 22, icon: Cloud },
    { day: 'Wed', condition: 'Rainy', temp: 19, icon: CloudRain },
    { day: 'Thu', condition: 'Windy', temp: 21, icon: Wind },
    { day: 'Fri', condition: 'Sunny', temp: 25, icon: Sun },
    { day: 'Sat', condition: 'Sunny', temp: 26, icon: Sun },
    { day: 'Sun', condition: 'Cloudy', temp: 23, icon: Cloud },
]

const mockAqiHistory = [
    { time: '6 AM', aqi: 42 },
    { time: '9 AM', aqi: 55 },
    { time: '12 PM', aqi: 85 },
    { time: '3 PM', aqi: 110 },
    { time: '6 PM', aqi: 95 },
    { time: '9 PM', aqi: 65 },
]

const mockPollutants = [
    { name: 'PM2.5', value: 35, fill: '#14b8a6' }, // Teal
    { name: 'PM10', value: 45, fill: '#3b82f6' },  // Blue
    { name: 'NO2', value: 20, fill: '#eab308' },  // Yellow
    { name: 'CO', value: 15, fill: '#22c55e' },   // Green
]

export default function Dashboard() {
    const { forecastAQI, selectedTimeFrame, setTimeFrame } = useAQIStore()
    const { medicalCategory, asthma, pregnancy } = usePersonalizationStore()

    const currentAQIData = forecastAQI[selectedTimeFrame]

    const timeFrames: { label: string; value: TimeFrame }[] = [
        { label: '+6hr', value: '6hr' },
        { label: '+12hr', value: '12hr' },
        { label: '+24hr', value: '24hr' },
        { label: '+2 Days', value: '2d' },
    ]

    // Generate personalized insights based on Zustand store
    const getInsights = () => {
        const insights = []

        // Generic insight based on AQI
        if (currentAQIData.value > 100) {
            insights.push({
                id: 1,
                title: 'Pollution levels are elevated',
                desc: `Today pollution levels are ${(currentAQIData.value - 50)}% higher than average.`,
                type: 'warning'
            })
        } else {
            insights.push({
                id: 1,
                title: 'Air quality is fair',
                desc: 'Great time for outdoor activities, pollution is minimal.',
                type: 'success'
            })
        }

        // Personalized insights
        if (asthma || medicalCategory === 'Asthma Patient') {
            if (currentAQIData.value > 80) {
                insights.push({
                    id: 2,
                    title: 'Asthma Alert',
                    desc: 'High particulate matter detected. Carry your inhaler and limit strenuous outdoor exercise.',
                    type: 'danger'
                })
            }
        }

        if (precipitation()) {
            insights.push({
                id: 3,
                title: 'Rain Expected',
                desc: 'Rain will likely clear up particulate matter, improving AQI later today.',
                type: 'info'
            })
        }

        if (currentAQIData.value > 150 || (asthma && currentAQIData.value > 100)) {
            insights.push({
                id: 4,
                title: 'Mask Recommended',
                desc: 'Wear an N95 mask if you must go outside.',
                type: 'danger'
            })
        }

        return insights
    }

    // Helper
    function precipitation() { return mockWeeklyWeather[0].condition === 'Rainy' || mockWeeklyWeather[1].condition === 'Rainy' }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50 pb-12">

            {/* 1. Fullscreen Heatmap Section */}
            <section className="relative w-full h-[100vh] min-h-[600px] bg-slate-900 overflow-hidden shrink-0">
                <div className="absolute inset-0 z-0">
                    <MapContainer center={chennaiCenter} zoom={12} style={{ height: '100%', width: '100%', zIndex: 0 }} zoomControl={false} scrollWheelZoom={false}>
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        {heatmapData.map((point, idx) => (
                            <Circle
                                key={idx}
                                center={[point.lat, point.lng]}
                                radius={point.radius}
                                pathOptions={{
                                    color: point.color,
                                    fillColor: point.color,
                                    fillOpacity: 0.3,
                                    stroke: false
                                }}
                            />
                        ))}
                    </MapContainer>
                </div>

                {/* Top Gradient for text readability */}
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-900/90 to-transparent pointer-events-none z-10" />

                {/* Bottom Gradient for seamless transition to content */}
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent pointer-events-none z-10" />

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-between p-6 lg:p-10 pointer-events-none z-20">

                    {/* Top Bar: Location & Status */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/20 shadow-lg pointer-events-auto">
                            <MapPin className="text-teal-400 size-5" />
                            <div>
                                <h2 className="text-white font-semibold text-lg leading-none">Chennai City</h2>
                                <p className="text-slate-300 text-sm mt-1">Live Street-level AQI</p>
                            </div>
                        </div>

                        {/* Floating AQI Badge */}
                        <div className="flex flex-col items-end pointer-events-auto">
                            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl flex flex-col items-center">
                                <span className="text-slate-200 text-sm font-medium uppercase tracking-wider mb-2">City avg AQI</span>
                                <span className={`text-6xl font-black ${currentAQIData.color === 'green' ? 'text-emerald-400' : currentAQIData.color === 'yellow' ? 'text-amber-400' : currentAQIData.color === 'orange' ? 'text-orange-400' : 'text-rose-500'}`}>
                                    {currentAQIData.value}
                                </span>
                                <span className="text-white font-medium mt-3 bg-white/10 px-3 py-1 rounded-full text-sm">
                                    {currentAQIData.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar: Timeframe Toggles */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-16 pointer-events-none">
                        <div className="flex-1 max-w-xl">
                            <h3 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">Forecast Prediction</h3>
                            <p className="text-slate-200 font-medium drop-shadow-md pb-6 text-lg">Scroll down to see detailed forecasting, personalized insights, and your health metrics.</p>
                        </div>

                        <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-white/40 flex gap-1 self-start md:self-auto pointer-events-auto">
                            {timeFrames.map((tf) => (
                                <Button
                                    key={tf.value}
                                    variant={selectedTimeFrame === tf.value ? 'default' : 'ghost'}
                                    onClick={() => setTimeFrame(tf.value)}
                                    className={`rounded-xl px-5 font-semibold transition-all ${selectedTimeFrame === tf.value
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                >
                                    {tf.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Scroll Down Section */}
            <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 space-y-8 -mt-8 relative z-20">

                {/* Weather Animation Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {mockWeeklyWeather.map((day, i) => (
                        <Card key={i} className={`border-0 shadow-sm transition-transform hover:-translate-y-1 ${i === 0 ? 'bg-teal-500 text-white shadow-teal-500/30' : 'bg-white'}`}>
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-3">
                                <span className={`text-xs font-bold uppercase tracking-wider ${i === 0 ? 'text-teal-100' : 'text-slate-400'}`}>{day.day}</span>
                                <day.icon className={`size-8 ${i === 0 ? 'text-white drop-shadow-md' : 'text-slate-700'}`} />
                                <div>
                                    <span className="text-lg font-bold">{day.temp}°</span>
                                    <span className={`text-sm block mt-0.5 font-medium ${i === 0 ? 'text-teal-100' : 'text-slate-500'}`}>{day.condition}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Main Analytics Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="border-0 shadow-lg shadow-slate-200/40 rounded-3xl overflow-hidden">
                            <CardHeader className="bg-white pb-2">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Activity className="text-teal-500" />
                                    Today's Timeline
                                </CardTitle>
                                <CardDescription>Hourly particulate matter concentration (PM2.5)</CardDescription>
                            </CardHeader>
                            <CardContent className="bg-white pt-4">
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={mockAqiHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="aqi"
                                                stroke="#14b8a6"
                                                strokeWidth={4}
                                                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                                activeDot={{ r: 8, fill: '#14b8a6', stroke: '#fff', strokeWidth: 3 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg shadow-slate-200/40 rounded-3xl overflow-hidden">
                            <CardHeader className="bg-white pb-2 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <Thermometer className="text-blue-500" />
                                        Pollutant Breakdown
                                    </CardTitle>
                                    <CardDescription className="mt-1">Primary contributors to current AQI</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="bg-white pt-4">
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={mockPollutants} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontWeight: 600, fontSize: 13 }} />
                                            <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Bar
                                                dataKey="value"
                                                radius={[0, 6, 6, 0]}
                                                barSize={24}
                                                animationDuration={1500}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Personalized Insights */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>

                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                    <Wind className="size-6 text-teal-300" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Health Guard</h3>
                                    <p className="text-indigo-200 text-sm">Personalized AI Insights</p>
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                {getInsights().map((insight, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-4 rounded-2xl backdrop-blur-md border ${insight.type === 'danger' ? 'bg-rose-500/10 border-rose-500/30 text-rose-100' :
                                            insight.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-100' :
                                                insight.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100' :
                                                    'bg-white/5 border-white/10 text-slate-200'
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            {insight.type === 'danger' ? <AlertCircle className="size-5 shrink-0 text-rose-400" /> :
                                                insight.type === 'warning' ? <AlertCircle className="size-5 shrink-0 text-amber-400" /> :
                                                    <Info className="size-5 shrink-0 text-teal-400" />}
                                            <div>
                                                <h4 className={`font-semibold text-sm mb-1 ${insight.type === 'danger' ? 'text-rose-300' :
                                                    insight.type === 'warning' ? 'text-amber-300' :
                                                        insight.type === 'success' ? 'text-emerald-300' :
                                                            'text-white'
                                                    }`}>{insight.title}</h4>
                                                <p className="text-sm opacity-90 leading-relaxed">{insight.desc}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Profile Context Card */}
                        <Card className="border-0 shadow-md shadow-slate-200/50 rounded-3xl bg-white overflow-hidden">
                            <div className="h-2 w-full bg-gradient-to-r from-teal-400 to-blue-500" />
                            <CardContent className="p-6">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Active Profile</h4>
                                <div className="flex flex-wrap gap-2">
                                    {medicalCategory && (
                                        <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-sm font-medium border border-slate-200">
                                            {medicalCategory}
                                        </span>
                                    )}
                                    {asthma && (
                                        <span className="bg-rose-50 text-rose-700 px-3 py-1.5 rounded-full text-sm font-medium border border-rose-200">
                                            Asthma Profile
                                        </span>
                                    )}
                                    {pregnancy && (
                                        <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium border border-purple-200">
                                            Pregnancy
                                        </span>
                                    )}
                                    <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-sm font-medium border border-slate-200 hover:bg-slate-200 cursor-pointer transition-colors">
                                        Edit Preferences →
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    )
}
