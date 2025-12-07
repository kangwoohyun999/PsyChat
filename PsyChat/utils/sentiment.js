// utils/sentiment.js
import { WORD_DICT } from './wordDictionary';

/**
 * 감성 분석 결과 타입
 * @typedef {Object} SentimentResult
 * @property {string} label - 감정 레이블 ('very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative')
 * @property {number} score - 감정 점수 (-1.0 ~ 1.0)
 * @property {number} rawScore - 정규화 전 원본 점수
 * @property {number} confidence - 신뢰도 (0.0 ~ 1.0)
 */

/**
 * 가중치 기반 감성 분석
 * @param {Object} weighted - 키워드별 가중치 { keyword: weight, ... }
 * @param {Object} options - 옵션
 * @param {number} options.positiveThreshold - 긍정 임계값 (기본: 0.3)
 * @param {number} options.negativeThreshold - 부정 임계값 (기본: -0.3)
 * @param {number} options.veryPositiveThreshold - 매우 긍정 임계값 (기본: 0.6)
 * @param {number} options.veryNegativeThreshold - 매우 부정 임계값 (기본: -0.6)
 * @param {boolean} options.normalize - 정규화 여부 (기본: true)
 * @returns {SentimentResult}
 */
export function estimateSentimentFromWeighted(
  weighted,
  options = {}
) {
  const {
    positiveThreshold = 0.3,
    negativeThreshold = -0.3,
    veryPositiveThreshold = 0.6,
    veryNegativeThreshold = -0.6,
    normalize = true,
  } = options;

  // 빈 입력 처리
  if (!weighted || Object.keys(weighted).length === 0) {
    return {
      label: 'neutral',
      score: 0,
      rawScore: 0,
      confidence: 0,
    };
  }

  // 원본 점수 계산
  let rawScore = 0;
  let totalWeight = 0;
  let positiveCount = 0;
  let negativeCount = 0;

  Object.keys(weighted).forEach((key) => {
    const weight = weighted[key] || 0;
    totalWeight += Math.abs(weight);

    const wordInfo = WORD_DICT[key];
    if (!wordInfo) return;

    const sentiment = wordInfo.sentiment || 'neutral';

    if (sentiment === 'positive') {
      rawScore += weight;
      positiveCount++;
    } else if (sentiment === 'negative') {
      rawScore -= weight;
      negativeCount++;
    }
  });

  // 정규화된 점수 계산 (-1.0 ~ 1.0)
  let normalizedScore = rawScore;
  if (normalize && totalWeight > 0) {
    normalizedScore = rawScore / totalWeight;
    // -1.0 ~ 1.0 범위로 제한
    normalizedScore = Math.max(-1.0, Math.min(1.0, normalizedScore));
  }

  // 신뢰도 계산 (감정 키워드가 많을수록 신뢰도 높음)
  const totalEmotionWords = positiveCount + negativeCount;
  const totalWords = Object.keys(weighted).length;
  const confidence = totalWords > 0 
    ? Math.min(1.0, totalEmotionWords / Math.max(3, totalWords))
    : 0;

  // 감정 레이블 결정
  let label = 'neutral';
  const score = normalizedScore;

  if (score >= veryPositiveThreshold) {
    label = 'very_positive';
  } else if (score >= positiveThreshold) {
    label = 'positive';
  } else if (score <= veryNegativeThreshold) {
    label = 'very_negative';
  } else if (score <= negativeThreshold) {
    label = 'negative';
  }

  return {
    label,
    score: Number(score.toFixed(3)),
    rawScore: Number(rawScore.toFixed(3)),
    confidence: Number(confidence.toFixed(3)),
    details: {
      positiveCount,
      negativeCount,
      totalWords,
      totalWeight: Number(totalWeight.toFixed(3)),
    },
  };
}

/**
 * 감정 레이블을 한글로 변환
 * @param {string} label - 감정 레이블
 * @returns {string} 한글 감정 표현
 */
export function getLabelText(label) {
  const labelMap = {
    very_positive: '매우 긍정적',
    positive: '긍정적',
    neutral: '중립적',
    negative: '부정적',
    very_negative: '매우 부정적',
  };
  return labelMap[label] || '알 수 없음';
}

/**
 * 감정 레이블에 해당하는 이모지 반환
 * @param {string} label - 감정 레이블
 * @returns {string} 이모지
 */
export function getLabelEmoji(label) {
  const emojiMap = {
    very_positive: '😄',
    positive: '😊',
    neutral: '😐',
    negative: '😔',
    very_negative: '😢',
  };
  return emojiMap[label] || '🤔';
}

/**
 * 감정 점수를 퍼센트로 변환
 * @param {number} score - 감정 점수 (-1.0 ~ 1.0)
 * @returns {number} 퍼센트 (0 ~ 100)
 */
export function scoreToPercent(score) {
  // -1.0 ~ 1.0 → 0 ~ 100
  return Math.round((score + 1) * 50);
}

/**
 * 레거시 호환성을 위한 함수 (기존 코드와 호환)
 * @param {Object} weighted
 * @returns {Object} { label: 'positive' | 'negative' | 'neutral', score: number }
 */
export function estimateSentimentFromWeightedLegacy(weighted) {
  const result = estimateSentimentFromWeighted(weighted);
  
  // very_positive와 very_negative를 positive/negative로 변환
  let label = result.label;
  if (label === 'very_positive') label = 'positive';
  if (label === 'very_negative') label = 'negative';
  
  return {
    label,
    score: result.score,
  };
}