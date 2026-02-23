import { useAQIStore, type TimeFrame } from '../stores/aqiStore'
import { useProfile, useHealthProfile } from '../lib/hooks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Wind, CloudRain, Sun, Cloud, AlertCircle, Thermometer, Info, Activity, Droplets, CloudDrizzle, Snowflake, CloudLightning, CloudFog } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useState, useEffect } from 'react'
import MapView from '@/components/map/MapView'
import LocationSearch from '@/components/map/LocationSearch'
import { useWeather } from '@/hooks/useWeather'
import { getWeatherInfo, type WeatherIcon } from '@/lib/weatherCodeMap'
import { useNearestAQI } from '@/hooks/useNearestAQI'
import { useForecast, type ForecastHorizon } from '@/hooks/useForecast'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

// Heatmap and map controllers are now modularized in MapView.tsx



function WeatherIcon({ icon, className }: { icon: WeatherIcon; className?: string }) {
    const props = { className: className ?? 'size-10' }
    switch (icon) {
        case 'sunny':         return <Sun {...props} />
        case 'partly-cloudy': return <Cloud {...props} />
        case 'cloudy':        return <Cloud {...props} />
        case 'foggy':         return <CloudFog {...props} />
        case 'drizzle':       return <CloudDrizzle {...props} />
        case 'rain':          return <CloudRain {...props} />
        case 'snow':          return <Snowflake {...props} />
        case 'storm':         return <CloudLightning {...props} />
        default:              return <Cloud {...props} />
    }
}


