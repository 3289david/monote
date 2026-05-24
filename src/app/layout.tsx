import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import SessionProvider from "@/components/providers/SessionProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import PWAProvider from "@/components/providers/PWAProvider";
import InstallPrompt from "@/components/ui/InstallPrompt";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "monote — 학생 커뮤니티",
  description: "시험 범위, 수행평가, 족보 공유 — 학생들을 위한 스터디 커뮤니티",
  keywords: "시험범위, 수행평가, 족보, 학생, 공부, 커뮤니티",
  authors: [{ name: "monote" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "monote",
  },
  openGraph: {
    title: "monote — 학생 커뮤니티",
    description: "시험 범위, 수행평가, 족보 공유 플랫폼",
    type: "website",
  },
  // Deep link support
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "msapplication-tap-highlight": "no",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#533afd" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1e54" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${inter.variable} h-full`}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
        {/* iOS splash / icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="monote" />
      </head>
      <body className="h-full antialiased">
        <SessionProvider>
          <QueryProvider>
            <PWAProvider>
              {children}
              <InstallPrompt />
              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    borderRadius: "9999px",
                    background: "#0d253d",
                    color: "#fff",
                    fontSize: "14px",
                    padding: "10px 18px",
                  },
                }}
              />
            </PWAProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
