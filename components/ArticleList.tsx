import React from 'react';
import { KoreanArticle } from '../types';
import { LinkIcon } from './icons';

interface ArticleListProps {
  articles: KoreanArticle[];
  onArticleSelect: (article: KoreanArticle) => void;
  selectedArticleUrl: string | null;
}

const ArticleList: React.FC<ArticleListProps> = ({ articles, onArticleSelect, selectedArticleUrl }) => {
  if (articles.length === 0) {
    return (
        <div className="text-center py-10 px-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg h-full flex flex-col justify-center">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">검색 결과가 없습니다.</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">다른 키워드나 기간으로 검색해보세요.</p>
        </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col h-full">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white p-2 mb-2 flex-shrink-0">검색 결과</h2>
        <ul className="space-y-3 overflow-y-auto pr-2 flex-grow">
        {articles.map((article, index) => (
            <li
            key={article.url || index}
            onClick={() => onArticleSelect(article)}
            className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${selectedArticleUrl === article.url ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{article.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{article.summary}</p>
            <div className="flex justify-between items-center mt-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">{article.publisher}</span>
                  {article.publishedDate && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">{article.publishedDate}</span>
                  )}
                </div>
                <a href={article.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center text-xs text-blue-600 hover:underline dark:text-blue-400 flex-shrink-0 ml-2">
                기사 보기 <LinkIcon className="ml-1 w-3 h-3" />
                </a>
            </div>
            </li>
        ))}
        </ul>
    </div>
  );
};

export default ArticleList;