"use client";
import { useState, useCallback } from "react";
import { format } from "date-fns";

import { getErrorMessage } from "@/lib/utils/error";

interface CalendarOutfit {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
  timesWorn?: number;
}

interface WearLogEntry {
  id?: string;
  wornAt: string;
  occasion?: string;
  weather?: string;
  temperature?: number | string;
  location?: string;
  notes?: string;
  outfit?: CalendarOutfit;
}

interface SubmitPayload {
  date: string;
  outfitId: string;
  occasion: string;
  weather: string;
  temperature: string;
  location: string;
  notes: string;
}

export function useCalendarLogs() {
  const [logs, setLogs] = useState<WearLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (apiStart: string, apiEnd: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/calendar?start=${apiStart}&end=${apiEnd}`);

      if (!res.ok) throw new Error("Failed to fetch logs");
      setLogs(await res.json());
    } catch (err) {
      setError("Failed to load calendar data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitLog = useCallback(
    async (payload: SubmitPayload, isEditing: boolean) => {
      setError(null);
      const body = isEditing
        ? {
            originalDate: payload.date,
            newDate: payload.date,
            outfitId: payload.outfitId,
            occasion: payload.occasion,
            weather: payload.weather,
            temperature: payload.temperature,
            location: payload.location,
            notes: payload.notes,
          }
        : payload;
      const res = await fetch("/api/calendar", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save");

        return false;
      }

      return true;
    },
    [],
  );

  const deleteLog = useCallback(
    async (outfitId: string, date: Date): Promise<boolean> => {
      const dateStr = format(date, "yyyy-MM-dd");

      try {
        const res = await fetch(
          `/api/calendar?outfitId=${outfitId}&date=${dateStr}`,
          { method: "DELETE" },
        );

        if (res.ok) return true;
        const data = await res.json();

        setError(data.error || "Failed to delete");

        return false;
      } catch (err) {
        setError(getErrorMessage(err));

        return false;
      }
    },
    [],
  );

  return { logs, loading, error, setError, fetchLogs, submitLog, deleteLog };
}
