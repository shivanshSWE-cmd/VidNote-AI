import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VidNote AI - YouTube Frame Extractor & PDF Note Compiler',
  description: 'Extract minute-by-minute visual frames from YouTube videos and compile user-selected slides into exportable PDF study notes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans flex flex-col min-h-screen bg-[#0B0F17] text-slate-100 antialiased selection:bg-indigo-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
