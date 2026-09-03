import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Please enter both username/email and password");
        }

        const envAdminUser = process.env.ADMIN_USERNAME || "admin";
        const envAdminPass = process.env.ADMIN_PASSWORD || "admin123";
        const envAdminEmail = process.env.ADMIN_EMAIL || "admin@flashkart.com";

        // 1. Check Root Admin credentials
        if (
          credentials.username === envAdminUser &&
          credentials.password === envAdminPass
        ) {
          return {
            id: "admin-root",
            name: "Administrator",
            email: envAdminEmail,
            role: "admin",
          };
        }

        // 2. Verify registered user (Customer or Delivery Partner) in MongoDB
        await dbConnect();
        const user = await User.findOne({
          email: credentials.username.toLowerCase().trim(),
        });

        if (!user || !user.password) {
          throw new Error("No account found with this email. Please check your credentials.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Incorrect password. Please try again.");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role || "customer",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || "customer";
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };