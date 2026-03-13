"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Avatar, Button, Chip, Image, Spinner, Tooltip } from "@heroui/react";
import {
  HeartIcon,
  BookmarkIcon,
  ShareIcon,
  ArrowLeftIcon,
  CheckBadgeIcon,
  UserPlusIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolid,
  BookmarkIcon as BookmarkSolid,
} from "@heroicons/react/24/solid";
import { toast } from "sonner";
import Link from "next/link";

import { CommentSection } from "@/components/community/CommentSection";

interface OutfitClothesItem {
  id: string;
  clothesId: string;
  layer?: number;
  clothes: {
    id: string;
    name: string;
    brand?: string;
    category: string;
    imageUrl?: string;
    price?: number;
    purchaseCurrency?: string;
    colors?: string[];
  };
}

interface Outfit {
  id: string;
  name: string;
  imageUrl?: string;
  slug?: string;
  season?: string;
  occasion?: string;
  styleTags?: string[];
  likeCount: number;
  saveCount: number;
  viewCount: number;
  rating?: number;
  allowComments: boolean;
  createdAt: string;
  clothes: OutfitClothesItem[];
}

interface Author {
  id: string;
  username: string;
  name?: string;
  image?: string;
  bio?: string;
  followerCount: number;
  isVerified: boolean;
}

