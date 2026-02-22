import { useState, useEffect } from 'react'
import api from '../lib/axios'

export type ForecastHorizon = 'now' | '6h' | '12h' | '24h'

export interface ForecastNode {
  node_id: number
  lat: number
  lon: number
  aqi_now: number
  risk_now: string
  color_now: string
  aqi_6h: number
  risk_6h: string
  color_6h: string
  aqi_12h: number
  risk_12h: string
  color_12h: string
  aqi_24h: number
  risk_24h: string
  color_24h: string
}

interface UseForecastReturn {
  nodes: ForecastNode[]
  loading: boolean
  error: string | null
  /** Map each node to the HeatmapPoint shape expected by MapView for the given horizon */
  heatmapPoints: (horizon: ForecastHorizon) => Array<{
    name: string
    lat: number
    lng: number
    aqi: number
    risk: string
    color: string
    // forecast details for tooltip
    aqi_6h: number; risk_6h: string
    aqi_12h: number; risk_12h: string
    aqi_24h: number; risk_24h: string
  }>
}

export function useForecast(): UseForecastReturn {
  const [nodes, setNodes] = useState<ForecastNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    api.get<{ status: string; data: ForecastNode[] }>('/maps/forecast')
      .then(({ data }) => {
        if (!cancelled) {
          setNodes(data.data ?? [])
          setLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message || 'Failed to fetch forecast data')
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [])

  function heatmapPoints(horizon: ForecastHorizon) {
    return nodes.map((n, i) => ({
      name: `Node ${n.node_id ?? i + 1}`,
      lat: n.lat,
      lng: n.lon,
      aqi:   horizon === 'now'  ? n.aqi_now  : horizon === '6h'  ? n.aqi_6h  : horizon === '12h' ? n.aqi_12h : n.aqi_24h,
      risk:  horizon === 'now'  ? n.risk_now : horizon === '6h'  ? n.risk_6h : horizon === '12h' ? n.risk_12h : n.risk_24h,
      color: horizon === 'now'  ? n.color_now: horizon === '6h'  ? n.color_6h: horizon === '12h' ? n.color_12h: n.color_24h,
      aqi_6h: n.aqi_6h, risk_6h: n.risk_6h,
      aqi_12h: n.aqi_12h, risk_12h: n.risk_12h,
      aqi_24h: n.aqi_24h, risk_24h: n.risk_24h,
    }))
  }

  return { nodes, loading, error, heatmapPoints }
}
