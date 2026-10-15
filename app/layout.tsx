import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cicat — English Conversation Practice",
  description: "Build your English speaking confidence through real AI conversation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
        {children}
      </body>
    </html>
  );
}
