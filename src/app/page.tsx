"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, X, FileText, Sparkles, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Importação das Server Actions para processamento de mensagens e armazenamento
import { processChatMessage, fetchChatMessage } from "./actions/chat";
import { StoreFile } from "./actions/storage";
import { UserMessage } from "./components/UserMessage";
import { AiMessage } from "./components/AiMessage";
import { useTheme } from "./context/theme-context";

// Interfaces para tipagem rigorosa de anexos e mensagens
interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  file?: File;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  timestamp: Date;
}

export default function ChatPage() {
  const router = useRouter();
  const { theme } = useTheme();

  // Estados locais para controle de histórico, input de texto e arquivos anexados
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Referências para manipulação de DOM (scroll automático e inputs escondidos)
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Constantes de Limite para validação de tamanho de arquivos (20MB)
  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  const MAX_TOTAL_SIZE = 20 * 1024 * 1024;

  // Função para garantir que a visualização acompanhe sempre a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Carrega o histórico de mensagens do banco de dados ao montar o componente
  useEffect(() => {
    const loadHistory = async () => {
      const result = await fetchChatMessage();
      if (result.success && result.data) {
        const history: Message[] = result.data.map((msg: any) => ({
          id: msg.message_id || Math.random().toString(),
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.text || "",
          attachments: msg.archive || [],
          timestamp: new Date(msg.created_at)
        }));
        setMessages(history);
      }
    };
    loadHistory();
  }, []);

  // Gerencia a seleção de arquivos e aplica validações de tamanho individual
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];

    Array.from(files).forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`O arquivo "${file.name}" excede 20MB.`);
        return;
      }

      newAttachments.push({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        file: file
      });
    });

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Remove anexos da lista e libera memória das URLs temporárias (blob)
  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find(a => a.id === id);
      if (target?.url.startsWith("blob:")) URL.revokeObjectURL(target.url);
      return prev.filter(a => a.id !== id);
    });
  };

  // Fluxo principal de envio: Valida tamanho total, faz upload e processa com a IA
  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;

    // Validação de segurança para o limite de payload acumulado
    const totalSize = attachments.reduce((acc, curr) => acc + curr.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      toast.error(`O tamanho total dos anexos (${(totalSize / 1024 / 1024).toFixed(1)}MB) excede o limite de 20MB.`);
      return;
    }

    const currentInput = input;
    const currentAttachments = [...attachments];

    // Atualização da interface
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: currentInput,
      attachments: currentAttachments,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachments([]);
    setIsTyping(true);

    try {
      // Envia cada arquivo individualmente para o storage usando FormData
      const uploadedFiles = await Promise.all(
        currentAttachments.map(async (attr) => {
          if (!attr.file) return null;

          const formData = new FormData();
          formData.append('file', attr.file);

          const res = await StoreFile(formData);

          if (res.success) {
            return {
              id: res.id,
              name: attr.name,
              url: res.url,
              type: attr.type,
              size: attr.size
            };
          } else {
            toast.error(`Erro ao subir ${attr.name}: ${res.error}`);
            return null;
          }
        })
      );

      const validAttachments = uploadedFiles.filter(f => f !== null);

      // Envia a mensagem e as referências dos arquivos para processamento da IA
      const result = await processChatMessage(currentInput, "user", validAttachments);

      if (result.success) {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.aiMessage ?? "IA processou sua solicitação.",
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error("Erro no fluxo de envio:", error);
      toast.error("Ocorreu um erro ao enviar sua mensagem.");
    } finally {
      setIsTyping(false);
    }
  };

  // Atalho de teclado: permite enviar com Enter e saltar linha com Shift+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Header: Identificação do Workspace e acesso às configurações */}
      <header className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-white">Customer Insights</h1>
            <p className="text-xs text-gray-500">Workspace Ativo</p>
          </div>
        </div>
        <button onClick={() => router.push("/settings")} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <Settings className="w-5 h-5 text-gray-500" />
        </button>
      </header>

      {/* Main: Renderização condicional das mensagens do usuário e da IA */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg) => (
            msg.role === "user" ? (
              <UserMessage key={msg.id} content={msg.content} timestamp={msg.timestamp} attachments={msg.attachments} />
            ) : (
              <AiMessage key={msg.id} content={msg.content} timestamp={msg.timestamp} />
            )
          ))}
          {/* Indicador visual de processamento da IA */}
          {isTyping && (
             <div className="flex gap-2 items-center text-sm text-gray-400">
               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
               Analisando dados...
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Footer: Área de input e preview de arquivos selecionados */}
      <footer className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto">
          {/* Lista de previews antes do envio definitivo */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map(attr => (
                <div key={attr.id} className="relative group bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-lg flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium truncate max-w-[120px] dark:text-gray-200">{attr.name}</span>
                    <span className="text-[9px] text-gray-400">{(attr.size / 1024).toFixed(0)} KB</span>
                  </div>
                  <button onClick={() => removeAttachment(attr.id)} className="p-1 hover:bg-red-100 rounded-full text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-2 border border-gray-200 dark:border-gray-700 shadow-sm focus-within:border-blue-400 transition-all">
            {/* Input de arquivo oculto acionado pelo botão de clip */}
            <input
               type="file"
               ref={fileInputRef}
               onChange={handleFileSelect}
               multiple
               className="hidden"
               accept="image/*,application/pdf,text/*"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem ou anexe arquivos..."
              className="flex-1 bg-transparent outline-none p-2 resize-none text-gray-700 dark:text-gray-200"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() && attachments.length === 0}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}