import React, { useState } from 'react';
import { 
  Shield, AlertTriangle, CheckCircle2, HelpCircle, 
  PlayCircle, Info, ChevronDown, ChevronUp, AlertOctagon, Lightbulb 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DocumentAnalysis } from '../types';
import ChatInterface from './ChatInterface';
import { generateSpeech } from '../services/geminiService';

interface AnalysisPanelProps {
  analysis: DocumentAnalysis;
  onReferenceClick?: (location: string) => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, onReferenceClick }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'chat'>('overview');
  const [isPlaying, setIsPlaying] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (idx: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-green-700 border-green-200 bg-green-50';
    if (score >= 60) return 'text-amber-700 border-amber-200 bg-amber-50';
    return 'text-red-700 border-red-200 bg-red-50';
  };
  
  const getRiskBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-amber-100 text-amber-800';
    return 'bg-red-100 text-red-800';
  };

  const playSummary = async () => {
    if (isPlaying) return;
    try {
      setIsPlaying(true);
      const audioBuffer = await generateSpeech(analysis.summary);
      const ctx = new AudioContext();
      const buffer = await ctx.decodeAudioData(audioBuffer);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      source.onended = () => setIsPlaying(false);
    } catch (e) {
      console.error(e);
      setIsPlaying(false);
    }
  };

  const handleExport = () => {
    const text = `
DOCUCLEAR ANALYSIS
Document: ${analysis.fileName}
Type: ${analysis.documentType}
Risk Score: ${analysis.riskScore}/100 (${analysis.riskLabel})

SUMMARY
${analysis.summary}

KEY POINTS
${(analysis.keyPoints || []).map(p => `- ${p}`).join('\n')}

RED FLAGS
${(analysis.redFlags || []).map(f => `[${f.severity}] ${f.title}: ${f.explanation}`).join('\n')}
    `.trim();

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.fileName}-analysis.txt`;
    a.click();
  };

  const safeKeyPoints = analysis.keyPoints || [];
  const safeRedFlags = analysis.redFlags || [];
  const safeSections = analysis.sections || [];
  const safeMissingClauses = analysis.missingClauses || [];

  // Define markdown components
  const markdownComponents = {
    table: ({ node, ...props }: any) => (
      <div className="overflow-x-auto w-full my-4 rounded-xl border border-earth-200">
        <table className="min-w-full divide-y divide-earth-200 text-sm" {...props} />
      </div>
    ),
    thead: ({node, ...props}: any) => <thead className="bg-[#F9F8F6]" {...props} />,
    tbody: ({node, ...props}: any) => <tbody className="bg-white divide-y divide-earth-100" {...props} />,
    tr: ({node, ...props}: any) => <tr className="" {...props} />,
    th: ({node, ...props}: any) => (
      <th className="px-4 py-3 text-left font-serif font-semibold text-earth-800 bg-[#F9F8F6]" {...props} />
    ),
    td: ({node, ...props}: any) => (
      <td className="px-4 py-3 text-earth-600 border-b border-earth-50 align-top" {...props} />
    ),
    ul: ({node, ...props}: any) => <ul className="list-disc pl-5 space-y-2 mb-4 text-earth-700" {...props} />,
    ol: ({node, ...props}: any) => <ol className="list-decimal pl-5 space-y-2 mb-4 text-earth-700" {...props} />,
    li: ({node, ...props}: any) => <li className="pl-1 leading-relaxed" {...props} />,
    p: ({node, ...props}: any) => <p className="mb-4 leading-relaxed last:mb-0" {...props} />,
    strong: ({node, ...props}: any) => <span className="font-bold text-earth-900" {...props} />,
    blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-earth-300 pl-4 py-1 my-4 italic text-earth-600 bg-[#F9F8F6] rounded-r" {...props} />,
  };

  return (
    <div className="flex flex-col h-full bg-[#F9F8F6]">
      {/* Tabs */}
      <div className="flex border-b border-earth-200 shrink-0 z-20 bg-white/50 backdrop-blur-md relative">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-5 text-sm font-medium transition relative tracking-wide ${activeTab === 'overview' ? 'text-earth-900' : 'text-earth-500 hover:text-earth-700'}`}
        >
          Overview
          {activeTab === 'overview' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-earth-900 rounded-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-5 text-sm font-medium transition relative tracking-wide ${activeTab === 'chat' ? 'text-earth-900' : 'text-earth-500 hover:text-earth-700'}`}
        >
          Ask Questions
          {activeTab === 'chat' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-earth-900 rounded-full"></div>}
        </button>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar relative scroll-smooth bg-[#F9F8F6]">
        {/* Overview Tab Content */}
        <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
          <div className="p-6 md:p-10 space-y-10 max-w-4xl mx-auto pb-24">
            
            {/* Header Card */}
            <div className="bg-[#F2F0EA] rounded-[2rem] shadow-sm border border-white overflow-hidden group">
               {analysis.visualImage && (
                 <div className="h-40 w-full relative">
                    <img 
                      src={`data:image/png;base64,${analysis.visualImage}`} 
                      alt="Document Visualization"
                      className="w-full h-full object-cover opacity-90 mix-blend-multiply" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#F2F0EA] to-transparent"></div>
                 </div>
               )}
               <div className="p-8 flex items-start justify-between relative">
                 <div className={analysis.visualImage ? "-mt-12 relative" : ""}>
                    <span className="text-xs font-bold tracking-widest text-earth-500 uppercase">{analysis.documentType || 'Unknown Document'}</span>
                    <h2 className="text-3xl md:text-4xl font-serif font-medium text-earth-900 mt-2 mb-3 leading-tight">
                      {analysis.fileName}
                    </h2>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleExport} 
                        className="text-xs font-semibold text-earth-600 hover:text-earth-900 border-b border-earth-300 hover:border-earth-600 transition-colors pb-0.5"
                      >
                        Download Report
                      </button>
                    </div>
                 </div>
                 
                 <div className="flex flex-col items-center bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm z-10 border border-white">
                    <div className={`relative w-16 h-16 rounded-full border-[5px] flex items-center justify-center ${getRiskColor(analysis.riskScore || 0)}`}>
                       <span className="text-2xl font-bold font-serif">{analysis.riskScore || 0}</span>
                    </div>
                    <span className={`text-[10px] font-bold mt-2 px-3 py-1 rounded-full whitespace-nowrap uppercase tracking-wide ${getRiskBadge(analysis.riskScore || 0)}`}>
                      {analysis.riskLabel || 'Unassessed'}
                    </span>
                 </div>
               </div>
            </div>

            {/* Key Points Summary */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-earth-100 overflow-hidden">
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md p-6 border-b border-earth-100 flex justify-between items-center transition-all">
                <h3 className="text-xl font-serif text-earth-900 flex items-center gap-3">
                  <div className="bg-[#F2F0EA] p-2 rounded-full text-earth-600">
                    <Shield className="w-5 h-5" />
                  </div>
                  What You Need to Know
                </h3>
                <button onClick={playSummary} className="text-earth-400 hover:text-earth-700 transition" title="Listen to Summary">
                   <PlayCircle className={`w-8 h-8 ${isPlaying ? 'animate-pulse text-earth-600' : ''}`} />
                </button>
              </div>
              <div className="p-8">
                <div className="text-earth-700 mb-8 text-sm leading-relaxed p-6 bg-[#F9F8F6] rounded-2xl border border-earth-100">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {analysis.summary}
                  </ReactMarkdown>
                </div>
                
                <div className="grid gap-4">
                  {safeKeyPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-5 p-5 rounded-2xl bg-white border border-earth-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-all">
                      <div className="w-8 h-8 rounded-full bg-[#E6E2D8] flex items-center justify-center text-earth-800 font-serif font-bold text-sm shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="text-sm text-earth-700 pt-1.5 font-medium leading-relaxed">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {point}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Red Flags Section */}
            <div className="relative">
              <div className="sticky top-0 z-10 bg-[#F9F8F6]/95 backdrop-blur-md py-4 border-b border-earth-200/50 mb-6">
                <h3 className="text-2xl font-serif text-earth-900 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-700/80" />
                  Red Flags <span className="text-lg font-sans font-normal text-earth-400">({safeRedFlags.length})</span>
                </h3>
              </div>
              
              {safeRedFlags.length === 0 ? (
                 <div className="p-8 bg-green-50/50 rounded-[2rem] border border-green-100 text-center text-green-800">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-serif text-lg">No major red flags detected.</p>
                 </div>
              ) : (
                <div className="space-y-4">
                  {safeRedFlags.map((flag, idx) => (
                    <div key={idx} className="bg-white rounded-[1.5rem] shadow-sm border border-earth-100 overflow-hidden transition hover:shadow-lg group">
                      <div 
                        className="p-6 cursor-pointer flex items-start gap-5"
                        onClick={() => toggleSection(`flag-${idx}`)}
                      >
                         <div className={`mt-2 w-2 h-2 rounded-full shrink-0 ${
                            flag.severity === 'HIGH' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 
                            flag.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-yellow-400'
                          }`} />
                         <div className="flex-1">
                            <div className="flex justify-between items-start">
                               <div>
                                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <h4 className="font-bold text-earth-900 text-lg">{flag.title}</h4>
                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                                      flag.severity === 'HIGH' ? 'bg-red-50 text-red-800' : 
                                      flag.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-800' : 'bg-yellow-50 text-yellow-800'
                                    }`}>{flag.severity}</span>
                                  </div>
                                  <p className="text-earth-600 leading-relaxed line-clamp-2">{flag.explanation}</p>
                               </div>
                               <div className="w-8 h-8 rounded-full bg-earth-50 flex items-center justify-center group-hover:bg-earth-100 transition-colors shrink-0 ml-4">
                                  {expandedSections[`flag-${idx}`] ? <ChevronUp className="w-4 h-4 text-earth-500" /> : <ChevronDown className="w-4 h-4 text-earth-500" />}
                               </div>
                            </div>
                         </div>
                      </div>
                      
                      {expandedSections[`flag-${idx}`] && (
                        <div className="bg-[#F9F8F6] px-8 py-6 border-t border-earth-100 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                           {flag.excerpt && (
                             <div className="mb-6 pl-4 border-l-2 border-earth-300 italic text-earth-500 font-serif text-base">
                               "{flag.excerpt}"
                             </div>
                           )}
                           <div className="bg-white p-6 rounded-xl border border-earth-100 shadow-sm">
                              <p className="font-semibold text-earth-900 mb-3 flex items-center gap-2">
                                <HelpCircle className="w-4 h-4 text-earth-400" />
                                Questions to ask:
                              </p>
                              <ul className="space-y-3">
                                {(flag.questions || []).map((q, i) => (
                                  <li key={i} className="text-earth-700 flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 bg-earth-300 rounded-full mt-1.5 shrink-0"></span>
                                    <span>{q}</span>
                                  </li>
                                ))}
                              </ul>
                           </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section Breakdown */}
            <div className="relative">
              <div className="sticky top-0 z-10 bg-[#F9F8F6]/95 backdrop-blur-md py-4 border-b border-earth-200/50 mb-6">
                <h3 className="text-2xl font-serif text-earth-900 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-earth-400" />
                  Document Sections
                </h3>
              </div>
              <div className="bg-white rounded-[2rem] shadow-sm border border-earth-100 divide-y divide-earth-100">
                {safeSections.map((section, idx) => (
                  <div key={idx} className="group">
                    <button 
                      onClick={() => toggleSection(`sec-${idx}`)}
                      className="w-full text-left p-6 flex items-center justify-between hover:bg-[#F9F8F6] transition first:rounded-t-[2rem] last:rounded-b-[2rem]"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full shrink-0 ${
                          section.status === 'GOOD' ? 'bg-green-50 text-green-700' :
                          section.status === 'CONCERN' ? 'bg-red-50 text-red-700' : 'bg-earth-50 text-earth-500'
                        }`}>
                          {section.status === 'GOOD' ? <CheckCircle2 className="w-4 h-4" /> : 
                           section.status === 'CONCERN' ? <AlertOctagon className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                        </div>
                        <span className="font-medium text-earth-900 text-base line-clamp-1">{section.title}</span>
                      </div>
                      {expandedSections[`sec-${idx}`] ? <ChevronUp className="w-5 h-5 text-earth-300 shrink-0" /> : <ChevronDown className="w-5 h-5 text-earth-300 shrink-0" />}
                    </button>
                    
                    {expandedSections[`sec-${idx}`] && (
                      <div className="px-16 pb-8 text-sm text-earth-600 leading-relaxed bg-[#F9F8F6]/50">
                        {section.summary}
                        {(section.location || onReferenceClick) && (
                          <div className="mt-4">
                             <button
                                className="text-xs bg-[#E6E2D8] text-earth-800 px-4 py-2 rounded-full font-bold hover:bg-[#D6CBB6] transition inline-flex items-center gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onReferenceClick && section.location) {
                                    onReferenceClick(section.location);
                                  }
                                }}
                              >
                                Go to {section.location || 'Section'}
                                <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
                              </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Clauses */}
            {safeMissingClauses.length > 0 && (
              <div className="bg-[#FFF8F0] rounded-[2rem] p-8 border border-orange-100/50">
                <h3 className="font-bold text-[#8C765A] flex items-center gap-3 mb-4 font-serif text-lg">
                  <Lightbulb className="w-5 h-5" />
                  Missing Standard Clauses
                </h3>
                <ul className="list-disc list-inside text-sm text-earth-700 space-y-2 ml-1">
                  {safeMissingClauses.map((clause, idx) => (
                    <li key={idx} className="pl-2">{clause}</li>
                  ))}
                </ul>
              </div>
            )}
            
          </div>
        </div>

        {/* Chat Tab Content - Kept mounted to preserve state */}
        <div 
          style={{ display: activeTab === 'chat' ? 'block' : 'none' }} 
          className="h-full bg-white"
        >
          <ChatInterface 
            docContext={JSON.stringify(analysis)} 
            onReferenceClick={onReferenceClick}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;