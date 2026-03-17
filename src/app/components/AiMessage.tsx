import { Sparkles } from "lucide-react";

interface AiMessageProps {
  content: string;
  timestamp: Date;
}

export function AiMessage({ content, timestamp }: AiMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="flex gap-3 max-w-[80%] flex-row">
        {/* Avatar da IA */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500 to-blue-500">
          <Sparkles className="w-4 h-4 text-white" />
        </div>

        {/* Conteúdo da Mensagem */}
        <div className="flex flex-col gap-2 items-start">
          <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
            <p className="whitespace-pre-wrap">{content}</p>
          </div>

          <span className="text-xs text-gray-400 px-1">
            {timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </div>
  );
}