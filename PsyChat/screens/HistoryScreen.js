// screens/HistoryScreen.js
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getEntries, deleteEntry } from "../utils/storage";
import { getLabelText, getLabelEmoji } from "../utils/sentiment";
import { SENTIMENT_COLORS } from "../utils/wordDictionary";

export default function HistoryScreen({ navigation }) {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadEntries();
  }, [selectedMonth]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadEntries();
    });
    return unsubscribe;
  }, [navigation]);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const allEntries = await getEntries();
      const filtered = allEntries.filter((entry) => {
        const entryDate = new Date(entry.date);
        return (
          entryDate.getMonth() === selectedMonth.getMonth() &&
          entryDate.getFullYear() === selectedMonth.getFullYear()
        );
      });

      setEntries(filtered);
    } catch (error) {
      Alert.alert("오류", "데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadEntries();
  };

  const handleDelete = (entryId) => {
    Alert.alert("삭제 확인", "이 일기를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          const success = await deleteEntry(entryId);
          if (success) {
            setEntries((prev) => prev.filter((e) => e.id !== entryId));
            Alert.alert("삭제 완료", "일기가 삭제되었습니다.");
          } else {
            Alert.alert("오류", "삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

  const changeMonth = (delta) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(selectedMonth.getMonth() + delta);
    setSelectedMonth(newDate);
  };

  const formatMonthYear = (date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const dayName = days[date.getDay()];
    return `${month}월 ${day}일 (${dayName}) ${hours}:${minutes}`;
  };

  const renderItem = ({ item }) => {
    const label = item.sentiment?.label || "neutral";
    const emoji = getLabelEmoji(label);
    const labelText = getLabelText(label);
    const color = SENTIMENT_COLORS[label] || "#94A3B8";

    return (
      <View style={[styles.card, { borderLeftColor: color }]}>
        {/* 1) 삭제 버튼 — 카드 오른쪽 위, 절대 위치, 다른 View 위에 올라감 */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={22} color="#E74C3C" />
        </TouchableOpacity>

        {/* 2) 카드 내용 */}
        <View style={styles.cardHeader}>
          <Text style={styles.emoji}>{emoji}</Text>
          <View>
            <Text style={styles.dateText}>{formatDateTime(item.date)}</Text>
            <Text style={[styles.sentimentLabel, { color }]}>
              {labelText}{" "}
              {item.sentiment?.score
                ? `(${item.sentiment.score.toFixed(2)})`
                : ""}
            </Text>
          </View>
        </View>

        <Text style={styles.contentText} numberOfLines={3}>
          {item.text}
        </Text>

        {item.keywords?.length > 0 && (
          <View style={styles.keywordsContainer}>
            {item.keywords.slice(0, 5).map((kw, i) => (
              <View key={i} style={styles.keywordBadge}>
                <Text style={styles.keywordText}>#{kw}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.viewMoreBtn}
          onPress={() =>
            Alert.alert(formatDateTime(item.date), item.text, [
              { text: "확인" },
            ])
          }
        >
          <Text style={styles.viewMoreText}>전체 보기</Text>
          <Ionicons name="chevron-forward" size={16} color="#4A90E2" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>일기 기록</Text>
      </View>

      {/* 월 선택 */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <Ionicons name="chevron-back" size={28} color="#4A90E2" />
        </TouchableOpacity>

        <Text style={styles.monthText}>{formatMonthYear(selectedMonth)}</Text>

        <TouchableOpacity
          onPress={() => changeMonth(1)}
          disabled={
            selectedMonth.getMonth() === new Date().getMonth() &&
            selectedMonth.getFullYear() === new Date().getFullYear()
          }
        >
          <Ionicons
            name="chevron-forward"
            size={28}
            color={
              selectedMonth.getMonth() === new Date().getMonth()
                ? "#CCC"
                : "#4A90E2"
            }
          />
        </TouchableOpacity>
      </View>

      {/* 리스트 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#BDC3C7" />
          <Text style={styles.emptyText}>
            {formatMonthYear(selectedMonth)}
            {"\n"}작성된 일기가 없습니다.
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={["#4A90E2"]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

// ---------------------- STYLE ----------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },

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

  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },

  monthText: { fontSize: 18, fontWeight: "600", color: "#2C3E50" },

  listContent: { padding: 16 },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    position: "relative", // ⭐ 절대 위치 버튼 위해 꼭 필요
  },

  deleteBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 8,
    backgroundColor: "white", // 클릭 방해 요소 제거
    borderRadius: 16,
    zIndex: 9999, // ⭐ 웹에서도 최상단 클릭되도록
    elevation: 10,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  emoji: { fontSize: 32, marginRight: 10 },

  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E50",
  },

  sentimentLabel: { fontSize: 12, fontWeight: "600", marginTop: 2 },

  contentText: {
    fontSize: 15,
    color: "#34495E",
    lineHeight: 22,
    marginVertical: 10,
  },

  keywordsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },

  keywordBadge: {
    backgroundColor: "#E8F4FD",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },

  keywordText: { fontSize: 12, color: "#4A90E2", fontWeight: "600" },

  moreKeywords: { fontSize: 12, color: "#7F8C8D" },

  viewMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  viewMoreText: {
    fontSize: 14,
    color: "#4A90E2",
    fontWeight: "600",
    marginRight: 4,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: { marginTop: 12, fontSize: 14, color: "#7F8C8D" },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 24,
    color: "#7F8C8D",
  },
});
