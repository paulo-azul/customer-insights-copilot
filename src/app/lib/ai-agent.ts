import OpenAI from "openai";

// Configura o cliente da OpenAI utilizando o endpoint do GitHub Models / Azure
export const aiClient = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: "https://models.inference.ai.azure.com",
});

// Define o modelo de inteligência artificial utilizado pelo agente
export const MODEL_NAME = "gpt-4o-mini";

// Lista de ferramentas (functions) que a IA pode decidir executar autonomamente
export const AI_TOOLS: any[] = [
  {
    type: "function",
    function: {
      name: "list_clients",
      description: "Lista todos os clientes cadastrados na base de dados.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_client_by_id",
      description: "Busca os detalhes de um cliente específico pelo ID.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "O UUID do cliente" }
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_client",
      description: "Cadastra um novo cliente no sistema.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome do cliente" },
          email: { type: "string", description: "Email do cliente" },
          enterprise: { type: "string", description: "Nome da empresa" },
          telephone: { type: "string", description: "Telefone" },
        },
        required: ["name", "email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_client",
      description: "Atualiza os dados de um cliente existente.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "O UUID do cliente que será editado" },
          updates: {
            type: "object",
            description: "Campos a serem atualizados",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
              enterprise: { type: "string" },
              telephone: { type: "string" }
            }
          }
        },
        required: ["id", "updates"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_client",
      description: "Remove um cliente permanentemente do sistema.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "O UUID do cliente a ser removido" }
        },
        required: ["id"],
      },
    },
  }
];