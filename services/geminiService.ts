import { GoogleGenAI, Type } from "@google/genai";
import { KoreanArticle, Citation, OriginalArticle, Evaluation, FullAnalysis, AnalysisResult } from '../types';

const getAiClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const parseJsonFromMarkdown = <T,>(markdown: string): T | null => {
    try {
        const jsonMatch = markdown.match(/```json\n([\s\S]*?)\n```/);
        if (!jsonMatch) {
            // If no markdown block, try parsing directly as the model might return raw JSON
            try {
                return JSON.parse(markdown);
            } catch (e) {
                console.error("String is not a valid JSON:", markdown);
                return null;
            }
        };
        return JSON.parse(jsonMatch[1]);
    } catch (e) {
        console.error("Failed to parse JSON from markdown:", e);
        return null;
    }
};

export const findKoreanArticles = async (
    keywords: string, 
    startDate: string, 
    endDate: string, 
    publisher: string, 
    mustHaveCitation: boolean
): Promise<KoreanArticle[]> => {
    const ai = getAiClient();
    let prompt = `"${keywords}"에 대한 한국어 뉴스 기사를 ${startDate}부터 ${endDate}까지 검색해줘.`;

    if (publisher) {
        prompt += ` 발행인은 "${publisher}" 이어야 합니다.`;
    }
    if (mustHaveCitation) {
        prompt += ` 반드시 외신 인용문(예: 로이터, AP, BBC 등)이 포함되어야 합니다.`;
    }

    prompt += ` 각 기사에 대해 제목, 2-3문장의 상세한 요약, 출판사, 원문 URL, 그리고 기사 발행일 또는 최종 수정일을 'YYYY-MM-DD' 형식으로 포함한 정보를 제공해줘. 응답은 반드시 다음 영문 키를 사용하는 JSON 객체들의 배열이어야 해: "title", "summary", "publisher", "url", "publishedDate". 전체 응답을 하나의 JSON 마크다운 코드 블록 안에 넣어줘.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const articles = parseJsonFromMarkdown<any>(response.text);

    // FIX: Ensure the returned value is always an array to prevent runtime errors.
    if (Array.isArray(articles)) {
        return articles;
    }

    // The model might have wrapped the result in an object like { "articles": [...] }
    if (articles && typeof articles === 'object' && !Array.isArray(articles)) {
        const key = Object.keys(articles)[0];
        if(key && Array.isArray(articles[key])) {
            return articles[key];
        }
    }

    console.warn("Article search did not return a valid array. Raw response text:", response.text);
    return [];
};

export const extractArticleFromUrl = async (url: string): Promise<KoreanArticle | null> => {
    const ai = getAiClient();
    const prompt = `
    You are an expert-level AI system designed for one purpose: extracting structured data from news article URLs. Your performance is measured by your ability to return valid JSON, even in cases of failure.

    Your task is to analyze the content of the news article at this URL: ${url}

    **Multi-Step Extraction Protocol:**

    1.  **Primary Method: URL Content Retrieval via Search**.
        *   Use your Google Search tool to find the indexed content for the exact URL: "${url}".
        *   The URL may redirect; ensure you are analyzing the content of the final destination page.
        *   From the retrieved content, parse the main article body. Exclude all non-essential elements like ads, comments, and site navigation.

    2.  **Secondary Method: Title-Based Search (Fallback)**.
        *   If the primary method fails to retrieve the full article text (e.g., the page is not indexed, behind a paywall, or the search result is just a snippet), do not give up.
        *   Attempt to find the article's title from the initial search result snippet.
        *   Perform a new Google search using the extracted article title, combined with the likely news source name. This may lead you to an accessible version of the article.

    **Output Requirements (Strictly Enforced):**

    *   **On Success**: If you successfully extract the content using *any* method, your entire response MUST be a single JSON object inside a markdown code block. The object must have these exact keys:
        - \`title\`: The full title of the article.
        - \`publisher\`: The name of the news publication.
        - \`summary\`: A comprehensive summary of the article's main points.
        - \`url\`: The original URL provided: "${url}"
        - \`publishedDate\`: The publication date in 'YYYY-MM-DD' format. If the date is not found, use \`null\`.

    *   **On Failure**: If, after attempting BOTH the primary and secondary methods, you still cannot reliably extract the article's content, your entire response MUST be the value \`null\` inside a JSON markdown block.

    **Absolutely NO conversational text, apologies, or explanations are allowed in your final output.** Your response will be machine-parsed, and any deviation from the specified JSON format will cause a system failure.

    Example of successful output:
    \`\`\`json
    {
      "title": "...",
      "publisher": "...",
      "summary": "...",
      "url": "${url}",
      "publishedDate": "2024-05-21"
    }
    \`\`\`

    Example of failure output:
    \`\`\`json
    null
    \`\`\`
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    return parseJsonFromMarkdown<KoreanArticle>(response.text);
};


export const analyzeArticle = async (article: KoreanArticle): Promise<AnalysisResult | null> => {
    const ai = getAiClient();
    const prompt = `
    You are an AI fact-checker specializing in journalism. Your task is to analyze the provided Korean news article to verify a citation from foreign press.

    Korean Article Details:
    - Title: ${article.title}
    - Content Summary: ${article.summary}
    - URL: ${article.url}

    Please follow these steps meticulously and return a single JSON object in a markdown code block with the specified "AnalysisResult" structure.

    1. **Identify Foreign Press Citation**:
       - Carefully scan the article's content for any mention of or quote attributed to a non-Korean news source.
       - Be comprehensive. Recognize full names (e.g., The New York Times, The Washington Post, Reuters, Associated Press, Bloomberg) and common abbreviations (e.g., NYT, WP, AP).
       - If a citation is found, extract the source's name (standardized English name) and the exact quoted text from the Korean article.
       - If NO foreign press citation is found, the 'citation' field in the JSON output MUST be null. Stop processing and return immediately.

    2. **Find the Original Source Article (Enhanced Search Strategy)**:
       - This step is ONLY performed if a citation was identified in Step 1.
       - First, translate the Korean 'quote' into English to create a 'search_quote'.
       - **Attempt 1 (High-Precision Search)**: Perform a targeted search for the exact "search_quote" within the source's domain (e.g., using 'site:nytimes.com').
       - **Attempt 2 (Keyword Search)**: If Attempt 1 fails, extract the key entities (names, places, concepts) from the 'search_quote' and search for them along with the source's name.
       - **Attempt 3 (Flexible Search)**: If still no match, search for paraphrased versions of the 'search_quote' that convey the same core meaning.
       - If you successfully locate the original source article through any of these attempts, provide its full title, a direct, clickable URL, and a relevant snippet from the original article that contains the quoted information.
       - CRITICAL: Only if ALL of these search attempts fail to yield a definitive original article, the 'originalArticle' field MUST be null.

    3. **Provide a Neutral Evaluation**:
       - This step is ONLY performed if both a citation (Step 1) and an original article (Step 2) were found.
       - Compare the translated quote in the Korean article with the text from the original English snippet.
       - Provide a neutral, objective analysis in the 'summary'. Your analysis should address:
         - **Translation Accuracy**: Is the translation faithful to the original?
         - **Context Preservation**: Is the original context maintained, or is the quote used in a misleading way?
         - **Omissions/Additions**: Has any crucial information been left out or added?
         - **Nuance**: Are there any subtle changes in meaning or tone?
       - Provide an accuracy score from 1 (very inaccurate/misleading) to 5 (perfectly accurate and contextualized).
       - If a full evaluation cannot be performed, the 'evaluation' field must be null.

    Required JSON Output Structure for AnalysisResult:
    {
      "citation": { "source": "The New York Times", "quote": "인용된 한국어 문장..." } | null,
      "originalArticle": { "title": "Original English Article Title", "url": "https://...", "snippet": "The original English sentence that was quoted..." } | null,
      "evaluation": { "summary": "번역은 정확하지만, 원문의 미묘한 뉘앙스 일부가 생략되었습니다...", "score": 4.5 } | null
    }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    return parseJsonFromMarkdown<AnalysisResult>(response.text);
};