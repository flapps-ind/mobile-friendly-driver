"use client"

import { MapPin, Navigation, Signal, Clock, Target } from "lucide-react"
import type { UserLocation, Ambulance } from "@/lib/emergency-types"

interface LocationTrackerProps {
  userLocation: UserLocation | null
  dispatchedAmbulance: Ambulance | null
}

export function LocationTracker({ userLocation, dispatchedAmbulance }: LocationTrackerProps) {
  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-green-400" />
          Live Tracking
        </h3>
        <div className="flex items-center gap-1">
          <Signal className="w-4 h-4 text-green-400" />
          <span className="text-xs text-green-400">Connected</span>
        </div>
      </div>

      {/* User Location */}
      <div className="bg-white/5 rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-2 text-white/70 text-sm">
          <MapPin className="w-4 h-4 text-red-400" />
          Your Location
        </div>
        {userLocation ? (
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-black/30 rounded-lg p-2">
                <div className="text-white/50">Latitude</div>
                <div className="text-white font-mono">{userLocation.latitude.toFixed(6)}</div>
              </div>
              <div className="bg-black/30 rounded-lg p-2">
                <div className="text-white/50">Longitude</div>
                <div className="text-white font-mono">{userLocation.longitude.toFixed(6)}</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-white/50 mt-2">
              <span>Accuracy: ±{Math.round(userLocation.accuracy)}m</span>
              {userLocation.speed !== null && (
                <span>Speed: {(userLocation.speed * 3.6).toFixed(1)} km/h</span>
              )}
            </div>
            {userLocation.address && (
              <div className="text-xs text-white/70 mt-2 bg-black/20 rounded-lg p-2">
                {userLocation.address}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white/70 rounded-full animate-spin" />
            Acquiring GPS...
          </div>
        )}
      </div>

      {/* Ambulance Tracking */}
      {dispatchedAmbulance && (
        <div className="bg-green-500/10 rounded-xl p-3 space-y-2 border border-green-500/20">
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
            <Navigation className="w-4 h-4" />
            Ambulance En Route
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-green-400 font-bold text-sm">{dispatchedAmbulance.callSign}</span>
              </div>
              <div>
                <div className="text-white font-medium">{dispatchedAmbulance.callSign}</div>
                <div className="text-xs text-white/50">{dispatchedAmbulance.distance.toFixed(1)} km away</div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-400">
                <Clock className="w-4 h-4" />
                <span className="text-2xl font-bold">{dispatchedAmbulance.eta}</span>
              </div>
              <div className="text-xs text-white/50">min ETA</div>
            </div>
          </div>
          <div className="h-2 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-1000"
              style={{ width: `${Math.max(10, 100 - (dispatchedAmbulance.eta / 15) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Last Update */}
      {userLocation && (
        <div className="text-center text-xs text-white/40">
          Last updated: {new Date(userLocation.timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
