import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store/AppProvider";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeSync, themeInitScript } from "@/components/layout/ThemeProvider";

export const metadata: Metadata = {
  title: "MyEnglish",
  description: "B1 → B2 → C1 英語学習管理",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <AppProvider>
          <ThemeSync />
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
