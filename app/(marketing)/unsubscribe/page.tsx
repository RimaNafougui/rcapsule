"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

type Status = "loading" | "success" | "error" | "invalid";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [status, setStatus] = useState<Status>(email ? "loading" : "invalid");

  useEffect(() => {
    if (!email) return;

    fetch("/api/newsletter/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then((res) => setStatus(res.ok ? "success" : "error"))
      .catch(() => setStatus("error"));
  }, [email]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "loading" && (
          <>
            <div className="w-12 h-12 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-default-500 text-sm uppercase tracking-widest">
              Unsubscribing…
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircleIcon className="w-14 h-14 text-success mx-auto" />
            <div className="space-y-2">
              <h1 className="text-2xl font-black uppercase tracking-tighter italic">
                You&apos;re unsubscribed.
              </h1>
              <p className="text-default-500 text-sm">
                <span className="text-foreground font-medium">{email}</span> has
                been removed from our mailing list. You won&apos;t hear from us
                again.
              </p>
            </div>
            <Link
              className="inline-block text-xs uppercase tracking-widest text-default-400 hover:text-foreground transition-colors border-b border-default-300 pb-0.5"
              href="/"
            >
              Back to Rcapsule
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircleIcon className="w-14 h-14 text-danger mx-auto" />
            <div className="space-y-2">
              <h1 className="text-2xl font-black uppercase tracking-tighter italic">
                Something went wrong.
              </h1>
              <p className="text-default-500 text-sm">
                We couldn&apos;t process your request. Please try again or
                contact us at{" "}
                <a
                  className="text-foreground underline underline-offset-2"
                  href="mailto:hello@rcapsule.com"
                >
                  hello@rcapsule.com
                </a>
                .
              </p>
            </div>
          </>
        )}

        {status === "invalid" && (
          <>
            <XCircleIcon className="w-14 h-14 text-warning mx-auto" />
            <div className="space-y-2">
              <h1 className="text-2xl font-black uppercase tracking-tighter italic">
                Invalid link.
              </h1>
              <p className="text-default-500 text-sm">
                This unsubscribe link is missing an email address. Use the link
                from your email.
              </p>
            </div>
            <Link
              className="inline-block text-xs uppercase tracking-widest text-default-400 hover:text-foreground transition-colors border-b border-default-300 pb-0.5"
              href="/"
            >
              Back to Rcapsule
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
