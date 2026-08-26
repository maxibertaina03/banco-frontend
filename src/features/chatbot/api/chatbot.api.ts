import { request } from "../../../lib/api/client";

export interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

interface ChatbotResponse {
  reply: string;
}

export function enviarMensajeAlChatbot(message: string, history: ChatMessageInput[]) {
  return request<ChatbotResponse>("/chatbot/message", {
    method: "POST",
    body: JSON.stringify({ message, history }),
  });
}