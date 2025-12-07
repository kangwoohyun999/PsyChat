// utils/storage.js
import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage Keys
const KEYS = {
  ENTRIES: "CONDITION_ENTRIES_V3",
  MOOD_COLORS: "MOOD_COLORS_V2",
  USER_SETTINGS: "USER_SETTINGS_V1",
};

/**
 * Entry 저장
 * @param {Object} entry - 일기 항목
 * @returns {Promise<boolean>}
 */
export async function saveEntry(entry) {
  try {
    const entries = await getEntries();
    
    // 중복 체크 (같은 ID가 있으면 업데이트)
    const existingIndex = entries.findIndex((e) => e.id === entry.id);
    
    if (existingIndex >= 0) {
      entries[existingIndex] = entry;
    } else {
      entries.push(entry);
    }
    
    // 날짜순 정렬 (최신순)
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error("saveEntry error:", error);
    return false;
  }
}

/**
 * 모든 Entry 가져오기
 * @returns {Promise<Array>}
 */
export async function getEntries() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ENTRIES);
    const entries = raw ? JSON.parse(raw) : [];
    
    // 날짜순 정렬 (최신순)
    return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error("getEntries error:", error);
    return [];
  }
}

/**
 * 특정 날짜의 Entry들 가져오기
 * @param {string} dateStr - ISO 날짜 문자열 (YYYY-MM-DD)
 * @returns {Promise<Array>}
 */
export async function getEntriesByDate(dateStr) {
  try {
    const all = await getEntries();
    return all.filter((e) => e.date.slice(0, 10) === dateStr);
  } catch (error) {
    console.error("getEntriesByDate error:", error);
    return [];
  }
}

/**
 * 특정 Entry 삭제
 * @param {string} entryId - Entry ID
 * @returns {Promise<boolean>}
 */
export async function deleteEntry(entryId) {
  try {
    const entries = await getEntries();
    const filtered = entries.filter((e) => e.id !== entryId);
    await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("deleteEntry error:", error);
    return false;
  }
}

/**
 * 특정 Entry 업데이트
 * @param {string} entryId - Entry ID
 * @param {Object} updates - 업데이트할 필드
 * @returns {Promise<boolean>}
 */
export async function updateEntry(entryId, updates) {
  try {
    const entries = await getEntries();
    const index = entries.findIndex((e) => e.id === entryId);
    
    if (index === -1) return false;
    
    entries[index] = { ...entries[index], ...updates };
    await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error("updateEntry error:", error);
    return false;
  }
}

/**
 * 모든 데이터 삭제
 * @returns {Promise<boolean>}
 */
export async function clearAllData() {
  try {
    await AsyncStorage.multiRemove([
      KEYS.ENTRIES,
      KEYS.MOOD_COLORS,
    ]);
    return true;
  } catch (error) {
    console.error("clearAllData error:", error);
    return false;
  }
}

/**
 * 날짜별 감정 색상 저장
 * @param {string} date - 날짜 (YYYY-MM-DD)
 * @param {string} moodLabel - 감정 레이블
 * @returns {Promise<boolean>}
 */
export async function saveMoodColor(date, moodLabel) {
  try {
    const colors = await getMoodColors();
    colors[date] = moodLabel;
    await AsyncStorage.setItem(KEYS.MOOD_COLORS, JSON.stringify(colors));
    return true;
  } catch (error) {
    console.error("saveMoodColor error:", error);
    return false;
  }
}

/**
 * 모든 감정 색상 가져오기
 * @returns {Promise<Object>} { 'YYYY-MM-DD': 'positive', ... }
 */
export async function getMoodColors() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.MOOD_COLORS);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("getMoodColors error:", error);
    return {};
  }
}

/**
 * 특정 날짜의 감정 색상 가져오기
 * @param {string} date - 날짜 (YYYY-MM-DD)
 * @returns {Promise<string|null>}
 */
export async function getMoodColorByDate(date) {
  try {
    const colors = await getMoodColors();
    return colors[date] || null;
  } catch (error) {
    console.error("getMoodColorByDate error:", error);
    return null;
  }
}

/**
 * 날짜 범위의 Entry 통계
 * @param {number} days - 최근 며칠
 * @returns {Promise<Object>}
 */
