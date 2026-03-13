"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@heroui/react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">
            Oops!
          </h1>
          <h2 className="text-xl font-light text-default-600">
            Something went wrong
          </h2>
        </div>

        <p className="text-sm text-default-500">
          We&apos;ve been notified and are looking into it. Please try again.
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="p-4 bg-danger-50 rounded-lg text-left">
            <p className="text-xs font-mono text-danger-600 break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Button
            className="font-bold uppercase tracking-widest"
            color="primary"
            radius="none"
            onPress={reset}
          >
            Try Again
          </Button>

          <Button
            className="font-medium uppercase tracking-wider"
            radius="none"
            variant="bordered"
            onPress={() => router.push("/")}
          >
            Go Home
          </Button>
        </div>

        <button
          className="text-xs text-default-400 hover:text-default-600 underline"
          onClick={() => {
            const eventId = Sentry.lastEventId();

            if (eventId) {
              Sentry.showReportDialog({ eventId });
            }
          }}
        >
          Report feedback
        </button>
      </div>
    </div>
  );
}
