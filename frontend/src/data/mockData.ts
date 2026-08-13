import { DashboardData, WeatherForecast } from '../types';

const generateHistory = (base: number, variance: number, points = 24) =>
  Array.from({ length: points }, (_, i) => ({
    timestamp: new Date(Date.now() - (points - i) * 3600000).toISOString(),
    value: parseFloat((base + (Math.random() - 0.5) * variance).toFixed(1)),
  }));

export const mockDashboardData: DashboardData = {
  temperature: {
    current: 28.4,
    unit: '°C',
    status: 'optimal',
    trend: 'up',
    history: generateHistory(26, 6),
  },
  humidity: {
    current: 62,
    unit: '%',
    status: 'optimal',
    trend: 'stable',
    history: generateHistory(60, 15),
  },
  soilMoisture: {
    current: 38,
    unit: '%',
    status: 'warning',
    trend: 'down',
    history: generateHistory(45, 20),
  },
  zones: [
    {
      id: 'z1',
      name: 'North Field — Maize',
      status: 'active',
      moisture: 38,
      lastIrrigated: '2h ago',
      nextScheduled: 'Now',
      area: 2.4,
    },
    {
      id: 'z2',
      name: 'South Field — Tomato',
      status: 'scheduled',
      moisture: 55,
      lastIrrigated: '5h ago',
      nextScheduled: 'In 2h',
      area: 1.8,
    },
    {
      id: 'z3',
      name: 'East Patch — Pepper',
      status: 'idle',
      moisture: 72,
      lastIrrigated: '1h ago',
      nextScheduled: 'Tomorrow',
      area: 0.9,
    },
    {
      id: 'z4',
      name: 'West Field — Cassava',
      status: 'paused',
      moisture: 44,
      lastIrrigated: '8h ago',
      nextScheduled: 'Paused',
      area: 3.1,
    },
  ],
  forecast: [
    { time: 'Now', condition: 'Sunny', temp: 28, humidity: 62, rainProbability: 5, icon: '☀️' },
    { time: '3h', condition: 'Partly Cloudy', temp: 27, humidity: 68, rainProbability: 20, icon: '⛅' },
    { time: '6h', condition: 'Overcast', temp: 25, humidity: 75, rainProbability: 45, icon: '☁️' },
    { time: '9h', condition: 'Light Rain', temp: 23, humidity: 85, rainProbability: 72, icon: '🌧️' },
    { time: '12h', condition: 'Rain', temp: 22, humidity: 90, rainProbability: 88, icon: '⛈️' },
    { time: '15h', condition: 'Clearing', temp: 24, humidity: 80, rainProbability: 30, icon: '🌤️' },
  ],
  systemStatus: 'attention',
  waterSaved: 1240,
  lastUpdated: new Date().toISOString(),
};

export const getStatusColor = (status: 'optimal' | 'warning' | 'critical') => {
  switch (status) {
    case 'optimal': return '#4ade80';
    case 'warning': return '#fbbf24';
    case 'critical': return '#f87171';
  }
};
