import React, { useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's broken default icon paths in Vite/Webpack builds
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LatLng {
  lat: number;
  lng: number;
}

interface MapPickerProps {
  position: LatLng | null;
  onChange: (pos: LatLng) => void;
}

/** Listens for map clicks and moves the pin */
function ClickHandler({ onChange }: { onChange: (pos: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/** Flies the map to a new centre whenever `position` changes */
function FlyToPosition({ position }: { position: LatLng | null }) {
  const map = useMap();
  const prevPos = useRef<LatLng | null>(null);

  useEffect(() => {
    if (
      position &&
      (prevPos.current?.lat !== position.lat ||
        prevPos.current?.lng !== position.lng)
    ) {
      map.flyTo([position.lat, position.lng], 16, { duration: 1.2 });
      prevPos.current = position;
    }
  }, [position, map]);

  return null;
}

const MapPicker: React.FC<MapPickerProps> = ({ position, onChange }) => {
  // Default centre: India (Mumbai)
  const defaultCenter: [number, number] = position
    ? [position.lat, position.lng]
    : [19.076, 72.8777];

  return (
    <div className="relative w-full h-72 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-inner">
      {/* Subtle cross-hair hint overlay */}
      <div className="absolute inset-0 pointer-events-none z-[400] flex items-center justify-center">
        <div
          className="w-6 h-6 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(#64748b 1px,transparent 1px),linear-gradient(90deg,#64748b 1px,transparent 1px)',
            backgroundSize: '50% 50%',
            backgroundPosition: 'center',
          }}
        />
      </div>

      {/* Tap-to-pin hint */}
      {!position && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm select-none pointer-events-none">
          Tap anywhere on map to place pin
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={position ? 16 : 11}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        <FlyToPosition position={position} />
        {position && (
          <Marker
            position={[position.lat, position.lng]}
            draggable
            eventHandlers={{
              dragend(e) {
                const m = e.target as L.Marker;
                const ll = m.getLatLng();
                onChange({ lat: ll.lat, lng: ll.lng });
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapPicker;
