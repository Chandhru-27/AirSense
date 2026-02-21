import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MapPin, Upload, AlertTriangle, Building2, Send, Loader2, CheckCircle2, X, Camera, Map as MapIcon, Search } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { Input } from '@/components/ui/input'
import L from 'leaflet'

// Fix for default marker icon in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
})

const INITIAL_CHENNAI: [number, number] = [13.0827, 80.2707]

function LocationPicker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    const [position, setPosition] = useState<[number, number]>(INITIAL_CHENNAI)

    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng
            setPosition([lat, lng])
            onLocationSelect(lat, lng)
        },
    })

    return (
        <Marker position={position} icon={DefaultIcon} />
    )
}

function MapSearch({ onSearch }: { onSearch: (lat: number, lng: number) => void }) {
    const [query, setQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const map = useMap()

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setIsSearching(true)
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Chennai')}`)
            const data = await response.json()
            if (data && data.length > 0) {
                const { lat, lon } = data[0]
                const newLat = parseFloat(lat)
                const newLng = parseFloat(lon)
                map.flyTo([newLat, newLng], 15)
                onSearch(newLat, newLng)
            }
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setIsSearching(false)
        }
    }

    return (
        <div className="absolute top-4 left-4 right-4 z-[1000]">
            <form onSubmit={handleSearch} className="relative">
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search area (e.g. Adyar, T.Nagar)..."
                    className="h-12 pl-12 pr-4 bg-white/95 backdrop-blur-md border-slate-200 shadow-xl rounded-xl focus-visible:ring-teal-500"
                />
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 size-5 ${isSearching ? 'text-teal-500 animate-pulse' : 'text-slate-400'}`} />
            </form>
        </div>
    )
}

export default function ReportPollution() {
    const [description, setDescription] = useState('')
    const [location, setLocation] = useState<[number, number]>(INITIAL_CHENNAI)
    const [files, setFiles] = useState<File[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)])
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Artificial delay for simulation
        await new Promise(resolve => setTimeout(resolve, 2000))

        setIsSubmitting(false)
        setIsSubmitted(true)
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 p-6 lg:p-10">
            <div className="max-w-5xl mx-auto w-full space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <AlertTriangle className="text-amber-500 size-8" />
                            Report Pollution
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">Report environmental hazards directly to your Local Municipal Corporation.</p>
                    </div>
                </div>

                {isSubmitted ? (
                    <Card className="border-0 shadow-xl shadow-emerald-100/50 rounded-3xl overflow-hidden bg-white max-w-2xl mx-auto text-center p-12">
                        <CardContent className="space-y-6">
                            <div className="size-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-4 scale-in animate-in duration-500">
                                <CheckCircle2 className="size-12" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-slate-900">Report Successfully Filed!</h2>
                                <p className="text-slate-500 text-lg">
                                    The Greater Chennai Corporation has been notified of the issue at
                                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded ml-1 text-slate-700">
                                        {location[0].toFixed(4)}, {location[1].toFixed(4)}
                                    </span>.
                                </p>
                            </div>
                            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-start gap-4 text-left">
                                <Building2 className="text-emerald-600 size-6 shrink-0 mt-1" />
                                <div>
                                    <p className="font-bold text-emerald-900">What happens next?</p>
                                    <p className="text-emerald-700 text-sm mt-1">A municipal inspector will be assigned to review the evidence and conduct an on-site audit within 48 hours.</p>
                                </div>
                            </div>
                            <Button onClick={() => { setIsSubmitted(false); setFiles([]); setDescription('') }} variant="outline" className="h-12 px-8 rounded-xl font-semibold mt-4">
                                File Another Report
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid lg:grid-cols-5 gap-8">
                        {/* Form Section */}
                        <div className="lg:col-span-3 space-y-6">
                            <Card className="border-0 shadow-md shadow-slate-200/50 rounded-3xl bg-white h-full">
                                <CardContent className="p-8 space-y-6">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 block text-lg mb-1">Describe the hazard</label>
                                            <Textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Example: 'Severe industrial smoke in Ambattur area' or 'Open garbage fire at Mandaveli junction'..."
                                                className="min-h-[140px] border-slate-200 bg-slate-50/50 rounded-2xl p-4 focus-visible:ring-teal-500 text-base"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 block text-lg mb-1">Attach Media (Images or Video)</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {files.map((file, idx) => (
                                                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group">
                                                        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                                            <Camera className="size-8" />
                                                        </div>
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <button onClick={() => removeFile(idx)} type="button" className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transform hover:scale-110 transition-all">
                                                                <X className="size-4" />
                                                            </button>
                                                        </div>
                                                        <div className="absolute bottom-2 left-2 right-2 truncate text-[10px] bg-white/80 backdrop-blur-md px-1 py-0.5 rounded text-slate-700">
                                                            {file.name}
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50 transition-all flex flex-col items-center justify-center gap-2 group"
                                                >
                                                    <Upload className="size-6 text-slate-400 group-hover:text-teal-600 transition-colors" />
                                                    <span className="text-xs font-medium text-slate-500 group-hover:text-teal-700">Add Media</span>
                                                </button>
                                            </div>
                                            <input
                                                type="file"
                                                multiple
                                                className="hidden"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                accept="image/*,video/*"
                                            />
                                        </div>

                                        <div className="pt-4">
                                            <Button type="submit" disabled={isSubmitting || !description} className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]">
                                                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />}
                                                {isSubmitting ? 'Processing Report...' : 'Submit to Municipal Corporation'}
                                            </Button>
                                            <p className="text-center text-xs text-slate-400 mt-4">
                                                Submitting artificial reports is a punishable offense. Your report is securely logged with IP and location metadata.
                                            </p>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Map Section */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-0 shadow-md shadow-slate-200/50 rounded-3xl bg-white overflow-hidden h-full flex flex-col">
                                <div className="p-6 bg-slate-900 text-white shrink-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MapIcon className="size-5 text-teal-400" />
                                        <h3 className="font-bold">Tag Location</h3>
                                    </div>
                                    <p className="text-slate-400 text-xs">Click on the map to pinpoint the pollution source.</p>
                                </div>
                                <div className="flex-1 min-h-[400px] relative z-0">
                                    <MapContainer
                                        center={INITIAL_CHENNAI}
                                        zoom={12}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <MapSearch onSearch={(lat, lng) => setLocation([lat, lng])} />
                                        <LocationPicker onLocationSelect={(lat, lng) => setLocation([lat, lng])} />
                                    </MapContainer>
                                    <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-lg flex items-center gap-3">
                                        <div className="size-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700">
                                            <MapPin className="size-5" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Selected Coordinates</p>
                                            <p className="text-sm font-mono truncate text-slate-700">{location[0].toFixed(5)}, {location[1].toFixed(5)}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
