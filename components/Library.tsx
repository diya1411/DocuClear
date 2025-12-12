import React, { useEffect, useState } from 'react';
import { FileText, Trash2, Clock, ChevronRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import { StoredDocument } from '../types';
import { getDocuments, deleteDocument } from '../services/storageService';

interface LibraryProps {
  onSelect: (doc: StoredDocument) => void;
  onNew: () => void;
}

const Library: React.FC<LibraryProps> = ({ onSelect, onNew }) => {
  const [docs, setDocs] = useState<StoredDocument[]>([]);

  useEffect(() => {
    setDocs(getDocuments());
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteDocument(id);
    setDocs(getDocuments());
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 w-full">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">Library</h2>
          <p className="text-slate-500 mt-2">Your previously analyzed documents.</p>
        </div>
        <button 
          onClick={onNew}
          className="bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition shadow-sm"
        >
          New Analysis
        </button>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
             <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-medium text-slate-900 mb-2">No documents yet</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">Upload a contract, lease, or agreement to get detailed AI analysis.</p>
          <button 
            onClick={onNew}
            className="text-brand-600 font-medium hover:underline"
          >
            Upload Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docs.map((doc) => (
            <div 
              key={doc.docId}
              onClick={() => onSelect(doc)}
              className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative"
            >
              <div className="flex justify-between items-start mb-6">
                 <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${getRiskColor(doc.riskScore)}`}>
                    {doc.riskScore >= 80 ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    Score: {doc.riskScore}
                 </div>
                 <button
                   onClick={(e) => handleDelete(e, doc.docId)}
                   className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                   title="Delete"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>

              <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-1 group-hover:text-brand-600 transition-colors">
                {doc.fileName}
              </h3>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-6">
                {doc.documentType}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <span className="flex items-center text-xs text-slate-400">
                  <Clock className="w-3 h-3 mr-1.5" />
                  {new Date(doc.timestamp).toLocaleDateString()}
                </span>
                <span className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-brand-600 group-hover:text-white transition-all">
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;
