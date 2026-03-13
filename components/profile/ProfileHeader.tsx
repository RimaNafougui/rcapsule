"use client";
import Image from "next/image";
import { Avatar, Button, Chip, Link } from "@heroui/react";
import {
  Cog6ToothIcon,
  SparklesIcon,
  MapPinIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";

import { SocialIcon } from "@/components/ui/icons";
import { useUser } from "@/lib/contexts/UserContext";

interface ProfileHeaderProps {
  user: {
    name?: string | null;
    username?: string | null;
    email?: string | null;
    image?: string | null;
    coverImage?: string | null;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    instagramHandle?: string | null;
    tiktokHandle?: string | null;
    pinterestHandle?: string | null;
    followerCount?: number;
    followingCount?: number;
    profilePublic?: boolean;
    createdAt?: string;
  };
  stats: {
    items: number;
    wardrobes: number;
    outfits: number;
    totalValue: number;
  };
  onEdit: () => void;
}

export default function ProfileHeader({
  user,
  stats,
  onEdit,
}: ProfileHeaderProps) {
  const { isPremium } = useUser();

  const _joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="w-full mb-8">
      {/* 1. COVER IMAGE BANNER */}
      <div className="relative w-full h-48 md:h-64 bg-default-100 overflow-hidden">
        {user.coverImage ? (
          <Image
            unoptimized
            alt="Cover"
            className="w-full h-full object-cover"
            src={user.coverImage}
            fill
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-default-100 to-default-200 flex items-center justify-center">
            <SparklesIcon className="w-12 h-12 text-default-300 opacity-20" />
          </div>
        )}

        {/* Edit Button (Top Right over Banner) */}
        <Button
          isIconOnly
          className="absolute top-4 right-4 bg-black/20 backdrop-blur-md text-white hover:bg-black/40 z-10"
          variant="flat"
          onPress={onEdit}
        >
          <Cog6ToothIcon className="w-5 h-5" />
        </Button>
      </div>

      {/* 2. PROFILE SECTION */}
      <div className="px-6 md:px-10 max-w-7xl mx-auto">
        <div className="relative flex flex-col md:flex-row items-start gap-6 -mt-16 md:-mt-20 mb-8">
          {/* Avatar Area */}
          <div className="relative shrink-0">
            <Avatar
              isBordered
              className="w-32 h-32 md:w-40 md:h-40 text-large border-4 border-background"
              name={user.name || "User"}
              radius="full"
              src={user.image || undefined}
            />
            {isPremium && (
              <Chip
                className="absolute bottom-2 right-2 border-2 border-background bg-gradient-to-r from-gray-400 to-blue-300 text-white font-bold shadow-sm"
                size="sm"
                startContent={<SparklesIcon className="w-3 h-3 text-white" />}
              >
                PREMIUM
              </Chip>
            )}
          </div>

          {/* User Info Area */}
          <div className="flex-1 w-full pt-4 md:pt-20 space-y-4">
            {/* Top Row: Name & Handle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter italic">
                  {user.name}
                </h1>
                <div className="flex items-center gap-2 text-default-500">
                  <span className="font-medium">
                    @{user.username || "username"}
                  </span>
                  {user.location && (
                    <>
                      <span className="text-default-300">•</span>
                      <div className="flex items-center gap-1 text-xs uppercase tracking-wide">
                        <MapPinIcon className="w-3 h-3" />
                        {user.location}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Follower Stats (Visible on Desktop) */}
              <div className="hidden md:flex gap-6">
                <div className="text-center">
                  <p className="font-bold text-lg">{user.followerCount || 0}</p>
                  <p className="text-[10px] uppercase text-default-500 tracking-wider">
                    Followers
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">
                    {user.followingCount || 0}
                  </p>
                  <p className="text-[10px] uppercase text-default-500 tracking-wider">
                    Following
                  </p>
                </div>
              </div>
            </div>

            {/* Bio & Links */}
            <div className="space-y-3 max-w-2xl">
              {user.bio && (
                <p className="text-sm leading-relaxed">{user.bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-primary">
                {user.website && (
                  <Link
                    isExternal
                    className="flex items-center gap-1 hover:underline"
                    href={
                      user.website.startsWith("http")
                        ? user.website
                        : `https://${user.website}`
                    }
                    size="sm"
                  >
                    <LinkIcon className="w-4 h-4" />
                    {user.website.replace(/^https?:\/\//, "")}
                  </Link>
                )}

                {/* Social Icons Row */}
                <div className="flex items-center gap-3 text-default-500 pl-2 border-l border-default-200">
                  {user.instagramHandle && (
                    <Link
                      isExternal
                      className="hover:text-secondary transition-colors"
                      href={`https://instagram.com/${user.instagramHandle}`}
                    >
                      <SocialIcon type="instagram" />
                    </Link>
                  )}
                  {user.tiktokHandle && (
                    <Link
                      isExternal
                      className="hover:text-secondary transition-colors"
                      href={`https://tiktok.com/@${user.tiktokHandle}`}
                    >
                      <SocialIcon type="tiktok" />
                    </Link>
                  )}
                  {user.pinterestHandle && (
                    <Link
                      isExternal
                      className="hover:text-secondary transition-colors"
                      href={`https://pinterest.com/${user.pinterestHandle}`}
                    >
                      <SocialIcon type="pinterest" />
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="flex md:hidden justify-between py-4 border-y border-default-100">
              <div className="text-center">
                <p className="font-bold">{user.followerCount || 0}</p>
                <p className="text-[10px] uppercase text-default-400">
                  Followers
                </p>
              </div>
              <div className="text-center">
                <p className="font-bold">{stats.items}</p>
                <p className="text-[10px] uppercase text-default-400">Items</p>
              </div>
              <div className="text-center">
                <p className="font-bold">{stats.outfits}</p>
                <p className="text-[10px] uppercase text-default-400">Looks</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. DESKTOP CLOSET STATS GRID */}
        {/* Only visible on md+, mobile uses the condensed row above */}
        <div className="hidden md:grid grid-cols-4 gap-4 py-8 border-t border-default-200">
          <div className="space-y-1">
            <p className="text-4xl font-light">{stats.items}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-default-400">
              Total Items
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-4xl font-light">{stats.wardrobes}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-default-400">
              Collections
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-4xl font-light">{stats.outfits}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-default-400">
              Created Looks
            </p>
          </div>
          <div className="space-y-1 border-l border-default-200 pl-8">
            <p className="text-4xl font-light">
              ${stats.totalValue.toLocaleString()}
            </p>
            <p className="text-xs font-bold uppercase tracking-widest text-default-400">
              Closet Value
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
