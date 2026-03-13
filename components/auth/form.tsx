"use client";
import React from "react";
import { Form, Input, Button, Link } from "@heroui/react";
import { useSearchParams } from "next/navigation";

import { SignInButtonGithub } from "./button";

export const LoginForm = () => {
  const searchParams = useSearchParams();
  const signupSuccess = searchParams?.get("signup") === "success";

  return (
    <div className="p-5 flex flex-col items-center">
      <Form className="w-1/2 flex flex-col gap-4 ">
        <Input
          isRequired
          errorMessage="Please enter a valid username"
          label="Username"
          labelPlacement="outside"
          name="username"
          placeholder="Enter your username"
          type="text"
        />
        <Input
          isRequired
          errorMessage="Please enter a valid email"
          label="Email"
          labelPlacement="outside"
          name="email"
          placeholder="Enter your email"
          type="email"
        />
        <div className="flex w-full gap-2">
          <Button className="w-1/2" color="primary" type="submit">
            Submit
          </Button>
          <Button className="w-1/2" type="reset" variant="flat">
            Reset
          </Button>
        </div>
        <SignInButtonGithub />
        {signupSuccess && (
          <div className="w-1/2 mb-4 p-4 bg-green-100 text-green-700 rounded">
            Account created successfully! Please sign in.
          </div>
        )}
        <div className="text-center text-sm mt-4">
          Don&apos;t have an account?{" "}
          <Link className="text-primary hover:underline" href="/signup">
            Sign up
          </Link>
        </div>
      </Form>
    </div>
  );
};
