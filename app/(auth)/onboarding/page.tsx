"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button, Avatar, Chip, Spinner } from "@heroui/react";
import { ArrowRight, Check, UserPlus, Shirt, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface StyleTag {
  id: string;
  name: string;
  slug: string;
  category: string;
}

interface SuggestedUser {
  id: string;
  username: string;
  name?: string;
  image?: string;
  bio?: string;
  styleTags: string[];
  followerCount: number;
  isVerified: boolean;
}

const STEP_LABELS = ["Your Style", "Find People", "Get Started"];

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [tags, setTags] = useState<StyleTag[]>([]);
  const [groupedTags, setGroupedTags] = useState<Record<string, StyleTag[]>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loadingTags, setLoadingTags] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingTags, setSavingTags] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/style-tags");
      const data = await res.json();

      setTags(data.tags || []);
      setGroupedTags(data.grouped || {});
    } catch {
      toast.error("Failed to load style tags");
    } finally {
      setLoadingTags(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    setLoadingUsers(true);
    try {
      const tagsParam = selectedTags.join(",");
      const res = await fetch(`/api/users/suggested?tags=${encodeURIComponent(tagsParam)}`);
      const data = await res.json();

      setSuggestedUsers(data.users || []);
    } catch {
      toast.error("Failed to load suggestions");
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleTag = (slug: string) => {
    setSelectedTags((prev) =>
      prev.includes(slug)
        ? prev.filter((t) => t !== slug)
        : prev.length < 8
          ? [...prev, slug]
          : prev,
    );
  };

  const handleSaveTags = async () => {
    if (selectedTags.length < 3) {
      toast.error("Select at least 3 style tags");
      return;
    }

    setSavingTags(true);
    try {
      await fetch("/api/settings/style-tags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ styleTags: selectedTags }),
      });
    } catch {
      // Non-fatal — proceed anyway
    } finally {
      setSavingTags(false);
    }

    await fetchSuggestedUsers();
    setStep(1);
  };

  const handleFollow = async (username: string, userId: string) => {
    const alreadyFollowing = followedIds.has(userId);

    setFollowedIds((prev) => {
      const next = new Set(prev);

      if (alreadyFollowing) next.delete(userId);
      else next.add(userId);

      return next;
    });

    try {
      await fetch(`/api/users/${username}/follow`, {
        method: alreadyFollowing ? "DELETE" : "POST",
      });
    } catch {
      setFollowedIds((prev) => {
        const next = new Set(prev);

        if (alreadyFollowing) next.add(userId);
        else next.delete(userId);

        return next;
      });
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const categoryOrder = ["aesthetic", "trend", "occasion", "style", "season", "other"];
  const orderedCategories = categoryOrder.filter((c) => groupedTags[c]);

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-10">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                i < step
                  ? "bg-foreground text-background border-foreground"
                  : i === step
                    ? "border-foreground text-foreground"
                    : "border-default-300 text-default-400"
              }`}
            >
              {i < step ? <Check size={12} /> : i + 1}
            </div>
            <span
              className={`text-[10px] uppercase tracking-widest hidden sm:block ${
                i === step ? "text-foreground font-bold" : "text-default-400"
              }`}
            >
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && (
              <div className={`flex-1 h-px ${i < step ? "bg-foreground" : "bg-default-200"}`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            initial={{ opacity: 0, y: 10 }}
          >
            <div className="mb-8">
              <h1 className="text-3xl font-black uppercase tracking-tighter italic mb-2">
                What&apos;s Your Style?
              </h1>
              <p className="text-default-500 text-sm">
                Select 3–8 tags that describe your aesthetic. We&apos;ll use these to show you the right people and content.
              </p>
              <p className="text-[10px] uppercase tracking-widest text-default-400 mt-2">
                {selectedTags.length}/8 selected
              </p>
            </div>

            {loadingTags ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="space-y-6">
                {orderedCategories.map((category) => (
                  <div key={category}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-default-400 mb-3 capitalize">
                      {category}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(groupedTags[category] || []).map((tag) => {
                        const isSelected = selectedTags.includes(tag.slug);

                        return (
                          <button
                            key={tag.id}
                            className={`px-3 py-1.5 text-xs font-medium border transition-colors uppercase tracking-wider ${
                              isSelected
                                ? "bg-foreground text-background border-foreground"
                                : "border-default-300 text-default-600 hover:border-default-500"
                            }`}
                            onClick={() => toggleTag(tag.slug)}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Fallback if no tags exist in DB yet */}
                {orderedCategories.length === 0 && (
                  <div className="text-center py-8 text-default-400">
                    <p className="text-sm">No style tags available yet.</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-10 flex gap-3">
              <Button
                className="flex-1 h-12 font-bold uppercase tracking-widest"
                color="primary"
                isDisabled={selectedTags.length < 3}
                isLoading={savingTags}
                radius="none"
                onPress={handleSaveTags}
              >
                Continue <ArrowRight className="ml-2" size={16} />
              </Button>
              <Button
                className="font-bold uppercase tracking-wider text-xs"
                radius="none"
                variant="light"
                onPress={() => {
                  fetchSuggestedUsers();
                  setStep(1);
                }}
              >
                Skip
              </Button>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            initial={{ opacity: 0, y: 10 }}
          >
            <div className="mb-8">
              <h1 className="text-3xl font-black uppercase tracking-tighter italic mb-2">
                People Who Share Your Taste
              </h1>
              <p className="text-default-500 text-sm">
                Follow at least one person to start building your community feed.
              </p>
            </div>

            {loadingUsers ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : suggestedUsers.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-default-200">
                <p className="text-default-400 text-sm">No suggestions yet — the community is just getting started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestedUsers.map((user) => {
                  const isFollowing = followedIds.has(user.id);

                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-4 p-4 border border-default-200 hover:border-default-400 transition-colors"
                    >
                      <Avatar
                        className="w-12 h-12 flex-shrink-0"
                        name={user.name || user.username}
                        src={user.image || undefined}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm uppercase tracking-wider truncate">
                          {user.name || user.username}
                        </p>
                        <p className="text-[10px] text-default-400">@{user.username} · {user.followerCount} followers</p>
                        {user.styleTags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.styleTags.slice(0, 3).map((t) => (
                              <span key={t} className="text-[9px] uppercase tracking-wider text-default-400 border border-default-200 px-1.5 py-0.5">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        className="flex-shrink-0 font-bold uppercase tracking-wider text-xs"
                        color={isFollowing ? "default" : "primary"}
                        radius="none"
                        size="sm"
                        startContent={isFollowing ? <Check size={14} /> : <UserPlus size={14} />}
                        variant={isFollowing ? "bordered" : "solid"}
                        onPress={() => handleFollow(user.username, user.id)}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-10 flex gap-3">
              <Button
                className="flex-1 h-12 font-bold uppercase tracking-widest"
                color="primary"
                radius="none"
                onPress={() => setStep(2)}
              >
                Continue <ArrowRight className="ml-2" size={16} />
              </Button>
              <Button
                className="font-bold uppercase tracking-wider text-xs"
                radius="none"
                variant="light"
                onPress={() => setStep(2)}
              >
                Skip
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            initial={{ opacity: 0, y: 10 }}
            className="text-center"
          >
            <div className="mb-10">
              <div className="w-16 h-16 bg-foreground text-background flex items-center justify-center mx-auto mb-6">
                <Check size={32} />
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic mb-3">
                You&apos;re All Set.
              </h1>
              <p className="text-default-500 text-sm max-w-sm mx-auto">
                Welcome to the community. What do you want to do first?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                className="flex flex-col items-center gap-3 p-6 border border-default-200 hover:border-foreground transition-colors"
                onClick={() => router.push("/closet/new")}
              >
                <Shirt className="w-7 h-7 text-default-500" />
                <div>
                  <p className="font-bold uppercase tracking-wider text-sm">Add First Piece</p>
                  <p className="text-[10px] text-default-400 mt-1">Start your digital closet</p>
                </div>
              </button>

              <button
                className="flex flex-col items-center gap-3 p-6 border border-foreground bg-foreground text-background"
                onClick={() => router.push("/discover")}
              >
                <Sparkles className="w-7 h-7" />
                <div>
                  <p className="font-bold uppercase tracking-wider text-sm">Explore Community</p>
                  <p className="text-[10px] text-background/60 mt-1">See what people are wearing</p>
                </div>
              </button>

              <button
                className="flex flex-col items-center gap-3 p-6 border border-default-200 hover:border-foreground transition-colors"
                onClick={() => router.push("/closet")}
              >
                <span className="text-2xl">→</span>
                <div>
                  <p className="font-bold uppercase tracking-wider text-sm">Skip for Now</p>
                  <p className="text-[10px] text-default-400 mt-1">Go to your closet</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
