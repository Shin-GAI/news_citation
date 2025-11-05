
import React from 'react';
import { AnalysisResult, KoreanArticle } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { LinkIcon, CheckCircleIcon, XCircleIcon, DocumentTextIcon } from './icons';

interface AnalysisPanelProps {
  isLoading: boolean;
  selectedArticle: KoreanArticle | null;
  analysisResult: AnalysisResult | null;
  error: string | null;
}

const ScoreIndicator: React.FC<{ score: number }> = ({ score }) => {
    // FIX: Corrected typo from constbgColor to const bgColor
    const bgColor = score >= 4 ? 'bg-green-500' : score >= 2 ? 'bg-yellow-500' : 'bg-red-500';
    const width = `${score * 20}%`;
    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className={`${bgColor} h-2.5 rounded-full`} style={{ width }}></div>
        </div>
    );
};

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ isLoading, selectedArticle, analysisResult, error }) => {
  if (isLoading) {
    return <LoadingSpinner message="AI가 기사를 분석하고 있습니다..." />;
  }

  if (error) {
    return (
        <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col items-center text-center">
            <XCircleIcon className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400">분석 중 오류 발생</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</p>
        </div>
    );
  }

  if (!selectedArticle) {
    return (
      <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col items-center text-center">
        <DocumentTextIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">기사를 선택하여 분석을 시작하세요</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">왼쪽 목록에서 기사를 클릭하면 인용 정확도 분석이 시작됩니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">분석 결과: {selectedArticle.title}</h2>
      </div>

      {!analysisResult?.citation && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-300">이 기사에서는 해외 언론 인용을 찾을 수 없었습니다.</p>
        </div>
      )}

      {analysisResult?.citation && (
        <div className="space-y-6">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">인용된 해외 언론</h3>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{analysisResult.citation.source}</p>
            <blockquote className="mt-2 p-3 bg-gray-100 dark:bg-gray-700/50 border-l-4 border-blue-500 text-gray-600 dark:text-gray-300 rounded-r-lg">
              "{analysisResult.citation.quote}"
            </blockquote>
          </div>
          
          {analysisResult.originalArticle ? (
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200">검색된 원문 기사</h3>
              <a href={analysisResult.originalArticle.url} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-green-600 dark:text-green-400 hover:underline flex items-center">
                {analysisResult.originalArticle.title} <LinkIcon className="ml-2"/>
              </a>
              <p className="mt-2 p-3 bg-gray-100 dark:bg-gray-700/50 text-sm text-gray-600 dark:text-gray-300 rounded-lg">
                {analysisResult.originalArticle.snippet}
              </p>
            </div>
          ) : (
             <div className="p-4 border border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/50 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200">인용에 해당하는 원문 기사를 찾을 수 없었습니다.</p>
            </div>
          )}

          {analysisResult.evaluation && (
             <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">인용 정확도 평가</h3>
                <div className="flex items-center gap-4 mb-3">
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">{analysisResult.evaluation.score.toFixed(1)} / 5.0</span>
                    <ScoreIndicator score={analysisResult.evaluation.score} />
                </div>
              <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700/50 text-sm text-gray-600 dark:text-gray-300 rounded-lg space-y-2">
                 <p>{analysisResult.evaluation.summary}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;
