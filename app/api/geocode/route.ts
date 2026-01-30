import { NextRequest, NextResponse } from "next/server"

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

  // Try Google Geocoding API first
  if (apiKey) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${userLat},${userLng}&key=${apiKey}`
      )
      const data = await response.json()

      if (data.status === "OK" && data.results && data.results[0]) {
        return NextResponse.json({
          address: data.results[0].formatted_address,
          components: data.results[0].address_components,
          source: "google",
        })
      }
    } catch (error) {
      console.error("Google Geocoding API error:", error)
    }
  }

  // Fallback: Use Nominatim (OpenStreetMap) - free, no API key required
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "EmergencySOS/1.0",
        },
      }
    )

    const data = await response.json()

    if (data.display_name) {
      return NextResponse.json({
        address: data.display_name,
        components: data.address,
        source: "nominatim",
      })
    }
  } catch (error) {
    console.error("Nominatim API error:", error)
  }

  // Final fallback
  return NextResponse.json({
    address: `${userLat.toFixed(6)}, ${userLng.toFixed(6)}`,
    source: "coordinates",
  })
}
