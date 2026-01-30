"use client"

import { Building2, Clock, Bed, Phone, ChevronRight } from "lucide-react"
import type { Hospital } from "@/lib/emergency-types"

interface HospitalListProps {
  hospitals: Hospital[]
  selectedHospital: Hospital | null
  onSelect: (hospital: Hospital) => void
}

export function HospitalList({ hospitals, selectedHospital, onSelect }: HospitalListProps) {
  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-400" />
          Nearby Hospitals
        </h3>
        <span className="text-xs text-white/50">{hospitals.length} found</span>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {hospitals.map((hospital) => (
          <button
            key={hospital.id}
            onClick={() => onSelect(hospital)}
            className={`w-full text-left p-3 rounded-xl transition-all ${
              selectedHospital?.id === hospital.id
                ? "bg-blue-500/20 border border-blue-500/40"
                : "bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-white font-medium text-sm truncate">{hospital.name}</h4>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      hospital.traumaLevel === 1
                        ? "bg-red-500/20 text-red-400"
                        : hospital.traumaLevel === 2
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    L{hospital.traumaLevel}
                  </span>
                </div>
                <p className="text-xs text-white/50 truncate mt-0.5">{hospital.address}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {hospital.duration} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Bed className="w-3 h-3" />
                    {hospital.availableBeds} beds
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-lg font-bold text-white">{hospital.distance.toFixed(1)}</span>
                <span className="text-xs text-white/50">km</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <div className="flex flex-wrap gap-1">
                {hospital.specialties.slice(0, 2).map((s) => (
                  <span key={s} className="text-xs px-1.5 py-0.5 bg-white/5 rounded text-white/60">
                    {s}
                  </span>
                ))}
              </div>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </div>
          </button>
        ))}
      </div>

      {selectedHospital && (
        <div className="pt-2 border-t border-white/10">
          <a
            href={`tel:${selectedHospital.phone}`}
            className="flex items-center justify-center gap-2 w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-colors"
          >
            <Phone className="w-4 h-4" />
            Call {selectedHospital.name}
          </a>
        </div>
      )}
    </div>
  )
}
