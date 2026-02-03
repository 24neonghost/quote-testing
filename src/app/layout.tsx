import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";
import { VisualEditsMessenger } from "orchids-visual-edits";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/hooks/use-auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Raise Labs - Quotation System",
  description: "Premium quotation generator for Raise Labs",
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
          <Script
            id="orchids-browser-logs"
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
            strategy="afterInteractive"
            data-orchids-project-id="3507e170-5f3e-4866-b5e4-54d15686411b"
          />
          <ErrorReporter />
          <Script
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
            strategy="afterInteractive"
            data-target-origin="*"
            data-message-type="ROUTE_CHANGE"
            data-include-search-params="true"
            data-only-in-iframe="true"
            data-debug="true"
            data-custom-data='{"appName": "Raise Quotation", "version": "1.0.0"}'
          />
          <Toaster position="top-center" richColors />
          {children}
          <VisualEditsMessenger />
        </AuthProvider>
      </body>
    </html>
  );
}
