import React, { useState } from 'react';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import Analyzer from './components/Analyzer';
import Library from './components/Library';
import { ViewState, StoredDocument } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');
  const [selectedDoc, setSelectedDoc] = useState<StoredDocument | null>(null);

  const handleStart = () => {
    setSelectedDoc(null);
    setView('analysis');
  };

  const handleNavigateHome = () => {
    setView('landing');
    setSelectedDoc(null);
  };

  const handleNavigateLibrary = () => {
    setView('library');
    setSelectedDoc(null);
  };

  const handleSelectDoc = (doc: StoredDocument) => {
    setSelectedDoc(doc);
    setView('analysis');
  };

  return (
    <Layout 
      onNavigateHome={handleNavigateHome} 
      onNavigateLibrary={handleNavigateLibrary}
      currentDocName={view === 'analysis' ? (selectedDoc?.fileName || 'Analysis') : undefined}
    >
      {view === 'landing' && (
        <LandingPage onStart={handleStart} />
      )}
      
      {view === 'analysis' && (
        <Analyzer initialDoc={selectedDoc} />
      )}

      {view === 'library' && (
        <Library onSelect={handleSelectDoc} onNew={handleStart} />
      )}
    </Layout>
  );
};

export default App;
