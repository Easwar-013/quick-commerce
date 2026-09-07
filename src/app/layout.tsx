import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/mobile/BottomNav";
import AuthProvider from "@/components/providers/AuthProvider";
import { FilterProvider } from "@/context/FilterContext";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlashKart | 10-Minute Grocery Delivery",
  description: "Cross-platform quick commerce store",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 font-sans">
        <AuthProvider>
          <FilterProvider>
            {children}
            <BottomNav />
          </FilterProvider>
        </AuthProvider>
      </body>
    </html>
  );
}