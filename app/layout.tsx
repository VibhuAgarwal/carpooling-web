import "./globals.css";
import Providers from "./providers";
import Navbar from "./components/Navbar";
import GoogleMapsProvider from "@/app/providers/GoogleMapsProvider";

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
