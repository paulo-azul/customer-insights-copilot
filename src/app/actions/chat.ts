"use server";

import { supabaseAdmin as supabase } from "../lib/supabase";
import { aiClient, MODEL_NAME } from "../lib/ai-agent";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import PDFParser from "pdf2json";

// Identificador temporario de usuario configurado para a prova de conceito
const TEMP_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function processChatMessage(content: string, role: string, attachments: any[] = []) {
  try {
    // Salva a mensagem enviada pelo usuario no banco de dados
    await supabase.from('message').insert([{ text: content, role: 'user', archive: attachments, user_id: TEMP_USER_ID }]);

    // Busca o historico recente de mensagens para que a inteligencia artificial entenda o contexto da conversa
    const { data: history } = await supabase
      .from('message')
      .select('role, text')
      .order('created_at', { ascending: false })
      .limit(15);

    // Prepara a estrutura do payload contendo o texto do usuario e possiveis arquivos
    const userContent: any[] = [{ type: "text", text: content }];

    // Processa os arquivos anexados realizando a leitura de PDFs nativa e validando os formatos de imagem
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        if (file.url) {
          const isPdf = file.url.toLowerCase().includes('.pdf') || (file.name && file.name.toLowerCase().endsWith('.pdf'));

          if (isPdf) {
            try {
              const pdfResponse = await fetch(file.url);
              const arrayBuffer = await pdfResponse.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              const extractTextFromPDF = (pdfBuffer: Buffer): Promise<string> => {
                return new Promise((resolve, reject) => {
                  const pdfParser = new PDFParser(null, true);
                  pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
                  pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
                  pdfParser.parseBuffer(pdfBuffer);
                });
              };

              const pdfText = await extractTextFromPDF(buffer);
              userContent.push({
                type: "text",
                text: `[Conteudo extraido do documento PDF '${file.name || 'documento'}':\n\n${pdfText}\n\nFim do documento]`
              });
            } catch (pdfError) {
              userContent.push({ type: "text", text: `[Aviso do Sistema: Nao foi possivel ler o arquivo PDF.]` });
            }
          } else {
            const validImageTypes = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
            const fileUrlLower = file.url.toLowerCase();
            const isSupportedImage = validImageTypes.some(ext => fileUrlLower.includes(ext));

            if (isSupportedImage) {
              userContent.push({ type: "image_url", image_url: { url: file.url } });
            } else {
              userContent.push({ type: "text", text: `[Aviso do Sistema: Formato nao suportado para leitura visual.]` });
            }
          }
        }
      }
    }

    // Define o papel do Agente no prompt de sistema e acopla o historico de mensagens
    const messages: any[] = [
      { role: "system", content: `Voce e o Customer Insights Copilot. ID: ${TEMP_USER_ID}. REGRA IMPORTANTE: Sempre responda de forma clara.` },
      ...(history?.reverse().map(m => ({ role: m.role, content: m.text })) || []),
      { role: "user", content: userContent }
    ];

    // Secao de Integracao com o Model Context Protocol

    // Busca o caminho absoluto do servidor MCP declarado nas variaveis de ambiente
    const mcpServerPath = process.env.MCP_SERVER_PATH;
    if (!mcpServerPath) {
      throw new Error("Variavel MCP_SERVER_PATH nao configurada no ambiente.");
    }

    // Estabelece a conexao de transporte padrao com o servidor Node isolado
    const transport = new StdioClientTransport({
      command: "npx",
      args: ["tsx", mcpServerPath]
    });

    const mcpClient = new Client({ name: "next-js-client", version: "1.0.0" }, { capabilities: {} });
    await mcpClient.connect(transport);

    // Requisita a lista de ferramentas disponiveis no servidor MCP e mapeia para o formato exigido pela OpenAI
    // A expressao as const e utilizada para garantir que o TypeScript entenda type como a string literal function e evite erros de tipagem
    const mcpToolsResponse = await mcpClient.listTools();
    const openAiTools = mcpToolsResponse.tools.map(tool => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }
    }));

    // Envia a mensagem do usuario e as ferramentas disponiveis para a inteligencia artificial tomar uma decisao
    let response = await aiClient.chat.completions.create({
      messages,
      model: MODEL_NAME,
      tools: openAiTools.length > 0 ? openAiTools : undefined,
    });

    let aiMessage = response.choices[0].message;

    // Executa a acao no servidor MCP caso a inteligencia artificial tenha solicitado o uso de alguma ferramenta especifica
    if (aiMessage.tool_calls) {
      for (const toolCall of aiMessage.tool_calls) {
        if (toolCall.type !== "function") continue;

        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        // O servidor MCP executa a rotina de banco de dados e retorna o resultado
        const mcpResult = await mcpClient.callTool({
          name: name,
          arguments: args
        });

        // Devolve o resultado da operacao executada de volta para o contexto da conversa com a inteligencia artificial
        messages.push(aiMessage);
        messages.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(mcpResult.content) });
      }

      // Solicita que a inteligencia artificial formule uma resposta compreensivel em texto baseada nos dados lidos do banco
      const secondResponse = await aiClient.chat.completions.create({ messages, model: MODEL_NAME });
      aiMessage = secondResponse.choices[0].message;
    }

    // Encerra a conexao com o MCP para liberar os recursos do sistema imediatamente
    await transport.close();

    // Salva a resposta final gerada pela IA no banco de dados Supabase e devolve para exibicao no Frontend
    const aiText = aiMessage.content || "Acao realizada com sucesso no banco de dados.";
    await supabase.from('message').insert([{ text: aiText, role: 'assistant', user_id: TEMP_USER_ID }]);

    return { success: true, aiMessage: aiText };

  } catch (error: any) {
    console.error("Erro no servidor:", error);
    return { success: false, error: "Erro ao processar a conversa" };
  }
}

// Funcao responsavel por carregar o historico completo de mensagens na inicializacao da pagina no navegador
export async function fetchChatMessage() {
  try {
    const { data, error } = await supabase
      .from('message')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("Erro no servidor:", error);
    return { success: false, error: "Erro ao buscar as mensagens" };
  }
}