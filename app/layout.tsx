import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Já tá podendo jogar?',
  description:
    'Descubra se o Neymar já foi escalado e vai jogar hoje. Atualizado em tempo real.',
  keywords: ['neymar', 'santos', 'futebol', 'jogar', 'escalaçao', 'partida'],
  openGraph: {
    title: 'Já tá podendo jogar?',
    description: 'Será que o Neymar vai jogar hoje?',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Já tá podendo jogar?',
    description: 'Será que o Neymar vai jogar hoje?',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}