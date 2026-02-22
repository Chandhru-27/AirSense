import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    MapPin, Upload, AlertTriangle, Building2, Send,
    Loader2, CheckCircle2, X, Camera, Map as MapIcon,
    AlertCircle, ImageIcon
} from 'lucide-react'
import MapView from '@/components/map/MapView'
import LocationSearch from '@/components/map/LocationSearch'
import { useSubmitReport } from '@/lib/hooks'

const INITIAL_CHENNAI: [number, number] = [13.0827, 80.2707]
const MAX_SIZE_BYTES = 5 * 1024 * 1024   // 5 MB
const MAX_SIZE_LABEL = '5 MB'

export default function ReportPollution() {
    const [description, setDescription] = useState('')
    const [location, setLocation] = useState<[number, number]>(INITIAL_CHENNAI)
    const [image, setImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [imageError, setImageError] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const { mutate: submitReport, isPending, isSuccess, isError, error, data: submittedReport, reset } = useSubmitReport()

    // ── Image handling ────────────────────────────────────────────────────────
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImageError(null)
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            setImageError('Only image files are accepted (JPEG, PNG, WEBP, etc.)')
            e.target.value = ''
            return
        }

        if (file.size > MAX_SIZE_BYTES) {
            setImageError(`Image exceeds the ${MAX_SIZE_LABEL} limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`)
            e.target.value = ''
            return
        }

        setImage(file)
        setImagePreview(URL.createObjectURL(file))
    }

    const removeImage = () => {
        setImage(null)
        if (imagePreview) URL.revokeObjectURL(imagePreview)
        setImagePreview(null)
        setImageError(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        submitReport({
            description,
            lat: location[0],
            lon: location[1],
            image,
        })
    }

    const handleFileAnother = () => {
        reset()
        removeImage()
        setDescription('')
    }

    // ── Error message helper ──────────────────────────────────────────────────
    const apiError = isError
        ? ((error as any)?.response?.data?.error ?? (error as Error)?.message ?? 'Submission failed')
        : null

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

                {isSuccess ? (
                    /* ── Success Card ─────────────────────────────────────────────── */
                    <Card className="border-0 shadow-xl shadow-emerald-100/50 rounded-3xl overflow-hidden bg-white max-w-2xl mx-auto text-center p-12">
                        <CardContent className="space-y-6">
                            <div className="size-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-4 scale-in animate-in duration-500">
                                <CheckCircle2 className="size-12" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-slate-900">Report Successfully Filed!</h2>
                                <p className="text-slate-500 text-lg">
                                    The Greater Chennai Corporation has been notified of the issue at{' '}
                                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded ml-1 text-slate-700">
                                        {submittedReport?.lat.toFixed(5)}, {submittedReport?.lon.toFixed(5)}
                                    </span>.
                                </p>
                            </div>

                            {/* Image confirmation */}
                            {submittedReport?.image_url && (
                                <div className="flex items-center justify-center gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                                    <img
                                        src={submittedReport.image_url}
                                        alt="Submitted evidence"
                                        className="w-20 h-20 rounded-xl object-cover border border-slate-200"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                    />
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-slate-700">Image uploaded</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {submittedReport.mime_type} · {((submittedReport.image_size ?? 0) / 1024).toFixed(0)} KB
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-start gap-4 text-left">
                                <Building2 className="text-emerald-600 size-6 shrink-0 mt-1" />
                                <div>
                                    <p className="font-bold text-emerald-900">What happens next?</p>
                                    <p className="text-emerald-700 text-sm mt-1">A municipal inspector will be assigned to review the evidence and conduct an on-site audit within 48 hours.</p>
                                </div>
                            </div>
                            <Button
                                onClick={handleFileAnother}
                                variant="outline"
                                className="h-12 px-8 rounded-xl font-semibold mt-4"
                            >
                                File Another Report
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid lg:grid-cols-5 gap-8">
                        {/* ── Form Section ─────────────────────────────────────────────── */}
                        <div className="lg:col-span-3 space-y-6">
                            <Card className="border-0 shadow-md shadow-slate-200/50 rounded-3xl bg-white h-full">
                                <CardContent className="p-8 space-y-6">
                                    <form onSubmit={handleSubmit} className="space-y-6">

                                        {/* API error banner */}
                                        {apiError && (
                                            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
                                                <AlertCircle className="size-5 shrink-0 mt-0.5" />
                                                <span>{apiError}</span>
                                            </div>
                                        )}

                                        {/* Description */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 block text-lg mb-1">
                                                Describe the hazard
                                            </label>
                                            <Textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Example: 'Severe industrial smoke in Ambattur area' or 'Open garbage fire at Mandaveli junction'..."
                                                className="min-h-[140px] border-slate-200 bg-slate-50/50 rounded-2xl p-4 focus-visible:ring-teal-500 text-base"
                                                required
                                            />
                                        </div>

                                        {/* Image upload */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 block text-lg mb-1">
                                                Attach Evidence Photo
                                            </label>
                                            <p className="text-xs text-slate-400 -mt-1">
                                                image/* · max {MAX_SIZE_LABEL}
                                            </p>

                                            {imageError && (
                                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 text-sm">
                                                    <AlertCircle className="size-4 shrink-0" />
                                                    <span>{imageError}</span>
                                                </div>
                                            )}

                                            {image && imagePreview ? (
                                                /* Preview */
                                                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video group">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {/* File info overlay */}
                                                    <div className="absolute bottom-0 inset-x-0 bg-black/50 backdrop-blur-sm px-4 py-2 flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-white text-xs">
                                                            <ImageIcon className="size-3.5" />
                                                            <span className="truncate max-w-[200px]">{image.name}</span>
                                                            <span className="text-white/60">
                                                                {(image.size / 1024).toFixed(0)} KB
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={removeImage}
                                                            className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                                                        >
                                                            <X className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Drop zone */
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-full aspect-video rounded-2xl border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/50 transition-all flex flex-col items-center justify-center gap-3 group"
                                                >
                                                    <div className="size-14 bg-slate-100 group-hover:bg-teal-100 rounded-2xl flex items-center justify-center transition-colors">
                                                        <Camera className="size-7 text-slate-400 group-hover:text-teal-600 transition-colors" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-semibold text-slate-600 group-hover:text-teal-700">
                                                            Click to upload a photo
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            JPEG, PNG, WEBP, GIF — up to {MAX_SIZE_LABEL}
                                                        </p>
                                                    </div>
                                                    <Upload className="size-4 text-slate-400 group-hover:text-teal-500" />
                                                </button>
                                            )}

                                            <input
                                                type="file"
                                                className="hidden"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                accept="image/*"
                                            />
                                        </div>

                                        {/* Submit */}
                                        <div className="pt-4">
                                            <Button
                                                type="submit"
                                                disabled={isPending || !description}
                                                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
                                            >
                                                {isPending
                                                    ? <><Loader2 className="animate-spin mr-2" /> Processing Report...</>
                                                    : <><Send className="mr-2" /> Submit to Municipal Corporation</>
                                                }
                                            </Button>
                                            <p className="text-center text-xs text-slate-400 mt-4">
                                                Submitting artificial reports is a punishable offense. Your report is securely logged with IP and location metadata.
                                            </p>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* ── Map Section ───────────────────────────────────────────────── */}
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
                                    <MapView
                                        center={location}
                                        onLocationSelect={(lat, lng) => setLocation([lat, lng])}
                                    />

                                    <div className="absolute top-4 left-4 right-4 z-[1000]">
                                        <LocationSearch
                                            onLocationSelect={(lat, lng) => setLocation([lat, lng])}
                                            placeholder="Search for area..."
                                        />
                                    </div>

                                    <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-lg flex items-center gap-3">
                                        <div className="size-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700">
                                            <MapPin className="size-5" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Selected Coordinates</p>
                                            <p className="text-sm font-mono truncate text-slate-700">
                                                {location[0].toFixed(5)}, {location[1].toFixed(5)}
                                            </p>
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
