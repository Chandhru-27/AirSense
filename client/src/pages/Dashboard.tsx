import { useAQIStore, type TimeFrame } from '../stores/aqiStore'
import { usePersonalizationStore } from '../stores/personalizationStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Wind, CloudRain, Sun, Cloud, AlertCircle, Thermometer, Info, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Circle, useMap, Tooltip as LeafletTooltip } from 'react-leaflet'

// Default fallback center if location access is denied
const fallbackCenter: [number, number] = [13.0827, 80.2707];

// Component to dynamically update map center when location changes
function MapController({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

// Chennai Pollution Risk Points
const chennaiRiskPoints = [
    { name: "Manali Industrial Zone", lat: 13.1667, lng: 80.2667, risk: "Severe", color: "#ef4444", aqi: 185 },
    { name: "T. Nagar Commercial Hub", lat: 13.0418, lng: 80.2341, risk: "Medium", color: "#f97316", aqi: 112 },
    { name: "Adyar Residential Area", lat: 13.0033, lng: 80.2550, risk: "Minimal", color: "#10b981", aqi: 42 },
    { name: "Ambattur Industrial Estate", lat: 13.1143, lng: 80.1548, risk: "Severe", color: "#ef4444", aqi: 168 },
    { name: "Marina Beach", lat: 13.0500, lng: 80.2824, risk: "Minimal", color: "#10b981", aqi: 35 },
    { name: "Guindy Tech Park", lat: 13.0067, lng: 80.2206, risk: "Medium", color: "#f97316", aqi: 95 },
    { name: "Velachery Junction", lat: 12.9792, lng: 80.2184, risk: "Medium", color: "#f97316", aqi: 125 },
    { name: "Perungudi Dump Yard", lat: 12.9385, lng: 80.2312, risk: "Severe", color: "#ef4444", aqi: 195 },
]

const mockWeeklyWeather = [
    { day: 'Sat', condition: 'Rainy', high: 28, low: 24, icon: CloudRain },
    { day: 'Sun', condition: 'Partly Cloudy', high: 29, low: 24, icon: Cloud },
    { day: 'Mon', condition: 'Sunny', high: 29, low: 24, icon: Sun },
    { day: 'Tue', condition: 'Partly Cloudy', high: 29, low: 23, icon: Sun },
    { day: 'Wed', condition: 'Partly Cloudy', high: 29, low: 23, icon: Sun },
    { day: 'Thu', condition: 'Sunny', high: 29, low: 23, icon: Sun },
    { day: 'Fri', condition: 'Sunny', high: 31, low: 23, icon: Sun },
    { day: 'Sat', condition: 'Sunny', high: 31, low: 23, icon: Sun },
]

const weatherTimeline = [
    { time: '7 pm', temp: 26 },
    { time: '10 pm', temp: 26 },
    { time: '1 am', temp: 26 },
    { time: '4 am', temp: 25 },
    { time: '7 am', temp: 24 },
    { time: '10 am', temp: 28 },
    { time: '1 pm', temp: 29 },
    { time: '4 pm', temp: 28 },
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

    const [location] = useState<[number, number]>(fallbackCenter)
    const [locationName, setLocationName] = useState("Chennai City")

    useEffect(() => {
        setLocationName("Chennai City");
    }, []);

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
                    <MapContainer center={location} zoom={12} style={{ height: '100%', width: '100%', zIndex: 0 }} zoomControl={false} scrollWheelZoom={false}>
                        <MapController center={location} />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {chennaiRiskPoints.map((point, idx) => (
                            <Circle
                                key={idx}
                                center={[point.lat, point.lng]}
                                radius={400}
                                pathOptions={{
                                    color: point.color,
                                    fillColor: point.color,
                                    fillOpacity: 0.8,
                                    stroke: true,
                                    weight: 2
                                }}
                            >
                                <LeafletTooltip>
                                    <div className="bg-white p-2 rounded shadow-lg border border-slate-200">
                                        <p className="font-bold text-slate-800">{point.name}</p>
                                        <p className="text-sm text-slate-500">Risk: <span style={{ color: point.color }}>{point.risk}</span></p>
                                        <p className="text-xs text-slate-400">AQI: {point.aqi}</p>
                                        <p className="text-[10px] text-slate-300 mt-1">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</p>
                                    </div>
                                </LeafletTooltip>
                            </Circle>
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
                                <h2 className="text-white font-semibold text-lg leading-none">{locationName}</h2>
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
                {/* Weather Hub Section */}
                <Card className="border-0 shadow-2xl rounded-[32px] overflow-hidden bg-[#1e1e1e] text-white">
                    <CardContent className="p-0">
                        {/* Top Weather Info */}
                        <div className="p-8 lg:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <Sun className="size-20 text-yellow-500 fill-yellow-500/20" />
                                    <Cloud className="size-12 text-slate-400 absolute -bottom-2 -right-2" />
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-8xl font-medium tracking-tighter">26</span>
                                        <div className="text-2xl font-light text-slate-400 flex gap-2">
                                            <span className="text-white font-normal">°C</span>
                                            <span>|</span>
                                            <span>°F</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 text-slate-400 text-sm mt-2">
                                        <span>Precipitation: 8%</span>
                                        <span>Humidity: 79%</span>
                                        <span>Wind: 18 km/h</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-5xl font-light tracking-tight">Weather</h2>
                                <p className="text-slate-400 mt-1 text-lg">Saturday, 6:00 pm</p>
                                <p className="text-slate-400 font-medium">Clear with periodic clouds</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="px-8 lg:px-12 flex gap-8 text-lg font-medium border-b border-white/5">
                            <button className="pb-4 border-b-2 border-yellow-500 text-white">Temperature</button>
                            <button className="pb-4 text-slate-500 hover:text-slate-300">Precipitation</button>
                            <button className="pb-4 text-slate-500 hover:text-slate-300">Wind</button>
                        </div>

                        {/* Temperature Chart */}
                        <div className="p-4 lg:p-12 pb-4">
                            <div className="h-[200px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={weatherTimeline}>
                                        <XAxis dataKey="time" hide />
                                        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                        <Line
                                            type="monotone"
                                            dataKey="temp"
                                            stroke="#facc15"
                                            strokeWidth={3}
                                            dot={{ fill: '#facc15', r: 0 }}
                                            activeDot={{ r: 6 }}
                                            label={(props: any) => (
                                                <text x={props.x} y={props.y - 15} fill="#fff" fontSize={12} textAnchor="middle" fontWeight="bold">
                                                    {props.value}
                                                </text>
                                            )}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-x-12 bottom-0 h-2 bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-transparent rounded-full" />
                            </div>
                            <div className="flex justify-between px-4 lg:px-12 mt-4 text-slate-500 text-sm font-medium">
                                {weatherTimeline.map((item, idx) => (
                                    <span key={idx}>{item.time}</span>
                                ))}
                            </div>
                        </div>

                        {/* 7-Day Forecast */}
                        <div className="p-6 lg:p-10 border-t border-white/5 grid grid-cols-4 lg:grid-cols-8 gap-4">
                            {mockWeeklyWeather.map((day, i) => (
                                <div key={i} className={`flex flex-col items-center gap-4 p-4 rounded-3xl transition-all ${i === 0 ? 'bg-white/5 border border-white/10' : 'hover:bg-white/5'}`}>
                                    <span className="font-bold text-lg">{day.day}</span>
                                    <day.icon className={`size-10 ${i === 0 ? 'text-blue-400' : 'text-yellow-500'}`} />
                                    <div className="flex flex-col items-center">
                                        <span className="font-bold text-xl">{day.high}°</span>
                                        <span className="text-slate-500 font-medium">{day.low}°</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

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
