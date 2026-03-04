"use client";

import type { Clothes, Wardrobe, Outfit } from "@/lib/database.type";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  Tabs,
  Tab,
  Spinner,
  Button,
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure,
} from "@heroui/react";
import {
  SparklesIcon,
  MapPinIcon,
  XMarkIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import NextImage from "next/image";

import ProfileHeader from "@/components/profile/ProfileHeader";
import { useUser } from "@/lib/contexts/UserContext";

// Import Visualization Components
import { ColorPalette } from "@/components/closet/ColorPalette";
import { StatsCard } from "@/components/analytics/StatsCard";
import CalendarTracker from "@/components/calendar/CalendarTracker";
import OutfitRecommendation from "@/components/outfit/OutfitRecommendation";
import LocationSettings from "@/components/settings/LocationSettings";
import WeatherWidget from "@/components/weather/WeatherWidget";

// Analytics
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { OverviewDashboard } from "@/components/analytics/OverviewDashboard";
import { CategoryBreakdown } from "@/components/analytics/CategoryBreakdown";
import { InsightsCard } from "@/components/analytics/InsightsCard";
import { ValueLeaders } from "@/components/analytics/ValueLeaders";

interface ExtendedWardrobe extends Wardrobe {
  clothesCount?: number;
}

export default function ProfilePage() {
  const { status } = useSession();
  const { user } = useUser();
  const router = useRouter();
  const isPremium = user?.subscription_status === "premium";

  // Data State
  const [loading, setLoading] = useState(true);
  const [wardrobes, setWardrobes] = useState<ExtendedWardrobe[]>([]);
  const [clothes, setClothes] = useState<Clothes[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);

  // UI State
  const [showRecommendation, setShowRecommendation] = useState(false);
  const {
    isOpen: isLocOpen,
    onOpen: onLocOpen,
    onOpenChange: onLocChange,
  } = useDisclosure();
  const { analytics, isLoading: analyticsLoading } = useAnalytics();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") fetchProfileData();
  }, [status, router]);

  const fetchProfileData = async () => {
    try {
      const [wardrobesRes, clothesRes, outfitsRes] = await Promise.all([
        fetch("/api/wardrobes"),
        fetch("/api/clothes?status=owned"),
        fetch("/api/outfits"),
      ]);

      if (wardrobesRes.ok && clothesRes.ok) {
        const wData = await wardrobesRes.json();
        const cData = await clothesRes.json();
        const oData = outfitsRes.ok ? await outfitsRes.json() : [];

        setWardrobes(wData);
        setClothes(cData);
        setOutfits(oData);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load profile data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  // --- CALCULATION LOGIC ---
  const dashboardStats = useMemo(() => {
    const totalValue = clothes.reduce(
      (sum, item) => sum + (item.price || 0),
      0,
    );
    const avgPrice = clothes.length > 0 ? totalValue / clothes.length : 0;

    // Color Analysis Logic
    const colorCounts: Record<string, number> = {};
    let totalColorTags = 0;

    clothes.forEach((item) => {
      if (Array.isArray(item.colors)) {
        item.colors.forEach((c) => {
          const colorName = c.toLowerCase().trim();

          colorCounts[colorName] = (colorCounts[colorName] || 0) + 1;
          totalColorTags++;
        });
      }
    });

    const colorAnalysis = Object.entries(colorCounts)
      .map(([color, count]) => ({
        color,
        count,
        percentage:
          totalColorTags > 0 ? Math.round((count / totalColorTags) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      items: clothes.length,
      wardrobes: wardrobes.length,
      outfits: outfits.length,
      totalValue,
      avgPrice,
      colorAnalysis,
    };
  }, [clothes, wardrobes, outfits]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="w-full pb-20">
      <ProfileHeader
        stats={{
          items: dashboardStats.items,
          wardrobes: dashboardStats.wardrobes,
          outfits: dashboardStats.outfits,
          totalValue: dashboardStats.totalValue,
        }}
        user={user || {}}
        onEdit={() => router.push("/settings")}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Tabs
          aria-label="Profile Options"
          classNames={{
            tabList:
              "gap-8 w-full relative rounded-none p-0 border-b border-divider mb-8",
            cursor: "w-full bg-foreground",
            tab: "max-w-fit px-0 h-12",
            tabContent:
              "group-data-[selected=true]:text-foreground text-default-500 uppercase tracking-widest font-bold text-xs",
          }}
          variant="underlined"
        >
          {/* OVERVIEW TAB */}
          <Tab key="overview" title="Overview">
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Financial Summary Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  label="Total Valuation"
                  subtext="Asset value"
                  value={`$${dashboardStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                />
                <StatsCard
                  label="Avg. Cost / Item"
                  subtext="Spending habit"
                  value={`$${dashboardStats.avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                />
                <StatsCard
                  label="Total Pieces"
                  subtext="Collection size"
                  value={dashboardStats.items}
                />
                <StatsCard
                  label="Outfits Created"
                  subtext="Styling combinations"
                  value={dashboardStats.outfits}
                />
              </div>

              {/* Deep Analysis Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Color DNA */}
                <div className="bg-background border border-default-200 p-6 shadow-sm">
                  <div className="mb-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-default-500">
                      Color DNA
                    </h3>
                    <p className="text-xs text-default-400 mt-1">
                      Dominant tones in your collection
                    </p>
                  </div>
                  {dashboardStats.colorAnalysis.length > 0 ? (
                    <ColorPalette colors={dashboardStats.colorAnalysis} />
                  ) : (
                    <div className="h-32 flex items-center justify-center text-default-400 text-xs italic">
                      Add items with colors to see analysis
                    </div>
                  )}
                </div>

                {/* Top Designers */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-default-500">
                    Top Designers
                  </h3>
                  <div className="flex flex-col gap-2">
                    {Object.entries(
                      clothes.reduce(
                        (acc, item) => {
                          if (item.brand) {
                            acc[item.brand] = (acc[item.brand] || 0) + 1;
                          }

                          return acc;
                        },
                        {} as Record<string, number>,
                      ),
                    )
                      .sort(([, countA], [, countB]) => countB - countA)
                      .slice(0, 5)
                      .map(([brand, count], index) => (
                        <div
                          key={brand}
                          className="flex justify-between items-center py-3 border-b border-default-100 group"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-default-300 w-4">
                              0{index + 1}
                            </span>
                            <span className="text-lg font-black uppercase italic tracking-tighter text-foreground group-hover:translate-x-2 transition-transform duration-300">
                              {brand}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-content2 px-2 py-1 text-default-500 rounded-sm">
                            {count} {count === 1 ? "Item" : "Items"}
                          </span>
                        </div>
                      ))}

                    {clothes.filter((c) => c.brand).length === 0 && (
                      <div className="py-8 text-center border border-dashed border-default-200 rounded-lg">
                        <p className="text-xs uppercase tracking-widest text-default-400">
                          No brand data available
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recently Acquired */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-default-500">
                    Recently Acquired
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {clothes.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="aspect-[3/4] bg-content2 relative group overflow-hidden rounded-md"
                    >
                      {item.imageUrl ? (
                        <NextImage
                          fill
                          alt={item.name}
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          src={item.imageUrl}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-default-300 text-xs uppercase">
                          No Image
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-[10px] uppercase font-bold truncate">
                          {item.name}
                        </p>
                      </div>
                    </div>
                  ))}
                  {clothes.length === 0 && (
                    <div className="col-span-full py-12 text-center text-default-400 text-sm border border-dashed border-default-200 rounded-lg">
                      Start adding items to your closet to see them here.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Tab>

          {/* ANALYTICS TAB */}
          <Tab key="analytics" title="Analytics">
            {analyticsLoading || !analytics ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <OverviewDashboard analytics={analytics} />
                <InsightsCard insights={analytics.insights} />
                <ValueLeaders
                  bestValue={analytics.value.bestValueItems}
                  worstValue={analytics.value.worstValueItems}
                />
                <CategoryBreakdown categories={analytics.categories} />
              </div>
            )}
          </Tab>

          {/* THE EDIT TAB (STYLIST) */}
          <Tab
            key="stylist"
            title={
              <div className="flex items-center gap-2">
                <span>The Edit</span>
                {!isPremium && (
                  <LockClosedIcon className="w-3 h-3 text-default-400" />
                )}
              </div>
            }
          >
            {isPremium ? (
              // Premium Content
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header / Utility Bar */}
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                      Daily Curator
                    </h2>
                    <p className="text-xs text-default-400 uppercase tracking-widest mt-1">
                      AI-Powered Personal Styling
                    </p>
                  </div>
                  <Button
                    className="uppercase font-bold text-[10px] tracking-widest text-default-500"
                    size="sm"
                    startContent={<MapPinIcon className="w-4 h-4" />}
                    variant="light"
                    onPress={onLocOpen}
                  >
                    Location Settings
                  </Button>
                </div>

                {/* The Trigger Area */}
                {!showRecommendation ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Weather Context - Left Side */}
                    <div className="md:col-span-1">
                      <WeatherWidget
                        compact={false}
                        onLocationNotSet={onLocOpen}
                      />
                    </div>

                    <div className="md:col-span-2 h-64 border border-default-200 bg-content1 flex flex-col items-center justify-center gap-6 relative overflow-hidden group">
                      <div className="z-10 text-center space-y-2">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-default-400">
                          Ready to dress?
                        </p>
                        <Button
                          className="uppercase font-bold tracking-widest px-12 py-6 shadow-xl"
                          color="primary"
                          radius="none"
                          size="lg"
                          startContent={<SparklesIcon className="w-5 h-5" />}
                          onPress={() => setShowRecommendation(true)}
                        >
                          Curate Today's Look
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        className="text-[10px] uppercase font-bold tracking-widest text-default-400 hover:text-danger flex items-center gap-1 transition-colors"
                        onClick={() => setShowRecommendation(false)}
                      >
                        <XMarkIcon className="w-3 h-3" /> Close Curator
                      </button>
                    </div>
                    <OutfitRecommendation onLocationNotSet={onLocOpen} />
                  </div>
                )}
              </div>
            ) : (
              // Upgrade Prompt for Free Users
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 rounded-full bg-default-100 flex items-center justify-center">
                  <SparklesIcon className="w-10 h-10 text-default-400" />
                </div>

                <div className="space-y-3 max-w-md">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                    Unlock The Edit
                  </h2>
                  <p className="text-default-500 text-sm">
                    Get AI-powered outfit recommendations tailored to your
                    wardrobe, the weather, and your personal style. Your pocket
                    stylist awaits.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-2 text-left">
                    <div className="flex items-center gap-3 text-sm">
                      <SparklesIcon className="w-4 h-4 text-foreground" />
                      <span>AI Outfit Generator</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <MapPinIcon className="w-4 h-4 text-foreground" />
                      <span>Weather-Smart Suggestions</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <LockClosedIcon className="w-4 h-4 text-foreground" />
                      <span>Magic Background Removal</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="bg-foreground text-background uppercase font-bold tracking-widest px-12"
                  radius="none"
                  size="lg"
                  onPress={() => router.push("/pricing")}
                >
                  Upgrade to Premium
                </Button>

                <p className="text-xs text-default-400">
                  Starting at $4.92/month billed annually
                </p>
              </div>
            )}
          </Tab>

          {/* CALENDAR TAB */}
          <Tab key="calendar" title="Calendar">
            <div className="py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CalendarTracker outfits={outfits} />
            </div>
          </Tab>
        </Tabs>
      </div>

      {/* LOCATION MODAL */}
      <Modal
        classNames={{
          base: "bg-background border border-default-200 rounded-none p-10",
          closeButton: "hover:bg-default-100 active:bg-default-200",
        }}
        isOpen={isLocOpen}
        size="2xl"
        onOpenChange={onLocChange}
      >
        <ModalContent>
          <ModalBody className="p-0">
            <LocationSettings />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
