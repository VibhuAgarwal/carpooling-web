import "./globals.css";
import Providers from "./providers";
import Navbar from "./components/Navbar";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main className="max-w-7xl mx-auto px-6 py-6">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
