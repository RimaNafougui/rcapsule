"use client";

import { useState, useEffect } from "react";
import { Input } from "@heroui/react";
import { GlobeAltIcon } from "@heroicons/react/24/outline";

interface LocationSuggestion {
  place_id: number;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    country: string;
  };
}

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function LocationInput({ value, onChange }: LocationInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (inputValue.length > 2) {
        setLoading(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
              new URLSearchParams({
                q: inputValue,
                format: "json",
                addressdetails: "1",
                limit: "5",
                featuretype: "city",
              }),
            {
              headers: {
                "User-Agent": "WardrobeOS/1.0",
              },
            },
          );
          const data = await response.json();

          setSuggestions(data);
        } catch (error) {
          console.error("Error fetching locations:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [inputValue]);

  const handleSelect = (suggestion: LocationSuggestion) => {
    const city =
      suggestion.address.city ||
      suggestion.address.town ||
      suggestion.address.village;
    const country = suggestion.address.country;
    const location = `${city}, ${country}`;

    setInputValue(location);
    onChange(location);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative md:col-span-2">
      <Input
        className="md:col-span-2"
        label="Location"
        placeholder="City, Country"
        radius="none"
        startContent={<GlobeAltIcon className="w-4 h-4 text-default-400" />}
        value={inputValue}
        variant="bordered"
        onBlur={() => {
          setTimeout(() => setShowSuggestions(false), 200);
        }}
        onChange={(e) => {
          setInputValue(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border-2 border-default-200 shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion) => {
            const city =
              suggestion.address.city ||
              suggestion.address.town ||
              suggestion.address.village;
            const country = suggestion.address.country;

            return (
              <div
                key={suggestion.place_id}
                className="px-4 py-3 hover:bg-secondary cursor-pointer transition-colors border-b border-default-100 last:border-b-0"
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(suggestion)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleSelect(suggestion);
                  }
                }}
              >
                <div className="font-medium text-sm text-foreground">
                  {city}, {country}
                </div>
                <div className="text-xs text-default-500 truncate mt-0.5">
                  {suggestion.display_name}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-4 h-4 border-2 border-default-300 border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
