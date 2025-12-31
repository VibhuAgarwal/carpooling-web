import "./globals.css";
import Providers from "./providers";
import Navbar from "./components/Navbar";
import GoogleMapsProvider from "@/app/providers/GoogleMapsProvider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  applicationName: "CoRide",
  title: {
    default: "CoRide",
    template: "%s | CoRide",
  },
  icons: {
    icon: "/RideSHareHub.png",
    apple: "/RideShareHub.png",
  },
  openGraph: {
    title: "CoRide",
    siteName: "CoRide",
    images: [{ url: "/RideShareHub.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CoRide",
    images: ["/RideShareHub.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <GoogleMapsProvider>
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 py-6">
              {children}
            </main>
          </GoogleMapsProvider>
        </Providers>
      </body>
    </html>
  );
}
