"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Tooltip,
  Divider,
} from "@heroui/react";
import {
  SparklesIcon,
  ArrowPathIcon,
  SunIcon,
  CheckIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

import { getErrorMessage } from "@/lib/utils/error";

interface RecommendedItem {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  reason: string;
}

interface Recommendation {
  items: RecommendedItem[];
  reasoning: string;
  styleNotes: string;
  weatherConsiderations: string;
}

interface RecommendationResponse {
  recommendations: Recommendation[];
  weather: {
    temperature: number;
    condition: string;
    description: string;
  };
  generatedAt: string;
}

const occasions = [
  { key: "casual", label: "Casual Day" },
  { key: "work", label: "Work / Office" },
  { key: "date", label: "Date Night" },
  { key: "gym", label: "Gym / Workout" },
  { key: "event", label: "Special Event" },
  { key: "outdoor", label: "Outdoor Activity" },
];

interface OutfitRecommendationProps {
  onLocationNotSet?: () => void;
}

export default function OutfitRecommendation({
  onLocationNotSet,
}: OutfitRecommendationProps) {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const fetchRecommendation = async (occasion?: string) => {
    setLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const params = new URLSearchParams();

      if (occasion) params.set("occasion", occasion);
      params.set("count", "1");

      const res = await fetch(`/api/recommendations?${params}`);
      const result = await res.json();

      if (!res.ok) {
        setErrorCode(result.code);
        setRemaining(result.remaining ?? 0);
        if (result.code === "LOCATION_NOT_SET") {
          onLocationNotSet?.();
        }
        throw new Error(result.message || "Failed to get recommendations");
      }

      setData(result);
      setRemaining(result.remaining);
      setCurrentIndex(0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendation();
  }, []);

  const handleRefresh = () => {
    fetchRecommendation(selectedOccasion || undefined);
  };

  const handleOccasionChange = (occasion: string) => {
    setSelectedOccasion(occasion);
    fetchRecommendation(occasion);
  };

  const handleNextOutfit = () => {
    if (data && currentIndex < data.recommendations.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevOutfit = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  const handleLogOutfit = async () => {
    if (!currentRecommendation) return;

    setIsLogging(true);
    try {
      const itemIds = currentRecommendation.items.map((item) => item.id);

      const res = await fetch("/api/wear-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemIds,
          date: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to log outfit");

      onOpenChange();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLogging(false);
    }
  };

  const currentRecommendation = data?.recommendations[currentIndex];

  if (loading) {
    return (
      <div className="w-full border border-default-200 p-6 space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-default-100">
          <SparklesIcon className="w-4 h-4 text-default-900" />
          <h3 className="font-bold uppercase tracking-widest text-sm">
            Curating Look...
          </h3>
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-default-100 w-3/4" />
          <div className="flex gap-4">
            <div className="w-24 h-32 bg-default-100" />
            <div className="w-24 h-32 bg-default-100" />
            <div className="w-24 h-32 bg-default-100" />
          </div>
          <div className="h-16 bg-default-50 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full border border-danger/20 bg-danger-50/50 p-6">
        <div className="flex items-center gap-2 pb-4 border-b border-danger/10 mb-4">
          <InformationCircleIcon className="w-5 h-5 text-danger" />
          <h3 className="font-bold uppercase tracking-widest text-sm text-danger">
            Recommendation Unavailable
          </h3>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-danger-700 font-medium uppercase tracking-wide">
            {error}
          </p>

          {errorCode === "LOCATION_NOT_SET" && (
            <Button
              className="uppercase font-bold tracking-widest"
              color="primary"
              radius="none"
              size="sm"
              startContent={<Cog6ToothIcon className="w-4 h-4" />}
              onPress={onLocationNotSet}
            >
              Configure Location
            </Button>
          )}

          {errorCode === "INSUFFICIENT_WARDROBE" && (
            <p className="text-[10px] text-default-500 italic">
              *Tip: Add more essential items to your digital wardrobe to unlock
              AI styling.
            </p>
          )}
          {errorCode === "RATE_LIMIT_EXCEEDED" && (
            <p className="text-[10px] text-default-500 italic">
              *Your daily recommendations reset at midnight.
            </p>
          )}

          {!errorCode && (
            <Button
              className="uppercase font-bold tracking-widest border-default-400"
              isDisabled={remaining === 0}
              isLoading={loading}
              radius="none"
              size="sm"
              startContent={<ArrowPathIcon className="w-4 h-4" />}
              variant="bordered"
              onPress={handleRefresh}
            >
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!data || !currentRecommendation) return null;

  return (
    <>
      <div className="w-full border border-default-200 bg-background relative overflow-hidden">
        {/* TOP BAR: WEATHER & OCCASION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-default-100 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 border border-default-200">
              <SparklesIcon className="w-5 h-5 text-default-900" />
            </div>
            <div>
              <h3 className="font-black uppercase italic tracking-tighter text-xl leading-none">
                Daily Edit
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-default-400 mt-1">
                {data.weather.temperature}°C • {data.weather.description}
                {remaining !== null && (
                  <span className="ml-2 text-primary">
                    • {remaining} left today
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select
              className="w-40"
              classNames={{
                trigger: "border-default-200 h-10",
                value: "uppercase text-[10px] font-bold tracking-widest",
              }}
              placeholder="SELECT OCCASION"
              radius="none"
              selectedKeys={selectedOccasion ? [selectedOccasion] : []}
              size="sm"
              startContent={
                <CalendarDaysIcon className="w-4 h-4 text-default-400" />
              }
              variant="bordered"
              onChange={(e) => handleOccasionChange(e.target.value)}
            >
              {occasions.map((o) => (
                <SelectItem
                  key={o.key}
                  classNames={{ title: "uppercase text-xs tracking-wide" }}
                >
                  {o.label}
                </SelectItem>
              ))}
            </Select>

            <Button
              isIconOnly
              className="h-10 w-10 border border-default-200"
              isDisabled={remaining === 0}
              isLoading={loading}
              radius="none"
              size="sm"
              variant="ghost"
              onPress={handleRefresh}
            >
              <ArrowPathIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="p-6 space-y-8">
          {/* OUTFIT GALLERY */}
          <div className="flex flex-wrap gap-6 justify-center md:justify-start">
            {currentRecommendation.items.map((item) => (
              <Tooltip
                key={item.id}
                className="rounded-none uppercase text-xs tracking-wide"
                content={
                  <div className="p-2 max-w-xs">
                    <p className="font-bold uppercase tracking-wide text-xs">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-default-400 uppercase mt-1">
                      {item.reason}
                    </p>
                  </div>
                }
              >
                <div className="relative group cursor-pointer w-28 md:w-32 aspect-[3/4] border border-default-200 bg-content2 hover:border-default-900 transition-colors">
                  {item.imageUrl ? (
                    <Image
                      fill
                      unoptimized
                      alt={item.name}
                      className="w-full h-full object-cover p-1"
                      src={item.imageUrl}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] uppercase text-default-300">
                      No Image
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-1 border-t border-default-100">
                    <p className="text-[9px] uppercase font-bold text-center truncate tracking-widest">
                      {item.category}
                    </p>
                  </div>
                </div>
              </Tooltip>
            ))}
          </div>

          <Divider className="my-4" />

          {/* EDITORIAL TEXT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-default-400 mb-2">
                Stylist&apos;s Notes
              </h4>
              <p className="text-sm font-serif italic leading-relaxed text-default-700">
                &quot;{currentRecommendation.reasoning}&quot;
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-default-400 mb-1">
                  Forecast Match
                </h4>
                <p className="text-xs uppercase font-bold tracking-wide border-l-2 border-primary pl-2 text-primary">
                  {currentRecommendation.weatherConsiderations}
                </p>
              </div>

              {/* NAVIGATION DOTS */}
              {data.recommendations.length > 1 && (
                <div className="flex items-center gap-4 pt-4">
                  <button
                    className="p-1 hover:text-primary disabled:opacity-30 transition-colors"
                    disabled={currentIndex === 0}
                    onClick={handlePrevOutfit}
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>

                  <div className="flex gap-2">
                    {data.recommendations.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          idx === currentIndex
                            ? "bg-default-900"
                            : "bg-default-200"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    className="p-1 hover:text-primary disabled:opacity-30 transition-colors"
                    disabled={currentIndex === data.recommendations.length - 1}
                    onClick={handleNextOutfit}
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3 pt-4">
            <Button
              className="flex-1 uppercase font-bold tracking-widest h-12"
              color="primary"
              radius="none"
              startContent={<CheckIcon className="w-4 h-4" />}
              onPress={onOpen}
            >
              Log This Look
            </Button>
            <Button
              isIconOnly
              className="h-12 w-12 border-default-300"
              radius="none"
              variant="bordered"
              onPress={onOpen}
            >
              <InformationCircleIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      <Modal
        classNames={{
          base: "rounded-none border border-default-200",
          header: "border-b border-default-100",
          footer: "border-t border-default-100",
          closeButton: "hover:bg-default-100 active:bg-default-200",
        }}
        isOpen={isOpen}
        size="2xl"
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 py-6">
            <span className="text-[10px] uppercase tracking-[0.2em] text-default-400 font-bold">
              Collection Analysis
            </span>
            <h3 className="font-black text-2xl uppercase italic tracking-tighter">
              Outfit Breakdown
            </h3>
          </ModalHeader>
          <ModalBody className="py-6">
            {/* Items Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8">
              {currentRecommendation?.items.map((item) => (
                <div key={item.id} className="text-center group">
                  <div className="aspect-[3/4] mx-auto mb-3 border border-default-200 p-1 bg-content2 relative">
                    {item.imageUrl && (
                      <Image
                        fill
                        unoptimized
                        alt={item.name}
                        className="w-full h-full object-cover"
                        src={item.imageUrl}
                      />
                    )}
                  </div>
                  <p className="font-bold text-xs uppercase tracking-wide truncate">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-default-400 uppercase tracking-widest mt-1">
                    {item.category}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-default-900 border-b border-default-200 pb-2">
                  Why It Works
                </h4>
                <p className="text-sm text-default-600 leading-relaxed">
                  {currentRecommendation?.reasoning}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-default-900 border-b border-default-200 pb-2">
                  Styling Tips
                </h4>
                <p className="text-sm text-default-600 leading-relaxed">
                  {currentRecommendation?.styleNotes}
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-default-50 border border-default-100 flex items-start gap-3">
              <SunIcon className="w-5 h-5 text-default-900 mt-0.5" />
              <div>
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-default-900">
                  Weather Context
                </h5>
                <p className="text-xs text-default-600 mt-1">
                  {currentRecommendation?.weatherConsiderations}
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="py-4">
            <Button
              className="uppercase font-bold tracking-widest text-xs"
              radius="none"
              variant="light"
              onPress={onOpenChange}
            >
              Close
            </Button>
            <Button
              className="uppercase font-bold tracking-widest text-xs px-8"
              color="primary"
              isLoading={isLogging}
              radius="none"
              onPress={handleLogOutfit}
            >
              Confirm Log
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