export default function Dashboard() {
    const { forecastAQI, selectedTimeFrame, setTimeFrame } = useAQIStore()
    const { data: userProfile } = useProfile()
    const { data: healthProfile } = useHealthProfile()
    const navigate = useNavigate()

    const currentAQIData = forecastAQI[selectedTimeFrame]

    const timeFrames: { label: string; value: TimeFrame }[] = [
        { label: '+6hr', value: '6hr' },
        { label: '+12hr', value: '12hr' },
        { label: '+24hr', value: '24hr' },
        { label: '+2 Days', value: '2d' },
    ]

    const [location, setLocation] = useState<[number, number] | undefined>(undefined)
    const [locationName, setLocationName] = useState("Detecting location...")

    // Reverse-geocode whenever the pinned location changes
    useEffect(() => {
        if (!location) return
        const [lat, lng] = location
        const controller = new AbortController()
        fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { signal: controller.signal, headers: { 'Accept-Language': 'en' } }
        )
            .then((r) => r.json())
            .then((data) => {
                const addr = data.address
                const name =
                    addr.suburb ||
                    addr.neighbourhood ||
                    addr.city_district ||
                    addr.town ||
                    addr.village ||
                    addr.city ||
                    addr.county ||
                    data.display_name?.split(',')[0] ||
                    'Unknown location'
                setLocationName(name)
            })
            .catch(() => { /* silently ignore abort / network errors */ })
        return () => controller.abort()
    }, [location])

    const {
        current: wxCurrent,
        hourly: wxHourly,
        daily: wxDaily,
        currentHumidity,
        currentPrecipProb,
        loading: wxLoading,
        error: wxError,
    } = useWeather(location?.[0], location?.[1])

    const { data: aqiData } = useNearestAQI(location?.[0], location?.[1])

    // ── Forecast heatmap ───────────────────────────────────────────────────────
    const [horizon, setHorizon] = useState<ForecastHorizon>('now')
    const { heatmapPoints, loading: forecastLoading } = useForecast()
    const liveHeatmapPoints = heatmapPoints(horizon)

    // Build pollutant chart rows from live API data
    const pollutants = useMemo(() => [
        { name: 'PM2.5', value: Math.round(aqiData?.pm25 ?? 0), fill: '#14b8a6' },
        { name: 'NO2',   value: Math.round(aqiData?.no2  ?? 0), fill: '#eab308' },
        { name: 'O3',    value: Math.round(aqiData?.o3   ?? 0), fill: '#3b82f6' },
    ], [aqiData])

    // Build Today's Timeline: current PM2.5 + +6h and +12h forecast from the nearest node
    const now = new Date()

    const nearestNode = useMemo(() => {
        if (!location || liveHeatmapPoints.length === 0) return null
        const [lat, lon] = location
        return liveHeatmapPoints.reduce((best, pt) =>
            Math.hypot(pt.lat - lat, pt.lng - lon) < Math.hypot(best.lat - lat, best.lng - lon) ? pt : best
        )
    }, [location, liveHeatmapPoints])

    const timelineData = useMemo(() => {
        const pm25Now = Math.round(aqiData?.pm25 ?? nearestNode?.aqi ?? 0)
        const pm25_6h  = nearestNode?.aqi_6h  != null ? Math.round(nearestNode.aqi_6h)  : null
        const pm25_12h = nearestNode?.aqi_12h != null ? Math.round(nearestNode.aqi_12h) : null

        const t = new Date(now)
        const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

        const rows: { time: string; aqi: number; forecast?: boolean }[] = [
            { time: fmt(t), aqi: pm25Now, forecast: false },
        ]

        if (pm25_6h !== null) {
            rows.push({ time: `+6h (${fmt(new Date(t.getTime() + 6 * 3600_000))})`, aqi: pm25_6h, forecast: true })
        }
        if (pm25_12h !== null) {
            rows.push({ time: `+12h (${fmt(new Date(t.getTime() + 12 * 3600_000))})`, aqi: pm25_12h, forecast: true })
        }

        return rows
    }, [aqiData, nearestNode, now.getHours()])

    // Generate personalized insights based on real health profile
    const getInsights = () => {
        const insights = []
        const hasAsthma = healthProfile?.has_asthma ?? false
        const hasHeartCondition = healthProfile?.has_heart_condition ?? false
        const isPregnant = healthProfile?.is_pregnant ?? false

        if (currentAQIData.value > 100) {
            insights.push({ id: 1, title: 'Pollution levels are elevated', desc: `Today pollution levels are ${(currentAQIData.value - 50)}% higher than average.`, type: 'warning' })
        } else {
            insights.push({ id: 1, title: 'Air quality is fair', desc: 'Great time for outdoor activities, pollution is minimal.', type: 'success' })
        }
        if (hasAsthma && currentAQIData.value > 80) {
            insights.push({ id: 2, title: 'Asthma Alert', desc: 'High particulate matter detected. Carry your inhaler and limit outdoor exercise.', type: 'danger' })
        }
        if (hasHeartCondition && currentAQIData.value > 100) {
            insights.push({ id: 3, title: 'Cardiovascular Advisory', desc: 'Elevated pollution can strain the heart. Avoid prolonged outdoor exposure.', type: 'danger' })
        }
        if (isPregnant && currentAQIData.value > 75) {
            insights.push({ id: 4, title: 'Pregnancy Advisory', desc: 'Avoid areas with high traffic emissions. AQI is above safe levels for expectant mothers.', type: 'warning' })
        }
        if (precipitation()) {
            insights.push({ id: 5, title: 'Rain Expected', desc: 'Rain will likely clear up particulate matter, improving AQI later today.', type: 'info' })
        }
        if (currentAQIData.value > 150 || (hasAsthma && currentAQIData.value > 100)) {
            insights.push({ id: 6, title: 'Mask Recommended', desc: 'Wear an N95 mask if you must go outside.', type: 'danger' })
        }
        return insights
    }

    // Helper — uses live precipitation probability from Open-Meteo
    function precipitation() { return currentPrecipProb >= 30 }

    return (
        <div className="flex flex-col min-h-screen pb-12" style={{ backgroundColor: '#F4F9FF' }}>

            {/* 1. Fullscreen Heatmap Section */}
            <section className="relative w-full h-[100vh] min-h-[600px] bg-slate-900 overflow-hidden shrink-0">
                <div className="absolute inset-0 z-0">
                    <MapView
                        center={location}
                        heatmapRequired={true}
                        heatmapPoints={forecastLoading ? [] : liveHeatmapPoints}
                        showUserLocation={true}
                        onLocationSelect={(lat, lng) => setLocation([lat, lng])}
                    />
                </div>

                {/* Top Gradient for text readability */}
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-900/90 to-transparent pointer-events-none z-10" />

                {/* Bottom Gradient for seamless transition to content */}
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent pointer-events-none z-10" />

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-between p-6 lg:p-10 pointer-events-none z-20">

                    {/* Top Bar: Location & Status */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-4 pointer-events-auto max-w-md w-full">
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xs border border-white/20 shadow-lg">
                                <MapPin className="text-teal-400 size-5" />
                                <div>
                                    <h2 className="text-white font-semibold text-lg leading-none group-data-[collapsible=icon]:hidden">{locationName === "Predicting..." ? "Your Location" : locationName}</h2>
                                    <p className="text-slate-300 text-sm mt-1">Live Street-level AQI</p>
                                </div>
                            </div>

                            <LocationSearch
                                onLocationSelect={(lat, lng, label) => {
                                    setLocation([lat, lng]);
                                    if (label) setLocationName(label.split(',')[0]);
                                }}
                                placeholder="Search neighborhood..."
                                className="z-[3000]"
                            />
                        </div>
                    </div>

                    {/* Bottom Bar: Timeframe Toggles */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-16 pointer-events-none">
                        <div className="flex-1 max-w-xl">
                            {/* <h3 className="text-5xl font-black text-teal-400 mb-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">Forecast Prediction</h3> */}
                            {/* <p className="text-blue-900 font-semibold drop-shadow-[0_1px_5px_rgba(0,0,0,0.5)] pb-6 text-xl leading-relaxed w-dvw ">Scroll down to see detailed forecasting, personalized insights, and your health metrics.</p> */}
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Scroll Down Section */}
            <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 space-y-8 -mt-8 relative z-20">

                {/* Weather Animation Row */}
                {/* Weather Hub Section */}
                <Card className="border-0 shadow-2xl rounded-xs overflow-hidden text-white" style={{ backgroundColor: '#2C3E50' }}>
                    <CardContent className="p-0">
                        {wxLoading ? (
                            /* Loading skeleton */
                            <div className="p-8 lg:p-12 flex flex-col gap-6 animate-pulse">
                                <div className="flex items-center gap-6">
                                    <div className="size-20 rounded-xs bg-white/10" />
                                    <div className="space-y-3">
                                        <div className="h-16 w-40 bg-white/10 rounded-xl" />
                                        <div className="h-4 w-64 bg-white/10 rounded-lg" />
                                    </div>
                                </div>
                                <div className="h-[200px] w-full bg-white/5 rounded-xs" />
                                <div className="grid grid-cols-7 gap-4">
                                    {Array.from({ length: 7 }).map((_, i) => (
                                        <div key={i} className="h-28 bg-white/5 rounded-xs" />
                                    ))}
                                </div>
                            </div>
                        ) : wxError ? (
                            /* Error state */
                            <div className="p-8 lg:p-12 flex flex-col items-center justify-center gap-4 min-h-[320px] text-center">
                                <AlertCircle className="size-12 text-rose-400" />
                                <h3 className="text-xl font-semibold text-white">Weather Unavailable</h3>
                                <p className="text-slate-400 max-w-sm">{wxError}</p>
                            </div>
                        ) : (
                            <>
                                {/* Top Weather Info */}
                                <div className="p-8 lg:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className="relative">
                                            <WeatherIcon
                                                icon={getWeatherInfo(wxCurrent?.weathercode ?? 0).icon}
                                                className={`size-20 ${
                                                    getWeatherInfo(wxCurrent?.weathercode ?? 0).icon === 'sunny'
                                                        ? 'text-yellow-400 fill-yellow-400/20'
                                                        : getWeatherInfo(wxCurrent?.weathercode ?? 0).icon === 'rain' || getWeatherInfo(wxCurrent?.weathercode ?? 0).icon === 'drizzle'
                                                        ? 'text-blue-400'
                                                        : getWeatherInfo(wxCurrent?.weathercode ?? 0).icon === 'storm'
                                                        ? 'text-purple-400'
                                                        : getWeatherInfo(wxCurrent?.weathercode ?? 0).icon === 'snow'
                                                        ? 'text-sky-200'
                                                        : 'text-slate-400'
                                                }`}
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-8xl font-medium tracking-tighter">{wxCurrent?.temperature ?? '--'}</span>
                                                <div className="text-2xl font-light text-slate-400 flex gap-2">
                                                    <span className="text-white font-normal">°C</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-slate-400 text-sm mt-2">
                                                <span className="flex items-center gap-1.5">
                                                    <CloudRain className="size-4" />
                                                    Precipitation: {currentPrecipProb}%
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Droplets className="size-4" />
                                                    Humidity: {currentHumidity}%
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Wind className="size-4" />
                                                    Wind: {wxCurrent?.windspeed ?? '--'} km/h
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-5xl font-light tracking-tight">Weather</h2>
                                        <p className="text-slate-400 mt-1 text-lg">{locationName}</p>
                                        <p className="text-slate-400 font-medium mt-1">
                                            {getWeatherInfo(wxCurrent?.weathercode ?? 0).description}
                                        </p>
                                    </div>
                                </div>

                                {/* Tabs (static label, chart is always temperature) */}
                                <div className="px-8 lg:px-12 flex gap-8 text-lg font-medium border-b border-white/5">
                                    <button className="pb-4 border-b-2 border-yellow-500 text-white">Temperature</button>
                                </div>

                                {/* Temperature Chart — next 8 hours */}
                                <div className="p-4 lg:p-12 pb-4">
                                    <div className="h-[200px] w-full relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={wxHourly}>
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
                                                            {props.value}°
                                                        </text>
                                                    )}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-x-12 bottom-0 h-2 bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-transparent rounded-full" />
                                    </div>
                                    <div className="flex justify-between px-4 lg:px-12 mt-4 text-slate-500 text-sm font-medium">
                                        {wxHourly.map((item, idx) => (
                                            <span key={idx}>{item.time}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* 7-Day Forecast */}
                                <div className="p-6 lg:p-10 border-t border-white/5 grid grid-cols-4 lg:grid-cols-7 gap-4">
                                    {wxDaily.map((day, i) => {
                                        const info = getWeatherInfo(day.weathercode)
                                        return (
                                            <div key={i} className={`flex flex-col items-center gap-4 p-4 rounded-xs transition-all ${
                                                i === 0 ? 'bg-white/5 border border-white/10' : 'hover:bg-white/5'
                                            }`}>
                                                <span className="font-bold text-lg">{day.day}</span>
                                                <WeatherIcon
                                                    icon={info.icon}
                                                    className={`size-10 ${
                                                        info.icon === 'sunny' ? 'text-yellow-400'
                                                        : info.icon === 'rain' || info.icon === 'drizzle' ? 'text-blue-400'
                                                        : info.icon === 'storm' ? 'text-purple-400'
                                                        : info.icon === 'snow' ? 'text-sky-200'
                                                        : 'text-slate-400'
                                                    }`}
                                                />
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold text-xl">{day.tempMax}°</span>
                                                    <span className="text-slate-500 font-medium">{day.tempMin}°</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Main Analytics Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="border-0 shadow-lg shadow-slate-200/40 rounded-xs overflow-hidden">
                            <CardHeader className="bg-white pb-2">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Activity className="text-teal-500" />
                                    Today's Timeline
                                </CardTitle>
                                <CardDescription className="flex items-center gap-4 mt-1">
                                    Hourly PM2.5 concentration (µg/m³)
                                    <span className="flex items-center gap-1.5 text-xs">
                                        <span className="inline-block w-6 h-0.5 rounded bg-[#14b8a6]" /> Now
                                        <span className="inline-block w-6 h-0.5 rounded border-t-2 border-dashed border-[#f97316]" /> +6h forecast
                                        <span className="inline-block w-6 h-0.5 rounded border-t-2 border-dashed border-[#3b82f6]" /> +12h forecast
                                    </span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="bg-white pt-4">
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            {/* Single connected line — Now → +6h → +12h */}
                                            <Line
                                                type="monotone"
                                                dataKey="aqi"
                                                name="PM2.5 (µg/m³)"
                                                stroke="#14b8a6"
                                                strokeWidth={3}
                                                dot={(props: any) => {
                                                    const isForecast = props.payload?.forecast
                                                    return (
                                                        <circle
                                                            key={props.key}
                                                            cx={props.cx}
                                                            cy={props.cy}
                                                            r={5}
                                                            fill={isForecast ? '#fff' : '#14b8a6'}
                                                            stroke="#14b8a6"
                                                            strokeWidth={2}
                                                            strokeDasharray={isForecast ? '3 2' : '0'}
                                                        />
                                                    )
                                                }}
                                                activeDot={{ r: 7, fill: '#14b8a6', stroke: '#fff', strokeWidth: 3 }}
                                                connectNulls
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg shadow-slate-200/40 rounded-xs overflow-hidden">
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
                                        <BarChart data={pollutants} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} layout="vertical">
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
                        <div className="rounded-xs p-6 text-white shadow-xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #5F9EC0, #89B6E3)' }}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-xs blur-2xl -translate-y-1/2 translate-x-1/3"></div>

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
                        <Card className="border shadow-md rounded-xs bg-white overflow-hidden" style={{ borderColor: '#DCEBFA', boxShadow: '0 4px 12px rgba(167,199,231,0.25)' }}>
                            <div className="h-2 w-full" style={{ background: 'linear-gradient(135deg, #A7C7E7, #89B6E3)' }} />
                            <CardContent className="p-6">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Active Profile</h4>
                                {userProfile?.full_name && (
                                    <p className="text-base font-bold text-slate-700 mb-4">{userProfile.full_name}</p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {userProfile?.age && <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-xs font-medium">Age {userProfile.age}</span>}
                                    {userProfile?.gender && <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-100">{userProfile.gender}</span>}
                                    {healthProfile?.has_asthma && <span className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-xs font-medium border border-orange-200">Asthma</span>}
                                    {healthProfile?.has_copd && <span className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-xs font-medium border border-orange-200">COPD</span>}
                                    {healthProfile?.has_allergies && <span className="bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full text-xs font-medium border border-yellow-200">Allergies</span>}
                                    {healthProfile?.has_heart_condition && <span className="bg-rose-50 text-rose-700 px-3 py-1.5 rounded-full text-xs font-medium border border-rose-200">Heart Condition</span>}
                                    {healthProfile?.is_pregnant && <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-xs font-medium border border-purple-200">Pregnant</span>}
                                    {healthProfile?.takes_inhaler && <span className="bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full text-xs font-medium border border-teal-200">Inhaler User</span>}
                                    {healthProfile?.fitness_level && <span className="bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-medium border border-green-200">{healthProfile.fitness_level} Fitness</span>}
                                    {!healthProfile && (
                                        <span className="text-slate-400 text-xs">No health profile yet</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => navigate('/personalize')}
                                    className="mt-4 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                                >
                                    Edit Health Profile →
                                </button>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    )
}
