import { useState, useEffect } from 'react'
import { mapsApi, type NearestAQIData } from '../lib/api'

const DEFAULT_LAT = 13.0827
const DEFAULT_LON = 80.2707

interface UseNearestAQIReturn {
  data: NearestAQIData | null
  loading: boolean
  error: string | null
}

export function useNearestAQI(lat?: number, lon?: number): UseNearestAQIReturn {
  const [data, setData] = useState<NearestAQIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const resolvedLat = lat ?? DEFAULT_LAT
  const resolvedLon = lon ?? DEFAULT_LON

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    mapsApi
      .getNearestAQI(resolvedLat, resolvedLon)
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message || 'Failed to fetch AQI data')
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [resolvedLat, resolvedLon])

  return { data, loading, error }
}
