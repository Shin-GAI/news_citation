
import React, { useState } from 'react';
import { SearchIcon, ChevronDownIcon, ChevronUpIcon } from './icons';

interface SearchFormProps {
  keywords: string;
  setKeywords: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  publisherFilter: string;
  setPublisherFilter: (value: string) => void;
  citationFilter: boolean;
  setCitationFilter: (value: boolean) => void;
  onSearch: () => void;
  articleUrl: string;
  setArticleUrl: (value: string) => void;
  onUrlSearch: () => void;
  isKeywordSearchLoading: boolean;
  isUrlSearchLoading: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({
  keywords,
  setKeywords,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  publisherFilter,
  setPublisherFilter,
  citationFilter,
  setCitationFilter,
  onSearch,
  articleUrl,
  setArticleUrl,
  onUrlSearch,
  isKeywordSearchLoading,
  isUrlSearchLoading,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const commonInputClasses = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-100 dark:border-gray-500 dark:placeholder-gray-500 dark:text-gray-900";

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4">
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">키워드로 검색</h2>
        <div>
          <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            키워드
          </label>
          <input
            type="text"
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="예: 'AI 반도체 정책'"
            className={commonInputClasses}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              시작일
            </label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={commonInputClasses}
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              종료일
            </label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={commonInputClasses}
            />
          </div>
        </div>

        {/* Advanced Search Toggle */}
        <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 py-2 rounded-lg"
        >
            {showAdvanced ? '상세 검색 옵션 숨기기' : '상세 검색 옵션 보기'}
            {showAdvanced ? <ChevronUpIcon className="ml-2 w-4 h-4" /> : <ChevronDownIcon className="ml-2 w-4 h-4" />}
        </button>

        {/* Advanced Search Fields */}
        {showAdvanced && (
            <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div>
                    <label htmlFor="publisher" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        언론사
                    </label>
                    <input
                        type="text"
                        id="publisher"
                        value={publisherFilter}
                        onChange={(e) => setPublisherFilter(e.target.value)}
                        placeholder="예: 연합뉴스"
                        className={commonInputClasses}
                    />
                </div>
                <div className="flex items-center">
                    <input
                        id="citation-filter"
                        type="checkbox"
                        checked={citationFilter}
                        onChange={(e) => setCitationFilter(e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="citation-filter" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                        외신 인용 포함
                    </label>
                </div>
            </div>
        )}

        <button
          onClick={onSearch}
          disabled={isKeywordSearchLoading || isUrlSearchLoading || !keywords}
          className="w-full flex items-center justify-center bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-300"
        >
          <SearchIcon className="w-5 h-5 mr-2" />
          {isKeywordSearchLoading ? '검색 중...' : '기사 검색'}
        </button>
      </div>
      
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white dark:bg-gray-800 px-2 text-sm text-gray-500 dark:text-gray-400">
            또는
          </span>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">URL로 직접 분석</h2>
        <div>
          <label htmlFor="article-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            기사 URL
          </label>
          <input
            type="url"
            id="article-url"
            value={articleUrl}
            onChange={(e) => setArticleUrl(e.target.value)}
            placeholder="https://example.com/news/article"
            className={commonInputClasses}
          />
        </div>
        <button
          onClick={onUrlSearch}
          disabled={isKeywordSearchLoading || isUrlSearchLoading || !articleUrl}
          className="w-full flex items-center justify-center bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors duration-300"
        >
          <SearchIcon className="w-5 h-5 mr-2" />
          {isUrlSearchLoading ? '분석 중...' : 'URL로 분석'}
        </button>
      </div>
    </div>
  );
};

export default SearchForm;