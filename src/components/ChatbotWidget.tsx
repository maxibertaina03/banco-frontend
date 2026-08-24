import { Bot, Loader2, Send, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { requestAbsolute } from "../lib/api/client";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface ChatResponse {
  reply: string;
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isSending) return;

    const userMessage: ChatMessage = { role: "user", text: trimmedMessage };
    setMessages((current) => [...current, userMessage]);
    setMessage("");
    setError(null);
    setIsSending(true);

    try {
      const response = await requestAbsolute<ChatResponse>("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: trimmedMessage,
          history: messages,
        }),
      });

      setMessages((current) => [...current, { role: "assistant", text: response.reply }]);
    } catch {
      setError("No pude responder ahora. Intentá nuevamente.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
      {isOpen && (
        <section
          aria-label="Chat de Banco Orbital"
          className="mb-4 flex h-[min(32rem,calc(100vh-7rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-2xl shadow-black/40"
        >
          <header className="flex items-center justify-between border-b border-primary/20 bg-secondary/70 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Bot className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-card-foreground">Asistente Orbital</h2>
                <p className="text-xs text-muted-foreground">Consultas sobre tu cuenta</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar chatbot"
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-primary/15 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-background/45 p-4">
            {messages.length === 0 && (
              <div className="rounded-xl border border-primary/15 bg-secondary/45 p-3 text-sm text-muted-foreground">
                Hola. Puedo ayudarte a consultar la información disponible de tu perfil.
              </div>
            )}

            {messages.map((chatMessage, index) => (
              <div
                key={`${chatMessage.role}-${index}`}
                className={`max-w-[88%] rounded-xl px-3 py-2 text-sm ${
                  chatMessage.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "border border-primary/15 bg-secondary/60 text-card-foreground"
                }`}
              >
                {chatMessage.text}
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
                Pensando...
              </div>
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-primary/20 bg-card p-3">
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-input-background/60 p-1.5 focus-within:ring-2 focus-within:ring-ring/50">
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Escribí tu consulta..."
                aria-label="Mensaje para el chatbot"
                disabled={isSending}
                className="min-w-0 flex-1 bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
              />
              <button
                type="submit"
                aria-label="Enviar mensaje"
                disabled={!message.trim() || isSending}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="size-4" aria-hidden="true" />
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? "Cerrar chatbot" : "Abrir chatbot"}
        aria-expanded={isOpen}
        className="ml-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-105 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
      >
        {isOpen ? <X className="size-6" aria-hidden="true" /> : <Bot className="size-7" aria-hidden="true" />}
      </button>
    </div>
  );
}