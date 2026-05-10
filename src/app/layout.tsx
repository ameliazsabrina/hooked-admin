import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hooked Admin",
  description: "Operations dashboard for Hooked rooms and LP cycles",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
