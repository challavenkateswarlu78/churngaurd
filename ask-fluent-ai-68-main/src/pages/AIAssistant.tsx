import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Database, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { askQuestion } from "@/lib/api";
import { motion } from "framer-motion";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
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

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendQuestion = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: question.trim() };
    const loadingMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "", isLoading: true };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await askQuestion(question.trim());
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? { ...m, content: data.answer, resultCount: data.resultCount, isLoading: false }
            : m
        )
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? { ...m, content: e instanceof Error ? `Sorry: ${e.message}` : "An error occurred.", isLoading: false }
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
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center gap-8">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-3">
              <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-primary/10 glow-primary">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">What would you like to know?</h2>
              <p className="text-muted-foreground text-sm max-w-md">
                Ask any question about your customer and telecom data.
              </p>
            </motion.div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  onClick={() => sendQuestion(s)}
                  className="px-3 py-2 text-xs rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border/50 text-foreground rounded-bl-md"
                  }`}>
                  {m.isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing your data…</span>
                    </div>
                  ) : m.content.startsWith("Sorry") ? (
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
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border/50 px-4 py-4 glass">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <Textarea
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
            className="shrink-0 h-11 w-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 glow-primary disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
