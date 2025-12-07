// utils/emotionToColor.js
import { SENTIMENT_COLORS } from './wordDictionary';

/**
 * 감정 점수를 색상으로 변환 (레거시 - 점수 기반)
 * @param {number} score - 감정 점수 (0~1 사이, 긍정 확률)
 * @returns {string} 색상 코드
 * @deprecated 대신 emotionLabelToColor 사용 권장
 */
export function emotionToColor(score) {
  if (score >= 0.7) return "#FFD93D"; // 매우 긍정 - 밝은 노랑
  if (score >= 0.5) return "#6BCB77"; // 긍정 - 초록
  if (score >= 0.3) return "#94A3B8"; // 중립 - 회색
  if (score >= 0.15) return "#4D96FF"; // 부정 - 파랑
  return "#6A4C93"; // 매우 부정 - 보라
}

/**
 * 감정 레이블을 색상으로 변환 (권장)
 * @param {string} label - 감정 레이블 ('very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative')
 * @returns {string} 색상 코드
 */
export function emotionLabelToColor(label) {
  return SENTIMENT_COLORS[label] || SENTIMENT_COLORS.neutral;
}

/**
 * 감정 점수를 세밀한 색상 그라데이션으로 변환
 * @param {number} score - 감정 점수 (-1.0 ~ 1.0)
 * @returns {string} 색상 코드
 */
export function emotionScoreToGradientColor(score) {
  // -1.0 ~ 1.0 범위로 정규화
  const normalizedScore = Math.max(-1, Math.min(1, score));

  // 매우 부정 → 부정 → 중립 → 긍정 → 매우 긍정
  if (normalizedScore <= -0.6) {
    // 매우 부정: 진한 빨강 계열
    return interpolateColor("#DC2626", "#EF4444", (normalizedScore + 1) / 0.4);
  } else if (normalizedScore <= -0.2) {
    // 부정: 주황 계열
    return interpolateColor("#EF4444", "#F59E0B", (normalizedScore + 0.6) / 0.4);
  } else if (normalizedScore <= 0.2) {
    // 중립: 회색 계열
    return interpolateColor("#F59E0B", "#94A3B8", (normalizedScore + 0.2) / 0.4);
  } else if (normalizedScore <= 0.6) {
    // 긍정: 초록 계열
    return interpolateColor("#94A3B8", "#34D399", (normalizedScore - 0.2) / 0.4);
  } else {
    // 매우 긍정: 밝은 초록 계열
    return interpolateColor("#34D399", "#10B981", (normalizedScore - 0.6) / 0.4);
  }
}

/**
 * 두 색상 사이를 보간
 * @param {string} color1 - 시작 색상 (hex)
 * @param {string} color2 - 끝 색상 (hex)
 * @param {number} ratio - 비율 (0~1)
 * @returns {string} 보간된 색상
 */
function interpolateColor(color1, color2, ratio) {
  const r = Math.max(0, Math.min(1, ratio));
  
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  
  const r_val = Math.round(c1.r + (c2.r - c1.r) * r);
  const g_val = Math.round(c1.g + (c2.g - c1.g) * r);
  const b_val = Math.round(c1.b + (c2.b - c1.b) * r);
  
  return rgbToHex(r_val, g_val, b_val);
}

/**
 * Hex 색상을 RGB로 변환
 * @param {string} hex - Hex 색상 코드
 * @returns {{r: number, g: number, b: number}}
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * RGB를 Hex로 변환
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex 색상 코드
 */
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * 감정 점수에 따른 투명도 계산
 * @param {number} score - 감정 점수 (-1.0 ~ 1.0)
 * @returns {number} 투명도 (0.0 ~ 1.0)
 */
export function emotionScoreToOpacity(score) {
  // 절대값이 클수록 불투명하게
  const absScore = Math.abs(score);
  return Math.min(0.3 + absScore * 0.7, 1.0); // 최소 0.3, 최대 1.0
}

/**
 * 감정 레이블에 따른 배경 그라데이션 생성
 * @param {string} label - 감정 레이블
 * @returns {Array<string>} [startColor, endColor]
 */
export function emotionLabelToGradient(label) {
  const gradients = {
    very_positive: ["#10B981", "#34D399"],
    positive: ["#34D399", "#6EE7B7"],
    neutral: ["#94A3B8", "#CBD5E1"],
    negative: ["#F59E0B", "#FCD34D"],
    very_negative: ["#EF4444", "#F87171"],
  };

  return gradients[label] || gradients.neutral;
}

/**
 * 감정 점수를 텍스트 색상으로 변환 (가독성 고려)
 * @param {number} score - 감정 점수 (-1.0 ~ 1.0)
 * @returns {string} 텍스트 색상 (밝은/어두운)
 */
export function emotionScoreToTextColor(score) {
  // 긍정적일수록 어두운 텍스트, 부정적일수록 밝은 텍스트
  return score > 0 ? "#1F2937" : "#F9FAFB";
}

/**
 * 감정별 추천 배경 패턴
 * @param {string} label - 감정 레이블
 * @returns {Object} 스타일 객체
 */
export function emotionLabelToBackgroundStyle(label) {
  const base = {
    backgroundColor: emotionLabelToColor(label),
  };

  switch (label) {
    case "very_positive":
      return {
        ...base,
        shadowColor: SENTIMENT_COLORS.very_positive,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      };
    case "positive":
      return {
        ...base,
        shadowColor: SENTIMENT_COLORS.positive,
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      };
    case "very_negative":
      return {
        ...base,
        shadowColor: SENTIMENT_COLORS.very_negative,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      };
    case "negative":
      return {
        ...base,
        shadowColor: SENTIMENT_COLORS.negative,
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      };
    default:
      return {
        ...base,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      };
  }
}

/**
 * 캘린더용 감정 색상 (파스텔 톤)
 * @param {string} label - 감정 레이블
 * @returns {string} 파스텔 색상 코드
 */
export function emotionLabelToPastelColor(label) {
  const pastelColors = {
    very_positive: "#D4EDDA",
    positive: "#E8F5E9",
    neutral: "#F5F7FA",
    negative: "#FFF3CD",
    very_negative: "#F8D7DA",
  };

  return pastelColors[label] || pastelColors.neutral;
}

/**
 * 감정 색상 테마 전체 반환
 * @param {string} label - 감정 레이블
 * @returns {Object} 색상 테마 객체
 */
export function getEmotionColorTheme(label) {
  return {
    primary: emotionLabelToColor(label),
    pastel: emotionLabelToPastelColor(label),
    gradient: emotionLabelToGradient(label),
    backgroundStyle: emotionLabelToBackgroundStyle(label),
  };
}