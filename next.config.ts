import type { NextConfig } from "next";

// Configuracoes de comportamento do Next.js para o ambiente de execucao
const nextConfig: NextConfig = {
  experimental: {
    // Ajuste das configuracoes de Server Actions
    serverActions: {
      // Define o limite maximo de processamento do corpo da requisicao (Payload) no servidor
      // Este valor deve ser compativel com as validacoes feitas no frontend (page.tsx)
      bodySizeLimit: '20mb',
    },
  },
};

export default nextConfig;