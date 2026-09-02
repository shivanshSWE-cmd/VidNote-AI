import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VidNote AI - YouTube & Instagram Video Notes & Transcript Generator',
  description: 'Convert YouTube videos/Shorts and Instagram Reels into structured English & Hinglish study notes and downloadable .docx documents.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans flex flex-col min-h-screen bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
