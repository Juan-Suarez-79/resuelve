import { useState, useEffect } from 'react';

interface Location {
    lat: number;
    lng: number;
}

export const CORO_COORDS = {
    lat: 11.4095,
    lng: -69.6817
};

export const MAX_DISTANCE_KM = 30; // 30km radius around Coro

export function useGeolocation() {
    const [location, setLocation] = useState<Location | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isInRegion, setIsInRegion] = useState(true); // Default to true until checked

    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                setLocation({ lat, lng });

                // Check if in region
                const dist = calculateDistance(lat, lng, CORO_COORDS.lat, CORO_COORDS.lng);
                setIsInRegion(dist <= MAX_DISTANCE_KM);

                setLoading(false);
            },
            (err) => {
                setError(err.message);
                setLoading(false);
            }
        );
    }, []);

    return { location, error, loading, isInRegion };
}

// Haversine formula to calculate distance in km
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

export function isLocationInCoro(lat: number, lng: number): boolean {
    const dist = calculateDistance(lat, lng, CORO_COORDS.lat, CORO_COORDS.lng);
    return dist <= MAX_DISTANCE_KM;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}
