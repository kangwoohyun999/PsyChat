// utils/keywordExtractor.js
import { WORD_DICT } from './wordDictionary';

/**
 * 키워드 추출 결과 타입
 * @typedef {Object} KeywordResult
 * @property {string[]} keywords - 추출된 키워드 배열
 * @property {Object} counts - 키워드별 등장 횟수 { keyword: count }
 * @property {Object} weighted - 키워드별 가중치 합계 { keyword: totalWeight }
 * @property {Object} positions - 키워드별 등장 위치 { keyword: [index1, index2, ...] }
 */

/**
 * 텍스트 전처리
 * @param {string} text - 원본 텍스트
 * @returns {string} 정규화된 텍스트
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .trim()
    // 영문은 소문자로
    .replace(/[A-Z]/g, (char) => char.toLowerCase())
    // 특수문자는 공백으로 (한글, 영문, 숫자 제외)
    .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ')
    // 연속된 공백은 하나로
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 텍스트를 토큰으로 분리
 * @param {string} text - 정규화된 텍스트
 * @returns {string[]} 토큰 배열
 */
function tokenize(text) {
  return text.split(/\s+/).filter(Boolean);
}

/**
 * 키워드와 가중치 추출 (개선된 버전)
 * @param {string} text - 분석할 텍스트
 * @param {Object} options - 옵션
 * @param {boolean} options.caseSensitive - 대소문자 구분 (기본: false)
 * @param {boolean} options.exactMatch - 정확히 일치하는 것만 (기본: false)
 * @param {number} options.minTokenLength - 최소 토큰 길이 (기본: 1)
 * @returns {KeywordResult}
 */
export function extractKeywordsWithWeights(text, options = {}) {
  const {
    caseSensitive = false,
    exactMatch = false,
    minTokenLength = 1,
  } = options;

  // 빈 텍스트 처리
  if (!text || typeof text !== 'string') {
    return {
      keywords: [],
      counts: {},
      weighted: {},
      positions: {},
    };
  }

  // 텍스트 전처리
  const normalizedText = normalizeText(text);
  const tokens = tokenize(normalizedText);

  // 결과 저장용 객체
  const counts = {};
  const weighted = {};
  const positions = {};
  const matchedTokens = new Set(); // 이미 매칭된 토큰 추적

  // 각 토큰에 대해 사전 검색
  tokens.forEach((token, tokenIndex) => {
    // 최소 길이 체크
    if (token.length < minTokenLength) return;

    // 이미 매칭된 토큰은 스킵 (중복 방지)
    if (matchedTokens.has(tokenIndex)) return;

    // 사전의 각 키워드 확인
    Object.entries(WORD_DICT).forEach(([key, info]) => {
      const { synonyms = [], weight = 1, sentiment } = info;

      // 동의어 배열에서 매칭 확인
      const isMatched = synonyms.some((syn) => {
        if (!syn) return false;

        const normalizedSyn = caseSensitive ? syn : syn.toLowerCase();
        const normalizedToken = caseSensitive ? token : token.toLowerCase();

        if (exactMatch) {
          // 정확히 일치
          return normalizedToken === normalizedSyn;
        } else {
          // 부분 매칭 (단, 동의어가 토큰에 포함되고, 토큰이 동의어로 시작하거나 끝날 때만)
          return (
            normalizedToken.includes(normalizedSyn) &&
            (normalizedToken.startsWith(normalizedSyn) ||
              normalizedToken.endsWith(normalizedSyn))
          );
        }
      });

      if (isMatched) {
        // 카운트 증가
        counts[key] = (counts[key] || 0) + 1;
        
        // 가중치 누적
        weighted[key] = (weighted[key] || 0) + weight;
        
        // 위치 저장
        if (!positions[key]) {
          positions[key] = [];
        }
        positions[key].push(tokenIndex);

        // 매칭된 토큰 표시
        matchedTokens.add(tokenIndex);
      }
    });
  });

  // 키워드 배열 생성 (빈도순 정렬)
  const keywords = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

  return {
    keywords,
    counts,
    weighted,
    positions,
    meta: {
      totalTokens: tokens.length,
      matchedTokens: matchedTokens.size,
      matchRate: tokens.length > 0 
        ? Number((matchedTokens.size / tokens.length).toFixed(3))
        : 0,
    },
  };
}

/**
 * 고성능 키워드 추출 (대용량 텍스트용)
 * @param {string} text - 분석할 텍스트
 * @returns {KeywordResult}
 */
