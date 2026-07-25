import { useState, useRef, useEffect } from "react";
import { Send, Mic, Lightbulb } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/common/Button";
import { consultarNegocio } from "../services/api";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
}

const quickQuestions = [
  "¿Cómo nos fue hoy?",
  "¿Quiénes nos deben?",
  "¿Qué productos tienen poco stock?",
  "¿Cuánto debería haber en efectivo?",
];

export function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "assistant",
      text: "Hola, soy tu asistente. Pregúntame cómo va tu negocio hoy.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    const userMsg: ChatMessage = { id: Date.now(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);
    setError(null);
    try {
      const { respuesta } = await consultarNegocio(text);
      const botMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: respuesta,
      };
      setMessages((m) => [...m, botMsg]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo obtener una respuesta.",
      );
    } finally {
      setSending(false);
    }
  };

  const toggleMic = () => {
    setRecording((r) => !r);
    if (!recording) {
      setTimeout(() => setRecording(false), 1800);
    }
  };

  return (
    <PageContainer className="flex flex-col">
      <div className="flex flex-col h-[calc(100vh-220px)]">
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-ink">Asistente</h1>
          <p className="text-sm text-ink-soft">Pregúntale a tu negocio</p>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-3 no-scrollbar"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary-600 text-white rounded-br-md"
                    : "bg-surface-elevated border border-line text-ink rounded-bl-md"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-surface-elevated border border-line text-ink-soft rounded-bl-md px-4 py-3 text-sm">
                <span className="inline-flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-ink-muted animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <span className="w-2 h-2 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: "0.3s" }} />
                </span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {quickQuestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              disabled={sending}
              className="shrink-0 rounded-full bg-surface-elevated border border-line px-3 py-2 text-xs font-medium text-ink-soft hover:bg-primary-50 hover:border-primary-300 min-h-[36px] disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMic}
            className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              recording
                ? "bg-error-500 text-white animate-pulse-soft"
                : "bg-surface-elevated border border-line-strong text-primary-700"
            }`}
            aria-label={recording ? "Detener grabación" : "Grabar con el micrófono"}
          >
            <Mic size={22} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Escribe tu pregunta..."
            aria-label="Escribe tu pregunta"
            disabled={sending}
            className="flex-1 rounded-full border border-line-strong bg-surface-elevated px-4 py-3 text-base text-ink focus:border-primary-500 outline-none disabled:opacity-50"
          />
          <Button
            size="md"
            className="rounded-full !px-4"
            onClick={() => send(input)}
            disabled={!input.trim() || sending}
            aria-label="Enviar pregunta"
          >
            <Send size={20} />
          </Button>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl bg-secondary-500/10 border border-secondary-400/30 p-3">
          <Lightbulb size={18} className="text-secondary-600 mt-0.5 shrink-0" />
          <p className="text-sm text-ink-soft leading-snug">
            Recuerda: una venta fiada cuenta como venta, pero todavía no es
            dinero disponible.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
