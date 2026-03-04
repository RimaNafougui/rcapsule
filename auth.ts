import NextAuth, { CredentialsSignin } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

import { asUserId } from "@/types/branded";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

class EmailNotVerifiedError extends CredentialsSignin {
  code = "EmailNotVerified";
}

class UserNotFoundError extends CredentialsSignin {
  code = "UserNotFound";
}

class WrongPasswordError extends CredentialsSignin {
  code = "WrongPassword";
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    Credentials({
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        const identifier = credentials.identifier as string;
        const password = credentials.password as string;

        try {
          // Determine if identifier is an email or username
          const isEmail = identifier.includes("@");
          let email: string;

          if (isEmail) {
            // Check if the email exists in our User table
            const { data: userByEmail } = await supabase
              .from("User")
              .select("email")
              .eq("email", identifier)
              .single();

            if (!userByEmail) {
              throw new UserNotFoundError();
            }

            email = identifier;
          } else {
            // Look up email by username (case-insensitive)
            const { data: userByUsername } = await supabase
              .from("User")
              .select("email")
              .ilike("username", identifier)
              .single();

            if (!userByUsername) {
              throw new UserNotFoundError();
            }

            email = userByUsername.email;
          }

          // Attempt sign-in with Supabase Auth
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            if (error.message.includes("Email not confirmed")) {
              throw new EmailNotVerifiedError();
            }
            // Invalid credentials = wrong password (user exists but password is wrong)
            if (
              error.message.includes("Invalid login credentials") ||
              error.message.includes("invalid_credentials")
            ) {
              throw new WrongPasswordError();
            }

            return null;
          }

          if (!data.user) return null;

          const { data: existingUser } = await supabase
            .from("User")
            .select("id, email, name, image")
            .eq("email", data.user.email!)
            .single();

          if (existingUser) {
            return {
              id: existingUser.id,
              email: existingUser.email,
              name: existingUser.name,
              image: existingUser.image,
            };
          }

          return {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || null,
            image: data.user.user_metadata?.image || null,
          };
        } catch (error) {
          if (
            error instanceof EmailNotVerifiedError ||
            error instanceof UserNotFoundError ||
            error instanceof WrongPasswordError
          ) {
            throw error;
          }
          console.error("Authorization error:", error);

          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile: _profile }) {
      if (account?.provider === "github" || account?.provider === "google") {
        try {
          const { data: existingUser } = await supabase
            .from("User")
            .select("id, name, image")
            .eq("email", user.email!)
            .single();

          let userId: any;

          if (existingUser) {
            userId = existingUser.id;

            if (!existingUser.name && user.name) {
              await supabase
                .from("User")
                .update({
                  name: user.name,
                  image: user.image,
                  updatedAt: new Date().toISOString(),
                })
                .eq("id", userId);
            }
          } else {
            userId = user.id;
            await supabase.from("User").insert({
              id: userId,
              email: user.email!,
              name: user.name,
              image: user.image,
              emailVerified: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }

          const { error: accountError } = await supabase.from("Account").upsert(
            {
              userId: userId,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              onConflict: "provider,providerAccountId",
            },
          );

          if (accountError) {
            console.error("Error linking account:", accountError);

            return false;
          }

          user.id = userId;

          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);

          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      // Initial sign-in: populate token from the user object
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      // Explicit session update (e.g. after profile edit)
      if (trigger === "update" && session) {
        token.name = session.user.name;
        token.picture = session.user.image;

        return token;
      }

      // Fetch role (and sync name/image) only once per session — when role
      // is not yet stored in the token. Avoids a DB round-trip on every request.
      if (token.id && token.role === undefined) {
        try {
          const { data: userData } = await supabase
            .from("User")
            .select("name, image, role")
            .eq("id", token.id as string)
            .single();

          if (userData) {
            token.name = userData.name;
            token.picture = userData.image;
            token.role = userData.role ?? "user";
          }
        } catch (error) {
          console.error("Error fetching user data in JWT callback:", error);
          token.role = "user";
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = asUserId(token.id as string);
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        session.user.role = (token.role as string) ?? "user";
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
});
