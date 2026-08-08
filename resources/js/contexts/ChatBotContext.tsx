import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatBotContextValue {
    isOpen: boolean;
    isMinimized: boolean;
    messages: ChatMessage[];
    open: () => void;
    close: () => void;
    toggle: () => void;
    toggleMinimize: () => void;
    addMessage: (message: ChatMessage) => void;
    setMessages: (messages: ChatMessage[]) => void;
    clearMessages: () => void;
}

const ChatBotContext = createContext<ChatBotContextValue | null>(null);

export function useChatBot() {
    const ctx = useContext(ChatBotContext);
    if (!ctx) throw new Error('useChatBot must be used within ChatBotProvider');
    return ctx;
}

export function ChatBotProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessagesState] = useState<ChatMessage[]>([]);

    const open = useCallback(() => {
        setIsOpen(true);
        setIsMinimized(false);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    const toggle = useCallback(() => {
        setIsOpen((prev) => {
            if (!prev) {
                setIsMinimized(false);
                return true;
            }
            return false;
        });
    }, []);

    const toggleMinimize = useCallback(() => {
        setIsMinimized((prev) => !prev);
    }, []);

    const addMessage = useCallback((message: ChatMessage) => {
        setMessagesState((prev) => [...prev, message]);
    }, []);

    const setMessages = useCallback((msgs: ChatMessage[]) => {
        setMessagesState(msgs);
    }, []);

    const clearMessages = useCallback(() => {
        setMessagesState([]);
    }, []);

    return (
        <ChatBotContext.Provider
            value={{
                isOpen,
                isMinimized,
                messages,
                open,
                close,
                toggle,
                toggleMinimize,
                addMessage,
                setMessages,
                clearMessages,
            }}
        >
            {children}
        </ChatBotContext.Provider>
    );
}
