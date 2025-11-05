import React, { useState, useCallback, useEffect } from 'react';
import { KoreanArticle, AnalysisResult, LoadingState } from './types';
import * as geminiService from './services/geminiService';
import SearchForm from './components/SearchForm';
import ArticleList from './components/ArticleList';
import AnalysisPanel from './components/AnalysisPanel';
import LoadingSpinner from './components/LoadingSpinner';

function getISODate(offsetDays: number = 0): string {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split('T')[0];
}

const App: React.FC = () => {
    const [keywords, setKeywords] = useState<string>('AI 반도체');
    const [startDate, setStartDate] = useState<string>(getISODate(-7));
    const [endDate, setEndDate] = useState<string>(getISODate());
    const [articleUrl, setArticleUrl] = useState<string>('');
    const [publisherFilter, setPublisherFilter] = useState<string>('');
    const [citationFilter, setCitationFilter] = useState<boolean>(false);
    
    const [koreanArticles, setKoreanArticles] = useState<KoreanArticle[]>([]);
    const [selectedArticle, setSelectedArticle] = useState<KoreanArticle | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState<LoadingState>({ search: false, analysis: false, url: false });
    const [error, setError] = useState<string | null>(null);
    const [searchAttempted, setSearchAttempted] = useState<boolean>(false);

    const [isApiKeySelected, setIsApiKeySelected] = useState<boolean>(false);
    const [checkingApiKey, setCheckingApiKey] = useState<boolean>(true);

    useEffect(() => {
        const checkApiKey = async () => {
            setCheckingApiKey(true);
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setIsApiKeySelected(hasKey);
            setCheckingApiKey(false);
        };
        checkApiKey();
    }, []);

    const handleSelectApiKey = async () => {
        await window.aistudio.openSelectKey();
        setIsApiKeySelected(true);
        setError(null);
    };
    
    const handleError = (err: unknown, defaultMessage: string) => {
        console.error(err);
        let errorMessage = defaultMessage;
        if (err instanceof Error && (err.message.includes("PERMISSION_DENIED") || err.message.includes("API key not valid"))) {
            errorMessage = "API 키에 Google Search를 사용할 권한이 없습니다. 다른 키를 선택하고 다시 시도해주세요.";
            setIsApiKeySelected(false);
        }
        setError(errorMessage);
    };

    const handleSearch = useCallback(async () => {
        setLoading(prev => ({ ...prev, search: true }));
        setError(null);
        setKoreanArticles([]);
        setSelectedArticle(null);
        setAnalysisResult(null);
        setSearchAttempted(true);
        try {
            const articles = await geminiService.findKoreanArticles(keywords, startDate, endDate, publisherFilter, citationFilter);
            setKoreanArticles(articles);
        } catch (err) {
            handleError(err, "기사 검색에 실패했습니다. API 키 또는 네트워크 연결을 확인해주세요.");
        } finally {
            setLoading(prev => ({ ...prev, search: false }));
        }
    }, [keywords, startDate, endDate, publisherFilter, citationFilter]);

    const handleArticleSelect = useCallback(async (article: KoreanArticle) => {
        if (selectedArticle?.url === article.url) return;
        
        setSelectedArticle(article);
        setLoading(prev => ({ ...prev, analysis: true }));
        setError(null);
        setAnalysisResult(null);

        try {
            const result = await geminiService.analyzeArticle(article);
            setAnalysisResult(result);
        } catch (err) {
            handleError(err, "기사 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setLoading(prev => ({ ...prev, analysis: false }));
        }
    }, [selectedArticle]);

    const handleUrlSearch = useCallback(async () => {
        if (!articleUrl) return;

        setLoading(prev => ({ ...prev, url: true }));
        setError(null);
        setSelectedArticle(null);
        setAnalysisResult(null);

        try {
            const extractedArticle = await geminiService.extractArticleFromUrl(articleUrl);
            
            if (extractedArticle) {
                setSelectedArticle(extractedArticle);
                const analysis = await geminiService.analyzeArticle(extractedArticle);
                setAnalysisResult(analysis);
            } else {
                setError("URL에서 기사 내용을 추출할 수 없습니다. 기사가 삭제되었거나, 유료 콘텐츠이거나, 기술적인 문제로 접근이 어려울 수 있습니다.");
                setSelectedArticle(null);
            }
        } catch (err) {
            handleError(err, "URL 분석 중 오류가 발생했습니다. API 키 또는 네트워크 연결을 확인해주세요.");
            setSelectedArticle(null);
            setAnalysisResult(null);
        } finally {
            setLoading(prev => ({ ...prev, url: false }));
        }
    }, [articleUrl]);

    if (checkingApiKey) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <LoadingSpinner message="API 키 확인 중..." />
            </div>
        );
    }

    if (!isApiKeySelected) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col items-center text-center max-w-lg">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">API 키 선택 필요</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        이 애플리케이션의 모든 기능을 사용하려면 Google Search 연동이 활성화된 API 키가 필요합니다. 버튼을 클릭하여 API 키를 선택해주세요.
                    </p>
                    {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</p>}
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                        API 키 사용에는 요금이 부과될 수 있습니다. 자세한 내용은{' '}
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            결제 정보 문서
                        </a>
                        를 참고하세요.
                    </p>
                    <button
                        onClick={handleSelectApiKey}
                        className="bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300"
                    >
                        API 키 선택하기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
            <header className="bg-white dark:bg-gray-800 shadow-md">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 text-center">
                        뉴스 인용 검증기
                    </h1>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                        AI를 사용하여 뉴스 기사의 해외 언론 인용 정확도를 확인합니다.
                    </p>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <aside className="lg:col-span-4 xl:col-span-3">
                        <SearchForm 
                            keywords={keywords}
                            setKeywords={setKeywords}
                            startDate={startDate}
                            setStartDate={setStartDate}
                            endDate={endDate}
                            setEndDate={setEndDate}
                            publisherFilter={publisherFilter}
                            setPublisherFilter={setPublisherFilter}
                            citationFilter={citationFilter}
                            setCitationFilter={setCitationFilter}
                            onSearch={handleSearch}
                            articleUrl={articleUrl}
                            setArticleUrl={setArticleUrl}
                            onUrlSearch={handleUrlSearch}
                            isKeywordSearchLoading={loading.search}
                            isUrlSearchLoading={loading.url}
                        />
                    </aside>
                    <section className="lg:col-span-8 xl:col-span-4">
                        {loading.search && <LoadingSpinner message="기사를 검색하고 있습니다..." />}
                        
                        {!loading.search && searchAttempted && (
                             <ArticleList 
                                articles={koreanArticles} 
                                onArticleSelect={handleArticleSelect}
                                selectedArticleUrl={selectedArticle?.url ?? null}
                            />
                        )}

                         {!loading.search && !searchAttempted && (
                             <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col items-center text-center h-full justify-center">
                                 <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">검색을 시작하세요</h3>
                                 <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">키워드와 기간을 설정하고 '기사 검색' 버튼을 눌러주세요.</p>
                             </div>
                         )}
                    </section>
                    <section className="lg:col-span-12 xl:col-span-5">
                        <AnalysisPanel 
                            isLoading={loading.analysis || loading.url}
                            selectedArticle={selectedArticle}
                            analysisResult={analysisResult}
                            error={error}
                        />
                    </section>
                </div>
            </main>
        </div>
    );
};

export default App;