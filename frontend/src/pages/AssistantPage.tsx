import { useState, useRef, useEffect } from "react";
import { Send, Mic, Lightbulb } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/common/Button";
import { useApp } from "../context/AppContext";
import { formatSoles } from "../utils/currency";

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
  const { summary, products, debts } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "assistant",
      text: "Hola, soy tu asistente. Pregúntame cómo va tu negocio hoy.",
    },
  ]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const buildAnswer = (q: string): string => {
    if (q.includes("cómo nos fue") || q.includes("Cómo nos fue")) {
      const bajos = products.filter((p) => p.estado === "stock_bajo");
      const line = bajos.length
        ? `La ${bajos[0].nombre.toLowerCase()} está por debajo del stock mínimo.`
        : "Todos los productos tienen stock suficiente.";
      return `Hoy vendiste ${formatSoles(summary.ventasTotales)} en total.\n\nRecibiste ${formatSoles(summary.dineroRecibido)} y quedaron ${formatSoles(summary.montoFiado)} pendientes de cobro.\n\nTus gastos fueron ${formatSoles(summary.gastos)}.\n\n${line}`;
    }
    if (q.includes("quién") || q.includes("Quién") || q.includes("deben")) {
      const conDeuda = debts.filter((d) => d.saldo > 0);
      if (conDeuda.length === 0) return "Nadie te debe por ahora. ¡Buen trabajo!";
      const lista = conDeuda
        .map((d) => `${d.nombre}: ${formatSoles(d.saldo)}`)
        .join("\n");
      return `Tienes ${conDeuda.length} cliente(s) con deuda:\n\n${lista}\n\nTotal pendiente: ${formatSoles(conDeuda.reduce((s, d) => s + d.saldo, 0))}`;
    }
    if (q.includes("stock") || q.includes("poco")) {
      const bajos = products.filter((p) => p.estado === "stock_bajo");
      const agotados = products.filter((p) => p.estado === "agotado");
      if (bajos.length === 0 && agotados.length === 0) {
        return "Todos tus productos tienen stock suficiente.";
      }
      const parts: string[] = [];
      if (bajos.length) parts.push(`Stock bajo: ${bajos.map((p) => p.nombre).join(", ")}.`);
      if (agotados.length) parts.push(`Agotados: ${agotados.map((p) => p.nombre).join(", ")}.`);
      return parts.join("\n\n");
    }
    if (q.includes("efectivo")) {
      return `Deberías tener ${formatSoles(summary.efectivoEsperado)} en efectivo en caja.`;
    }
    return "Aún no tengo una respuesta para esa pregunta. Prueba con una de las preguntas sugeridas.";
  };

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: Date.now(), role: "user", text };
    const answer = buildAnswer(text);
    const botMsg: ChatMessage = {
      id: Date.now() + 1,
      role: "assistant",
      text: answer,
    };
    setMessages((m) => [...m, userMsg, botMsg]);
    setInput("");
  };

  const toggleMic = () => {
    setRecording((r) => !r);
    if (!recording) setTimeout(() => setRecording(false), 1800);
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
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {quickQuestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              className="shrink-0 rounded-full bg-surface-elevated border border-line px-3 py-2 text-xs font-medium text-ink-soft hover:bg-primary-50 hover:border-primary-300 min-h-[36px]"
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
            className="flex-1 rounded-full border border-line-strong bg-surface-elevated px-4 py-3 text-base text-ink focus:border-primary-500 outline-none"
          />
          <Button
            size="md"
            className="rounded-full !px-4"
            onClick={() => send(input)}
            disabled={!input.trim()}
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
