import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ['700'],
  variable: '--font-dm-sans'
});


export const metadata: Metadata = {
  title: "PEPQA ─ Registration",
  description: "Modelling the Modern Resilient grid",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.className}>
      <body>
        {children}
      </body>
    </html>
  );
}
