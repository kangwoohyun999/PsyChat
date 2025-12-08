// screens/HomeScreen.js
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PieChartComponent from "../components/PieChartComponent";
import { getEntries, getStatsByDateRange } from "../utils/storage";

export default function HomeScreen({ navigation }) {
  const [positiveRatio, setPositiveRatio] = useState(0.0);
  const [negativeRatio, setNegativeRatio] = useState(0.0);
  const [neutralRatio, setNeutralRatio] = useState(0.0);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const [entries, recentStats] = await Promise.all([
        getEntries(),
        getStatsByDateRange(30),
      ]);

      if (entries.length === 0) {
        setPositiveRatio(0);
        setNegativeRatio(0);
        setNeutralRatio(0);
        setStats(null);
        return;
      }

      const posScore = entries.reduce(
        (acc, e) =>
          acc +
          (e.sentiment?.label === "positive" ||
          e.sentiment?.label === "very_positive"
            ? 1
            : 0),
        0
      );

      const negScore = entries.reduce(
        (acc, e) =>
          acc +
          (e.sentiment?.label === "negative" ||
          e.sentiment?.label === "very_negative"
            ? 1
            : 0),
        0
      );

      const neuScore = entries.reduce(
        (acc, e) => acc + (e.sentiment?.label === "neutral" ? 1 : 0),
        0
      );

      const total = entries.length;

      setPositiveRatio(posScore / total);
      setNegativeRatio(negScore / total);
      setNeutralRatio(neuScore / total);
      setStats(recentStats);
    } catch (err) {
      console.error("데이터 로딩 실패:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* 타이틀 */}
        <Text style={styles.title}>오늘의 감정 상태</Text>

        {/* 파이차트 + 비율 */}
        <View style={styles.chartWrap}>
          <PieChartComponent
            positive={positiveRatio}
            negative={negativeRatio}
            neutral={neutralRatio}
          />

          <Text style={styles.ratioText}>
            긍정 {Math.round(positiveRatio * 100)}% ・ 부정{" "}
            {Math.round(negativeRatio * 100)}% ・ 중립{" "}
            {Math.round(neutralRatio * 100)}%
          </Text>
        </View>

        {/* 최근 30일 카드 */}
        {stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>최근 30일 기록</Text>

            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>총 일기</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: "#3c55e2ff" }]}>
                  {stats.positive}
                </Text>
                <Text style={styles.statLabel}>긍정</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: "#F87171" }]}>
                  {stats.negative}
                </Text>
                <Text style={styles.statLabel}>부정</Text>
              </View>
            </View>
          </View>
        )}

        {/* 빠른 메뉴 (그래프 / 기록 / 캘린더) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>빠른 메뉴</Text>

          <View style={styles.menuRow}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.navigate("Graph")}
            >
              <Text style={styles.menuText}>통계 그래프</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.navigate("History")}
            >
              <Text style={styles.menuText}>기록 보기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.navigate("Calendar")}
            >
              <Text style={styles.menuText}>캘린더</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 일기 작성 버튼 */}
        <View style={styles.writeWrap}>
          <TouchableOpacity
            style={styles.writeBtn}
            onPress={() => navigation.navigate("Chat")}
          >
            <Ionicons name="create" size={22} color="#fff" />
            <Text style={styles.writeText}>일기 작성하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F7" },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginTop: 30,
    textAlign: "center",
    color: "#333",
  },

  chartWrap: {
    alignItems: "center",
    marginVertical: 20,
  },

  ratioText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },

  section: { paddingHorizontal: 20, marginTop: 20 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },

  statRow: { flexDirection: "row", justifyContent: "space-between" },

  statBox: {
    backgroundColor: "#fff",
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },

  statNumber: { fontSize: 22, fontWeight: "700", color: "#333" },
  statLabel: { fontSize: 12, color: "#777" },

  menuRow: { flexDirection: "row", justifyContent: "space-between" },

  menuButton: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 14,
    alignItems: "center",
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },

  menuText: { fontSize: 15, fontWeight: "600", color: "#333" },

  writeWrap: { alignItems: "center", marginVertical: 30 },

  writeBtn: {
    flexDirection: "row",
    backgroundColor: "#4A90E2",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },

  writeText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    marginLeft: 10,
  },

  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#777" },
});
