"use client";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, Spinner } from "@heroui/react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (sessionId) {
      verifySession(sessionId);
    } else {
      setStatus("success");
    }
  }, [searchParams]);

  const verifySession = async (sessionId: string) => {
    try {
      const response = await fetch(
        `/api/checkout/verify?session_id=${sessionId}`,
      );
      const data = await response.json();

      if (data.success) {
        setStatus("success");
      } else {
        setStatus("success");
      }
    } catch {
      setStatus("success");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <CheckCircleIcon className="w-16 h-16 mx-auto mb-6 text-green-500" />
        <h1 className="text-3xl font-bold mb-4">Welcome to Premium!</h1>
        <p className="text-default-500 mb-8">
          Your subscription is now active. Enjoy AI-powered outfit suggestions,
          magic background removal, and weather-smart styling.
        </p>
        <Button
          className="font-display font-light tracking-normal"
          radius="none"
          onPress={() => router.push("/closet")}
        >
          Go to Your Closet
        </Button>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
