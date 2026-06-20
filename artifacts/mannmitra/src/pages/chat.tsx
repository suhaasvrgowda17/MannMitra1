import { useState, useRef, useEffect } from "react";
import { useListChatMessages, useSendChatMessage, getListChatMessagesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Heart, MessageCircle } from "lucide-react";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "kn", label: "Kannada" },
  { value: "bn", label: "Bengali" },
];

export default function ChatPage() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useListChatMessages({ limit: 50 }, { query: { queryKey: getListChatMessagesQueryKey({ limit: 50 }) } });
  const sendMessage = useSendChatMessage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = () => {
    if (!input.trim() || sendMessage.isPending) return;
    const msg = input.trim();
    setInput("");
    sendMessage.mutate(
      { data: { content: msg, language } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListChatMessagesQueryKey() }) }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-screen">
        {/* Chat header */}
        <div className="border-b border-border px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">MannMitra</h1>
                <p className="text-xs text-muted-foreground italic">A Friend for Every Thought</p>
              </div>
            </div>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-32 h-8 text-xs" data-testid="select-chat-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  <Skeleton className={`h-12 rounded-2xl ${i % 2 === 0 ? "w-64" : "w-48"}`} />
                </div>
              ))}
            </div>
          ) : !messages?.length ? (
            <div className="flex flex-col items-center justify-center h-full text-center pb-10">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-semibold text-foreground text-lg mb-2">Start a conversation</h2>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Share what's on your mind — exam stress, comparison anxiety, family pressure, or just how your day went. MannMitra is here to listen.
              </p>
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                {[
                  "I'm feeling overwhelmed with my syllabus",
                  "My friends are ahead of me in preparation",
                  "I'm worried about disappointing my parents",
                ].map(s => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-xs bg-secondary text-secondary-foreground px-3 py-2 rounded-full hover:bg-secondary/70 transition-colors border border-border"
                    data-testid={`suggestion-${s.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`} data-testid={`message-${msg.id}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                      <Heart className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-card border border-card-border text-foreground rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                    <div className={`text-xs mt-1 ${msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
              {sendMessage.isPending && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                    <Heart className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-card border border-card-border px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-border px-6 py-4 flex-shrink-0">
          <div className="flex gap-3 items-end">
            <Textarea
              placeholder="Share what's on your mind..."
              className="resize-none min-h-[44px] max-h-32 flex-1"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              data-testid="input-chat-message"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sendMessage.isPending}
              size="icon"
              className="flex-shrink-0 h-[44px] w-[44px]"
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </div>
    </AppLayout>
  );
}
