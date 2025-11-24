"use client";

import { useEffect, useState } from "react";
import { MapPin, Loader2, AlertCircle } from "lucide-react";
import api from "../lib/api";
import toast from "react-hot-toast";

interface LocationPermissionProps {
  onLocationGranted: (location: { latitude: number; longitude: number }) => void;
}

export default function LocationPermission({ onLocationGranted }: LocationPermissionProps) {
  const [status, setStatus] = useState<"requesting" | "denied" | "granted" | "checking">("checking");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      setStatus("denied");
      return;
    }

    // Check if we already have permission
    try {
      const res = await api.get("/user/location");
      if (res.data?.success && res.data?.locationPermissionGranted && res.data?.location) {
        setLocation(res.data.location);
        setStatus("granted");
        setShowMessage(true);
        onLocationGranted(res.data.location);
        // Hide message after 3 seconds
        setTimeout(() => setShowMessage(false), 3000);
        return;
      }
    } catch (error) {
      // No location saved yet, proceed to request
    }

    // Request location
    requestLocation();
  };

  const requestLocation = () => {
    setStatus("requesting");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        try {
          // Save location to database
          await api.post("/user/location", loc);
          setLocation(loc);
          setStatus("granted");
          setShowMessage(true);
          onLocationGranted(loc);
          // Hide message after 3 seconds
          setTimeout(() => setShowMessage(false), 3000);
        } catch (error: any) {
          console.error("Error saving location:", error);
          toast.error("Failed to save location");
          setStatus("denied");
        }
      },
      (error) => {
        console.error("Location error:", error);
        setStatus("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  if (status === "granted" && !showMessage) {
    return null; // Don't show anything if location is granted and message is hidden
  }

  if (status === "granted" && showMessage) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5">
        <div className="bg-gradient-to-r from-purple-500/90 to-pink-500/90 backdrop-blur-sm border border-purple-400/30 rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3">
          <MapPin className="w-5 h-5 text-white animate-pulse" />
          <span className="text-white font-semibold">You are here! 📍</span>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-[#1a0030] to-[#2a0044] border border-purple-500/30 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Location Required</h2>
              <p className="text-white/70">
                We need your location to provide you with the best experience. Please enable location access in your browser settings.
              </p>
            </div>
            <button
              onClick={requestLocation}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Try Again
            </button>
            <p className="text-xs text-white/50">
              Without location access, you won't be able to use the app.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Requesting or checking
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#1a0030] to-[#2a0044] border border-purple-500/30 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Getting Your Location</h2>
            <p className="text-white/70">
              {status === "requesting"
                ? "Please allow location access when prompted..."
                : "Checking location permissions..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

