export interface UserLocation {
  latitude: number
  longitude: number
  accuracy: number
  speed: number | null
  heading: number | null
  timestamp: number
  address?: string
}

export interface Hospital {
  id: string
  name: string
  location: {
    lat: number
    lng: number
  }
  distance: number
  duration: number
  availableBeds: number
  traumaLevel: number
  specialties: string[]
  address: string
  phone: string
}

export interface Ambulance {
  id: string
  callSign: string
  location: {
    lat: number
    lng: number
  }
  status: 'available' | 'dispatched' | 'en-route' | 'on-scene'
  eta: number
  distance: number
  crew: number
  equipment: string[]
}

export interface EmergencyRequest {
  latitude: string
  longitude: string
  accuracy: string
  speed: string
  heading: string
  timestamp: string
  nearest_hospitals: Hospital[]
  nearest_ambulances: Ambulance[]
  fastest_route: {
    distance: string
    duration: string
    steps: string[]
  }
}
