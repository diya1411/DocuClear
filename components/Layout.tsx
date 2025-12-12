import React from 'react';
import { Scale, FolderOpen, ChevronLeft } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onNavigateHome: () => void;
  onNavigateLibrary: () => void;
  currentDocName?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, onNavigateHome, onNavigateLibrary, currentDocName }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9F8F6] text-earth-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 transition-all duration-200 bg-[#F9F8F6]/90 backdrop-blur-md pt-4 px-4">
        <div className="max-w-[1400px] mx-auto px-6 h-16 rounded-full bg-white/50 border border-white/60 shadow-sm flex items-center justify-between">
          
          {/* Logo / Left Nav */}
          <div className="flex items-center gap-4">
            {currentDocName ? (
              <button 
                onClick={onNavigateHome} 
                className="p-2 rounded-full hover:bg-white transition text-earth-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <div 
                className="flex items-center gap-2 cursor-pointer"
                onClick={onNavigateHome}
              >
                <div className="w-8 h-8 rounded-full bg-earth-800 flex items-center justify-center text-white">
                   <span className="font-serif font-bold italic">d</span>
                </div>
                <span className="text-xl font-medium tracking-tight font-sans text-earth-900">DocuClear</span>
              </div>
            )}
            
            {currentDocName && (
              <>
                <div className="h-4 w-px bg-earth-300 mx-1"></div>
                <span className="font-medium text-sm truncate max-w-[150px] sm:max-w-md text-earth-700">
                  {currentDocName}
                </span>
              </>
            )}
          </div>
          
          {/* Centered Nav - Only on landing/home */}
          {!currentDocName && (
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-earth-600">
              <button onClick={onNavigateHome} className="hover:text-earth-900 transition">Who we are</button>
              <button onClick={onNavigateHome} className="hover:text-earth-900 transition">The challenges</button>
              <button onClick={onNavigateHome} className="hover:text-earth-900 transition">Our process</button>
              <button onClick={onNavigateHome} className="hover:text-earth-900 transition">Why choose us</button>
            </nav>
          )}
          
          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={onNavigateLibrary}
              className="hidden sm:flex items-center gap-2 text-sm font-medium text-earth-600 hover:text-earth-900 transition"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Library</span>
            </button>
            {!currentDocName && (
              <button 
                onClick={onNavigateHome}
                className="bg-earth-500 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-earth-600 transition shadow-lg shadow-earth-500/20"
              >
                Start Analysis
              </button>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-grow flex flex-col relative w-full mx-auto">
        {children}
      </main>
      
    </div>
  );
};

export default Layout;