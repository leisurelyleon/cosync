import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "cosync — real-time collaborative editor",
  description:
    "Edit a shared document live with others. Presence and ordered edits via a Rust WebSocket server.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
