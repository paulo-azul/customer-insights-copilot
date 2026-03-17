import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "./context/theme-context";
import { Toaster } from 'sonner';
import "./globals.css";

// Configuração das fontes Geist para suporte a variáveis CSS e subsets latinos
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
});

// Metadados da página para SEO e identificação no navegador
export const metadata: Metadata = {
  title: "Chat_Undefined",
  description: "Chat da undefined para IA com banco de dados",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-br">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Provedor de contexto para gerenciamento de tema (Dark/Light Mode) */}
        <ThemeProvider>
          {/* Componente global para exibição de notificações do sistema */}
          <Toaster richColors position="top-right" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}