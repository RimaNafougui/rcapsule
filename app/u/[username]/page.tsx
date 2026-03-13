"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Avatar,
  Button,
  Chip,
  Spinner,
  Image,
  Tabs,
  Tab,
  Tooltip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Link,
} from "@heroui/react";
import {
  CheckBadgeIcon,
  MapPinIcon,
  LinkIcon,
  HeartIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
  FlagIcon,
  NoSymbolIcon,
  UserPlusIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

// --- INLINE SOCIAL ICONS COMPONENT ---
const SocialIcon = ({
  type,
}: {
  type: "instagram" | "tiktok" | "pinterest";
}) => {
  const icons = {
    instagram: (
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    ),
    tiktok: (
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    ),
    pinterest: (
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.399.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.173 0 7.41 2.967 7.41 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.62 0 12.017 0z" />
    ),
  };

  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      {icons[type]}
    </svg>
  );
};

// --- TYPES ---
interface PublicProfile {
  id: string;
  username: string;
  name?: string;
  bio?: string;
  image?: string;
  coverImage?: string;
  location?: string;
  website?: string;
  instagramHandle?: string;
  tiktokHandle?: string;
  pinterestHandle?: string;
  styleTags: string[];
  isVerified: boolean;
  isFeatured: boolean;
  followerCount: number;
  followingCount: number;
  publicOutfitCount: number;
  publicWardrobeCount: number;
  createdAt: string;
}

interface PublicWardrobe {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  slug?: string;
  likeCount: number;
  itemCount: number;
}

interface PublicOutfit {
  id: string;
  name: string;
  imageUrl?: string;
  slug?: string;
  likeCount: number;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const username = params.username as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [wardrobes, setWardrobes] = useState<PublicWardrobe[]>([]);
  const [outfits, setOutfits] = useState<PublicOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState("outfits");

  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = session?.user?.id === profile?.id;

