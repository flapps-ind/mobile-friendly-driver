"use client"

import { useState } from "react"
import { Phone, AlertTriangle, Mic, Shield } from "lucide-react"

interface SOSButtonProps {
  onActivate: () => void
  isActive: boolean
  isLoading: boolean
}

export function SOSButton({ onActivate, isActive, isLoading }: SOSButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Main SOS Button */}
      <div className="relative">
        {/* Outer glow rings */}
        {isActive && (
          <>
            <div className="absolute inset-0 -m-8 rounded-full bg-red-500/20 animate-ping" />
            <div className="absolute inset-0 -m-6 rounded-full bg-red-500/30 animate-pulse" />
            <div className="absolute inset-0 -m-4 rounded-full bg-red-500/40 animate-pulse" style={{ animationDelay: "150ms" }} />
          </>
        )}

        {/* Button container */}
        <button
          onClick={onActivate}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
          disabled={isLoading}
          className={`
            relative w-48 h-48 rounded-full
            bg-gradient-to-br from-red-500 via-red-600 to-red-700
            shadow-[0_0_60px_rgba(239,68,68,0.5)]
            border-4 border-red-400/50
            transition-all duration-200
            ${isPressed ? "scale-95 shadow-[0_0_40px_rgba(239,68,68,0.4)]" : "scale-100"}
            ${isActive ? "animate-pulse" : "hover:scale-105 hover:shadow-[0_0_80px_rgba(239,68,68,0.6)]"}
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center
            group
          `}
        >
          {/* Inner circle */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-red-400 to-red-600 opacity-50" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-2">
            {isLoading ? (
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <AlertTriangle className="w-12 h-12 text-white drop-shadow-lg" />
                <span className="text-3xl font-black text-white tracking-wider drop-shadow-lg">SOS</span>
              </>
            )}
          </div>

          {/* Shine effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/20 opacity-50" />
        </button>
      </div>

      {/* Status Text */}
      <div className="text-center">
        {isActive ? (
          <div className="flex items-center gap-2 text-red-400 animate-pulse">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
            <span className="text-lg font-semibold">EMERGENCY ACTIVE</span>
          </div>
        ) : isLoading ? (
          <p className="text-white/60">Acquiring GPS location...</p>
        ) : (
          <p className="text-white/60">Press to request emergency assistance</p>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="flex gap-4 mt-4">
        <button className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
            <Phone className="w-6 h-6 text-blue-400" />
          </div>
          <span className="text-xs text-white/60">Call 112</span>
        </button>

        <button className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
            <Mic className="w-6 h-6 text-green-400" />
          </div>
          <span className="text-xs text-white/60">Voice SOS</span>
        </button>

        <button className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group">
          <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
            <Shield className="w-6 h-6 text-purple-400" />
          </div>
          <span className="text-xs text-white/60">Safe Mode</span>
        </button>
      </div>
    </div>
  )
}
