"use client";
import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
} from "@heroui/react";

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    sent?: number;
    error?: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ error: data.error || "Failed to send broadcast" });
      } else {
        setResult({ sent: data.sent });
        setTitle("");
        setMessage("");
      }
    } catch {
      setResult({ error: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Broadcast Notification</h1>
        <p className="text-sm opacity-50 mt-1">
          Send a system notification to all users.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">Compose Message</h2>
        </CardHeader>
        <CardBody>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              isRequired
              label="Title"
              placeholder="e.g. Important Update"
              value={title}
              onValueChange={setTitle}
            />

            <Textarea
              isRequired
              label="Message"
              minRows={4}
              placeholder="Enter your message to all users..."
              value={message}
              onValueChange={setMessage}
            />

            <p className="text-xs opacity-50">
              This will insert a &quot;system&quot; notification for every user
              in the database. Use sparingly.
            </p>

            {result?.error && (
              <p className="text-sm text-danger">{result.error}</p>
            )}
            {result?.sent != null && (
              <p className="text-sm text-success">
                Notification sent to {result.sent.toLocaleString()} users.
              </p>
            )}

            <Button
              color="primary"
              isDisabled={!title.trim() || !message.trim()}
              isLoading={loading}
              type="submit"
            >
              Send to All Users
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
