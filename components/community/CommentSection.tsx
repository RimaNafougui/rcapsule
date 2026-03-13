"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Textarea } from "@heroui/react";
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import Link from "next/link";

interface CommentAuthor {
  id: string;
  username: string;
  name?: string;
  image?: string;
  isVerified?: boolean;
}

interface Comment {
  id: string;
  content: string;
  parentId?: string | null;
  likeCount: number;
  isEdited: boolean;
  createdAt: string;
  author: CommentAuthor;
}

interface CommentSectionProps {
  targetType: "outfit" | "wardrobe";
  targetId: string;
}

export function CommentSection({ targetType, targetId }: CommentSectionProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchComments();
  }, [targetType, targetId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/comments?targetType=${targetType}&targetId=${targetId}&limit=50`,
      );
      const data = await res.json();

      setComments(data.comments || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (
    content: string,
    parentId?: string,
    onSuccess?: () => void,
  ) => {
    if (!session) return router.push("/login");
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, content: content.trim(), parentId }),
      });

      if (!res.ok) {
        const data = await res.json();

        toast.error(data.error || "Failed to post comment");

        return;
      }

      const comment: Comment = await res.json();

      setComments((prev) => [...prev, comment]);
      setTotal((prev) => prev + 1);
      setNewComment("");
      onSuccess?.();
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      if (!res.ok) throw new Error();

      const updated: Comment = await res.json();

      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      setEditingId(null);
    } catch {
      toast.error("Failed to edit comment");
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });

      if (!res.ok) throw new Error();

      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setTotal((prev) => prev - 1);
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  // Separate top-level comments and replies
  const topLevel = comments.filter((c) => !c.parentId);
  const repliesMap: Record<string, Comment[]> = {};

  for (const c of comments) {
    if (c.parentId) {
      if (!repliesMap[c.parentId]) repliesMap[c.parentId] = [];
      repliesMap[c.parentId].push(c);
    }
  }

  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-widest mb-6">
        Comments ({total})
      </h2>

      {/* New comment input */}
      <div className="flex gap-3 mb-8">
        <Avatar
          className="w-8 h-8 flex-shrink-0 mt-1"
          name={session?.user?.name || "You"}
          src={session?.user?.image || undefined}
        />
        <div className="flex-1">
          <Textarea
            classNames={{ inputWrapper: "border-default-300" }}
            maxRows={4}
            minRows={2}
            placeholder={session ? "Add a comment…" : "Sign in to comment"}
            radius="none"
            value={newComment}
            variant="bordered"
            onChange={(e) => setNewComment(e.target.value)}
            onFocus={() => !session && router.push("/login")}
          />
          {newComment.trim() && (
            <div className="flex justify-end gap-2 mt-2">
              <Button
                className="text-xs font-bold uppercase tracking-wider"
                radius="none"
                size="sm"
                variant="light"
                onPress={() => setNewComment("")}
              >
                Cancel
              </Button>
              <Button
                className="text-xs font-bold uppercase tracking-wider"
                color="primary"
                isLoading={submitting}
                radius="none"
                size="sm"
                onPress={() => handleSubmit(newComment)}
              >
                Post
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Comment list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-default-200 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-default-200 rounded w-24" />
                <div className="h-3 bg-default-100 rounded w-full" />
                <div className="h-3 bg-default-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : topLevel.length === 0 ? (
        <p className="text-default-400 text-sm italic text-center py-8">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div className="space-y-6">
          {topLevel.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                currentUserId={session?.user?.id}
                editContent={editContent}
                editingId={editingId}
                submitting={submitting}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onReply={(id) => {
                  setReplyingToId(id);
                  setReplyContent("");
                }}
                onSetEditContent={setEditContent}
                onSetEditingId={setEditingId}
              />

              {/* Replies */}
              {repliesMap[comment.id]?.length > 0 && (
                <div className="ml-11 mt-4 space-y-4 border-l border-default-200 pl-4">
                  {repliesMap[comment.id].map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      currentUserId={session?.user?.id}
                      editContent={editContent}
                      editingId={editingId}
                      submitting={submitting}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      onReply={() => {}}
                      onSetEditContent={setEditContent}
                      onSetEditingId={setEditingId}
                    />
                  ))}
                </div>
              )}

              {/* Reply input */}
              {replyingToId === comment.id && (
                <div className="ml-11 mt-3 flex gap-3">
                  <Avatar
                    className="w-7 h-7 flex-shrink-0"
                    name={session?.user?.name || "You"}
                    src={session?.user?.image || undefined}
                  />
                  <div className="flex-1">
                    <Textarea
                      autoFocus
                      classNames={{ inputWrapper: "border-default-300" }}
                      maxRows={3}
                      minRows={1}
                      placeholder={`Reply to @${comment.author.username}…`}
                      radius="none"
                      value={replyContent}
                      variant="bordered"
                      onChange={(e) => setReplyContent(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        className="text-xs font-bold uppercase tracking-wider"
                        radius="none"
                        size="sm"
                        variant="light"
                        onPress={() => setReplyingToId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="text-xs font-bold uppercase tracking-wider"
                        color="primary"
                        isLoading={submitting}
                        radius="none"
                        size="sm"
                        onPress={() =>
                          handleSubmit(replyContent, comment.id, () => {
                            setReplyingToId(null);
                            setReplyContent("");
                          })
                        }
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  editingId,
  editContent,
  submitting,
  onEdit,
  onDelete,
  onReply,
  onSetEditingId,
  onSetEditContent,
}: {
  comment: Comment;
  currentUserId?: string;
  editingId: string | null;
  editContent: string;
  submitting: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (id: string) => void;
  onSetEditingId: (id: string | null) => void;
  onSetEditContent: (c: string) => void;
}) {
  const isOwner = currentUserId === comment.author.id;
  const isEditing = editingId === comment.id;
  const timeAgo = formatTimeAgo(comment.createdAt);

  return (
    <div className="flex gap-3">
      <Link href={`/u/${comment.author.username}`} className="flex-shrink-0">
        <Avatar
          className="w-8 h-8"
          name={comment.author.name || comment.author.username}
          src={comment.author.image || undefined}
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <Link
            className="text-xs font-bold uppercase tracking-wider hover:underline"
            href={`/u/${comment.author.username}`}
          >
            {comment.author.name || comment.author.username}
          </Link>
          <span className="text-[10px] text-default-400">{timeAgo}</span>
          {comment.isEdited && (
            <span className="text-[9px] text-default-300 italic">edited</span>
          )}
        </div>

        {isEditing ? (
          <div>
            <Textarea
              autoFocus
              classNames={{ inputWrapper: "border-default-300" }}
              maxRows={4}
              minRows={2}
              radius="none"
              value={editContent}
              variant="bordered"
              onChange={(e) => onSetEditContent(e.target.value)}
            />
            <div className="flex gap-2 mt-2">
              <Button
                isIconOnly
                color="primary"
                radius="none"
                size="sm"
                isLoading={submitting}
                onPress={() => onEdit(comment.id)}
              >
                <CheckIcon className="w-3.5 h-3.5" />
              </Button>
              <Button
                isIconOnly
                radius="none"
                size="sm"
                variant="light"
                onPress={() => onSetEditingId(null)}
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-default-700 leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <button
                className="text-[10px] uppercase tracking-wider text-default-400 hover:text-foreground transition-colors"
                onClick={() => onReply(comment.id)}
              >
                Reply
              </button>
              {isOwner && (
                <>
                  <button
                    className="text-[10px] uppercase tracking-wider text-default-400 hover:text-foreground transition-colors"
                    onClick={() => {
                      onSetEditingId(comment.id);
                      onSetEditContent(comment.content);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-[10px] uppercase tracking-wider text-danger/60 hover:text-danger transition-colors"
                    onClick={() => onDelete(comment.id)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
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
