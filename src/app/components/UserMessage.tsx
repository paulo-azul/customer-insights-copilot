import { FileText } from "lucide-react";

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface UserMessageProps {
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
}

export function UserMessage({ content, timestamp, attachments }: UserMessageProps) {
  return (
    /* justify-end empurra todo o bloco para a direita */
    <div className="flex justify-end">
      <div className="flex gap-3 max-w-[80%] flex-row-reverse">

        {/* Avatar do Usuário */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-700 dark:bg-gray-600">
          <span className="text-white text-sm">U</span>
        </div>

        {/* Container de Conteúdo */}
        <div className="flex flex-col gap-2 items-end">

          {/* Renderização Condicional: Anexos (Arquivos e Imagens) */}
          {attachments && attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end">
              {attachments.map((file) => (
                <div key={file.id} className="rounded-lg overflow-hidden border border-gray-300">
                  {file.type.startsWith("image/") ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="max-w-[200px] max-h-[200px] object-cover"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 font-medium truncate max-w-[150px]">
                        {file.name}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Renderização Condicional: Texto (necessário pois o usuário pode enviar só uma imagem sem texto) */}
          {content && (
            /* bg-blue-600 text-white dá a identidade visual da mensagem do usuário */
            <div className="px-4 py-3 rounded-2xl bg-blue-600 text-white">
              <p className="whitespace-pre-wrap">{content}</p>
            </div>
          )}

          {/* Timestamp */}
          <span className="text-xs text-gray-400 px-1">
            {timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </div>
  );
}