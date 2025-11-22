import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";
import type { LocalizationResource } from "@clerk/types";
import { Geist, Geist_Mono, Inter, JetBrains_Mono } from "next/font/google";

import Navbar from "@/components/Navbar";
import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// DESIGN_PLAN.md: Inter 폰트 (우선순위)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// DESIGN_PLAN.md: JetBrains Mono 폰트
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Linkpitch - AI 수주 비서",
  description: "퍼포먼스 마케터를 위한 콜드메일·시퀀스 비서",
  icons: {
    icon: "/favicon.ico",
  },
};

// Clerk 한국어 localization 커스터마이징
const customKoKR: LocalizationResource = {
  ...koKR,
  signIn: {
    ...koKR.signIn,
    start: {
      ...koKR.signIn?.start,
      title: "LinkPitch에 로그인",
      subtitle: "환영합니다! 계속하려면 로그인해 주세요",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={customKoKR}
      appearance={{
        variables: {
          colorPrimary: "#6366f1",
        },
      }}
    >
      <html lang="ko" className="dark" suppressHydrationWarning>
        <head>
          <link
            rel="stylesheet"
            as="style"
            crossOrigin="anonymous"
            href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
          style={{
            fontFamily: 'var(--font-inter), var(--font-pretendard), var(--font-geist-sans), sans-serif',
          }}
        >
          <SyncUserProvider>
            <Navbar />
            {children}
          </SyncUserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
