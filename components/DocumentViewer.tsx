import React, { useEffect, useState, useRef, useCallback } from 'react';
import { AlertCircle, ZoomIn, ZoomOut, Loader2, FileX, Lock } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Handle ES module default export inconsistency
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Define worker URL constant
const WORKER_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface DocumentViewerProps {
  fileData: string;
  mimeType: string;
  location?: string;
}

// -----------------------------------------------------------------------------
// Sub-component: Lazy Loaded PDF Page
// -----------------------------------------------------------------------------
interface PdfPageProps {
  pdfDoc: any;
  pageNum: number;
  scale: number;
  estimatedHeight?: number;
  onDimensionsResolved?: (height: number) => void;
}

const PdfPage: React.FC<PdfPageProps> = ({ 
  pdfDoc, 
  pageNum, 
  scale, 
  estimatedHeight, 
  onDimensionsResolved 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [pageHeight, setPageHeight] = useState<number | undefined>(undefined);
  const renderTaskRef = useRef<any>(null);

  // Intersection Observer for Lazy Loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Keep rendered once loaded (smoother scrolling)
        }
      },
      { rootMargin: '500px' } // Increased buffer to pre-load pages well before they enter viewport
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Rendering Logic
  useEffect(() => {
    if (!isVisible || !pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        if (renderTaskRef.current) {
          await renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        // Update container height
        const currentHeight = viewport.height;
        setPageHeight(currentHeight);
        
        // Notify parent of dimensions (useful for estimating other pages)
        if (onDimensionsResolved) {
          onDimensionsResolved(currentHeight);
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = currentHeight;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        setIsRendered(true);
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error(`Error rendering page ${pageNum}:`, err);
        }
      }
    };

    renderPage();

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [isVisible, pdfDoc, pageNum, scale]);

  // Determine height style to prevent layout shift
  const heightStyle = pageHeight 
    ? `${pageHeight}px` 
    : (estimatedHeight ? `${estimatedHeight}px` : '600px'); // Default fallback

  return (
    <div 
      id={`page-${pageNum}`}
      ref={containerRef} 
      className="relative my-4 shadow-md bg-white rounded-sm transition-all duration-300 focus:outline-none"
      role="img"
      aria-label={`PDF Page ${pageNum}`}
      style={{ 
        minHeight: heightStyle,
        width: 'fit-content'
      }}
    >
      <canvas ref={canvasRef} className="block" aria-hidden="true" />
      
      {!isRendered && isVisible && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F9F8F6] animate-pulse" role="status" aria-label="Loading page">
          <Loader2 className="w-8 h-8 text-earth-300 animate-spin" />
        </div>
      )}
      {!isVisible && (
        <div 
          className="flex items-center justify-center text-earth-400 text-sm font-medium bg-white border border-earth-100"
          style={{ height: heightStyle, width: '100%' }}
        >
           Page {pageNum}
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Main Component: Document Viewer
// -----------------------------------------------------------------------------
const DocumentViewer: React.FC<DocumentViewerProps> = ({ fileData, mimeType, location }) => {
  const isPdf = mimeType === 'application/pdf';
  const [src, setSrc] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'password' | 'corrupt' | 'generic'>('generic');
  
  const [loading, setLoading] = useState(false);
  const [workerReady, setWorkerReady] = useState(false);
  
  // PDF State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [estimatedPageHeight, setEstimatedPageHeight] = useState<number | undefined>(undefined);

  // Initialize Worker safely
  useEffect(() => {
    const initWorker = async () => {
      if (pdfjs.GlobalWorkerOptions.workerSrc) {
        setWorkerReady(true);
        return;
      }

      try {
        const response = await fetch(WORKER_CDN_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const workerScript = await response.text();
        const blob = new Blob([workerScript], { type: 'application/javascript' });
        pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
      } catch (e) {
        console.warn("Failed to load worker via Blob, falling back to CDN URL:", e);
        pdfjs.GlobalWorkerOptions.workerSrc = WORKER_CDN_URL;
      } finally {
        setWorkerReady(true);
      }
    };

    initWorker();
  }, []);

  // Handle Location Jumps (Scrolling)
  useEffect(() => {
    if (location && isPdf && numPages > 0) {
      const targetPage = parseInt(location, 10);
      if (!isNaN(targetPage) && targetPage > 0 && targetPage <= numPages) {
        const pageEl = document.getElementById(`page-${targetPage}`);
        if (pageEl) {
          pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          pageEl.focus();
        }
      }
    }
  }, [location, numPages, isPdf]);

  // Initial Load Logic
  useEffect(() => {
    if (!fileData || (isPdf && !workerReady)) return;

    setError(null);
    setPdfDoc(null);
    setNumPages(0);
    setEstimatedPageHeight(undefined);

    if (isPdf) {
      const loadPdf = async () => {
        try {
          setLoading(true);
          const cleanBase64 = fileData.replace(/[\n\r\s]/g, '');
          const binaryString = atob(cleanBase64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const loadingTask = pdfjs.getDocument({ data: bytes });
          const doc = await loadingTask.promise;
          
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          
          // Auto-fit width logic (approximate 0.9 for standard letter)
          setScale(0.9); 
          
          setLoading(false);
        } catch (err: any) {
          console.error("PDF Load Error Details:", err);
          setLoading(false);
          
          if (err.name === 'PasswordException') {
            setError("This document is password protected. Please remove the password and try again.");
            setErrorType('password');
          } else if (err.name === 'InvalidPDFException' || err.name === 'MissingPDFException') {
            setError("The PDF file appears to be corrupted or invalid. Please try another file.");
            setErrorType('corrupt');
          } else {
            setError("Could not render this document. It may be using an unsupported format or feature.");
            setErrorType('generic');
          }
        }
      };
      loadPdf();
    } else {
      setSrc(`data:${mimeType};base64,${fileData}`);
    }
  }, [fileData, mimeType, isPdf, workerReady]);

  const zoom = (delta: number) => {
    setScale(prev => Math.min(Math.max(0.5, prev + delta), 2.5));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '=' || e.key === '+') {
      zoom(0.1);
    } else if (e.key === '-') {
      zoom(-0.1);
    }
  };

  const handleDimensionsResolved = useCallback((height: number) => {
    setEstimatedPageHeight(prev => prev ? prev : height);
  }, []);

  if (error) {
     return (
         <div className="w-full h-full flex flex-col items-center justify-center bg-[#F9F8F6] text-earth-600 p-8 text-center" role="alert">
             <div className="bg-white p-6 rounded-full shadow-sm mb-6">
                {errorType === 'password' ? <Lock className="w-10 h-10 text-amber-500" aria-hidden="true" /> :
                 errorType === 'corrupt' ? <FileX className="w-10 h-10 text-red-500" aria-hidden="true" /> :
                 <AlertCircle className="w-10 h-10 text-earth-300" aria-hidden="true" />}
             </div>
             <h3 className="font-bold font-serif text-lg mb-2 text-earth-900">Unable to Preview</h3>
             <p className="text-sm max-w-xs mx-auto mb-6 leading-relaxed">
               {error}
             </p>
         </div>
     )
  }

  return (
    <div 
      className="w-full h-full flex flex-col bg-[#E8E8EB]" 
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Document Viewer"
    >
       {/* Toolbar */}
       <div 
         className="bg-[#F9F8F6] border-b border-earth-200 px-6 py-2 flex items-center justify-between shrink-0 h-16 shadow-sm z-10 relative"
         role="toolbar"
         aria-label="Document controls"
       >
         <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-earth-500 uppercase tracking-widest hidden sm:inline">
              {isPdf ? 'PDF Viewer' : 'Image Viewer'}
            </span>
            {isPdf && numPages > 0 && (
              <span className="text-xs font-medium text-earth-700 bg-earth-100/50 px-3 py-1 rounded-full" aria-live="polite">
                {numPages} Pages
              </span>
            )}
         </div>

         <div className="flex items-center gap-2">
            {location && isPdf && (
               <span className="text-xs bg-earth-800 text-white px-3 py-1 rounded-full font-medium animate-pulse hidden md:inline-block shadow-sm">
                 Page {location}
               </span>
            )}
            {isPdf && (
              <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-earth-100 shadow-sm">
                <button 
                  onClick={() => zoom(-0.1)} 
                  className="p-1.5 hover:bg-earth-50 rounded-md transition focus:outline-none text-earth-600" 
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span 
                  className="text-xs w-12 text-center font-medium text-earth-700"
                  aria-label={`Current Zoom Level: ${Math.round(scale * 100)}%`}
                >
                  {Math.round(scale * 100)}%
                </span>
                <button 
                  onClick={() => zoom(0.1)} 
                  className="p-1.5 hover:bg-earth-50 rounded-md transition focus:outline-none text-earth-600" 
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            )}
         </div>
       </div>

       {/* Viewer Content Area */}
       <div 
         className="flex-grow overflow-y-auto overflow-x-hidden p-8 flex flex-col items-center custom-scrollbar bg-[#E8E8EB] relative scroll-smooth focus:outline-none"
         tabIndex={0}
         aria-label="Document Content"
       >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#E8E8EB]/80 z-20 backdrop-blur-sm" role="status" aria-label="Loading Document">
             <div className="bg-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3">
               <Loader2 className="w-5 h-5 text-earth-600 animate-spin" aria-hidden="true" />
               <span className="text-sm font-medium text-earth-900">Loading Document...</span>
             </div>
          </div>
        )}

        {isPdf ? (
          pdfDoc && (
            <div className="flex flex-col gap-8 w-full items-center pb-20">
              {Array.from(new Array(numPages), (el, index) => (
                <PdfPage 
                  key={`page-${index + 1}`}
                  pageNum={index + 1}
                  pdfDoc={pdfDoc}
                  scale={scale}
                  estimatedHeight={estimatedPageHeight}
                  onDimensionsResolved={handleDimensionsResolved}
                />
              ))}
            </div>
          )
        ) : (
          <img 
            src={src} 
            alt="Uploaded Document" 
            className="max-w-full h-auto shadow-2xl rounded-sm object-contain bg-white" 
            onError={() => setError("Image could not be loaded.")}
          />
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;