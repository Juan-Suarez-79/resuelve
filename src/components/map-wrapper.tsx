"use client";

import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("./location-picker"), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">
            Cargando Mapa...
        </div>
    ),
});

export default LocationPicker;
