import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import ResendProvider from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import prisma from "./prisma";

export const { auth, signIn, signOut, handlers } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    ResendProvider({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || "BillFlow <noreply@resend.dev>",
    }),
    Credentials({
      id: "credentials",
      name: "Demo Account",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        const email = credentials.email as string;
        const name = (credentials.name as string) || "Demo User";
        
        let user = await prisma.user.findUnique({
          where: { email },
        });
        
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name,
            },
          });
        }

        // Auto-seed database with mock clients, products, and invoices
        const { seedDemoData } = await import("./demo-seeder");
        await seedDemoData(user.id);
        
        return user;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      
      // Allow updates to the token
      if (trigger === "update" && session) {
        return { ...token, ...session };
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
    error: "/login?error=1",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
