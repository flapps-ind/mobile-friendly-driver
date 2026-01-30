import { NextRequest, NextResponse } from "next/server"

interface GooglePlace {
  place_id: string
  name: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  vicinity?: string
  formatted_address?: string
  rating?: number
  opening_hours?: {
    open_now: boolean
  }
  business_status?: string
}

interface Hospital {
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
  rating?: number
  isOpen?: boolean
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Estimate driving duration based on distance (rough estimate: 30 km/h average in city)
function estimateDuration(distanceKm: number): number {
  return Math.round((distanceKm / 30) * 60) // minutes
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing latitude or longitude" }, { status: 400 })
  }

  const userLat = parseFloat(lat)
  const userLng = parseFloat(lng)
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  // Try Google Places API first
  if (apiKey) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${userLat},${userLng}&radius=15000&type=hospital&key=${apiKey}`
      )
      const data = await response.json()

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const hospitals: Hospital[] = data.results.map((place: GooglePlace, index: number) => {
          const distance = calculateDistance(
            userLat,
            userLng,
            place.geometry.location.lat,
            place.geometry.location.lng
          )
          const duration = estimateDuration(distance)

          return {
            id: place.place_id,
            name: place.name,
            location: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
            },
            distance: Math.round(distance * 100) / 100,
            duration,
            availableBeds: Math.floor(Math.random() * 20) + 5,
            traumaLevel: (index % 3) + 1,
            specialties: ["Emergency", "ICU", "Surgery", "Trauma"].slice(0, (index % 4) + 1),
            address: place.vicinity || place.formatted_address || "Address unavailable",
            phone: "112",
            rating: place.rating,
            isOpen: place.opening_hours?.open_now,
          }
        })

        // Sort by distance (closest first)
        hospitals.sort((a, b) => a.distance - b.distance)

        return NextResponse.json({ hospitals, source: "google" })
      }
    } catch (error) {
      console.error("Google Places API error:", error)
    }
  }

  // Fallback: Use Overpass API (OpenStreetMap) - free, no API key required
  try {
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](around:15000,${userLat},${userLng});
        way["amenity"="hospital"](around:15000,${userLat},${userLng});
        relation["amenity"="hospital"](around:15000,${userLat},${userLng});
      );
      out center;
    `

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: overpassQuery,
    })

    const data = await response.json()

    if (data.elements && data.elements.length > 0) {
      const hospitals: Hospital[] = data.elements
        .filter((element: { lat?: number; lon?: number; center?: { lat: number; lon: number } }) => 
          element.lat || element.center?.lat
        )
        .map((element: { 
          id: number
          lat?: number
          lon?: number
          center?: { lat: number; lon: number }
          tags?: { 
            name?: string
            'addr:full'?: string
            'addr:street'?: string
            'addr:city'?: string
            phone?: string
          }
        }, index: number) => {
          const hospitalLat = element.lat || element.center?.lat || 0
          const hospitalLng = element.lon || element.center?.lon || 0
          const distance = calculateDistance(userLat, userLng, hospitalLat, hospitalLng)
          const duration = estimateDuration(distance)

          return {
            id: `osm-${element.id}`,
            name: element.tags?.name || `Hospital ${index + 1}`,
            location: {
              lat: hospitalLat,
              lng: hospitalLng,
            },
            distance: Math.round(distance * 100) / 100,
            duration,
            availableBeds: Math.floor(Math.random() * 20) + 5,
            traumaLevel: (index % 3) + 1,
            specialties: ["Emergency", "ICU", "Surgery", "Trauma"].slice(0, (index % 4) + 1),
            address:
              element.tags?.["addr:full"] ||
              element.tags?.["addr:street"] ||
              element.tags?.["addr:city"] ||
              "Address unavailable",
            phone: element.tags?.phone || "112",
          }
        })

      // Sort by distance (closest first)
      hospitals.sort((a, b) => a.distance - b.distance)

      return NextResponse.json({ hospitals: hospitals.slice(0, 10), source: "openstreetmap" })
    }
  } catch (error) {
    console.error("Overpass API error:", error)
  }

  // Final fallback: Generate contextual mock data based on location
  const mockHospitals = generateLocationBasedMockHospitals(userLat, userLng)
  return NextResponse.json({ hospitals: mockHospitals, source: "mock" })
}

function generateLocationBasedMockHospitals(lat: number, lng: number): Hospital[] {
  // Generate hospitals at realistic distances around user location
  const hospitalData = [
    { name: "City General Hospital", offsetLat: 0.005, offsetLng: 0.003 },
    { name: "District Medical Center", offsetLat: -0.008, offsetLng: 0.006 },
    { name: "Emergency Care Hospital", offsetLat: 0.012, offsetLng: -0.004 },
    { name: "Super Specialty Hospital", offsetLat: -0.015, offsetLng: -0.01 },
    { name: "Government Hospital", offsetLat: 0.02, offsetLng: 0.015 },
    { name: "Private Medical Center", offsetLat: -0.025, offsetLng: 0.02 },
    { name: "Community Health Center", offsetLat: 0.03, offsetLng: -0.025 },
    { name: "Regional Hospital", offsetLat: -0.04, offsetLng: -0.03 },
  ]

  const hospitals: Hospital[] = hospitalData.map((hospital, index) => {
    const hospitalLat = lat + hospital.offsetLat
    const hospitalLng = lng + hospital.offsetLng
    const distance = calculateDistance(lat, lng, hospitalLat, hospitalLng)
    const duration = estimateDuration(distance)

    return {
      id: `mock-${index}`,
      name: hospital.name,
      location: {
        lat: hospitalLat,
        lng: hospitalLng,
      },
      distance: Math.round(distance * 100) / 100,
      duration,
      availableBeds: Math.floor(Math.random() * 25) + 5,
      traumaLevel: (index % 3) + 1,
      specialties: ["Emergency", "ICU", "Surgery", "Trauma", "Cardiology"].slice(0, (index % 5) + 1),
      address: `${Math.abs(Math.round(hospital.offsetLat * 1000))} Hospital Road`,
      phone: "112",
    }
  })

  // Sort by distance
  hospitals.sort((a, b) => a.distance - b.distance)

  return hospitals
}
