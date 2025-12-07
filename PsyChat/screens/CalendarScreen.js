// screens/CalendarScreen.js
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getMoodColors, getEntriesByDate } from "../utils/storage";
import { SENTIMENT_COLORS } from "../utils/wordDictionary";
import { getLabelEmoji } from "../utils/sentiment";

export default function CalendarScreen({ navigation }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [moodColors, setMoodColors] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayEntries, setDayEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMoodColors();
  }, [selectedMonth]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadMoodColors();
    });
    return unsubscribe;
  }, [navigation]);

  const loadMoodColors = async () => {
    try {
      setIsLoading(true);
      const colors = await getMoodColors();
      setMoodColors(colors);
    } catch (error) {
      console.error("감정 색상 로딩 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDatePress = async (dateStr) => {
    try {
      setSelectedDate(dateStr);
      const entries = await getEntriesByDate(dateStr);
      setDayEntries(entries);

      if (entries.length > 0) {
        // 일기 내용 표시
        const content = entries.map((e, i) => 
          `[${i + 1}] ${e.text.substring(0, 100)}${e.text.length > 100 ? '...' : ''}`
        ).join('\n\n');
        
        Alert.alert(
          dateStr,
          content || "작성된 일기가 없습니다.",
          [
            { text: "닫기" },
            {
              text: "일기 작성",
              onPress: () => navigation.navigate("Chat"),
            },
          ]
        );
      }
    } catch (error) {
      console.error("일기 로딩 실패:", error);
    }
  };

  const changeMonth = (delta) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(selectedMonth.getMonth() + delta);
    setSelectedMonth(newDate);
  };

  const formatMonthYear = (date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
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

  const getColorForDate = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const mood = moodColors[dateStr];
    
    if (!mood) return "#F8F9FA";
    
    return SENTIMENT_COLORS[mood] || "#94A3B8";
  };

  const renderCalendar = () => {
    const days = getDaysInMonth(selectedMonth);
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const today = new Date();
    const isCurrentMonth = 
      today.getMonth() === month && today.getFullYear() === year;

    return (
      <View style={styles.calendar}>
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
        <View style={styles.daysGrid}>
          {days.map((day, index) => {
            if (day === null) {
              return <View key={`empty-${index}`} style={styles.dayCell} />;
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const color = getColorForDate(year, month, day);
            const isToday = 
              isCurrentMonth && day === today.getDate();
            const hasMood = moodColors[dateStr] !== undefined;
            const mood = moodColors[dateStr];
            const emoji = mood ? getLabelEmoji(mood) : "";

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.dayCell,
                  { backgroundColor: color },
                  isToday && styles.todayCell,
                ]}
                onPress={() => handleDatePress(dateStr)}
              >
                <Text
                  style={[
                    styles.dayText,
                    hasMood && styles.dayTextWithMood,
                    isToday && styles.todayText,
                  ]}
                >
                  {day}
                </Text>
                {hasMood && (
                  <Text style={styles.emojiText}>{emoji}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderLegend = () => {
    return (
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>감정 색상 범례</Text>
        <View style={styles.legendGrid}>
          {[
            { label: "매우 긍정", color: SENTIMENT_COLORS.very_positive },
            { label: "긍정", color: SENTIMENT_COLORS.positive },
            { label: "중립", color: SENTIMENT_COLORS.neutral },
            { label: "부정", color: SENTIMENT_COLORS.negative },
            { label: "매우 부정", color: SENTIMENT_COLORS.very_negative },
          ].map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={styles.legendLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>감정 캘린더</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>감정 캘린더</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 월 선택 */}
        <View style={styles.monthSelector}>
          <TouchableOpacity
            onPress={() => changeMonth(-1)}
            style={styles.monthBtn}
          >
            <Ionicons name="chevron-back" size={24} color="#4A90E2" />
          </TouchableOpacity>

          <Text style={styles.monthText}>{formatMonthYear(selectedMonth)}</Text>

          <TouchableOpacity
            onPress={() => changeMonth(1)}
            style={styles.monthBtn}
            disabled={
              selectedMonth.getMonth() === new Date().getMonth() &&
              selectedMonth.getFullYear() === new Date().getFullYear()
            }
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={
                selectedMonth.getMonth() === new Date().getMonth() &&
                selectedMonth.getFullYear() === new Date().getFullYear()
                  ? "#BDC3C7"
                  : "#4A90E2"
              }
            />
          </TouchableOpacity>
        </View>

        {/* 캘린더 */}
        {renderCalendar()}

        {/* 범례 */}
        {renderLegend()}

        {/* 안내 */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#4A90E2" />
          <Text style={styles.infoText}>
            날짜를 눌러 그날의 일기를 확인할 수 있습니다.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2C3E50",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#7F8C8D",
  },
  scrollContent: {
    padding: 16,
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  monthBtn: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
  },
  calendar: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E50",
  },
  sundayText: {
    color: "#E74C3C",
  },
  saturdayText: {
    color: "#3498DB",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 4,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: "#4A90E2",
  },
  dayText: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  dayTextWithMood: {
    color: "#2C3E50",
    fontWeight: "600",
  },
  todayText: {
    fontWeight: "700",
  },
  emojiText: {
    fontSize: 20,
    marginTop: 2,
  },
  legendContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: 12,
  },
  legendGrid: {
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  legendColor: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  legendLabel: {
    fontSize: 14,
    color: "#2C3E50",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F4FD",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#2C3E50",
    lineHeight: 20,
  },
});