import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Trash2, Bot, CornerDownLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MessageItem } from './MessageItem';
import { streamChatResponse } from '../../services/chatStream';

export function ChatPanel() {
  const { isChatOpen, setIsChatOpen, gcpStatus } = useApp();
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your **Gemini Data Intelligence Assistant** connected to Google Cloud BigQuery (\`tribal-datum-507019-m0.uploadeddataset.packages\`).\n\nYou can ask me questions about your package types, shipping volumes, total revenues, or ask for custom visualizations!`,
      thoughts: [],
      suggestions: [
        'How many Ground Advantage packages were there?',
        'What is the total revenue by package type?',
        'Show revenue dot plot distribution',
      ],
    },
  ]);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Adjust textarea height dynamically
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleSendMessage = async (textToSend = null) => {
    const query = (textToSend || input).trim();
    if (!query || isStreaming) return;

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;

    const newMessages = [
      ...messages,
      { id: userMessageId, role: 'user', content: query },
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        thoughts: [],
        sql: null,
        suggestions: [],
        isStreaming: true,
      },
    ];

    setMessages(newMessages);
    setIsStreaming(true);

    const historyForApi = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.content }));

    await streamChatResponse({
      message: query,
      history: historyForApi,
      onThought: (thoughtText) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, thoughts: [...(msg.thoughts || []), thoughtText] }
              : msg
          )
        );
      },
      onContent: (contentChunk) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: (msg.content || '') + contentChunk }
              : msg
          )
        );
      },
      onSql: (sql) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, sql } : msg
          )
        );
      },
      onSuggestions: (suggestions) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, suggestions } : msg
          )
        );
      },
      onDone: () => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
          )
        );
        setIsStreaming(false);
      },
      onError: (err) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content:
                    (msg.content || '') +
                    `\n\n*(Error connecting to AI service: ${err.message})*`,
                  isStreaming: false,
                }
              : msg
          )
        );
        setIsStreaming(false);
      },
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Chat session reset. Connected to \`tribal-datum-507019-m0.uploadeddataset.packages\`. What would you like to analyze?`,
        thoughts: [],
        suggestions: [
          'What about the average price for each type of package?',
          'Show standard deviation of revenue',
          'How many Ground Advantage packages were there?',
        ],
      },
    ]);
  };

  if (!isChatOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[460px] bg-white dark:bg-[#0c0c0f] border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col justify-between transition-all">
      
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
              Gemini Data Analyst
            </h3>
            <span className="text-[10px] text-zinc-400 font-mono">
              Live SSE Reasoning Stream
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            title="Clear conversation"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsChatOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            onSelectSuggestion={(sug) => handleSendMessage(sug)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your data, generate SQL, or run ML models..."
            className="w-full resize-none bg-transparent p-3 pr-12 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none max-h-32"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isStreaming}
            className="absolute right-2.5 bottom-2.5 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-zinc-400">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span className="font-mono">BigQuery Analytics Agent</span>
        </div>
      </div>

    </div>
  );
}
