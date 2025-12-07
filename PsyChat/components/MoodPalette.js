// components/MoodPalette.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getMoodColors, getEntriesByDate } from "../utils/storage";
import { SENTIMENT_COLORS } from "../utils/wordDictionary";
import { getLabelText } from "../utils/sentiment";

export default function MoodPalette({ selectedDate, onDatePress }) {
  const [moodColors, setMoodColors] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  useEffect(() => {
    loadMoodColors();
  }, [selectedDate]);

  const loadMoodColors = async () => {
    try {
      setIsLoading(true);
      const colors = await getMoodColors();
      
      // 선택된 월에 해당하는 색상만 필터링
      const filteredColors = {};
      Object.keys(colors).forEach((dateStr) => {
        const date = new Date(dateStr);
        if (
          date.getMonth() === month &&
          date.getFullYear() === year
        ) {
          filteredColors[dateStr] = colors[dateStr];
        }
      });
      
      setMoodColors(filteredColors);
    } catch (error) {
      console.error("감정 색상 로딩 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];

    // 이전 달의 빈 칸
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // 현재 달의 날짜
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getColorForDate = (day) => {
    if (!day) return "transparent";
    
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const mood = moodColors[dateStr];
    
    if (!mood) return "#F0F0F0";
    
    return SENTIMENT_COLORS[mood] || "#94A3B8";
  };

  const handleDatePress = async (day) => {
    if (!day) return;

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const mood = moodColors[dateStr];

    if (mood) {
      const moodText = getLabelText(mood);
      Alert.alert(
        `${month + 1}월 ${day}일`,
        `이날의 감정: ${moodText}`,
        [
          { text: "확인" },
          {
            text: "일기 보기",
            onPress: () => onDatePress && onDatePress(dateStr),
          },
        ]
      );
    } else {
      Alert.alert(
        `${month + 1}월 ${day}일`,
        "이날은 일기를 작성하지 않았습니다.",
        [{ text: "확인" }]
      );
    }
  };

  const getMoodStats = () => {
    const stats = {
      total: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
    };

    Object.values(moodColors).forEach((mood) => {
      stats.total++;
      if (mood === "positive" || mood === "very_positive") {
        stats.positive++;
      } else if (mood === "negative" || mood === "very_negative") {
        stats.negative++;
      } else {
        stats.neutral++;
      }
    });

    return stats;
  };

  const days = getDaysInMonth();
  const stats = getMoodStats();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {year}년 {month + 1}월 감정 팔레트
        </Text>
        <Text style={styles.subtitle}>
          {stats.total}일 기록됨
        </Text>
      </View>

      {/* 요일 헤더 */}
      <View style={styles.weekHeader}>
        {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
          <View key={day} style={styles.weekDay}>
            <Text
              style={[
                styles.weekDayText,
                index === 0 && styles.sundayText,
                index === 6 && styles.saturdayText,
              ]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* 날짜 그리드 */}
      <View style={styles.grid}>
        {days.map((day, index) => {
          const color = getColorForDate(day);
          const today = new Date();
          const isToday =
            day &&
            today.getDate() === day &&
            today.getMonth() === month &&
            today.getFullYear() === year;

          return (
            <TouchableOpacity
              key={`day-${index}`}
              style={[
                styles.cell,
                { backgroundColor: color },
                isToday && styles.todayCell,
              ]}
              onPress={() => handleDatePress(day)}
              disabled={!day}
            >
              {day && (
                <Text
                  style={[
                    styles.cellText,
                    moodColors[
                      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                    ] && styles.cellTextActive,
                    isToday && styles.todayText,
                  ]}
                >
                  {day}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 통계 */}
      {stats.total > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View
              style={[
                styles.statColor,
                { backgroundColor: SENTIMENT_COLORS.positive },
              ]}
            />
            <Text style={styles.statText}>
              긍정 {stats.positive}일
            </Text>
          </View>
          <View style={styles.statItem}>
            <View
              style={[
                styles.statColor,
                { backgroundColor: SENTIMENT_COLORS.negative },
              ]}
            />
            <Text style={styles.statText}>
              부정 {stats.negative}일
            </Text>
          </View>
          {stats.neutral > 0 && (
            <View style={styles.statItem}>
              <View
                style={[
                  styles.statColor,
                  { backgroundColor: SENTIMENT_COLORS.neutral },
                ]}
              />
              <Text style={styles.statText}>
                중립 {stats.neutral}일
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#7F8C8D",
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2C3E50",
  },
  sundayText: {
    color: "#E74C3C",
  },
  saturdayText: {
    color: "#3498DB",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  todayCell: {
    borderWidth: 2,
    borderColor: "#4A90E2",
  },
  cellText: {
    fontSize: 12,
    color: "#95A5A6",
  },
  cellTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  todayText: {
    fontWeight: "700",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statText: {
    fontSize: 12,
    color: "#2C3E50",
    fontWeight: "600",
  },
});