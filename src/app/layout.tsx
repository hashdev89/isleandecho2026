import type { Metadata, Viewport } from "next";
import "./globals.css";
import ConditionalFooter from "../components/ConditionalFooter";
import ClientProviders from "../components/ClientProviders";
import GoogleAnalytics from "../components/GoogleAnalytics";
import { GoogleTranslateWidget } from "../components/GoogleTranslate";
import MobileBottomNav from "../components/MobileBottomNav";
import WhatsAppChat from "../components/WhatsAppChat";
import StructuredData from "../components/StructuredData";
import {
  buildRootMetadata,
  getSiteSeo,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/siteSeo";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteSeo()
  return buildRootMetadata(seo)
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0B3D4A",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const seo = await getSiteSeo()

  return (
    <html lang="en" className="font-inter" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
        <link rel="icon" href={seo.faviconUrl || seo.logoUrl || '/logoisle&echo.png'} type="image/png" />
        <link rel="apple-touch-icon" href={seo.logoUrl || '/logoisle&echo.png'} />
      </head>
      <body
        className="antialiased font-inter"
        suppressHydrationWarning={true}
      >
        {seo.googleTagManagerId ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(seo.googleTagManagerId)}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        ) : null}
        <StructuredData id="ld-organization" data={organizationJsonLd(seo)} />
        <StructuredData id="ld-website" data={websiteJsonLd(seo)} />
        <ClientProviders>
          {children}
          <ConditionalFooter />
          <MobileBottomNav />
          <WhatsAppChat />
          <GoogleTranslateWidget />
        </ClientProviders>
        <GoogleAnalytics
          googleAnalyticsId={seo.googleAnalyticsId || process.env.NEXT_PUBLIC_GA_ID}
          googleTagManagerId={seo.googleTagManagerId || process.env.NEXT_PUBLIC_GTM_ID}
          facebookPixelId={seo.facebookPixelId}
          googleAdsId={seo.googleAdsId}
        />
      </body>
    </html>
  );
}
