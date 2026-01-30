"use client"

import { useState, useEffect, useCallback } from "react"
import { LeafletMap } from "@/components/emergency/leaflet-map"
import { SOSButton } from "@/components/emergency/sos-button"
import { LocationTracker } from "@/components/emergency/location-tracker"
import { HospitalList } from "@/components/emergency/hospital-list"
import type { UserLocation, Hospital, Ambulance } from "@/lib/emergency-types"
import { Activity, AlertCircle, Map, Users, Zap, Phone, Navigation } from "lucide-react"

export default function EmergencyPage() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [ambulances, setAmbulances] = useState<Ambulance[]>([])
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)
  const [dispatchedAmbulance, setDispatchedAmbulance] = useState<Ambulance | null>(null)
  const [emergencyActive, setEmergencyActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [dataSource, setDataSource] = useState<string>("")

  // Get user's current location with high accuracy
  const getCurrentLocation = useCallback((): Promise<UserLocation> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"))
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp,
          }

          // Get address via API route
          try {
            const response = await fetch(
              `/api/geocode?lat=${location.latitude}&lng=${location.longitude}`
            )
            const data = await response.json()
            if (data.address) {
              location.address = data.address
            }
          } catch (error) {
            console.log("[v0] Geocoding error:", error)
          }

          resolve(location)
        },
        (error) => {
          let errorMessage = "Unable to get your location"
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Please allow location access to use emergency services"
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable"
              break
            case error.TIMEOUT:
              errorMessage = "Location request timed out"
              break
          }
          reject(new Error(errorMessage))
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      )
    })
  }, [])

  // Fetch nearby hospitals using server-side API
  const fetchNearbyHospitals = useCallback(async (location: UserLocation): Promise<Hospital[]> => {
    try {
      const response = await fetch(
        `/api/hospitals?lat=${location.latitude}&lng=${location.longitude}`
      )
      const data = await response.json()

      if (data.hospitals && data.hospitals.length > 0) {
        setDataSource(data.source)
        return data.hospitals
      }
    } catch (error) {
      console.log("[v0] Hospitals API error:", error)
    }

    return []
  }, [])

  // Generate mock ambulances
  const generateMockAmbulances = (location: UserLocation): Ambulance[] => {
    const ambulanceCallSigns = ["AMB-101", "AMB-102", "AMB-103"]

    return ambulanceCallSigns.map((callSign, index) => ({
      id: `ambulance-${index}`,
      callSign,
      location: {
        lat: location.latitude + (Math.random() - 0.5) * 0.02,
        lng: location.longitude + (Math.random() - 0.5) * 0.02,
      },
      status: "available" as const,
      eta: Math.floor(Math.random() * 10) + 3,
      distance: Math.random() * 3 + 0.5,
      crew: 2,
      equipment: ["AED", "Oxygen", "First Aid"],
    }))
  }

  // Activate emergency
  const activateEmergency = async () => {
    setIsLoading(true)
    setLocationError(null)

    try {
      // Get current location
      const location = await getCurrentLocation()
      setUserLocation(location)
      setShowMap(true)

      // Fetch nearby hospitals (sorted by distance on server)
      const nearbyHospitals = await fetchNearbyHospitals(location)
      setHospitals(nearbyHospitals)

      // Generate ambulances
      const nearbyAmbulances = generateMockAmbulances(location)
      setAmbulances(nearbyAmbulances)

      // Auto-select nearest hospital
      if (nearbyHospitals.length > 0) {
        setSelectedHospital(nearbyHospitals[0])
      }

      // Dispatch nearest ambulance
      const nearestAmbulance = nearbyAmbulances.sort((a, b) => a.distance - b.distance)[0]
      nearestAmbulance.status = "dispatched"
      setDispatchedAmbulance(nearestAmbulance)

      setEmergencyActive(true)

      console.log("[v0] Emergency activated:", {
        location: `${location.latitude}, ${location.longitude}`,
        accuracy: `${location.accuracy}m`,
        address: location.address,
        hospitalsFound: nearbyHospitals.length,
      })
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Continuous location tracking
  useEffect(() => {
    if (!emergencyActive) return

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: position.timestamp,
          address: userLocation?.address,
        }
        setUserLocation(location)
      },
      (error) => {
        console.log("[v0] Watch position error:", error)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [emergencyActive, userLocation?.address])

  // Open directions in Google Maps / Apple Maps
  const openDirections = (hospital: Hospital) => {
    if (!userLocation) return

    const origin = `${userLocation.latitude},${userLocation.longitude}`
    const destination = `${hospital.location.lat},${hospital.location.lng}`

    // Check if iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

    if (isIOS) {
      window.open(
        `maps://maps.apple.com/?saddr=${origin}&daddr=${destination}&dirflg=d`,
        "_blank"
      )
    } else {
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`,
        "_blank"
      )
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Emergency SOS</h1>
              <p className="text-xs text-white/50">AI-Powered Response System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {emergencyActive && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-full border border-red-500/30">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm text-red-400 font-medium">ACTIVE</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-20 pb-8">
        {!showMap ? (
          /* Initial SOS Screen */
          <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center px-4">
            <SOSButton onActivate={activateEmergency} isActive={emergencyActive} isLoading={isLoading} />

            {locationError && (
              <div className="mt-6 flex items-center gap-2 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">{locationError}</p>
              </div>
            )}

            {/* Features */}
            <div className="mt-12 grid grid-cols-3 gap-4 max-w-md">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-xs text-white/60">Instant Response</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Map className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-xs text-white/60">GPS Tracking</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-amber-400" />
                </div>
                <p className="text-xs text-white/60">24/7 Support</p>
              </div>
            </div>

            {/* Emergency Hotline */}
            <a
              href="tel:112"
              className="mt-8 flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
            >
              <Phone className="w-5 h-5 text-green-400" />
              <span className="text-white/80">Emergency Hotline: 112</span>
            </a>
          </div>
        ) : (
          /* Emergency Active Screen with Map */
          <div className="flex flex-col lg:flex-row gap-4 px-4 h-[calc(100vh-6rem)]">
            {/* Map Section */}
            <div className="flex-1 min-h-[400px] lg:min-h-0 rounded-2xl overflow-hidden border border-white/10">
              <LeafletMap
                userLocation={userLocation}
                hospitals={hospitals}
                ambulances={ambulances}
                selectedHospital={selectedHospital}
                dispatchedAmbulance={dispatchedAmbulance}
                onHospitalSelect={setSelectedHospital}
              />
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-96 space-y-4 overflow-y-auto pb-4">
              {/* Location Tracker */}
              <LocationTracker userLocation={userLocation} dispatchedAmbulance={dispatchedAmbulance} />

              {/* Data Source Indicator */}
              {dataSource && (
                <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-xs text-blue-400">
                    Hospital data from:{" "}
                    <span className="font-medium capitalize">
                      {dataSource === "google"
                        ? "Google Places"
                        : dataSource === "openstreetmap"
                          ? "OpenStreetMap"
                          : "Local Database"}
                    </span>
                  </p>
                </div>
              )}

              {/* Hospital List */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  Nearby Hospitals
                  <span className="text-white/50 font-normal">({hospitals.length})</span>
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {hospitals.map((hospital, index) => (
                    <div
                      key={hospital.id}
                      onClick={() => setSelectedHospital(hospital)}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        selectedHospital?.id === hospital.id
                          ? "bg-green-500/20 border border-green-500/30"
                          : "bg-white/5 border border-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            selectedHospital?.id === hospital.id
                              ? "bg-green-500 text-white"
                              : "bg-blue-500 text-white"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white/90 truncate">{hospital.name}</h4>
                          <p className="text-xs text-white/50 truncate">{hospital.address}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-green-400 font-medium">
                              {hospital.distance.toFixed(1)} km
                            </span>
                            <span className="text-xs text-white/50">~{hospital.duration} min</span>
                            <span className="text-xs text-blue-400">{hospital.availableBeds} beds</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions for selected hospital */}
                      {selectedHospital?.id === hospital.id && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openDirections(hospital)
                            }}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-sm font-medium text-white transition-colors"
                          >
                            <Navigation className="w-4 h-4" />
                            Get Directions
                          </button>
                          <a
                            href={`tel:${hospital.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium text-white transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                            Call
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancel Button */}
              <button
                onClick={() => {
                  setEmergencyActive(false)
                  setShowMap(false)
                  setDispatchedAmbulance(null)
                  setHospitals([])
                  setAmbulances([])
                  setSelectedHospital(null)
                  setDataSource("")
                }}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white transition-colors"
              >
                Cancel Emergency
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
