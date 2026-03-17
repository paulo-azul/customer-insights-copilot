"use server";

import { supabaseAdmin as supabase } from "../lib/supabase";
import { aiClient, AI_TOOLS, MODEL_NAME } from "../lib/ai-agent";
import * as tools from "./client-tools";
import PDFParser from "pdf2json";

const TEMP_USER_ID = "00000000-0000-0000-0000-000000000000";

export async function processChatMessage(content: string, role: string, attachments: any[] = []) {
  try {
    // Salva a mensagem enviada pelo usuario no banco de dados
    await supabase.from('message').insert([{ text: content, role: 'user', archive: attachments, user_id: TEMP_USER_ID }]);

    // Busca o historico de mensagens para dar contexto a IA
    const { data: history } = await supabase
      .from('message')
      .select('role, text')
      .order('created_at', { ascending: false })
      .limit(15);

    // Prepara o conteudo do usuario suportando texto e imagens simultaneamente
    const userContent: any[] = [{ type: "text", text: content }];

    // Verifica se existem anexos e os processa corretamente
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        if (file.url) {

          // Verifica se o arquivo e um PDF checando a extensao na URL ou no nome
          const isPdf = file.url.toLowerCase().includes('.pdf') || (file.name && file.name.toLowerCase().endsWith('.pdf'));

          if (isPdf) {
            try {
              // Faz o download do PDF a partir da URL publica do banco
              const pdfResponse = await fetch(file.url);
              const arrayBuffer = await pdfResponse.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              // Funcao auxiliar para ler o PDF usando a biblioteca pdf2json
              const extractTextFromPDF = (pdfBuffer: Buffer): Promise<string> => {
                return new Promise((resolve, reject) => {
                  const pdfParser = new PDFParser(null, true);

                  pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
                  pdfParser.on("pdfParser_dataReady", () => {
                    resolve(pdfParser.getRawTextContent());
                  });

                  pdfParser.parseBuffer(pdfBuffer);
                });
              };

              // Aguarda a extracao do texto do arquivo PDF
              const pdfText = await extractTextFromPDF(buffer);

              // Adiciona o texto extraido como contexto para a IA ler
              userContent.push({
                type: "text",
                text: `[Conteudo extraido do documento PDF '${file.name || 'documento'}':\n\n${pdfText}\n\nFim do documento]`
              });

            } catch (pdfError) {
              console.error("Erro ao extrair texto do PDF:", pdfError);

              // Informa a IA caso a leitura do arquivo tenha falhado
              userContent.push({
                type: "text",
                text: `[Aviso do Sistema: Nao foi possivel ler o conteudo do arquivo PDF anexado.]`
              });
            }
          } else {
            // Lista de extensoes de imagem permitidas pela OpenAI
            const validImageTypes = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
            const fileUrlLower = file.url.toLowerCase();

            // Verifica se a URL do arquivo termina com alguma das extensoes suportadas
            const isSupportedImage = validImageTypes.some(ext => fileUrlLower.includes(ext));

            if (isSupportedImage) {
              userContent.push({
                type: "image_url",
                image_url: { url: file.url }
              });
            } else {
              // Informa a IA caso o formato do arquivo visual nao seja suportado (ex: SVG)
              userContent.push({
                type: "text",
                text: `[Aviso do Sistema: O usuario anexou um arquivo '${file.name || 'desconhecido'}'. Formato nao suportado para leitura visual. Aceitamos apenas JPG, PNG, WEBP, GIF e PDF.]`
              });
            }
          }
        }
      }
    }

    // Prepara a lista de mensagens no formato que a OpenAI exige. A regra de sempre responder foi adicionada ao final.
    const messages: any[] = [
      { role: "system", content: `Voce e o Customer Insights Copilot. Gerencie clientes com precisao. ID do usuario: ${TEMP_USER_ID}. REGRA IMPORTANTE: Sempre responda de forma clara ao usuario apos executar uma ferramenta para confirmar que a tarefa foi feita.` },
      ...(history?.reverse().map(m => ({ role: m.role, content: m.text })) || []),
      { role: "user", content: userContent }
    ];

    // Faz a primeira chamada para a IA decidir o que fazer
    let response = await aiClient.chat.completions.create({
      messages,
      model: MODEL_NAME,
      tools: AI_TOOLS,
    });

    let aiMessage = response.choices[0].message;

    // Verifica se a IA decidiu usar alguma ferramenta
    if (aiMessage.tool_calls) {
      for (const toolCall of aiMessage.tool_calls) {

        // Verificacao de seguranca para o TypeScript nao dar erro
        if (toolCall.type !== "function") continue;

        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        let result;

        // Mapeia o nome da ferramenta escolhida pela IA para a funcao real do sistema
        if (name === "list_clients") result = await tools.listClientsTool();
        if (name === "get_client_by_id") result = await tools.getClientByIdTool(args.id);
        if (name === "create_client") result = await tools.createClientTool({ ...args, user_id: TEMP_USER_ID });
        if (name === "update_client") result = await tools.updateClientTool(args.id, args.updates);
        if (name === "delete_client") result = await tools.deleteClientTool(args.id);

        // Adiciona a chamada da ferramenta e o resultado na lista de mensagens
        messages.push(aiMessage);
        messages.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(result) });
      }

      // Faz uma segunda chamada para a IA formular a resposta final baseada no resultado
      const secondResponse = await aiClient.chat.completions.create({ messages, model: MODEL_NAME });
      aiMessage = secondResponse.choices[0].message;
    }

    // Define o texto final ou uma resposta padrao conversacional caso a IA falhe em gerar texto
    const aiText = aiMessage.content || "Acao realizada com sucesso no banco de dados. Como posso ajudar agora?";

    // Salva a resposta da IA no banco de dados
    await supabase.from('message').insert([{ text: aiText, role: 'assistant', user_id: TEMP_USER_ID }]);

    return { success: true, aiMessage: aiText };

  } catch (error: any) {
    console.error("Erro no servidor:", error);
    return { success: false, error: "Erro ao processar a conversa" };
  }
}

// Funcao responsavel por carregar as mensagens quando a pagina for atualizada
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