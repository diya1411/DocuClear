import React, { useState, useEffect } from 'react';
import { Upload, X, Loader2, AlertCircle, FileText, FileWarning, ArrowRight } from 'lucide-react';
import { DocumentAnalysis, StoredDocument } from '../types';
import { analyzeDocument, generateDocumentVisual } from '../services/geminiService';
import { saveDocument } from '../services/storageService';
import AnalysisPanel from './AnalysisPanel';
import DocumentViewer from './DocumentViewer';

interface AnalyzerProps {
  initialDoc?: StoredDocument | null;
}

const Analyzer: React.FC<AnalyzerProps> = ({ initialDoc }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<string | null>(initialDoc?.fileData || null);
  const [mimeType, setMimeType] = useState<string>(initialDoc?.mimeType || '');
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(initialDoc || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0); // 0: Upload, 1: Reading, 2: Reasoning, 3: Finalizing
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [viewerLocation, setViewerLocation] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (initialDoc) {
      setAnalysis(initialDoc);
      setFileData(initialDoc.fileData);
      setMimeType(initialDoc.mimeType);
      setFile(null);
      setError(null);
    }
  }, [initialDoc]);

  // Loading animation simulation
  useEffect(() => {
    if (isAnalyzing) {
      const intervals = [
        setTimeout(() => setLoadingStep(1), 1000),
        setTimeout(() => setLoadingStep(2), 3500),
        setTimeout(() => setLoadingStep(3), 8000),
      ];
      return () => intervals.forEach(clearTimeout);
    } else {
      setLoadingStep(0);
    }
  }, [isAnalyzing]);

  const validatePdfHeader = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      if (file.size === 0) {
        resolve(false);
        return;
      }
      
      const isPdfType = file.type === 'application/pdf';
      const isPdfExt = file.name.toLowerCase().endsWith('.pdf');

      // Only validate header for files that claim to be PDFs
      if (!isPdfType && !isPdfExt) {
        resolve(true); // Allow images
        return;
      }

      const reader = new FileReader();
      reader.onloadend = (e) => {
        try {
          if (!e.target?.result) {
            resolve(false);
            return;
          }
          const arr = (new Uint8Array(e.target.result as ArrayBuffer)).subarray(0, 5);
          let header = "";
          for(let i = 0; i < arr.length; i++) {
            header += String.fromCharCode(arr[i]);
          }
          // Check for %PDF signature
          resolve(header.startsWith('%PDF-'));
        } catch (err) {
          console.error("Header validation error", err);
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file.slice(0, 5));
    });
  };

  const handleFile = async (selectedFile: File) => {
    setError(null);
    setAnalysis(null);
    setFile(null); 
    setFileData(null); 
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB");
      return;
    }

    try {
      const isValidHeader = await validatePdfHeader(selectedFile);
      if (!isValidHeader) {
        setError("This PDF file appears to be corrupted or invalid. Please try another file.");
        return;
      }

      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (!result) {
          setError("Failed to read file content.");
          return;
        }
        
        // Ensure we extract pure Base64, removing the data URI prefix if present
        const base64Data = result.includes(',') ? result.split(',')[1] : result;
        
        setFileData(base64Data);
        setMimeType(selectedFile.type || (selectedFile.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'));
        startAnalysis(base64Data, selectedFile.type, selectedFile.name);
      };
      reader.onerror = () => {
        setError("This PDF file appears to be corrupted or invalid. Please try another file.");
      };
      reader.readAsDataURL(selectedFile);
    } catch (e) {
      setError("An unexpected error occurred while processing the file.");
    }
  };

  const startAnalysis = async (data: string, type: string, name: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeDocument(data, type, name);
      setAnalysis(result);
      saveDocument({
        ...result,
        fileData: data,
        mimeType: type
      });
      
      // Visual generation in background
      generateDocumentVisual(result.documentType, result.summary)
        .then((visualData) => {
          if (visualData) {
            const updatedResult = { ...result, visualImage: visualData };
            setAnalysis(updatedResult);
            saveDocument({
              ...updatedResult,
              fileData: data,
              mimeType: type
            });
          }
        })
        .catch(console.error);

    } catch (err: any) {
      setError(err.message || "Failed to analyze document. The file might be encrypted or unreadable.");
      setFile(null);
      setFileData(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleJumpToLocation = (location: string) => {
    let pageMatch = location.match(/page\s*[=]?\s*(\d+)/i);
    if (pageMatch && pageMatch[1]) {
      setViewerLocation(pageMatch[1]);
    } else {
      setViewerLocation(location.replace('#', ''));
    }
  };

  // Upload View
  if (!fileData) {
    return (
      <div 
        className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 bg-[#F9F8F6]"
        onDragEnter={handleDrag}
      >
        <div 
          className={`w-full max-w-2xl transition-all duration-300 transform
            ${dragActive ? 'scale-105' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {/* Card matching Landing Page aesthetics */}
          <div className={`
             relative rounded-[2.5rem] p-12 text-center overflow-hidden
             ${error ? 'bg-red-50 border-2 border-red-100' : 'bg-[#F2F0EA] hover:shadow-xl transition-shadow'}
          `}>
             
             {/* Background decorative element */}
             {!error && !dragActive && (
               <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                  <Upload className="w-48 h-48 text-earth-900" />
               </div>
             )}

             <div className="relative z-10 flex flex-col items-center">
                {error ? (
                  <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <FileWarning className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-white text-earth-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <Upload className="w-8 h-8" />
                  </div>
                )}
                
                <h2 className="text-3xl md:text-4xl font-serif text-earth-900 mb-4">
                  {error ? "Couldn't upload file" : "Upload Document"}
                </h2>
                
                <p className="text-earth-600 mb-8 max-w-md text-lg">
                  {error || "Drag and drop your PDF here, or click to browse. We'll handle the analysis."}
                </p>
                
                <label className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white transition-all duration-200 bg-earth-900 rounded-full hover:bg-earth-800 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                  <span className="flex items-center gap-2">
                    {error ? "Try Another File" : "Choose File"}
                    {!error && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="application/pdf,image/png,image/jpeg,image/jpg"
                    onChange={handleInputChange}
                  />
                </label>
                
                <p className="mt-6 text-xs font-medium text-earth-400 uppercase tracking-widest">
                   Supports PDF, PNG, JPG • Max 10MB
                </p>
             </div>
          </div>
        </div>
        
        {dragActive && (
          <div className="absolute inset-0 bg-earth-900/10 pointer-events-none flex items-center justify-center backdrop-blur-sm z-50">
             <div className="bg-white px-8 py-4 rounded-full shadow-2xl text-earth-900 font-serif font-bold text-xl animate-bounce">
               Drop file to analyze
             </div>
          </div>
        )}
      </div>
    );
  }

  // Loading View
  if (isAnalyzing) {
    const steps = [
      "Reading document structure...",
      "Identifying key clauses...",
      "Reasoning about risks...",
      "Generating final summary..."
    ];
    
    // Skeleton Pulse Animation
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-[#F9F8F6]">
        <div className="w-full max-w-4xl p-6 md:p-12">
           <div className="text-center mb-10">
             <h3 className="text-3xl font-serif text-earth-900 mb-3 animate-pulse">Analyzing Document</h3>
             <p className="text-earth-600 font-medium transition-all duration-500">{steps[loadingStep]}</p>
           </div>
           
           {/* Abstract Skeleton of the Interface */}
           <div className="grid md:grid-cols-2 gap-8 opacity-50">
              {/* Left Column Skeleton */}
              <div className="space-y-4">
                 <div className="h-64 bg-[#E6E2D8] rounded-[2rem] w-full animate-shimmer" style={{backgroundSize: '200% 100%'}}></div>
                 <div className="h-8 bg-[#E6E2D8] rounded-full w-3/4"></div>
                 <div className="h-4 bg-[#E6E2D8] rounded-full w-1/2"></div>
              </div>

              {/* Right Column Skeleton */}
              <div className="space-y-6">
                 <div className="h-20 bg-white rounded-3xl w-full flex items-center p-4 gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#F2F0EA]"></div>
                    <div className="flex-1 space-y-2">
                       <div className="h-4 bg-[#F2F0EA] rounded-full w-1/3"></div>
                       <div className="h-3 bg-[#F2F0EA] rounded-full w-1/2"></div>
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                       <div key={i} className="h-24 bg-white rounded-3xl w-full p-4 space-y-3">
                          <div className="h-4 bg-[#F2F0EA] rounded-full w-1/4"></div>
                          <div className="h-2 bg-[#F2F0EA] rounded-full w-full"></div>
                          <div className="h-2 bg-[#F2F0EA] rounded-full w-5/6"></div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // Main Split Layout
  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-[#F9F8F6]">
      {/* Left: Preview */}
      <div className="hidden md:block w-5/12 h-full border-r border-earth-200 bg-[#E8E8EB]">
        <DocumentViewer 
          fileData={fileData} 
          mimeType={mimeType} 
          location={viewerLocation}
        />
      </div>

      {/* Right: Analysis */}
      <div className="w-full md:w-7/12 h-full bg-white md:rounded-tl-[2rem] overflow-hidden relative shadow-2xl border-l border-white/50">
        {analysis && (
          <AnalysisPanel 
            analysis={analysis} 
            onReferenceClick={handleJumpToLocation}
          />
        )}
      </div>
    </div>
  );
};

export default Analyzer;