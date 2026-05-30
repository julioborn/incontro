import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Libre_Baskerville } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/ui/Providers";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre-baskerville",
});

export const metadata: Metadata = {
  title: "Insitus",
  description: "Conectate con quienes están en el mismo lugar que vos.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Insitus",
  },
  icons: {
    icon: "/iconofinal.png",
    apple: "/iconofinal.png",
  },
  openGraph: {
    title: "Insitus",
    description: "Conectate con quienes están en el mismo lugar que vos.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} ${libreBaskerville.variable} h-full`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/iconofinal.png" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/@geoman-io/leaflet-geoman-free@latest/dist/leaflet-geoman.css" />
      </head>
      <body className="h-full bg-black text-white antialiased overflow-x-hidden"
        style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
