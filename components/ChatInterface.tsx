import React, { useState, useRef, useEffect } from 'react';
import { Send, Search, User, Sparkles, Loader2, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage } from '../types';
import { chatWithDocument, checkLegalPrecedence } from '../services/geminiService';

interface ChatInterfaceProps {
  docContext: string;
  onReferenceClick?: (location: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ docContext, onReferenceClick }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'I\'ve analyzed this document. Feel free to ask about specific clauses, rights, or anything confusing.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize suggested questions from the document analysis context
  useEffect(() => {
    try {
      if (docContext) {
        const analysis = JSON.parse(docContext);
        
        let extractedQuestions: string[] = [];

        // 1. Extract from Red Flags (Priority: HIGH > MEDIUM > LOW)
        if (analysis.redFlags && Array.isArray(analysis.redFlags)) {
          const highFlags = analysis.redFlags.filter((f: any) => f.severity === 'HIGH');
          const mediumFlags = analysis.redFlags.filter((f: any) => f.severity === 'MEDIUM');
          const lowFlags = analysis.redFlags.filter((f: any) => f.severity === 'LOW');
          
          // Helper to flatten questions array
          const getQs = (flags: any[]) => flags.flatMap((f: any) => f.questions || []);
          
          extractedQuestions = [
            ...getQs(highFlags),
            ...getQs(mediumFlags),
            ...getQs(lowFlags)
          ];
        }

        // 2. Extract from Sections of Concern if we need more variety
        if (extractedQuestions.length < 5 && analysis.sections && Array.isArray(analysis.sections)) {
           const concerningSections = analysis.sections.filter((s: any) => s.status === 'CONCERN');
           concerningSections.forEach((s: any) => {
             if (s.title) extractedQuestions.push(`What are the concerns in the "${s.title}" section?`);
           });
        }
        
        // Deduplicate
        const uniqueQuestions = Array.from(new Set(extractedQuestions));
        
        // 3. Define Robust Defaults
        const defaults = [
          "What are the termination conditions?",
          "Are there any hidden fees?",
          "Is this standard for this type of document?",
          "Explain the liability clause.",
          "What happens if I breach this contract?"
        ];
        
        // Fill with defaults if we don't have enough specific questions
        for (const d of defaults) {
          if (uniqueQuestions.length >= 8) break;
          if (!uniqueQuestions.includes(d)) {
            uniqueQuestions.push(d);
          }
        }
        
        setSuggestedQuestions(uniqueQuestions.slice(0, 8));
      }
    } catch (e) {
      // Fallback defaults in case of parse error
      setSuggestedQuestions([
        "What are the termination conditions?",
        "Are there any hidden fees?",
        "Explain the liability clause.",
        "Is this standard for this type of document?"
      ]);
    }
  }, [docContext]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (text: string = inputValue) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const responseText = await chatWithDocument(
        messages.map(m => ({ role: m.role, text: m.text })),
        userMsg.text,
        docContext
      );
      
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "I couldn't generate a response."
      };
      
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I encountered an error answering that. Please try again."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchCheck = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: `Check legal precedence: ${inputValue}`
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const { text, sources } = await checkLegalPrecedence(userMsg.text);
      
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text || "No results found.",
        sources: sources
      };
      
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
       const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Search failed."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuestionClick = (q: string) => {
    handleSend(q);
  };

  // Custom renderer for Markdown elements
  const renderers = {
    a: ({ node, href, children, ...props }: any) => {
      const isCitation = href?.startsWith('#');
      
      return (
        <a
          href={href}
          onClick={(e) => {
            if (isCitation && onReferenceClick) {
              e.preventDefault();
              onReferenceClick(href);
            }
          }}
          className={`${isCitation ? 'bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded cursor-pointer hover:bg-brand-200 no-underline font-medium text-xs align-middle mx-0.5' : 'text-brand-600 hover:underline'}`}
          {...props}
        >
          {isCitation ? '📄 ' : ''}{children}
        </a>
      );
    },
    table: ({node, ...props}: any) => (
      <div className="overflow-x-auto w-full my-4 rounded-lg border border-slate-200 shadow-sm bg-white">
        <table className="min-w-full divide-y divide-slate-200 border-collapse" {...props} />
      </div>
    ),
    thead: ({node, ...props}: any) => (
      <thead className="bg-slate-50" {...props} />
    ),
    tbody: ({node, ...props}: any) => (
      <tbody className="bg-white divide-y divide-slate-200" {...props} />
    ),
    tr: ({node, ...props}: any) => (
      <tr className="hover:bg-slate-50/50 transition-colors" {...props} />
    ),
    th: ({node, ...props}: any) => (
      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50" {...props} />
    ),
    td: ({node, ...props}: any) => (
      <td className="px-4 py-3 text-sm text-slate-600 border-b border-slate-100 align-top leading-relaxed" {...props} />
    ),
  };

  return (
    <div className="flex flex-col h-full relative bg-white">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 pb-40" ref={scrollRef}>
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
              msg.role === 'user' ? 'bg-slate-100 border-slate-200' : 'bg-brand-50 border-brand-100'
            }`}>
              {msg.role === 'user' ? (
                <User className="w-4 h-4 text-slate-500" />
              ) : (
                <Sparkles className="w-4 h-4 text-brand-500" />
              )}
            </div>
            
            <div className={`max-w-[85%] px-5 py-3 text-[15px] leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-brand-600 text-white rounded-2xl rounded-tr-sm' 
                : 'bg-[#F5F5F7] text-[#1D1D1F] rounded-2xl rounded-tl-sm'
            }`}>
              <div className={msg.role === 'user' ? 'text-white' : 'text-earth-900'}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={renderers}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
              
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200/50">
                  <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center">
                    <Globe className="w-3 h-3 mr-1" />
                    Sources
                  </p>
                  <ul className="space-y-1">
                    {msg.sources.map((src, i) => (
                      <li key={i}>
                        <a 
                          href={src.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-brand-600 hover:underline block truncate"
                        >
                          {src.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
               <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
             </div>
             <div className="bg-[#F5F5F7] rounded-2xl rounded-tl-sm px-5 py-3">
                <div className="flex gap-1 h-5 items-center">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100 absolute bottom-0 left-0 right-0 z-10">
        {/* Suggested Questions - Always visible if not loading */}
        {!isLoading && suggestedQuestions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar mb-2 px-1">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleQuestionClick(q)}
                className="whitespace-nowrap px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition shrink-0 shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="relative max-w-3xl mx-auto">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about specific clauses..."
            className="w-full bg-[#F5F5F7] border-0 text-slate-900 text-base rounded-full pl-5 pr-24 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all shadow-sm"
          />
          <div className="absolute right-2 top-2 flex gap-1">
            <button
              onClick={handleSearchCheck}
              disabled={isLoading || !inputValue.trim()}
              className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition"
              title="Verify with Google Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !inputValue.trim()}
              className="p-2 bg-brand-600 text-white rounded-full hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;