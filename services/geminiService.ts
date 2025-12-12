import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DocumentAnalysis } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// 1. Document Analysis with Reasoning
export const analyzeDocument = async (
  fileBase64: string,
  mimeType: string,
  fileName: string
): Promise<DocumentAnalysis> => {
  
  const prompt = `
    You are an expert legal aide called "DocuClear". Your goal is to explain this document to a layperson in simple, conversational English.
    
    Analyze the attached document deeply.
    
    1. Identify the document type (e.g., Rental Agreement, NDA, Employment Contract).
    2. Assess the overall "Risk Score" from 0-100 where:
       - 80-100 = Safe, standard terms
       - 60-79 = Moderate concerns
       - 0-59 = Risky, multiple red flags
       Provide a short "Risk Label" (e.g., "Standard Terms", "High Risk").
    3. Write a "What You Need to Know" summary (plain English, bullet points).
    4. Identify "Red Flags" - clauses that are risky, unfair, or strictly binding.
       - Severity: HIGH, MEDIUM, or LOW.
       - Title: Short name for the issue.
       - Explanation: Why it matters to the user (use "you" and "your").
       - Excerpt: Short quote from the doc.
       - Questions: 2-3 questions the user should ask the other party.
       - Location: Section/Page reference (e.g., "Page 3").
    5. Break the document into logical "Sections".
       - Summary of the section in plain English.
       - Status: GOOD, NEUTRAL, or CONCERN.
       - Location: Section/Page reference.
    6. Identify any "Missing Clauses" standard for this doc type.

    Return strictly JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data: fileBase64 } },
          { text: prompt }
        ]
      },
      config: {
        // Removed thinkingConfig to significantly improve speed
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentType: { type: Type.STRING },
            riskScore: { type: Type.INTEGER },
            riskLabel: { type: Type.STRING },
            summary: { type: Type.STRING },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            redFlags: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] },
                  explanation: { type: Type.STRING },
                  excerpt: { type: Type.STRING },
                  questions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  location: { type: Type.STRING }
                }
              }
            },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ["GOOD", "NEUTRAL", "CONCERN"] },
                  location: { type: Type.STRING }
                }
              }
            },
            missingClauses: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    // Strip markdown code blocks if present
    let text = response.text || '{}';
    text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error("JSON parse failed", e);
      result = {};
    }
    
    // Helper to clean strings
    const cleanString = (s: string) => s.replace(/^[\s•\-\*]+/, '').trim();

    // Sanitize and ensure defaults
    return {
      documentType: result.documentType || "Unknown Document",
      riskScore: typeof result.riskScore === 'number' ? result.riskScore : 0,
      riskLabel: result.riskLabel || "Unassessed",
      summary: result.summary || "Analysis not available.",
      keyPoints: Array.isArray(result.keyPoints) 
        ? result.keyPoints.map(cleanString) 
        : [],
      redFlags: Array.isArray(result.redFlags) ? result.redFlags.map((flag: any) => ({
        ...flag,
        questions: Array.isArray(flag.questions) ? flag.questions : []
      })) : [],
      sections: Array.isArray(result.sections) ? result.sections : [],
      missingClauses: Array.isArray(result.missingClauses) ? result.missingClauses : [],
      docId: crypto.randomUUID(),
      fileName,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("Analysis failed:", error);
    throw new Error("Failed to analyze document. Please try again.");
  }
};

// 2. Chat with Document (Conversational)
export const chatWithDocument = async (
  history: { role: string; text: string }[],
  message: string,
  docContext: any // Passing the full analysis object/summary
) => {
  
  const systemInstruction = `
    You are DocuClear, a helpful, empathetic legal assistant.
    The user is looking at a document with the following analysis:
    ${JSON.stringify(docContext, null, 2)}
    
    Rules:
    - Answer in plain, conversational English.
    - Reference specific sections or red flags from the analysis context.
    - Be concise but accurate.
    - If unsure, say so. Do not invent legal advice.
    - Always remind the user you are an AI if the question is serious.
    - You can use Markdown tables, bolding, and lists to format your response clearly.
    - CITATIONS: When you refer to a specific page or section, format it as a markdown link that I can intercept. 
      Example: "As seen in [Section 5](#section=5)" or "on [Page 3](#page=3)". 
      Use the '#' prefix in the url to signal it's a document location.
  `;

  const contents = [
    ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: 'user', parts: [{ text: message }] }
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: { systemInstruction }
  });

  return response.text;
};

// 3. Search Grounding (Legal Check)
export const checkLegalPrecedence = async (query: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Use flash for search as requested
      contents: `Search for recent legal context, laws, or precedence regarding: ${query}. Return a brief summary with sources.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(
      (c: any) => c.web ? { title: c.web.title, uri: c.web.uri } : null
    ).filter(Boolean) || [];

    return { text, sources };
  } catch (e) {
    console.error("Search failed", e);
    return { text: "Could not perform search.", sources: [] };
  }
};

// 4. Text-to-Speech
export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: { parts: [{ text }] },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data returned");
  
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// 5. Generate Visual (Image Generation)
export const generateDocumentVisual = async (docType: string, summary: string): Promise<string | null> => {
  try {
    const prompt = `Create a minimal, abstract, professional icon or illustration representing a "${docType}". 
    Style: Vector art, flat design, earth tones (beige, brown, dark grey), simple, clean lines. No text in the image.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      // Guidelines: DO NOT set responseMimeType or responseSchema for nano banana series (image gen) models
    });

    // Iterate through parts to find the image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return part.inlineData.data;
      }
    }
    return null;
  } catch (error) {
    console.error("Failed to generate visual", error);
    return null;
  }
};