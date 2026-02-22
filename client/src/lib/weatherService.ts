const BASE_URL = 'https://api.open-meteo.com/v1/forecast'

export interface CurrentWeather {
  temperature: number
  windspeed: number
  weathercode: number
  time: string
}

export interface HourlyPoint {
  time: string        // formatted: "2 PM"
  temp: number
  humidity: number
  precipProb: number
  windspeed: number
}

export interface DailyPoint {
  day: string         // formatted: "Mon"
  tempMax: number
  tempMin: number
  weathercode: number
}

export interface WeatherData {
  current: CurrentWeather
  hourly: HourlyPoint[]
  daily: DailyPoint[]
  /** Humidity at the current hour (latest available) */
  currentHumidity: number
  /** Precipitation probability at the current hour */
  currentPrecipProb: number
}

function formatHour(isoTime: string): string {
  const date = new Date(isoTime)
  const h = date.getHours()
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12} ${period}`
}

function formatDay(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

export async function fetchWeather(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current_weather: 'true',
    hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,windspeed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,weathercode',
    timezone: 'auto',
    forecast_days: '7',
  })

  const response = await fetch(`${BASE_URL}?${params.toString()}`, { signal })

  if (!response.ok) {
    throw new Error(`Weather fetch failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  const currentTime = data.current_weather.time as string
  const currentHourIndex = (data.hourly.time as string[]).findIndex(
    (t) => t >= currentTime
  )
  const startIndex = currentHourIndex >= 0 ? currentHourIndex : 0

  const hourly: HourlyPoint[] = (data.hourly.time as string[])
    .slice(startIndex, startIndex + 8)
    .map((t: string, i: number) => ({
      time: formatHour(t),
      temp: Math.round(data.hourly.temperature_2m[startIndex + i]),
      humidity: data.hourly.relative_humidity_2m[startIndex + i],
      precipProb: data.hourly.precipitation_probability[startIndex + i],
      windspeed: Math.round(data.hourly.windspeed_10m[startIndex + i]),
    }))

  const daily: DailyPoint[] = (data.daily.time as string[]).map(
    (t: string, i: number) => ({
      day: formatDay(t),
      tempMax: Math.round(data.daily.temperature_2m_max[i]),
      tempMin: Math.round(data.daily.temperature_2m_min[i]),
      weathercode: data.daily.weathercode[i],
    })
  )

  const currentHumidity: number =
    data.hourly.relative_humidity_2m[startIndex] ?? 0
  const currentPrecipProb: number =
    data.hourly.precipitation_probability[startIndex] ?? 0

  return {
    current: {
      temperature: Math.round(data.current_weather.temperature),
      windspeed: Math.round(data.current_weather.windspeed),
      weathercode: data.current_weather.weathercode,
      time: data.current_weather.time,
    },
    hourly,
    daily,
    currentHumidity,
    currentPrecipProb,
  }
}
