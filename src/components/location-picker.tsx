"use client";

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from "react-leaflet";
import { createClient } from "@/lib/supabase/client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { CORO_COORDS, isLocationInCoro, MAX_DISTANCE_KM } from "@/lib/hooks/use-geolocation";
import { useToast } from "@/components/ui/toast";

// Fix Leaflet icon issue in Next.js
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface LocationPickerProps {
    initialLat?: number;
    initialLng?: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

function LocationMarker({ onLocationSelect, initialPos }: { onLocationSelect: (lat: number, lng: number) => void, initialPos: L.LatLngExpression | null }) {
    const [position, setPosition] = useState<L.LatLngExpression | null>(initialPos);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('is_super_admin').eq('id', user.id).single();
                if (data?.is_super_admin) setIsSuperAdmin(true);
            }
        };
        checkAdmin();
    }, []);

    const map = useMapEvents({
        click(e) {
            const inZone = isLocationInCoro(e.latlng.lat, e.latlng.lng);

            if (!inZone && !isSuperAdmin) {
                toast("Ubicación fuera de zona", "error");
                return;
            }

            if (!inZone && isSuperAdmin) {
                toast("Modo Super Admin: Ubicación permitida fuera de zona", "success");
            }

            setPosition(e.latlng);
            onLocationSelect(e.latlng.lat, e.latlng.lng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return position === null ? null : (
        <Marker position={position} icon={icon} />
    );
}

export default function LocationPicker({ initialLat, initialLng, onLocationSelect }: LocationPickerProps) {
    // Default to Coro
    const defaultCenter: L.LatLngExpression = [CORO_COORDS.lat, CORO_COORDS.lng];
    const center = initialLat && initialLng ? [initialLat, initialLng] as L.LatLngExpression : defaultCenter;

    // Calculate bounds for Coro region (approximate)
    const bounds = L.latLng(CORO_COORDS.lat, CORO_COORDS.lng).toBounds(MAX_DISTANCE_KM * 2000); // *2 to give some padding

    return (
        <div className="h-full w-full relative z-0">
            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/* Visual indicator of the service area */}
                <Circle
                    center={[CORO_COORDS.lat, CORO_COORDS.lng]}
                    radius={MAX_DISTANCE_KM * 1000}
                    pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.05, weight: 1, dashArray: '5, 10' }}
                />
                <LocationMarker onLocationSelect={onLocationSelect} initialPos={initialLat && initialLng ? center : null} />
            </MapContainer>
        </div>
    );
}