export default function PublicOutfitPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const username = params.username as string;
  const id = params.id as string;

  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    fetchOutfit();
  }, [username, id]);

  const fetchOutfit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${username}/looks/${id}`);

      if (res.status === 404) {
        setNotFound(true);

        return;
      }
      if (!res.ok) throw new Error();

      const data = await res.json();

      setOutfit(data.outfit);
      setAuthor(data.author);
      setIsLiked(data.isLiked);
      setIsSaved(data.isSaved);
      setIsFollowing(data.isFollowing);
      setIsOwnProfile(data.isOwnProfile);
      setLikeCount(data.outfit.likeCount);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!session) return router.push("/login");

    const prev = isLiked;
    const prevCount = likeCount;

    setIsLiked(!isLiked);
    setLikeCount(prev ? prevCount - 1 : prevCount + 1);

    try {
      const res = await fetch("/api/likes", {
        method: prev ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "outfit", targetId: outfit!.id }),
      });

      if (!res.ok) throw new Error();
    } catch {
      setIsLiked(prev);
      setLikeCount(prevCount);
    }
  };

  const handleSave = async () => {
    if (!session) return router.push("/login");

    const prev = isSaved;

    setIsSaved(!isSaved);

    try {
      const res = await fetch("/api/saves", {
        method: prev ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "outfit", targetId: outfit!.id }),
      });

      if (!res.ok) throw new Error();
      toast.success(prev ? "Removed from saved" : "Saved to inspiration");
    } catch {
      setIsSaved(prev);
      toast.error("Something went wrong");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: outfit?.name, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  const handleFollow = async () => {
    if (!session) return router.push("/login");

    setFollowLoading(true);
    const prev = isFollowing;

    setIsFollowing(!isFollowing);
    if (author) {
      setAuthor({
        ...author,
        followerCount: author.followerCount + (prev ? -1 : 1),
      });
    }

    try {
      const res = await fetch(`/api/users/${username}/follow`, {
        method: prev ? "DELETE" : "POST",
      });

      if (!res.ok) throw new Error();
    } catch {
      setIsFollowing(prev);
      if (author) setAuthor({ ...author });
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound || !outfit || !author) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-center px-4">
        <h1 className="text-3xl font-black uppercase tracking-tighter italic">
          Look Not Found
        </h1>
        <p className="text-default-500">
          This outfit doesn&apos;t exist or is set to private.
        </p>
        <Button
          className="uppercase font-bold tracking-widest"
          radius="none"
          variant="flat"
          onPress={() => router.push(`/u/${username}`)}
        >
          Back to Profile
        </Button>
      </div>
    );
  }

  const items = outfit.clothes || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Back link */}
      <div className="mb-6">
        <Button
          as={Link}
          className="uppercase tracking-widest text-xs font-bold pl-0 text-default-500 hover:text-foreground"
          href={`/u/${username}`}
          startContent={<ArrowLeftIcon className="w-4 h-4" />}
          variant="light"
        >
          Back to {author.name || author.username}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Image */}
        <div className="relative aspect-[3/4] bg-default-100 overflow-hidden">
          {outfit.imageUrl ? (
            <Image
              removeWrapper
              alt={outfit.name}
              className="w-full h-full object-cover"
              src={outfit.imageUrl}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-default-300 text-sm">
              No Image
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic leading-none mb-4">
              {outfit.name}
            </h1>

            {/* Meta chips */}
            <div className="flex flex-wrap gap-2">
              {outfit.season && (
                <Chip size="sm" variant="flat">
                  {outfit.season}
                </Chip>
              )}
              {outfit.occasion && (
                <Chip size="sm" variant="flat">
                  {outfit.occasion}
                </Chip>
              )}
              {(outfit.styleTags || []).map((tag) => (
                <Chip key={tag} size="sm" variant="bordered">
                  {tag}
                </Chip>
              ))}
            </div>
          </div>

          {/* Social bar */}
          <div className="flex items-center gap-4 py-4 border-y border-default-200">
            <button
              className="flex items-center gap-2 text-sm font-medium"
              onClick={handleLike}
            >
              {isLiked ? (
                <HeartSolid className="w-5 h-5 text-danger" />
              ) : (
                <HeartIcon className="w-5 h-5" />
              )}
              <span>{likeCount}</span>
            </button>

            <Tooltip
              content={isSaved ? "Remove from saved" : "Save to inspiration"}
            >
              <button onClick={handleSave}>
                {isSaved ? (
                  <BookmarkSolid className="w-5 h-5 text-primary" />
                ) : (
                  <BookmarkIcon className="w-5 h-5" />
                )}
              </button>
            </Tooltip>

            <Tooltip content="Share">
              <button onClick={handleShare}>
                <ShareIcon className="w-5 h-5" />
              </button>
            </Tooltip>

            <span className="text-[10px] uppercase tracking-widest text-default-400 ml-auto">
              {outfit.viewCount} views · {outfit.saveCount} saves
            </span>
          </div>

          {/* Items breakdown */}
          {items.length > 0 && (
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-default-400 mb-3">
                Pieces in This Look
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map(({ clothes }) => (
                  <div
                    key={clothes.id}
                    className="border border-default-200 overflow-hidden hover:border-default-400 transition-colors"
                  >
                    <div className="relative h-24 bg-default-100">
                      {clothes.imageUrl ? (
                        <Image
                          removeWrapper
                          alt={clothes.name}
                          className="w-full h-full object-cover"
                          src={clothes.imageUrl}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-default-300 text-[10px]">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider truncate">
                        {clothes.name}
                      </p>
                      {clothes.brand && (
                        <p className="text-[9px] text-default-400 uppercase tracking-widest truncate">
                          {clothes.brand}
                        </p>
                      )}
                      {clothes.price && (
                        <p className="text-[10px] font-mono text-default-500 mt-0.5">
                          ${clothes.price} {clothes.purchaseCurrency || "CAD"}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Author card */}
          <div className="border border-default-200 p-4 flex items-start gap-4">
            <Avatar
              className="w-12 h-12 flex-shrink-0"
              name={author.name || author.username}
              src={author.image || undefined}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Link
                  className="font-bold text-sm uppercase tracking-wider hover:underline"
                  href={`/u/${author.username}`}
                >
                  {author.name || author.username}
                </Link>
                {author.isVerified && (
                  <CheckBadgeIcon className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-default-400">
                @{author.username} · {author.followerCount} followers
              </p>
              {author.bio && (
                <p className="text-xs text-default-500 mt-1 line-clamp-2">
                  {author.bio}
                </p>
              )}
            </div>
            {!isOwnProfile && (
              <Button
                className="flex-shrink-0 font-bold uppercase tracking-wider text-xs"
                color={isFollowing ? "default" : "primary"}
                isLoading={followLoading}
                radius="none"
                size="sm"
                startContent={
                  isFollowing ? (
                    <UserMinusIcon className="w-3.5 h-3.5" />
                  ) : (
                    <UserPlusIcon className="w-3.5 h-3.5" />
                  )
                }
                variant={isFollowing ? "bordered" : "solid"}
                onPress={handleFollow}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Comments */}
      {outfit.allowComments && (
        <div className="mt-12 pt-8 border-t border-default-200">
          <CommentSection targetId={outfit.id} targetType="outfit" />
        </div>
      )}
    </div>
  );
}
