import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, LoaderCircle, Send, X } from "lucide-react";
import { enviarMensajeAlChatbot, type ChatMessageInput } from "../api/chatbot.api";

const MAX_VISIBLE_HISTORY = 6;

interface ChatMessage extends ChatMessageInput {
  id: number;
}

const initialMessage: ChatMessage = {
  id: 0,
  role: "assistant",
  content: "Hola. Soy el asistente de Banco Orbital. Puedo ayudarte a usar el portal y consultar un resumen de tus productos.",
};

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || loading) return;

    const userMessage: ChatMessage = { id: nextId.current++, role: "user", content: message };
    const history = messages
      .filter((item) => item.id !== 0)
      .slice(-MAX_VISIBLE_HISTORY)
      .map(({ role, content }) => ({ role, content }));

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setError(null);
    setLoading(true);

    try {
      const response = await enviarMensajeAlChatbot(message, history);
      setMessages((current) => [
        ...current,
        { id: nextId.current++, role: "assistant", content: response.reply },
      ]);
    } catch {
      setError("No pude responder en este momento. Revisá tu conexión e intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 sm:bottom-7 sm:right-7">
      {open && (
        <section
          aria-label="Chat de Banco Orbital"
          className="flex h-[min(620px,calc(100vh-110px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-primary/30 bg-[#1C0B2E] shadow-2xl shadow-black/40"
        >
          <header className="flex items-center justify-between border-b border-primary/20 bg-gradient-to-r from-[#2D1548] to-[#1C0B2E] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Asistente Orbital</h2>
                <p className="text-xs text-muted-foreground">Ayuda bancaria segura</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
              title="Cerrar chat"
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-[#2D1548] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#0A0118]/35 p-4" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <p
                  className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-5 ${
                    message.role === "user"
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-[#2D1548] text-foreground"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                Preparando respuesta...
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-red-200">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-primary/20 bg-[#1C0B2E] p-3">
            <div className="flex items-end gap-2 rounded-xl border border-primary/20 bg-[#2D1548]/50 p-1.5 focus-within:border-primary/60">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 1200))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Escribí tu consulta..."
                aria-label="Mensaje para el asistente"
                rows={1}
                disabled={loading}
                className="max-h-24 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || !draft.trim()}
                aria-label="Enviar mensaje"
                title="Enviar mensaje"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="px-1 pt-2 text-[10px] text-muted-foreground">No compartas claves ni códigos de seguridad.</p>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Cerrar asistente Orbital" : "Abrir asistente Orbital"}
        title={open ? "Cerrar asistente Orbital" : "Abrir asistente Orbital"}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/40 bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition hover:scale-105 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Bot className="h-6 w-6" aria-hidden="true" />}
      </button>
    </div>
  );
}