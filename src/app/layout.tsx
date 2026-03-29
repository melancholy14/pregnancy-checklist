import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { BottomNav } from "@/components/layout/BottomNav";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pregnancy Preparation Web App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={poppins.className}>
      <body>
        <div className="min-h-screen">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
