import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { APP_INFO } from '@/lib/appInfo';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  fallback?: boolean;
}

const GREETING: Message = {
  role: 'assistant',
  content: `Hi! I'm the NYSC Facilities Hub support assistant. Ask me anything about the app — features, your role, how to use a page, or common issues.\n\nIf I can't help, I'll point you to ${APP_INFO.support.email}.`,
};

// Very basic markdown bold: **text** → <strong>text</strong>
function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

export function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      // Send full conversation history so the AI has context
      const conversationHistory = nextMessages
        .slice(1) // skip the static greeting
        .map(m => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke('support-chat', {
        body: { messages: conversationHistory },
      });

      if (error || !data?.reply) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Something went wrong. Please email [${APP_INFO.support.email}](${APP_INFO.support.emailHref}) for help.`,
          fallback: true,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply,
          fallback: !!data.fallback,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I couldn't connect right now. Please email **${APP_INFO.support.email}** for help.`,
        fallback: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 md:bottom-6 left-4 z-50 w-[calc(100vw-2rem)] max-w-sm flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground">
            <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-none">Support Assistant</p>
              <p className="text-xs text-primary-foreground/70 mt-0.5">NYSC Facilities Hub</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-full p-1 hover:bg-primary-foreground/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80 min-h-[200px]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'flex gap-2 items-start',
                  msg.role === 'user' && 'flex-row-reverse'
                )}
              >
                <div className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                  msg.role === 'assistant' ? 'bg-primary/10' : 'bg-muted'
                )}>
                  {msg.role === 'assistant'
                    ? <Bot className="h-3.5 w-3.5 text-primary" />
                    : <User className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <div className={cn(
                  'rounded-2xl px-3 py-2 text-sm leading-relaxed max-w-[85%]',
                  msg.role === 'assistant'
                    ? 'bg-muted text-foreground rounded-tl-sm'
                    : 'bg-primary text-primary-foreground rounded-tr-sm'
                )}>
                  {msg.content.split('\n').map((line, j) => (
                    <span key={j}>
                      {renderMarkdown(line)}
                      {j < msg.content.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                  {msg.fallback && (
                    <a
                      href={APP_INFO.support.emailHref}
                      className="block mt-1 text-xs underline opacity-80 hover:opacity-100"
                    >
                      Email support →
                    </a>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-center">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything…"
              className="text-sm h-9"
              disabled={loading}
            />
            <Button
              size="sm"
              onClick={send}
              disabled={!input.trim() || loading}
              className="h-9 w-9 p-0 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Footer */}
          <div className="px-4 pb-3 text-center">
            <p className="text-[10px] text-muted-foreground">
              Still stuck?{' '}
              <a
                href={APP_INFO.support.emailHref}
                className="underline hover:text-foreground"
              >
                {APP_INFO.support.email}
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'fixed bottom-20 md:bottom-6 left-4 z-50',
          'h-12 w-12 rounded-full shadow-lg transition-all duration-200',
          'flex items-center justify-center',
          'bg-primary text-primary-foreground',
          'hover:scale-110 active:scale-95',
          open && 'hidden'
        )}
        aria-label="Open support chat"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    </>
  );
}
