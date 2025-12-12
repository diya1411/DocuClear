export interface RedFlag {
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
  excerpt?: string;
  questions: string[];
  location?: string;
}

export interface DocumentSection {
  title: string;
  summary: string;
  status: 'GOOD' | 'NEUTRAL' | 'CONCERN';
  location?: string;
}

export interface DocumentAnalysis {
  documentType: string;
  riskScore: number;
  riskLabel: string;
  summary: string;
  keyPoints: string[];
  redFlags: RedFlag[];
  sections: DocumentSection[];
  missingClauses: string[];
  docId: string;
  fileName: string;
  timestamp: number;
  visualImage?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  sources?: Array<{ title: string; uri: string }>;
}

export interface StoredDocument extends DocumentAnalysis {
  fileData: string; // Base64
  mimeType: string;
}

export type ViewState = 'landing' | 'processing' | 'analysis' | 'library';