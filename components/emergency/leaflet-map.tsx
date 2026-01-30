"use client"

import { useEffect, useRef, useState } from "react"
import type { UserLocation, Hospital, Ambulance } from "@/lib/emergency-types"
import { MapPin, Navigation, AlertCircle } from "lucide-react"

interface LeafletMapProps {
  userLocation: UserLocation | null
  hospitals: Hospital[]
  ambulances: Ambulance[]
  selectedHospital: Hospital | null
  dispatchedAmbulance: Ambulance | null
  onHospitalSelect?: (hospital: Hospital) => void
}

// Dynamic import types
type LeafletType = typeof import("leaflet")
type MapType = import("leaflet").Map
type MarkerType = import("leaflet").Marker
type CircleType = import("leaflet").Circle
type PolylineType = import("leaflet").Polyline

export function LeafletMap({
  userLocation,
  hospitals,
  selectedHospital,
  dispatchedAmbulance,
  onHospitalSelect,
}: LeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapType | null>(null)
  const userMarkerRef = useRef<MarkerType | null>(null)
  const accuracyCircleRef = useRef<CircleType | null>(null)
  const hospitalMarkersRef = useRef<MarkerType[]>([])
  const ambulanceMarkerRef = useRef<MarkerType | null>(null)
  const routeLineRef = useRef<PolylineType | null>(null)
  const mapInitializedRef = useRef(false)
  const [L, setL] = useState<LeafletType | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      // Add Leaflet CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        link.crossOrigin = ""
        document.head.appendChild(link)
      }

      const leaflet = await import("leaflet")
      setL(leaflet.default)
    }

    loadLeaflet()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!L || !mapContainer.current || mapInitializedRef.current) return

    // Prevent double initialization in React Strict Mode
    mapInitializedRef.current = true

    const defaultCenter: [number, number] = userLocation
      ? [userLocation.latitude, userLocation.longitude]
      : [12.9716, 77.5946] // Default to Bangalore

    try {
      const map = L.map(mapContainer.current, {
        center: defaultCenter,
        zoom: 14,
        zoomControl: false,
      })

      // Add dark tile layer
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map)

      // Add zoom control to top right
      L.control.zoom({ position: "topright" }).addTo(map)

      mapRef.current = map
      setMapReady(true)
    } catch (error) {
      console.error("Failed to initialize map:", error)
      mapInitializedRef.current = false
    }

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove()
        } catch (e) {
          // Ignore cleanup errors
        }
        mapRef.current = null
      }
      mapInitializedRef.current = false
      setMapReady(false)
    }
  }, [L])

  // Update user location marker
  useEffect(() => {
    const map = mapRef.current
    if (!L || !map || !userLocation || !mapReady) return

    const { latitude, longitude, accuracy } = userLocation

    // Create or update user marker
    if (userMarkerRef.current) {
      try {
        userMarkerRef.current.setLatLng([latitude, longitude])
      } catch (e) {
        userMarkerRef.current = null
      }
    }
    
    if (!userMarkerRef.current) {
      // Custom user icon - RED with glow
      const userIcon = L.divIcon({
        className: "user-location-marker",
        html: `
          <div style="
            position: relative;
            width: 40px;
            height: 40px;
          ">
            <div style="
              position: absolute;
              inset: 0;
              background: rgba(239, 68, 68, 0.4);
              border-radius: 50%;
              animation: user-pulse 2s ease-out infinite;
              box-shadow: 0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.4);
            "></div>
            <div style="
              position: absolute;
              inset: 8px;
              background: #ef4444;
              border-radius: 50%;
              border: 3px solid #fff;
              box-shadow: 0 0 15px rgba(239, 68, 68, 1), 0 0 30px rgba(239, 68, 68, 0.8);
            "></div>
            <div style="
              position: absolute;
              inset: 14px;
              background: #fff;
              border-radius: 50%;
            "></div>
          </div>
          <style>
            @keyframes user-pulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.8); opacity: 0.4; }
              100% { transform: scale(2.5); opacity: 0; }
            }
          </style>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      })

      userMarkerRef.current = L.marker([latitude, longitude], {
        icon: userIcon,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup(
          `<div style="text-align: center; font-weight: bold; color: #000;">
            Your Location<br/>
            <span style="font-size: 11px; color: #666;">
              Accuracy: ${Math.round(accuracy)}m
            </span>
          </div>`
        )
    }

    // Create or update accuracy circle
    if (accuracyCircleRef.current) {
      try {
        accuracyCircleRef.current.setLatLng([latitude, longitude])
        accuracyCircleRef.current.setRadius(accuracy)
      } catch (e) {
        accuracyCircleRef.current = null
      }
    }
    
    if (!accuracyCircleRef.current) {
      accuracyCircleRef.current = L.circle([latitude, longitude], {
        radius: accuracy,
        color: "#ef4444",
        fillColor: "#ef4444",
        fillOpacity: 0.1,
        weight: 1,
      }).addTo(map)
    }

    // Center map on user
    try {
      map.setView([latitude, longitude], map.getZoom())
    } catch (e) {
      // Ignore view errors
    }
  }, [L, userLocation, mapReady])

  // Update hospital markers
  useEffect(() => {
    const map = mapRef.current
    if (!L || !map || !mapReady) return

    // Clear existing hospital markers
    hospitalMarkersRef.current.forEach((marker) => {
      try {
        marker.remove()
      } catch (e) {
        // Ignore removal errors
      }
    })
    hospitalMarkersRef.current = []

    // Add new hospital markers - GREEN with glow
    hospitals.forEach((hospital, index) => {
      const isSelected = selectedHospital?.id === hospital.id
      const hospitalIcon = L.divIcon({
        className: "hospital-marker",
        html: `
          <div style="
            position: relative;
            width: ${isSelected ? "48px" : "40px"};
            height: ${isSelected ? "48px" : "40px"};
          ">
            <div style="
              position: absolute;
              inset: 0;
              background: rgba(34, 197, 94, 0.3);
              border-radius: 50%;
              animation: hospital-glow 2s ease-in-out infinite;
              box-shadow: 0 0 15px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.5);
            "></div>
            <div style="
              position: absolute;
              inset: ${isSelected ? "6px" : "8px"};
              display: flex;
              align-items: center;
              justify-content: center;
              background: #22c55e;
              border-radius: 50%;
              border: 3px solid #fff;
              box-shadow: 0 0 12px rgba(34, 197, 94, 1), 0 0 24px rgba(34, 197, 94, 0.6);
              color: #fff;
              font-weight: bold;
              font-size: ${isSelected ? "16px" : "13px"};
            ">
              ${index + 1}
            </div>
          </div>
          <style>
            @keyframes hospital-glow {
              0%, 100% { transform: scale(1); opacity: 0.8; }
              50% { transform: scale(1.15); opacity: 1; }
            }
          </style>
        `,
        iconSize: [isSelected ? 48 : 40, isSelected ? 48 : 40],
        iconAnchor: [isSelected ? 24 : 20, isSelected ? 24 : 20],
      })

      const marker = L.marker([hospital.location.lat, hospital.location.lng], {
        icon: hospitalIcon,
      })
        .addTo(map)
        .bindPopup(
          `<div style="min-width: 150px; color: #000;">
            <strong>${hospital.name}</strong><br/>
            <span style="font-size: 12px; color: #666;">
              ${hospital.distance.toFixed(1)} km away<br/>
              ~${hospital.duration} min drive<br/>
              ${hospital.availableBeds} beds available
            </span>
          </div>`
        )
        .on("click", () => {
          onHospitalSelect?.(hospital)
        })

      hospitalMarkersRef.current.push(marker)
    })
  }, [L, hospitals, selectedHospital, mapReady, onHospitalSelect])

  // Update ambulance marker
  useEffect(() => {
    const map = mapRef.current
    if (!L || !map || !mapReady) return

    if (ambulanceMarkerRef.current) {
      try {
        ambulanceMarkerRef.current.remove()
      } catch (e) {
        // Ignore removal errors
      }
      ambulanceMarkerRef.current = null
    }

    if (dispatchedAmbulance) {
      const ambulanceIcon = L.divIcon({
        className: "ambulance-marker",
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            background: #f59e0b;
            border-radius: 50%;
            border: 3px solid #fff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            animation: ambulance-pulse 1s infinite;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M3 15h4v-4H3v4zm14 0h4v-4h-4v4zM3 9h18V5H3v4z"/>
              <circle cx="6" cy="17" r="2"/>
              <circle cx="18" cy="17" r="2"/>
            </svg>
          </div>
          <style>
            @keyframes ambulance-pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
          </style>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })

      ambulanceMarkerRef.current = L.marker(
        [dispatchedAmbulance.location.lat, dispatchedAmbulance.location.lng],
        { icon: ambulanceIcon }
      )
        .addTo(map)
        .bindPopup(
          `<div style="text-align: center; color: #000;">
            <strong>${dispatchedAmbulance.callSign}</strong><br/>
            <span style="font-size: 12px; color: #666;">
              ETA: ${dispatchedAmbulance.eta} min
            </span>
          </div>`
        )
    }
  }, [L, dispatchedAmbulance, mapReady])

  // Draw route line to selected hospital
  useEffect(() => {
    const map = mapRef.current
    if (!L || !map || !mapReady || !userLocation) return

    if (routeLineRef.current) {
      try {
        routeLineRef.current.remove()
      } catch (e) {
        // Ignore removal errors
      }
      routeLineRef.current = null
    }

    if (selectedHospital) {
      // Draw a simple straight line (for real routing, you'd use OSRM or similar)
      const routeCoords: [number, number][] = [
        [userLocation.latitude, userLocation.longitude],
        [selectedHospital.location.lat, selectedHospital.location.lng],
      ]

      routeLineRef.current = L.polyline(routeCoords, {
        color: "#22c55e",
        weight: 4,
        opacity: 0.8,
        dashArray: "10, 10",
      }).addTo(map)

      // Fit bounds to show both points
      try {
        const bounds = L.latLngBounds(routeCoords)
        map.fitBounds(bounds, { padding: [50, 50] })
      } catch (e) {
        // Ignore bounds errors
      }
    }
  }, [L, userLocation, selectedHospital, mapReady])

  if (!L) {
    return (
      <div className="w-full h-full bg-[#1a1a2e] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-sm space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          <span className="text-white/80">Your Location</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
          <span className="text-white/80">Hospitals</span>
        </div>
        {dispatchedAmbulance && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <span className="text-white/80">Ambulance</span>
          </div>
        )}
      </div>

      {/* Recenter Button */}
      {userLocation && (
        <button
          onClick={() => {
            if (mapRef.current && userLocation) {
              mapRef.current.setView([userLocation.latitude, userLocation.longitude], 15)
            }
          }}
          className="absolute top-4 left-4 bg-black/80 hover:bg-black backdrop-blur-sm rounded-lg p-3 text-white transition-colors"
          title="Center on your location"
        >
          <Navigation className="w-5 h-5" />
        </button>
      )}

      {/* Location Info Overlay */}
      {userLocation && (
        <div className="absolute top-4 right-16 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white/80">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-red-400" />
            <span>
              {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <AlertCircle className="w-3 h-3 text-blue-400" />
            <span>Accuracy: {Math.round(userLocation.accuracy)}m</span>
          </div>
        </div>
      )}
    </div>
  )
}
