import { AppShell } from "@/components/layout/app-shell";
import Script from "next/script";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* GA4 설치 코드 시작 */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-E6572JB840"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-E6572JB840');
        `}
      </Script>
      {/* GA4 설치 코드 끝 */}

      <AppShell>{children}</AppShell>
    </>
  );
}