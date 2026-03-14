"use client";
import React, { Suspense, useState } from "react";
import { Form, Input, Button, Link, Divider } from "@heroui/react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, User } from "lucide-react";

import {
  SignInButtonGithub,
  SignInButtonGoogle,
} from "@/components/auth/button";

function LoginFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const signupSuccess = searchParams?.get("signup") === "success";
  const callbackUrl = searchParams?.get("callbackUrl") || "/closet";

  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const identifier = formData.get("identifier") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });

      if (result?.error) {
        setIsLoading(false);

        if (result.code === "EmailNotVerified") {
          setError(
            "Please check your email to verify your account before logging in.",
          );
        } else if (result.code === "UserNotFound") {
          const isEmail = identifier.includes("@");

          setError(
            isEmail
              ? "No account found with that email address."
              : "No account found with that username.",
          );
        } else if (result.code === "WrongPassword") {
          setError("Incorrect password. Please try again.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (_err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md space-y-8"
      initial={{ opacity: 0, y: 10 }}
    >
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tighter uppercase italic">
          Welcome Back
        </h2>
        <p className="text-default-500 text-sm tracking-wide">
          Welcome back to your community
        </p>
      </div>

      {signupSuccess && (
        <div className="p-3 text-xs bg-success-50 border border-success-200 text-success-700 rounded-xl text-center">
          Account created! Check your email and click the link to verify, then
          sign in here.
        </div>
      )}

      <Form
        className="flex flex-col gap-4"
        validationBehavior="native"
        onSubmit={handleSubmit}
      >
        <Input
          isRequired
          description="You can use your email or username"
          label="Email or Username"
          labelPlacement="outside"
          name="identifier"
          placeholder="AnnaVogue@email.com or @annavogue"
          startContent={<User className="text-default-400" size={18} />}
          type="text"
          variant="bordered"
        />
        <Input
          isRequired
          endContent={
            <button
              aria-label={isVisible ? "Hide password" : "Show password"}
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
          label="Password"
          labelPlacement="outside"
          name="password"
          placeholder="••••••••"
          startContent={<Lock className="text-default-400" size={18} />}
          type={isVisible ? "text" : "password"}
          variant="bordered"
        />
        <div className="flex justify-end w-full px-1">
          <Link
            className="text-default-500 hover:text-primary transition-colors"
            href="/forgot-password"
            size="sm"
          >
            Forgot password?
          </Link>
        </div>
        {error && (
          <p className="text-danger text-xs text-center font-medium">{error}</p>
        )}
        <Button
          className="w-full h-12 font-bold text-md mt-2 shadow-lg shadow-primary/20"
          color="primary"
          isLoading={isLoading}
          type="submit"
        >
          Sign In
        </Button>
        <div className="flex items-center w-full gap-4 my-2">
          <Divider className="flex-1" />
          <span className="text-xs text-default-400 uppercase tracking-widest">
            Or
          </span>
          <Divider className="flex-1" />
        </div>
        <div className="grid grid-cols-2 w-full gap-3">
          <SignInButtonGoogle />
          <SignInButtonGithub />
        </div>
        <p className="text-center w-full text-sm text-default-500 pt-4">
          Don&apos;t have an account?{" "}
          <Link
            className="text-primary font-bold hover:underline"
            href="/signup"
          >
            Sign up
          </Link>
        </p>
      </Form>
    </motion.div>
  );
}

export const LoginForm = () => (
  <Suspense
    fallback={
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    }
  >
    <LoginFormContent />
  </Suspense>
);
