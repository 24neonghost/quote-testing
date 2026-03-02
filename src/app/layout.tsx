import type { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/hooks/use-auth'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Raise Labs - Quotation System",
  description: "Premium quotation generator for Raise Labs",
  openGraph: {
    title: "Raise Labs - Quotation System",
    description: "Create and manage professional quotations efficiently.",
    type: "website",
    locale: "en_US",
    siteName: "Raise Labs Quote",
  },
  twitter: {
    card: "summary_large_image",
    title: "Raise Labs - Quotation System",
    description: "Create and manage professional quotations efficiently.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <Toaster position="top-center" richColors />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
