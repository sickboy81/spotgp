
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in React-Leaflet
// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

interface LeafletMapProps {
    lat: number;
    lng: number;
    mode: 'exact' | 'approximate';
}

function MapUpdater({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], zoom);
    }, [lat, lng, zoom, map]);
    return null;
}

export function LeafletMap({ lat, lng, mode }: LeafletMapProps) {
    const zoom = mode === 'approximate' ? 14 : 15;

    // Approximate radius in meters (e.g. 1000m = 1km)
    const radius = 1000;

    return (
        <MapContainer
            center={[lat, lng]}
            zoom={zoom}
            style={{ width: '100%', height: '100%' }}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapUpdater lat={lat} lng={lng} zoom={zoom} />

            {mode === 'exact' ? (
                <Marker position={[lat, lng]} />
            ) : (
                <Circle
                    center={[lat, lng]}
                    radius={radius}
                    pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }}
                />
            )}
        </MapContainer>
    );
}
