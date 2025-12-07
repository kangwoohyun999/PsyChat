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
      
      // 선택된 월에 해당하는 항목만 필터링
      const filtered = allEntries.filter((entry) => {
        const entryDate = new Date(entry.date);
        return (
          entryDate.getMonth() === selectedMonth.getMonth() &&
          entryDate.getFullYear() === selectedMonth.getFullYear()
        );
      });
      
      setEntries(filtered);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
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

  const handleDelete = (entryId, date) => {
    Alert.alert(
      "삭제 확인",
      "이 일기를 삭제하시겠습니까?",
      [
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
      ]
    );
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
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const dayName = days[date.getDay()];
    
    return `${month}월 ${day}일 (${dayName}) ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const renderItem = ({ item }) => {
    const sentiment = item.sentiment || {};
    const label = sentiment.label || "neutral";
    const emoji = getLabelEmoji(label);
    const labelText = getLabelText(label);
    const color = SENTIMENT_COLORS[label] || "#94A3B8";

    return (
      <View style={[styles.card, { borderLeftColor: color }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.emoji}>{emoji}</Text>
            <View>
              <Text style={styles.dateText}>{formatDateTime(item.date)}</Text>
              <Text style={[styles.sentimentLabel, { color }]}>
                {labelText} {sentiment.score ? `(${sentiment.score.toFixed(2)})` : ""}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id, item.date)}
          >
            <Ionicons name="trash-outline" size={20} color="#E74C3C" />
          </TouchableOpacity>
        </View>

        <Text style={styles.contentText} numberOfLines={3}>
          {item.text}
        </Text>

        {item.keywords && item.keywords.length > 0 && (
          <View style={styles.keywordsContainer}>
            {item.keywords.slice(0, 5).map((keyword, index) => (
              <View key={index} style={styles.keywordBadge}>
                <Text style={styles.keywordText}>#{keyword}</Text>
              </View>
            ))}
            {item.keywords.length > 5 && (
              <Text style={styles.moreKeywords}>
                +{item.keywords.length - 5}
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.viewMoreBtn}
          onPress={() => {
            Alert.alert(
              formatDateTime(item.date),
              item.text,
              [{ text: "확인" }]
            );
          }}
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

      {/* 통계 요약 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{entries.length}</Text>
          <Text style={styles.statLabel}>전체</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: SENTIMENT_COLORS.positive }]}>
            {entries.filter((e) => 
              e.sentiment?.label === "positive" || 
              e.sentiment?.label === "very_positive"
            ).length}
          </Text>
          <Text style={styles.statLabel}>긍정</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: SENTIMENT_COLORS.negative }]}>
            {entries.filter((e) => 
              e.sentiment?.label === "negative" || 
              e.sentiment?.label === "very_negative"
            ).length}
          </Text>
          <Text style={styles.statLabel}>부정</Text>
        </View>
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
            {formatMonthYear(selectedMonth)}에{"\n"}
            작성된 일기가 없습니다.
          </Text>
          <TouchableOpacity
            style={styles.writeBtn}
            onPress={() => navigation.navigate("Chat")}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.writeBtnText}>일기 작성하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  monthBtn: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    marginBottom: 8,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#4A90E2",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#7F8C8D",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#95A5A6",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  writeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  writeBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
  },
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
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  dateText: {
    fontSize: 14,
    color: "#2C3E50",
    fontWeight: "600",
    marginBottom: 4,
  },
  sentimentLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  deleteBtn: {
    padding: 8,
  },
  contentText: {
    fontSize: 15,
    color: "#34495E",
    lineHeight: 22,
    marginBottom: 12,
  },
  keywordsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  keywordBadge: {
    backgroundColor: "#E8F4FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  keywordText: {
    fontSize: 12,
    color: "#4A90E2",
    fontWeight: "600",
  },
  moreKeywords: {
    fontSize: 12,
    color: "#7F8C8D",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  viewMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  viewMoreText: {
    fontSize: 14,
    color: "#4A90E2",
    fontWeight: "600",
  },
});