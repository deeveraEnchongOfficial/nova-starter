import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Send, Bot, User, Loader2, Trash2, MessageSquare, X, Minus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';
import { toast } from 'sonner';
import { useChatBot, type ChatMessage } from '@/contexts/ChatBotContext';

const SUGGESTIONS = [
    'What can you help me with?',
    'How do I upload files?',
    'Explain the tech stack of this app',
];

export default function ChatWidget() {
    const { isOpen, isMinimized, messages, open, close, toggleMinimize, addMessage, setMessages, clearMessages } = useChatBot();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading, scrollToBottom]);

    const handleSend = useCallback(async (text?: string) => {
        const content = (text ?? input).trim();
        if (!content || loading) return;

        const userMessage: ChatMessage = { role: 'user', content };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const response = await axios.post('/ai-bot/chat', {
                messages: newMessages,
            });

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response.data.message,
            };
            addMessage(assistantMessage);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to get a response. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [input, loading, messages, setMessages, addMessage]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    const handleSuggestion = useCallback((suggestion: string) => {
        handleSend(suggestion);
    }, [handleSend]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    // Floating button when closed
    if (!isOpen) {
        return (
            <button
                onClick={open}
                className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                aria-label="Open AI Assistant"
            >
                <MessageSquare className="size-6" />
                {messages.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        {messages.length}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex w-[calc(100vw-3rem)] max-w-md flex-col rounded-xl border bg-background shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-3">
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="size-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold">Nova Assistant</p>
                        <p className="text-xs text-muted-foreground">AI-powered helper</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={toggleMinimize}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent"
                        aria-label="Minimize"
                    >
                        <Minus className="size-4" />
                    </button>
                    <button
                        onClick={close}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent"
                        aria-label="Close"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            </div>

            {/* Body — hidden when minimized */}
            {!isMinimized && (
                <>
                    {/* Messages */}
                    <div ref={scrollRef} className="h-[400px] max-h-[50vh] overflow-y-auto p-4">
                        {messages.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                                <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
                                    <Bot className="size-7 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold">Nova Assistant</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Ask me anything about the app or get help with your tasks.
                                    </p>
                                </div>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {SUGGESTIONS.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => handleSuggestion(s)}
                                            className="rounded-full border border-input bg-background px-3 py-1.5 text-xs transition-colors hover:bg-accent"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg, idx) => (
                                    <MessageBubble key={idx} message={msg} />
                                ))}
                                {loading && (
                                    <div className="flex gap-2">
                                        <Avatar size="sm">
                                            <AvatarFallback className="bg-primary/10">
                                                <Bot className="size-4 text-primary" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">Thinking...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="border-t p-3">
                        {messages.length > 0 && (
                            <div className="mb-2 flex justify-end">
                                <Button variant="ghost" size="sm" onClick={clearMessages} className="h-7 text-xs">
                                    <Trash2 className="mr-1 size-3" />
                                    Clear
                                </Button>
                            </div>
                        )}
                        <div className="flex items-end gap-2">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                                rows={1}
                                className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                disabled={loading}
                            />
                            <Button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || loading}
                                size="icon"
                                className="size-10 shrink-0"
                            >
                                <Send className="size-4" />
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function MessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
            <Avatar size="sm">
                <AvatarFallback className={isUser ? 'bg-muted' : 'bg-primary/10'}>
                    {isUser ? (
                        <User className="size-4 text-muted-foreground" />
                    ) : (
                        <Bot className="size-4 text-primary" />
                    )}
                </AvatarFallback>
            </Avatar>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
            }`}>
                {isUser ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
}