  useEffect(() => {
    if (username) fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${username}`);

      if (response.status === 404) {
        setNotFound(true);

        return;
      }
      if (!response.ok) throw new Error("Failed to fetch profile");

      const data = await response.json();

      setProfile(data.profile);
      setWardrobes(data.wardrobes || []);
      setOutfits(data.outfits || []);
      setIsFollowing(data.isFollowing || false);
      setIsBlocked(data.isBlocked || false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!session) return router.push("/login");

    setFollowLoading(true);
    const previousState = isFollowing;
    const previousCount = profile?.followerCount || 0;

    setIsFollowing(!isFollowing);
    if (profile) {
      setProfile({
        ...profile,
        followerCount: previousCount + (previousState ? -1 : 1),
      });
    }

    try {
      const response = await fetch(`/api/users/${username}/follow`, {
        method: previousState ? "DELETE" : "POST",
      });

      if (!response.ok) throw new Error();
    } catch (_error) {
      setIsFollowing(previousState);
      if (profile) setProfile({ ...profile, followerCount: previousCount });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.name || profile?.username}'s Wardrobe`,
          url,
        });
      } catch (_err) {}
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const handleReport = () => {
    if (!session) return router.push("/login");
    toast.success("Report submitted.");
  };

  const handleBlock = async () => {
    if (!session) return router.push("/login");
    try {
      const response = await fetch(`/api/users/${username}/block`, {
        method: isBlocked ? "DELETE" : "POST",
      });

      if (response.ok) setIsBlocked(!isBlocked);
    } catch (error) {
      console.error("Error toggling block:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-center px-4">
        <NoSymbolIcon className="w-16 h-16 text-default-300" />
        <div className="space-y-2">
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">
            Profile Not Found
          </h1>
          <p className="text-default-500 max-w-sm mx-auto">
            The user @{username} doesn&apos;t exist or their profile is set to
            private.
          </p>
        </div>
        <Button
          className="uppercase font-bold tracking-widest"
          radius="none"
          variant="flat"
          onPress={() => router.push("/explore")}
        >
          Return to Explore
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* 1. COVER IMAGE */}
      <div className="relative z-0 h-48 md:h-72 w-full bg-default-100 overflow-hidden">
        {profile.coverImage ? (
          <Image
            removeWrapper
            alt="Cover"
            className="w-full h-full object-cover"
            src={profile.coverImage}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-default-100 to-default-200 z-10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/100 via-background/20 to-transparent z-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* 2. PROFILE HEADER */}
        <div className="relative z-10 -mt-20 md:-mt-24 pb-8 mb-8 border-b border-divider">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10">
            {/* Avatar */}
            <div className="shrink-0 flex justify-center md:block">
              <Avatar
                isBordered
                className="w-32 h-32 md:w-44 md:h-44 text-large ring-4 ring-background z-10"
                name={profile.name || profile.username}
                radius="full"
                src={profile.image || undefined}
              />
            </div>

            {/* Info Section */}
            <div className="flex-1 pt-2 md:pt-12 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                {/* Text Details */}
                <div className="space-y-2">
                  <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 justify-center md:justify-start">
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic">
                      {profile.name || profile.username}
                    </h1>
                    {profile.isVerified && (
                      <Tooltip content="Verified User">
                        <CheckBadgeIcon className="w-6 h-6 text-primary" />
                      </Tooltip>
                    )}
                    {profile.isFeatured && (
                      <Chip
                        classNames={{
                          content:
                            "font-bold text-[10px] uppercase tracking-widest",
                        }}
                        color="warning"
                        size="sm"
                        variant="flat"
                      >
                        Featured
                      </Chip>
                    )}
                  </div>

                  {/* USERNAME */}
                  <p className="text-default-500 font-medium">
                    @{profile.username}
                  </p>

                  {profile.bio && (
                    <p className="pt-2 text-default-600 max-w-lg mx-auto md:mx-0 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}

                  {/* Links & Location */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-3 text-sm text-default-500">
                    {profile.location && (
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        {profile.location}
                      </span>
                    )}
                    {profile.website && (
                      <a
                        className="flex items-center gap-1 text-primary hover:underline"
                        href={
                          profile.website.startsWith("http")
                            ? profile.website
                            : `https://${profile.website}`
                        }
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <LinkIcon className="w-4 h-4" />
                        {profile.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>

                  {/* Social Handles */}
                  <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                    {profile.instagramHandle && (
                      <Link
                        isExternal
                        className="text-default-400 hover:text-[#E1306C] transition-colors"
                        href={`https://instagram.com/${profile.instagramHandle}`}
                      >
                        <SocialIcon type="instagram" />
                      </Link>
                    )}
                    {profile.tiktokHandle && (
                      <Link
                        isExternal
                        className="text-default-400 hover:text-[#FE2C55] transition-colors"
                        href={`https://tiktok.com/@${profile.tiktokHandle}`}
                      >
                        <SocialIcon type="tiktok" />
                      </Link>
                    )}
                    {profile.pinterestHandle && (
                      <Link
                        isExternal
                        className="text-default-400 hover:text-[#E60023] transition-colors"
                        href={`https://pinterest.com/${profile.pinterestHandle}`}
                      >
                        <SocialIcon type="pinterest" />
                      </Link>
                    )}
                  </div>

                  {/* Style Tags */}
                  {profile.styleTags && profile.styleTags.length > 0 && (
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-4">
                      {profile.styleTags.map((tag) => (
                        <Chip
                          key={tag}
                          classNames={{
                            base: "bg-default-100",
                            content:
                              "text-[10px] uppercase tracking-widest text-default-500",
                          }}
                          size="sm"
                          variant="flat"
                        >
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-2 min-w-max">
                  {isOwnProfile ? (
                    <Button
                      className="uppercase tracking-widest text-xs font-bold"
                      radius="none"
                      variant="bordered"
                      onPress={() => router.push("/settings")}
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <Button
                      className="uppercase tracking-widest text-xs font-bold px-6"
                      color={isFollowing ? "default" : "primary"}
                      isLoading={followLoading}
                      radius="none"
                      startContent={
                        isFollowing ? (
                          <UserMinusIcon className="w-4 h-4" />
                        ) : (
                          <UserPlusIcon className="w-4 h-4" />
                        )
                      }
                      variant={isFollowing ? "bordered" : "solid"}
                      onPress={handleFollow}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                  )}

                  {/* Share Button - Visible to Everyone */}
                  <Tooltip content="Share Profile">
                    <Button
                      isIconOnly
                      radius="none"
                      variant="flat"
                      onPress={handleShare}
                    >
                      <ShareIcon className="w-5 h-5" />
                    </Button>
                  </Tooltip>

                  {/* Dropdown - Visitor Only */}
                  {!isOwnProfile && (
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly radius="none" variant="flat">
                          <EllipsisHorizontalIcon className="w-5 h-5" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Actions">
                        <DropdownItem
                          key="report"
                          startContent={<FlagIcon className="w-4 h-4" />}
                          onPress={handleReport}
                        >
                          Report User
                        </DropdownItem>
                        <DropdownItem
                          key="block"
                          className="text-danger"
                          color="danger"
                          startContent={<NoSymbolIcon className="w-4 h-4" />}
                          onPress={handleBlock}
                        >
                          {isBlocked ? "Unblock" : "Block"}
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="flex justify-center md:justify-start gap-8 md:gap-12 mt-8 md:mt-6">
                <div className="text-center md:text-left">
                  <p className="text-2xl font-light">{profile.followerCount}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-default-400">
                    Followers
                  </p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-2xl font-light">
                    {profile.followingCount}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-default-400">
                    Following
                  </p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-2xl font-light">
                    {profile.publicOutfitCount}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-default-400">
                    Looks
                  </p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-2xl font-light">
                    {profile.publicWardrobeCount}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-default-400">
                    Collections
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. CONTENT TABS */}
        <div className="min-h-[400px]">
          <Tabs
            classNames={{
              tabList: "gap-8 w-full border-b border-divider",
              tab: "uppercase tracking-widest text-xs font-bold px-0 h-12",
              cursor: "bg-foreground w-full",
              tabContent:
                "group-data-[selected=true]:text-foreground text-default-400",
            }}
            selectedKey={activeTab}
            variant="underlined"
            onSelectionChange={(key) => setActiveTab(key as string)}
          >
            <Tab key="outfits" title={`Looks (${outfits.length})`} />
            <Tab
              key="collections"
              title={`Collections (${wardrobes.length})`}
            />
          </Tabs>

          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === "outfits" && (
              <>
                {outfits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 border border-dashed border-default-200 rounded-lg">
                    <p className="text-default-400 italic">
                      No public looks yet
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {outfits.map((outfit) => (
                      <Link
                        key={outfit.id}
                        className="group block"
                        href={`/u/${username}/looks/${outfit.slug || outfit.id}`}
                      >
                        <div className="relative aspect-[3/4] bg-default-100 overflow-hidden">
                          {outfit.imageUrl ? (
                            <Image
                              removeWrapper
                              alt={outfit.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              src={outfit.imageUrl}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-default-300 text-xs uppercase">
                              No Image
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute bottom-0 left-0 w-full p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <p className="text-white font-bold uppercase tracking-tight text-sm truncate">
                              {outfit.name}
                            </p>
                            <div className="flex items-center gap-2 text-white/80 text-xs mt-1">
                              <HeartIcon className="w-3 h-3" />{" "}
                              {outfit.likeCount}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "collections" && (
              <>
                {wardrobes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 border border-dashed border-default-200 rounded-lg">
                    <p className="text-default-400 italic">
                      No public collections yet
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wardrobes.map((wardrobe) => (
                      <Link
                        key={wardrobe.id}
                        className="group block"
                        href={`/u/${username}/collections/${wardrobe.slug || wardrobe.id}`}
                      >
                        <div className="relative aspect-[16/10] bg-default-100 overflow-hidden">
                          {wardrobe.coverImage ? (
                            <Image
                              removeWrapper
                              alt={wardrobe.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              src={wardrobe.coverImage}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-default-50 text-default-300 text-2xl font-serif italic">
                              Capsule
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                          <div className="absolute bottom-0 left-0 w-full p-6">
                            <h3 className="text-white text-xl font-black uppercase italic tracking-tighter">
                              {wardrobe.title}
                            </h3>
                            <div className="flex items-center gap-4 text-white/90 text-xs font-medium mt-2 uppercase tracking-widest">
                              <span>{wardrobe.itemCount} Items</span>
                              <span className="flex items-center gap-1">
                                <HeartIcon className="w-3 h-3" />{" "}
                                {wardrobe.likeCount}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
