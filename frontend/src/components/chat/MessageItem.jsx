import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Sparkles, ChevronDown, ChevronRight, BrainCircuit } from 'lucide-react';
import { SqlPreviewCard } from './SqlPreviewCard';

export function MessageItem({ message, onSelectSuggestion }) {
  const isUser = message.role === 'user';
  const [showThoughts, setShowThoughts] = useState(false);

  return (
    <div className={`flex gap-3 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}>
      
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-4 h-4" />
        </div>
      )}

      {/* Message Bubble Container */}
      <div className={`max-w-[85%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Thought / Reasoning Block (Segregated from main content) */}
        {!isUser && message.thoughts && message.thoughts.length > 0 && (
          <div className="rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden text-[11px]">
            <button
              onClick={() => setShowThoughts(!showThoughts)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5 text-purple-500" />
                <span className="font-medium">
                  {message.isStreaming ? 'Reasoning step-by-step...' : 'Analysis Reasoning Steps'}
                </span>
                {message.isStreaming && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping ml-1" />
                )}
              </div>
              {showThoughts ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {showThoughts && (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 space-y-1 font-mono text-[10px]">
                {message.thoughts.map((t, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-purple-500">•</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content Bubble */}
        <div
          className={`rounded-xl p-3.5 shadow-sm leading-relaxed ${
            isUser
              ? 'bg-blue-600 text-white font-medium ml-auto'
              : 'bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-xs dark:prose-invert max-w-none [&>p]:mb-2.5 [&>p:last-child]:mb-0 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:text-zinc-950 dark:[&>h3]:text-zinc-100 [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:mb-2.5 [&>table]:w-full [&>table]:my-2 [&>table]:border-collapse [&>table_th]:border-b [&>table_th]:border-zinc-200 dark:[&>table_th]:border-zinc-800 [&>table_th]:p-1.5 [&>table_td]:p-1.5 [&>table_td]:border-b [&>table_td]:border-zinc-100 dark:[&>table_td]:border-zinc-850">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content || (message.isStreaming ? 'Thinking...' : '')}
              </ReactMarkdown>
            </div>
          )}

          {/* Embedded SQL query if present */}
          {!isUser && message.sql && (
            <SqlPreviewCard sql={message.sql} />
          )}
        </div>

        {/* Follow-up Interactive Suggestion Chips */}
        {!isUser && message.suggestions && message.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {message.suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => onSelectSuggestion && onSelectSuggestion(sug)}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span>{sug}</span>
              </button>
            ))}
          </div>
        )}

      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}

    </div>
  );
}
