import OpenAI from "openai";

// Configura o cliente da OpenAI utilizando o endpoint do GitHub Models / Azure
export const aiClient = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: "https://models.inference.ai.azure.com",
});

// Define o modelo de inteligência artificial utilizado pelo agente
export const MODEL_NAME = "gpt-4o-mini";