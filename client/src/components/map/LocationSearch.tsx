import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Loader2, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Suggestion {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

interface LocationSearchProps {
    onLocationSelect: (lat: number, lng: number, label?: string) => void;
    className?: string;
    placeholder?: string;
}

const CHENNAI_VIEWBOX = '80.0142,13.1825,80.3198,12.8342';
const DELHI_VIEWBOX = '76.838,28.882,77.345,28.404';

export default function LocationSearch({ onLocationSelect, className = "", placeholder = "Search for an area in Chennai or Delhi..." }: LocationSearchProps) {
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const dropdownRef = useRef<HTMLDivElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    const debounceTimerRef = useRef<any>(null)

    // Handle outside clicks to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchSuggestions = useCallback(async (searchText: string) => {
        if (!searchText.trim()) {
            setSuggestions([])
            setIsLoading(false)
            return
        }

        // Abort previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()

        setIsLoading(true)
        setError(null)

        try {
            const [chennaiRes, delhiRes] = await Promise.all([
                fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText + ', Chennai')}&format=json&addressdetails=1&limit=5&viewbox=${CHENNAI_VIEWBOX}&bounded=1`,
                    { signal: abortControllerRef.current.signal, headers: { 'Accept': 'application/json', 'User-Agent': 'AirSense-App' } }
                ),
                fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText + ', Delhi')}&format=json&addressdetails=1&limit=5&viewbox=${DELHI_VIEWBOX}&bounded=1`,
                    { signal: abortControllerRef.current.signal, headers: { 'Accept': 'application/json', 'User-Agent': 'AirSense-App' } }
                )
            ]);

            if (!chennaiRes.ok || !delhiRes.ok) throw new Error('Failed to fetch suggestions')

            const chennaiData = await chennaiRes.json();
            const delhiData = await delhiRes.json();
            
            const combinedData = [...chennaiData, ...delhiData].slice(0, 5);
            setSuggestions(combinedData);
            setIsOpen(true);
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setError('Search failed. Please try again.')
                console.error('Search error:', err)
            }
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Debounce the search input
    useEffect(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

        if (query.trim().length > 2) {
            debounceTimerRef.current = setTimeout(() => {
                fetchSuggestions(query)
            }, 400)
        } else {
            setSuggestions([])
            setIsOpen(false)
        }

        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        }
    }, [query, fetchSuggestions])

    const handleSelect = (s: Suggestion) => {
        const lat = parseFloat(s.lat)
        const lon = parseFloat(s.lon)
        onLocationSelect(lat, lon, s.display_name)
        setQuery(s.display_name.split(',')[0]) // Show short name in input
        setIsOpen(false)
    }

    const clearSearch = () => {
        setQuery('')
        setSuggestions([])
        setIsOpen(false)
    }

    return (
        <div className={`relative w-full ${className}`} ref={dropdownRef}>
            <div className="relative flex items-center">
                <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="h-12 pl-12 pr-10 bg-white/95 backdrop-blur-md border-slate-200 shadow-xl rounded-xs focus-visible:ring-teal-500 text-slate-700"
                />

                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    {isLoading ? (
                        <Loader2 className="size-5 text-teal-500 animate-spin" />
                    ) : (
                        <Search className="size-5 text-slate-400" />
                    )}
                </div>

                {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        type="button"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 shadow-lg z-[2000]">
                    {error}
                </div>
            )}

            {/* Suggestions Dropdown */}
            {isOpen && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-100 shadow-2xl overflow-y-auto max-h-[320px] z-[2000] animate-in slide-in-from-top-2 duration-200 custom-scrollbar">
                    <div className="py-2">
                        {suggestions.map((s) => (
                            <button
                                key={s.place_id}
                                onClick={() => handleSelect(s)}
                                className="w-full px-5 py-3 hover:bg-slate-50 flex items-start gap-4 transition-colors group text-left"
                                type="button"
                            >
                                <div className="mt-1 size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-teal-100 group-hover:text-teal-600 transition-colors shrink-0">
                                    <MapPin className="size-4" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-bold text-slate-700 group-hover:text-teal-700 truncate">{s.display_name.split(',')[0]}</p>
                                    <p className="text-xs text-slate-400 truncate mt-0.5">{s.display_name}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
