import type { NextAuthConfig } from "next-auth";

/** Edge-safe Auth.js settings for middleware. */
export const authConfig = {
  providers: [],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
