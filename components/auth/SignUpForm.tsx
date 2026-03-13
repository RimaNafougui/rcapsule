"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Form, Input, Button, Link, Divider } from "@heroui/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AtSymbolIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { debounce } from "lodash";

import {
  SignInButtonGithub,
  SignInButtonGoogle,
} from "@/components/auth/button";

export default function SignUpForm() {
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  );
  const [usernameError, setUsernameError] = useState<string>("");
  const router = useRouter();

  const toggleVisibility = () => setIsVisible(!isVisible);

  const validateUsername = (value: string): string | null => {
    if (!value) return "Username is required";
    if (value.length < 3) return "Must be at least 3 characters";
    if (value.length > 30) return "Must be less than 30 characters";
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return "Only letters, numbers, dashes, and underscores";
    }
    if (/^[-_]|[-_]$/.test(value)) {
      return "Cannot start or end with dash or underscore";
    }

    return null;
  };

  const checkUsernameAvailability = useCallback(
    debounce(async (value: string) => {
      const validationError = validateUsername(value);

      if (validationError) {
        setUsernameError(validationError);
        setUsernameAvailable(null);
        setIsCheckingUsername(false);

        return;
      }

      try {
        const response = await fetch(
          `/api/users/check-username?username=${encodeURIComponent(value)}`,
        );
        const data = await response.json();

        if (response.ok) {
          setUsernameAvailable(data.available);
          setUsernameError(data.available ? "" : "Username already taken");
        } else {
          setUsernameError(data.error || "Failed to check username");
          setUsernameAvailable(null);
        }
      } catch (_err) {
        setUsernameError("Failed to check username");
        setUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500),
    [],
  );

  useEffect(() => {
    if (username) {
      setIsCheckingUsername(true);
      setUsernameError("");
      setUsernameAvailable(null);
      checkUsernameAvailability(username);
    } else {
      setUsernameAvailable(null);
      setUsernameError("");
    }
  }, [username, checkUsernameAvailability]);

  const getUsernameEndContent = () => {
    if (isCheckingUsername) {
      return <Loader2 className="animate-spin text-default-400" size={18} />;
    }
    if (usernameAvailable === true) {
      return <CheckCircleIcon className="w-5 h-5 text-success" />;
    }
    if (usernameAvailable === false || usernameError) {
      return <XCircleIcon className="w-5 h-5 text-danger" />;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!usernameAvailable) {
      setError("Please choose an available username");

      return;
    }

    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);

      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          username: username.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "Something went wrong");
        setIsLoading(false);

        return;
      }

      router.push("/login?signup=success");
      toast.success("Successfully Signed Up!");
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
          Join the Community
        </h2>
        <p className="text-default-500 text-sm tracking-wide">
          Discover real outfits. Share your style. Build with intention.
        </p>
      </div>

      <Form
        className="flex flex-col gap-4"
        validationBehavior="native"
        onSubmit={handleSubmit}
      >
        <Input
          isRequired
          classNames={{ inputWrapper: "h-12" }}
          label="Full Name"
          labelPlacement="outside"
          name="name"
          placeholder="Name"
          startContent={<User className="text-default-400" size={18} />}
          type="text"
          variant="bordered"
        />

        <Input
          isRequired
          classNames={{ inputWrapper: "h-12" }}
          description="3-30 characters. Letters, numbers, dashes, and underscores only."
          endContent={getUsernameEndContent()}
          errorMessage={usernameError}
          isInvalid={!!usernameError || usernameAvailable === false}
          label="Username"
          labelPlacement="outside"
          placeholder="Username"
          startContent={<AtSymbolIcon className="w-5 h-5 text-default-400" />}
          value={username}
          variant="bordered"
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
        />

        <Input
          isRequired
          classNames={{ inputWrapper: "h-12" }}
          label="Email"
          labelPlacement="outside"
          name="email"
          placeholder="Email"
          startContent={<Mail className="text-default-400" size={18} />}
          type="email"
          variant="bordered"
        />

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
          label="Password"
          labelPlacement="outside"
          minLength={8}
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
          type={isVisible ? "text" : "password"}
          variant="bordered"
        />
        <div className="text-center font-light">
          By signing up, you agree to our{" "}
          <Link className="font-bold" href="/terms">
            Terms
          </Link>
          ,{" "}
          <Link className="font-bold" href="/privacy">
            Privacy Policy
          </Link>{" "}
          and
          <Link className="font-bold" href="#">
            Cookies Policy
          </Link>{" "}
          .
        </div>

        {error && (
          <p className="text-danger text-xs text-center font-medium">{error}</p>
        )}

        <Button
          className="w-full h-12 font-bold text-md mt-2 shadow-lg shadow-primary/20"
          color="primary"
          isDisabled={!usernameAvailable || isCheckingUsername}
          isLoading={isLoading}
          type="submit"
        >
          Create Account
        </Button>

        <div className="flex items-center w-full gap-4 my-2">
          <Divider className="flex-1" />
          <span className="text-xs text-default-400 uppercase tracking-widest">
            Or
          </span>
          <Divider className="flex-1" />
        </div>

        <div className="grid w-full grid-cols-2 gap-3">
          <SignInButtonGoogle />
          <SignInButtonGithub />
        </div>

        <p className="text-center w-full text-sm text-default-500 pt-4">
          Already a member?{" "}
          <Link
            className="text-primary font-bold hover:underline"
            href="/login"
          >
            Sign in
          </Link>
        </p>
      </Form>
    </motion.div>
  );
}