export async function getStatsByDateRange(days = 30) {
  try {
    const entries = await getEntries();
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days);

    const filtered = entries.filter((e) => {
      const entryDate = new Date(e.date);
      return entryDate >= startDate && entryDate <= today;
    });

    const stats = {
      total: filtered.length,
      positive: 0,
      negative: 0,
      neutral: 0,
      veryPositive: 0,
      veryNegative: 0,
      avgScore: 0,
      topKeywords: {},
    };

    let totalScore = 0;

    filtered.forEach((entry) => {
      const label = entry.sentiment?.label || "neutral";
      
      switch (label) {
        case "very_positive":
          stats.veryPositive++;
          stats.positive++;
          break;
        case "positive":
          stats.positive++;
          break;
        case "very_negative":
          stats.veryNegative++;
          stats.negative++;
          break;
        case "negative":
          stats.negative++;
          break;
        default:
          stats.neutral++;
      }

      totalScore += entry.sentiment?.score || 0;

      // 키워드 집계
      if (entry.keywords) {
        entry.keywords.forEach((keyword) => {
          stats.topKeywords[keyword] = (stats.topKeywords[keyword] || 0) + 1;
        });
      }
    });

    stats.avgScore = stats.total > 0 ? totalScore / stats.total : 0;

    // 상위 10개 키워드만
    const sortedKeywords = Object.entries(stats.topKeywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    stats.topKeywords = Object.fromEntries(sortedKeywords);

    return stats;
  } catch (error) {
    console.error("getStatsByDateRange error:", error);
    return {
      total: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
      avgScore: 0,
      topKeywords: {},
    };
  }
}

/**
 * 키워드 시계열 데이터
 * @param {number} days - 일수
 * @returns {Promise<Object>}
 */
export async function computeWordTimeSeries(days = 14) {
  try {
    const all = await getEntries();
    
    if (all.length === 0) {
      return { dates: [], words: [], data: {} };
    }

    // 날짜 배열 생성
    const today = new Date();
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }

    // 모든 키워드 수집
    const wordSet = new Set();
    all.forEach((e) => {
      if (e.keywords) {
        e.keywords.forEach((w) => wordSet.add(w));
      }
    });

    // 상위 10개 키워드만 선택 (빈도순)
    const wordCounts = {};
    all.forEach((e) => {
      if (e.keywords) {
        e.keywords.forEach((w) => {
          wordCounts[w] = (wordCounts[w] || 0) + 1;
        });
      }
    });

    const words = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    // 날짜별 키워드 카운트
    const data = {};
    words.forEach((w) => (data[w] = []));

    dates.forEach((dateStr) => {
      const dayEntries = all.filter((e) => e.date.slice(0, 10) === dateStr);
      
      words.forEach((word) => {
        let sum = 0;
        dayEntries.forEach((e) => {
          if (e.counts && e.counts[word]) {
            sum += e.counts[word];
          }
        });
        data[word].push(sum);
      });
    });

    return { dates, words, data };
  } catch (error) {
    console.error("computeWordTimeSeries error:", error);
    return { dates: [], words: [], data: {} };
  }
}

/**
 * 감정 시계열 데이터
 * @param {number} days - 일수
 * @returns {Promise<Object>}
 */
export async function computeSentimentTimeSeries(days = 14) {
  try {
    const all = await getEntries();
    const today = new Date();
    const dates = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const positiveData = [];
    const negativeData = [];
    const neutralData = [];
    const scoreData = [];

    dates.forEach((dateStr) => {
      const dayEntries = all.filter((e) => e.date.slice(0, 10) === dateStr);
      
      let posCount = 0;
      let negCount = 0;
      let neuCount = 0;
      let totalScore = 0;

      dayEntries.forEach((e) => {
        const label = e.sentiment?.label || "neutral";
        
        if (label === "positive" || label === "very_positive") {
          posCount++;
        } else if (label === "negative" || label === "very_negative") {
          negCount++;
        } else {
          neuCount++;
        }

        totalScore += e.sentiment?.score || 0;
      });

      positiveData.push(posCount);
      negativeData.push(negCount);
      neutralData.push(neuCount);
      scoreData.push(dayEntries.length > 0 ? totalScore / dayEntries.length : 0);
    });

    return {
      dates,
      positive: positiveData,
      negative: negativeData,
      neutral: neutralData,
      avgScores: scoreData,
    };
  } catch (error) {
    console.error("computeSentimentTimeSeries error:", error);
    return {
      dates: [],
      positive: [],
      negative: [],
      neutral: [],
      avgScores: [],
    };
  }
}

/**
 * 데이터 내보내기 (JSON)
 * @returns {Promise<string>}
 */
export async function exportData() {
  try {
    const entries = await getEntries();
    const moodColors = await getMoodColors();
    
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      entries,
      moodColors,
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error("exportData error:", error);
    return null;
  }
}

/**
 * 데이터 가져오기 (JSON)
 * @param {string} jsonString - JSON 문자열
 * @returns {Promise<boolean>}
 */
export async function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    
    if (!data.entries || !Array.isArray(data.entries)) {
      throw new Error("Invalid data format");
    }

    await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify(data.entries));
    
    if (data.moodColors) {
      await AsyncStorage.setItem(KEYS.MOOD_COLORS, JSON.stringify(data.moodColors));
    }

    return true;
  } catch (error) {
    console.error("importData error:", error);
    return false;
  }
}