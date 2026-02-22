import { useState, useEffect, useMemo } from 'react'
import { fetchWeather, type WeatherData, type HourlyPoint, type DailyPoint, type CurrentWeather } from '../lib/weatherService'

const DEFAULT_LAT = 13.0827
const DEFAULT_LON = 80.2707

interface UseWeatherReturn {
  current: CurrentWeather | null
  hourly: HourlyPoint[]
  daily: DailyPoint[]
  currentHumidity: number
  currentPrecipProb: number
  loading: boolean
  error: string | null
}

export function useWeather(lat?: number, lon?: number): UseWeatherReturn {
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const resolvedLat = lat ?? DEFAULT_LAT
  const resolvedLon = lon ?? DEFAULT_LON

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    setLoading(true)
    setError(null)

    fetchWeather(resolvedLat, resolvedLon, controller.signal)
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled && err.name !== 'AbortError') {
          setError(err.message || 'Failed to fetch weather data')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [resolvedLat, resolvedLon])

  const current = useMemo(() => data?.current ?? null, [data])
  const hourly = useMemo(() => data?.hourly ?? [], [data])
  const daily = useMemo(() => data?.daily ?? [], [data])
  const currentHumidity = useMemo(() => data?.currentHumidity ?? 0, [data])
  const currentPrecipProb = useMemo(() => data?.currentPrecipProb ?? 0, [data])

  return { current, hourly, daily, currentHumidity, currentPrecipProb, loading, error }
}
