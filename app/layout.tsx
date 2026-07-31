import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Letters",
  description: "Translate Italian letters, keep them, and review the words later.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body>
        <div className="shell">
          <header className="masthead">
            <h1>Letters</h1>
            <nav>
              <Link href="/">Translate</Link>
              <Link href="/saved">Saved</Link>
              <Link href="/review">Review</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
