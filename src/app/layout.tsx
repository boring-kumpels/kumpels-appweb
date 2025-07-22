import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/theme-context";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import "@/lib/fontawesome"; // Import Font Awesome configuration

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kumpels App",
  description: "Aplicación web para gestión médica",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <QueryProvider>{children}</QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
