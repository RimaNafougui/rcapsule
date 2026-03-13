"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Avatar, Button, Spinner } from "@heroui/react";
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
  BellIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  isRead: boolean;
  message?: string;
  targetType?: string;
  targetId?: string;
  createdAt: string;
  actor?: {
    id: string;
    username: string;
    name?: string;
    image?: string;
  };
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  like_outfit: <HeartIcon className="w-4 h-4 text-danger" />,
  like_wardrobe: <HeartIcon className="w-4 h-4 text-danger" />,
  comment: <ChatBubbleLeftIcon className="w-4 h-4 text-primary" />,
  comment_reply: <ChatBubbleLeftIcon className="w-4 h-4 text-primary" />,
  follow: <UserPlusIcon className="w-4 h-4 text-success" />,
  mention: <ChatBubbleLeftIcon className="w-4 h-4 text-warning" />,
  feature: <BellIcon className="w-4 h-4 text-warning" />,
  system: <BellIcon className="w-4 h-4 text-default-400" />,
};

function getNotifText(notif: Notification): string {
  const actor = notif.actor?.name || notif.actor?.username || "Someone";

  switch (notif.type) {
    case "like_outfit":
      return `${actor} liked your outfit`;
    case "like_wardrobe":
      return `${actor} liked your collection`;
    case "comment":
      return `${actor} commented on your ${notif.targetType || "post"}`;
    case "comment_reply":
      return `${actor} replied to your comment`;
    case "follow":
      return `${actor} started following you`;
    case "mention":
      return `${actor} mentioned you`;
    case "feature":
      return `Your ${notif.targetType || "content"} was featured`;
    case "system":
      return notif.message || "System notification";
    default:
      return notif.message || "New notification";
  }
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);

  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") fetchNotifications();
  }, [status]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=50");
      const data = await res.json();

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    setMarkingRead(true);
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    } finally {
      setMarkingRead(false);
    }
  };

  const markOneRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    await fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => {});
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-default-500 text-sm mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            className="uppercase font-bold tracking-wider text-xs"
            isLoading={markingRead}
            radius="none"
            size="sm"
            startContent={<CheckIcon className="w-4 h-4" />}
            variant="bordered"
            onPress={markAllRead}
          >
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-default-200">
          <BellIcon className="w-12 h-12 text-default-300 mb-4" />
          <p className="text-default-400 text-sm">No notifications yet.</p>
          <p className="text-default-300 text-xs mt-1">
            When people like or comment on your looks, you&apos;ll see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start gap-4 p-4 border transition-colors cursor-pointer ${
                notif.isRead
                  ? "border-default-200 bg-background"
                  : "border-default-300 bg-default-50"
              }`}
              onClick={() => {
                if (!notif.isRead) markOneRead(notif.id);
                if (notif.actor?.username && notif.type === "follow") {
                  router.push(`/u/${notif.actor.username}`);
                }
              }}
            >
              {/* Icon */}
              <div className="w-8 h-8 flex items-center justify-center bg-default-100 flex-shrink-0 mt-0.5">
                {NOTIF_ICONS[notif.type] || <BellIcon className="w-4 h-4" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {notif.actor && (
                    <Link href={`/u/${notif.actor.username}`} onClick={(e) => e.stopPropagation()}>
                      <Avatar
                        className="w-6 h-6"
                        name={notif.actor.name || notif.actor.username}
                        src={notif.actor.image || undefined}
                      />
                    </Link>
                  )}
                  <p className={`text-sm ${notif.isRead ? "text-default-600" : "text-foreground font-medium"}`}>
                    {getNotifText(notif)}
                  </p>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-default-400 mt-1">
                  {formatTimeAgo(notif.createdAt)}
                </p>
              </div>

              {/* Unread dot */}
              {!notif.isRead && (
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