export function extractKeywordsOptimized(text) {
  if (!text || typeof text !== 'string') {
    return {
      keywords: [],
      counts: {},
      weighted: {},
      positions: {},
    };
  }

  const normalizedText = normalizeText(text);
  
  // 사전을 Trie 또는 해시맵으로 변환 (한 번만 수행)
  const synonymMap = new Map();
  
  Object.entries(WORD_DICT).forEach(([key, info]) => {
    const { synonyms = [], weight = 1 } = info;
    synonyms.forEach((syn) => {
      if (syn) {
        const normalizedSyn = syn.toLowerCase();
        if (!synonymMap.has(normalizedSyn)) {
          synonymMap.set(normalizedSyn, []);
        }
        synonymMap.get(normalizedSyn).push({ key, weight });
      }
    });
  });

  const counts = {};
  const weighted = {};
  const positions = {};

  // 슬라이딩 윈도우로 매칭
  const tokens = tokenize(normalizedText);
  
  tokens.forEach((token, index) => {
    const normalizedToken = token.toLowerCase();
    
    // 정확히 일치하는 동의어 찾기
    if (synonymMap.has(normalizedToken)) {
      synonymMap.get(normalizedToken).forEach(({ key, weight }) => {
        counts[key] = (counts[key] || 0) + 1;
        weighted[key] = (weighted[key] || 0) + weight;
        
        if (!positions[key]) positions[key] = [];
        positions[key].push(index);
      });
    } else {
      // 부분 매칭 (시작 또는 끝 일치)
      synonymMap.forEach((infos, syn) => {
        if (
          normalizedToken.startsWith(syn) ||
          normalizedToken.endsWith(syn)
        ) {
          infos.forEach(({ key, weight }) => {
            counts[key] = (counts[key] || 0) + 1;
            weighted[key] = (weighted[key] || 0) + weight;
            
            if (!positions[key]) positions[key] = [];
            positions[key].push(index);
          });
        }
      });
    }
  });

  const keywords = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

  return {
    keywords,
    counts,
    weighted,
    positions,
    meta: {
      totalTokens: tokens.length,
      uniqueKeywords: keywords.length,
    },
  };
}

/**
 * 키워드 하이라이팅 (텍스트에서 키워드 위치 표시)
 * @param {string} text - 원본 텍스트
 * @param {string[]} keywords - 하이라이트할 키워드
 * @returns {Array<{text: string, isKeyword: boolean, keyword?: string}>}
 */
export function highlightKeywords(text, keywords) {
  if (!text || !keywords || keywords.length === 0) {
    return [{ text, isKeyword: false }];
  }

  const result = [];
  let currentIndex = 0;
  const normalizedText = text.toLowerCase();

  // 모든 키워드의 모든 동의어 찾기
  const allSynonyms = [];
  keywords.forEach((keyword) => {
    const info = WORD_DICT[keyword];
    if (info && info.synonyms) {
      info.synonyms.forEach((syn) => {
        allSynonyms.push({ keyword, synonym: syn });
      });
    }
  });

  // 텍스트에서 동의어 위치 찾기
  const matches = [];
  allSynonyms.forEach(({ keyword, synonym }) => {
    let index = 0;
    while ((index = normalizedText.indexOf(synonym.toLowerCase(), index)) !== -1) {
      matches.push({
        start: index,
        end: index + synonym.length,
        keyword,
        text: text.substring(index, index + synonym.length),
      });
      index++;
    }
  });

  // 위치순 정렬
  matches.sort((a, b) => a.start - b.start);

  // 겹치는 매칭 제거
  const filteredMatches = [];
  let lastEnd = -1;
  matches.forEach((match) => {
    if (match.start >= lastEnd) {
      filteredMatches.push(match);
      lastEnd = match.end;
    }
  });

  // 결과 생성
  filteredMatches.forEach((match) => {
    // 매칭 이전 텍스트
    if (currentIndex < match.start) {
      result.push({
        text: text.substring(currentIndex, match.start),
        isKeyword: false,
      });
    }

    // 매칭된 키워드
    result.push({
      text: match.text,
      isKeyword: true,
      keyword: match.keyword,
    });

    currentIndex = match.end;
  });

  // 남은 텍스트
  if (currentIndex < text.length) {
    result.push({
      text: text.substring(currentIndex),
      isKeyword: false,
    });
  }

  return result;
}

/**
 * 레거시 호환 함수
 */
export function extractKeywordsWithWeightsLegacy(text) {
  const result = extractKeywordsWithWeights(text);
  return {
    keywords: result.keywords,
    counts: result.counts,
    weighted: result.weighted,
  };
}