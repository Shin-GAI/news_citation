export interface KoreanArticle {
  title: string;
  summary: string;
  url: string;
  publisher: string;
  publishedDate?: string;
}

export interface Citation {
  source: string;
  quote: string;
}

export interface OriginalArticle {
  title: string;
  url: string;
  snippet: string;
}

export interface Evaluation {
  summary: string;
  score: number;
}

export interface AnalysisResult {
  citation: Citation | null;
  originalArticle: OriginalArticle | null;
  evaluation: Evaluation | null;
}

export interface FullAnalysis {
  koreanArticle: KoreanArticle;
  analysisResult: AnalysisResult;
}

export interface LoadingState {
  search: boolean;
  analysis: boolean;
  url: boolean;
}

// FIX: Removed the global declaration for `window.aistudio` to resolve a type conflict.
// The type definition is expected to be provided by the execution environment.