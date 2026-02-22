export type WeatherIcon =
  | 'sunny'
  | 'partly-cloudy'
  | 'cloudy'
  | 'foggy'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'storm'

export interface WeatherCodeInfo {
  icon: WeatherIcon
  description: string
}

const weatherCodeMap: Record<number, WeatherCodeInfo> = {
  0:  { icon: 'sunny',         description: 'Clear sky' },
  1:  { icon: 'sunny',         description: 'Mainly clear' },
  2:  { icon: 'partly-cloudy', description: 'Partly cloudy' },
  3:  { icon: 'cloudy',        description: 'Overcast' },
  45: { icon: 'foggy',         description: 'Fog' },
  48: { icon: 'foggy',         description: 'Icy fog' },
  51: { icon: 'drizzle',       description: 'Light drizzle' },
  53: { icon: 'drizzle',       description: 'Moderate drizzle' },
  55: { icon: 'drizzle',       description: 'Dense drizzle' },
  56: { icon: 'drizzle',       description: 'Freezing drizzle' },
  57: { icon: 'drizzle',       description: 'Heavy freezing drizzle' },
  61: { icon: 'rain',          description: 'Slight rain' },
  63: { icon: 'rain',          description: 'Moderate rain' },
  65: { icon: 'rain',          description: 'Heavy rain' },
  66: { icon: 'rain',          description: 'Light freezing rain' },
  67: { icon: 'rain',          description: 'Heavy freezing rain' },
  71: { icon: 'snow',          description: 'Slight snow' },
  73: { icon: 'snow',          description: 'Moderate snow' },
  75: { icon: 'snow',          description: 'Heavy snow' },
  77: { icon: 'snow',          description: 'Snow grains' },
  80: { icon: 'rain',          description: 'Slight showers' },
  81: { icon: 'rain',          description: 'Moderate showers' },
  82: { icon: 'rain',          description: 'Violent showers' },
  85: { icon: 'snow',          description: 'Slight snow showers' },
  86: { icon: 'snow',          description: 'Heavy snow showers' },
  95: { icon: 'storm',         description: 'Thunderstorm' },
  96: { icon: 'storm',         description: 'Thunderstorm with slight hail' },
  99: { icon: 'storm',         description: 'Thunderstorm with heavy hail' },
}

export function getWeatherInfo(code: number): WeatherCodeInfo {
  return weatherCodeMap[code] ?? { icon: 'partly-cloudy', description: 'Unknown' }
}
