import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, ZoomIn, ZoomOut, Search, Loader2 } from "lucide-react";

export default function InteractiveMap({
  latitude,
  longitude,
  radius = 50,
  name = "Selected Location",
  room = "",
  editable = false,
  onChange,
  height = "320px",
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const [addressSearch, setAddressSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const validLat = parseFloat(latitude) || 12.29581;
  const validLng = parseFloat(longitude) || 76.63929;

  // Custom SVG icon for pin
  const customIcon = L.divIcon({
    className: "custom-map-marker",
    html: `
      <div style="
        background: #0f172a;
        color: #ffffff;
        border: 2px solid #06b6d4;
        border-radius: 50%;
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transform: translate(-17px, -17px);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [validLat, validLng],
      zoom: 16,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Marker
    const marker = L.marker([validLat, validLng], {
      icon: customIcon,
      draggable: editable,
    }).addTo(map);

    if (name || room) {
      marker.bindPopup(`<strong>${name}</strong>${room ? `<br/>${room}` : ""}`);
    }

    // Geofence Circle
    const circle = L.circle([validLat, validLng], {
      radius: Number(radius) || 50,
      color: "#0891b2",
      weight: 2,
      fillColor: "#06b6d4",
      fillOpacity: 0.2,
    }).addTo(map);

    mapInstanceRef.current = map;
    markerRef.current = marker;
    circleRef.current = circle;

    if (editable) {
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        circle.setLatLng([lat, lng]);
        if (onChange) {
          onChange({
            latitude: lat.toFixed(5),
            longitude: lng.toFixed(5),
          });
        }
      });

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        circle.setLatLng(pos);
        if (onChange) {
          onChange({
            latitude: pos.lat.toFixed(5),
            longitude: pos.lng.toFixed(5),
          });
        }
      });
    }

    // Fix gray tiles / sizing after initial render
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
  }, []);

  // Update marker and circle position when props change
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !circleRef.current) return;
    const newPos = [validLat, validLng];
    markerRef.current.setLatLng(newPos);
    circleRef.current.setLatLng(newPos);
    circleRef.current.setRadius(Number(radius) || 50);

    if (name || room) {
      markerRef.current.bindPopup(`<strong>${name}</strong>${room ? `<br/>${room}` : ""}`);
    }

    mapInstanceRef.current.panTo(newPos, { animate: true });
  }, [validLat, validLng, radius, name, room]);

  function handleZoomIn() {
    mapInstanceRef.current?.zoomIn();
  }

  function handleZoomOut() {
    mapInstanceRef.current?.zoomOut();
  }

  function handleRecenter() {
    mapInstanceRef.current?.setView([validLat, validLng], 16, { animate: true });
  }

  async function handleSearch(e) {
    e?.preventDefault();
    if (!addressSearch.trim()) return;
    setSearching(true);
    setSearchError("");

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          addressSearch
        )}&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lon], 17, { animate: true });
          if (markerRef.current) markerRef.current.setLatLng([lat, lon]);
          if (circleRef.current) circleRef.current.setLatLng([lat, lon]);
        }
        if (editable && onChange) {
          onChange({
            latitude: lat.toFixed(5),
            longitude: lon.toFixed(5),
          });
        }
      } else {
        setSearchError("Location not found. Try a different query.");
      }
    } catch {
      setSearchError("Unable to search address at this time.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-navy-200 shadow-sm bg-navy-50" style={{ height }}>
      {/* Top search overlay if editable */}
      {editable && (
        <form
          onSubmit={handleSearch}
          className="absolute top-3 left-3 right-14 z-[1000] flex gap-1.5 bg-white/95 backdrop-blur-sm p-1.5 rounded-xl shadow-md border border-navy-100"
        >
          <input
            type="text"
            className="w-full text-xs px-2.5 py-1.5 outline-none rounded-lg text-navy-800 placeholder-navy-400 bg-transparent"
            placeholder="Search address or landmark..."
            value={addressSearch}
            onChange={(e) => {
              setAddressSearch(e.target.value);
              setSearchError("");
            }}
          />
          <button
            type="submit"
            disabled={searching}
            className="p-1.5 bg-navy-800 text-white rounded-lg hover:bg-navy-900 transition-colors shrink-0 disabled:opacity-50"
            title="Search"
          >
            {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
          </button>
        </form>
      )}

      {searchError && (
        <div className="absolute top-14 left-3 right-14 z-[1000] bg-rose-50 text-rose-600 border border-rose-200 text-xs px-2.5 py-1 rounded-lg">
          {searchError}
        </div>
      )}

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Controls */}
      <div className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-1.5 shadow-md">
        <button
          type="button"
          onClick={handleRecenter}
          className="p-2 bg-white text-navy-700 hover:bg-navy-50 rounded-xl border border-navy-200 shadow-sm transition-colors"
          title="Center on target"
        >
          <Navigation size={14} />
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-2 bg-white text-navy-700 hover:bg-navy-50 rounded-xl border border-navy-200 shadow-sm transition-colors"
          title="Zoom in"
        >
          <ZoomIn size={14} />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-2 bg-white text-navy-700 hover:bg-navy-50 rounded-xl border border-navy-200 shadow-sm transition-colors"
          title="Zoom out"
        >
          <ZoomOut size={14} />
        </button>
      </div>

      {/* Click tip indicator for editable mode */}
      {editable && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm text-[11px] text-navy-600 px-2.5 py-1 rounded-lg border border-navy-200 shadow-sm pointer-events-none">
          Click or drag marker to set physical location
        </div>
      )}
    </div>
  );
}
