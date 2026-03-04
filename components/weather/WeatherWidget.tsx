"use client";

import type { WeatherContext } from "@/lib/services/weather";

import { useState, useEffect } from "react";
import { Button, Spinner } from "@heroui/react";
import {
  SunIcon,
  CloudIcon,
  MapPinIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

import { getErrorMessage } from "@/lib/utils/error";

interface WeatherResponse {
  weather: WeatherContext;
  summary: string;
  location: {
    city: string;
    country: string;
  };
}

// Custom minimal icons with thin strokes where possible
const weatherIcons: Record<string, React.ReactNode> = {
  clear: <SunIcon className="w-10 h-10 text-default-900 stroke-1" />,
  cloudy: <CloudIcon className="w-10 h-10 text-default-500 stroke-1" />,
  rainy: (
    <svg
      className="w-10 h-10 text-default-700 stroke-1"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
      />
    </svg>
  ),
  snowy: (
    <svg
      className="w-10 h-10 text-default-400 stroke-1"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 3v18m-6-6l6 6 6-6m-12-6l6-6 6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
      />
    </svg>
  ),
  stormy: (
    <svg
      className="w-10 h-10 text-default-900 stroke-1"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M13 10V3L4 14h7v7l9-11h-7z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
      />
    </svg>
  ),
  windy: (
    <svg
      className="w-10 h-10 text-default-600 stroke-1"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M14 5l7 7m0 0l-7 7m7-7H3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
      />
    </svg>
  ),
  foggy: <CloudIcon className="w-10 h-10 text-default-300 stroke-1" />,
};

interface WeatherWidgetProps {
  onLocationNotSet?: () => void;
  compact?: boolean;
}

export default function WeatherWidget({
  onLocationNotSet,
  compact = false,
}: WeatherWidgetProps) {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationNotSet, setLocationNotSet] = useState(false);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    setLocationNotSet(false);

    try {
      const res = await fetch("/api/weather");
      const result = await res.json();

      if (!res.ok) {
        if (result.code === "LOCATION_NOT_SET") {
          setLocationNotSet(true);
          onLocationNotSet?.();

          return;
        }
        throw new Error(result.message || "Failed to fetch weather");
      }

      setData(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div
        className={`${compact ? "w-full p-2" : "w-full md:w-80 h-64"} border border-default-200 flex flex-col items-center justify-center bg-content1`}
      >
        <Spinner color="default" size="sm" />
        {!compact && (
          <span className="mt-4 text-[10px] uppercase tracking-widest text-default-400">
            Analyzing Atmosphere...
          </span>
        )}
      </div>
    );
  }

  // --- LOCATION NOT SET STATE ---
  if (locationNotSet) {
    return (
      <div
        className={`${compact ? "w-full" : "w-full md:w-80"} border border-dashed border-default-300 p-6 flex flex-col items-center justify-center text-center gap-4 hover:bg-default-50 transition-colors`}
      >
        <MapPinIcon className="w-6 h-6 text-default-400" />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-default-600">
            Location Required
          </p>
          {!compact && (
            <p className="text-[10px] text-default-400 mt-1 uppercase">
              Set city for forecast
            </p>
          )}
        </div>
        <Button
          className="uppercase font-bold text-[10px] tracking-widest"
          radius="none"
          size="sm"
          startContent={<Cog6ToothIcon className="w-3 h-3" />}
          variant="solid"
          onPress={onLocationNotSet}
        >
          Configure
        </Button>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error) {
    return (
      <div
        className={`${compact ? "w-full" : "w-full md:w-80"} border-l-2 border-danger bg-danger-50 p-4 flex flex-col gap-2`}
      >
        <div className="flex items-center gap-2 text-danger">
          <ExclamationTriangleIcon className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Unavailable
          </span>
        </div>
        {!compact && <p className="text-[10px] text-danger-600">{error}</p>}
        <button
          className="text-[10px] underline uppercase tracking-widest text-danger-700 text-left mt-1 hover:text-danger-900"
          onClick={fetchWeather}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { weather, location } = data;

  // --- COMPACT VIEW ---
  if (compact) {
    return (
      <div className="flex items-center gap-4 p-4 border border-default-200 bg-content1">
        <div className="text-default-900">
          {weatherIcons[weather.current.condition] || (
            <SunIcon className="w-6 h-6 stroke-1" />
          )}
        </div>
        <div className="flex-1 min-w-0 flex justify-between items-center">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-xl tracking-tight">
                {weather.current.temperature}°
              </span>
              <span className="text-[10px] uppercase tracking-widest text-default-500 truncate max-w-[100px]">
                {weather.current.description}
              </span>
            </div>
            <p className="text-[10px] text-default-400 uppercase tracking-wide truncate">
              {location.city}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-default-400">
              H:{weather.high}°
            </span>
          </div>
        </div>
      </div>
    );
  }

  // --- FULL WIDGET VIEW ---
  return (
    <div className="w-full md:w-80 border border-default-200 bg-content1 p-6 relative group">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-default-900 flex items-center gap-2">
            <MapPinIcon className="w-4 h-4" />
            {location.city}
          </h3>
          <p className="text-[10px] uppercase tracking-widest text-default-400 mt-1 pl-6">
            {location.country}
          </p>
        </div>
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-default-100"
          onClick={fetchWeather}
        >
          <ArrowPathIcon className="w-4 h-4 text-default-400" />
        </button>
      </div>

      {/* Main Temp Display */}
      <div className="flex flex-col items-center py-4 border-y border-default-100">
        <div className="mb-2 transform scale-125">
          {weatherIcons[weather.current.condition] || (
            <SunIcon className="w-12 h-12 stroke-1 text-default-900" />
          )}
        </div>
        <div className="flex items-start">
          <span className="text-7xl font-black italic tracking-tighter text-default-900 leading-none">
            {weather.current.temperature}
          </span>
          <span className="text-xl font-light text-default-400 mt-2">°</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-default-500 mt-2">
          {weather.current.description}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-px bg-default-200 mt-6 border border-default-200">
        <div className="bg-content1 p-3 text-center">
          <p className="text-[9px] uppercase tracking-widest text-default-400 mb-1">
            Feel
          </p>
          <p className="text-sm font-bold">{weather.current.feelsLike}°</p>
        </div>
        <div className="bg-content1 p-3 text-center">
          <p className="text-[9px] uppercase tracking-widest text-default-400 mb-1">
            High
          </p>
          <p className="text-sm font-bold">{weather.high}°</p>
        </div>
        <div className="bg-content1 p-3 text-center">
          <p className="text-[9px] uppercase tracking-widest text-default-400 mb-1">
            Low
          </p>
          <p className="text-sm font-bold">{weather.low}°</p>
        </div>
      </div>

      {/* Recommendations Footer */}
      {(weather.needsUmbrella ||
        weather.isCold ||
        weather.isHot ||
        weather.needsLayers) && (
        <div className="mt-6 space-y-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-default-300">
            Daily Forecast
          </p>
          <div className="flex flex-wrap gap-2">
            {weather.needsUmbrella && (
              <span className="border border-default-900 text-default-900 text-[10px] font-bold uppercase tracking-wide px-2 py-1">
                Umbrella Required
              </span>
            )}
            {weather.isCold && (
              <span className="border border-default-200 text-default-600 text-[10px] font-bold uppercase tracking-wide px-2 py-1 bg-default-50">
                Heavy Coat
              </span>
            )}
            {weather.isHot && (
              <span className="border border-default-200 text-default-600 text-[10px] font-bold uppercase tracking-wide px-2 py-1 bg-default-50">
                Light Fabric
              </span>
            )}
            {weather.needsLayers && (
              <span className="border border-default-200 text-default-600 text-[10px] font-bold uppercase tracking-wide px-2 py-1 bg-default-50">
                Layer Up
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
