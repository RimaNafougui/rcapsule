"use client";

import React, { useState, useEffect } from "react";
import { Form, Input, Button, Link } from "@heroui/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Standard Supabase client for client-side interactions
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const toggleVisibility = () => setIsVisible(!isVisible);

  // Optional: Verify the link is valid immediately upon load
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError(
          "This link is invalid or has expired. Please request a new one.",
        );
      }
    };

    checkSession();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);

      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setIsLoading(false);

      return;
    }

    try {
      // Since the email link logs the user in, we just update the user object
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Optional: Sign them out so they have to log in manually with the new password
        // await supabase.auth.signOut();

        // Redirect to login after a short delay
        setTimeout(() => {
          router.push("/login?signup=password_updated");
        }, 2000);
      }
    } catch (_err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-8 bg-success-50 border border-success-200 rounded-2xl text-center space-y-4"
          initial={{ opacity: 0, scale: 0.95 }}
        >
          <div className="flex justify-center">
            <CheckCircle2 className="text-success-600" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-success-800">
            Password Updated!
          </h2>
          <p className="text-success-700">
            Your password has been changed successfully. Redirecting you to
            login...
          </p>
          <Button
            as={Link}
            className="font-bold mt-4"
            color="success"
            href="/login"
            variant="flat"
          >
            Go to Login Now
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
        initial={{ opacity: 0, y: 10 }}
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tighter uppercase italic">
            Set New Password
          </h2>
          <p className="text-default-500 text-sm tracking-wide">
            Create a strong password for your account
          </p>
        </div>

        {error && (
          <div className="p-3 bg-danger-50 border border-danger-200 rounded-xl flex items-center gap-3 text-danger-700 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <Form
          className="flex flex-col gap-4"
          validationBehavior="native"
          onSubmit={handleSubmit}
        >
          <Input
            isRequired
            classNames={{ inputWrapper: "h-12" }}
            endContent={
              <button
                className="focus:outline-none"
                type="button"
                onClick={toggleVisibility}
              >
                {isVisible ? (
                  <EyeOff className="text-default-400" size={18} />
                ) : (
                  <Eye className="text-default-400" size={18} />
                )}
              </button>
            }
            label="New Password"
            labelPlacement="outside"
            name="password"
            placeholder="••••••••"
            startContent={<Lock className="text-default-400" size={18} />}
            type={isVisible ? "text" : "password"}
            variant="bordered"
          />

          <Input
            isRequired
            classNames={{ inputWrapper: "h-12" }}
            label="Confirm Password"
            labelPlacement="outside"
            name="confirmPassword"
            placeholder="••••••••"
            startContent={<Lock className="text-default-400" size={18} />}
            type="password"
            variant="bordered"
          />

          <Button
            className="w-full h-12 font-bold text-md mt-2 shadow-lg shadow-primary/20"
            color="primary"
            isDisabled={!!error && error.includes("link is invalid")}
            isLoading={isLoading}
            type="submit"
          >
            Update Password
          </Button>
        </Form>
      </motion.div>
    </div>
  );
}
