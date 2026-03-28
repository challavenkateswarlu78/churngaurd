import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Database, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  querySpec?: any;
  resultCount?: number;
  isLoading?: boolean;
};

const SUGGESTIONS = [
  "How many customers have churned?",
  "Show me top 5 customers by revenue",
  "Which plan type has the most customers?",
  "What's the average churn probability for SMB tier?",
  "List customers with high churn risk on monthly billing",
];

export default function Index() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendQuestion = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: question.trim(),
    };

    const loadingMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nl-query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ question: question.trim() }),
        }
      );

      if (resp.status === 429) {
        toast.error("Rate limited — please wait a moment and try again.");
        throw new Error("Rate limited");
      }
      if (resp.status === 402) {
        toast.error("AI credits exhausted. Please add funds.");
        throw new Error("Credits exhausted");
      }

      const data = await resp.json();

      if (data.error) throw new Error(data.error);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? {
                ...m,
                content: data.answer,
                querySpec: data.querySpec,
                resultCount: data.resultCount,
                isLoading: false,
              }
            : m
        )
      );
    } catch (e) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? {
                ...m,
                content:
                  e instanceof Error
                    ? `Sorry, something went wrong: ${e.message}`
                    : "An unexpected error occurred.",
                isLoading: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuestion(input);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-border/50 glass">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 glow-primary">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            AI Data <span className="text-gradient">Assistant</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Ask questions about your data in plain English
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <Database className="w-3.5 h-3.5" />
          <span>Connected</span>
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center gap-8">
            <div className="space-y-3">
              <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-primary/10 glow-primary">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground">
                What would you like to know?
              </h2>
              <p className="text-muted-foreground text-sm max-w-md">
                Ask any question about your customer and telecom data. I'll
                query the database and explain the results.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendQuestion(s)}
                  className="px-3 py-2 text-xs rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border/50 text-foreground rounded-bl-md"
                  }`}
                >
                  {m.isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing your data…</span>
                    </div>
                  ) : m.content.startsWith("Sorry,") ? (
                    <div className="flex items-start gap-2 text-destructive">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{m.content}</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  )}
                  {m.resultCount !== undefined && !m.isLoading && (
                    <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Database className="w-3 h-3" />
                      <span>{m.resultCount} records analyzed</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border/50 px-4 py-4 glass">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your data…"
            className="min-h-[44px] max-h-[120px] resize-none bg-secondary/50 border-border/60 focus-visible:ring-primary/50 text-sm"
            rows={1}
          />
          <Button
            size="icon"
            onClick={() => sendQuestion(input)}
            disabled={!input.trim() || isLoading}
            className="shrink-0 h-11 w-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 glow-primary disabled:opacity-40 disabled:shadow-none"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
