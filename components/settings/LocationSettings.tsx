"use client";
import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Spinner,
  Divider,
} from "@heroui/react";
import {
  MapPinIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

import { getErrorMessage } from "@/lib/utils/error";

interface LocationData {
  city: string | null;
  country: string | null;
  lat: number | null;
  lon: number | null;
  temperatureUnit: "celsius" | "fahrenheit";
  isSet: boolean;
}

export default function LocationSettings() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [cityInput, setCityInput] = useState("");
  const [tempUnit, setTempUnit] = useState<"celsius" | "fahrenheit">("celsius");
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    try {
      const res = await fetch("/api/user/location");

      if (res.ok) {
        const data = await res.json();

        setLocation(data);
        setTempUnit(data.temperatureUnit || "celsius");
        if (data.city) {
          setCityInput(data.city);
        }
      }
    } catch (err) {
      console.error("Failed to fetch location:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");

      return;
    }

    setDetectingLocation(true);
    setError(null);
    setSuccess(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch("/api/user/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              temperatureUnit: tempUnit,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || "Failed to save location");
          }

          setSuccess("Location detected and saved");
          fetchLocation();
        } catch (err) {
          setError(getErrorMessage(err));
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        setDetectingLocation(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location access denied. Enter city manually.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location unavailable. Enter city manually.");
            break;
          case err.TIMEOUT:
            setError("Request timed out.");
            break;
          default:
            setError("Failed to detect location.");
        }
      },
      { timeout: 10000, enableHighAccuracy: false },
    );
  };

  const handleSaveCity = async () => {
    if (!cityInput.trim()) {
      setError("Please enter a city name");

      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/user/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: cityInput.trim(),
          temperatureUnit: tempUnit,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save location");
      }

      setSuccess(`Location set to ${data.location.city}`);
      fetchLocation();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTempUnit = async (unit: "celsius" | "fahrenheit") => {
    setTempUnit(unit);

    if (location?.isSet) {
      try {
        await fetch("/api/user/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: location.lat,
            lon: location.lon,
            temperatureUnit: unit,
          }),
        });
      } catch (err) {
        console.error("Failed to update temperature unit:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <Spinner color="default" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h2 className="text-xl font-bold uppercase tracking-normal flex items-center gap-2">
          <MapPinIcon className="w-6 h-6" /> Location & Weather
        </h2>
        <Divider className="my-4" />
        <p className="text-xs uppercase tracking-widest text-default-500 mb-6">
          Set your coordinates for localized outfit recommendations
        </p>
      </div>

      {/* FEEDBACK BANNERS - SHARP & MINIMAL */}
      {error && (
        <div className="border-l-2 border-danger bg-danger-50 p-4 flex items-center gap-3">
          <ExclamationCircleIcon className="w-5 h-5 text-danger" />
          <span className="text-danger text-sm font-medium uppercase tracking-wide">
            {error}
          </span>
        </div>
      )}

      {success && (
        <div className="border-l-2 border-success bg-success-50 p-4 flex items-center gap-3">
          <CheckCircleIcon className="w-5 h-5 text-success" />
          <span className="text-success text-sm font-medium uppercase tracking-wide">
            {success}
          </span>
        </div>
      )}

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* LEFT: Current Status Block */}
        <div className="space-y-6">
          <div className="border border-default-200 p-6 bg-content1 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-display font-light tracking-normal text-default-500 mb-2">
                Current Status
              </h3>
              {location?.isSet ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-display font-light tracking-normal">
                      {location.city}
                    </span>
                    <span className="text-lg font-light text-default-400 uppercase">
                      {location.country}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-success">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">
                      Active
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center border border-dashed border-default-200">
                  <p className="text-xs uppercase tracking-widest text-default-400">
                    No location set
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-default-100">
              <Select
                classNames={{
                  trigger: "h-12 border-default-200",
                  value: "uppercase text-xs font-bold tracking-widest",
                }}
                label="Temperature Unit"
                radius="none"
                selectedKeys={[tempUnit]}
                variant="bordered"
                onChange={(e) =>
                  handleUpdateTempUnit(
                    e.target.value as "celsius" | "fahrenheit",
                  )
                }
              >
                <SelectItem key="celsius" textValue="celsius">
                  Celsius (°C)
                </SelectItem>
                <SelectItem key="fahrenheit" textValue="fahrenheit">
                  Fahrenheit (°F)
                </SelectItem>
              </Select>
            </div>
          </div>
        </div>

        {/* RIGHT: Input Actions */}
        <div className="space-y-8">
          {/* Manual Input Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-display font-light tracking-normal text-default-500">
              Manual Entry
            </h3>
            <div className="flex flex-col gap-4">
              <Input
                classNames={{
                  inputWrapper: "h-12 border-default-200",
                  input: "text-sm uppercase tracking-wide",
                }}
                placeholder="ENTER CITY (E.G. NEW YORK)"
                radius="none"
                value={cityInput}
                variant="bordered"
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveCity()}
              />
              <Button
                className="w-full h-12 uppercase font-bold tracking-widest"
                color="primary"
                isLoading={saving}
                radius="none"
                onPress={handleSaveCity}
              >
                Save Coordinates
              </Button>
            </div>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-default-200" />
            <span className="flex-shrink-0 mx-4 text-xs text-default-300 uppercase tracking-widest">
              Or Use GPS
            </span>
            <div className="flex-grow border-t border-default-200" />
          </div>

          {/* Auto Detect Section */}
          <Button
            className="w-full h-12 border-default-300 uppercase font-bold tracking-widest hover:bg-default-100"
            isLoading={detectingLocation}
            radius="none"
            startContent={
              !detectingLocation && <GlobeAltIcon className="w-5 h-5" />
            }
            variant="ghost"
            onPress={handleDetectLocation}
          >
            {detectingLocation ? "Locating..." : "Auto-detect Position"}
          </Button>
        </div>
      </div>
    </div>
  );
}
