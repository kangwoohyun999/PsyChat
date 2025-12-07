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
        getStatsByDateRange(30), // 최근 30일 통계
      ]);

      if (entries.length === 0) {
        setPositiveRatio(0);
        setNegativeRatio(0);
        setNeutralRatio(0);
        setStats(null);
        return;
      }

      // 전체 기간 감정 비율 계산
      const posScore = entries.reduce(
        (acc, e) => 
          acc + (e.sentiment?.label === "positive" || 
                 e.sentiment?.label === "very_positive" ? 1 : 0),
        0
      );
      const negScore = entries.reduce(
        (acc, e) => 
          acc + (e.sentiment?.label === "negative" || 
                 e.sentiment?.label === "very_negative" ? 1 : 0),
        0
      );
      const neuScore = entries.reduce(
        (acc, e) => acc + (e.sentiment?.label === "neutral" ? 1 : 0),
        0
      );

      const total = entries.length;
      setPositiveRatio(total > 0 ? posScore / total : 0);
      setNegativeRatio(total > 0 ? negScore / total : 0);
      setNeutralRatio(total > 0 ? neuScore / total : 0);
      setStats(recentStats);
      
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["#4A90E2"]}
          />
        }
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>안녕하세요! 👋</Text>
            <Text style={styles.subtitle}>오늘의 감정을 기록해보세요</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => {
              // TODO: 설정 화면 구현
            }}
          >
            <Ionicons name="settings-outline" size={24} color="#2C3E50" />
          </TouchableOpacity>
        </View>

        {/* 전체 누적 통계 */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>전체 누적 통계</Text>
          
          <View style={styles.chartCard}>
            <PieChartComponent
              positive={positiveRatio}
              negative={negativeRatio}
              neutral={neutralRatio}
              showLegend={false}
            />
            
            <View style={styles.ratioContainer}>
              <View style={styles.ratioItem}>
                <View style={[styles.ratioColor, { backgroundColor: "#34D399" }]} />
                <Text style={styles.ratioText}>
                  긍정 {Math.round(positiveRatio * 100)}%
                </Text>
              </View>
              <View style={styles.ratioItem}>
                <View style={[styles.ratioColor, { backgroundColor: "#F59E0B" }]} />
                <Text style={styles.ratioText}>
                  부정 {Math.round(negativeRatio * 100)}%
                </Text>
              </View>
              {neutralRatio > 0 && (
                <View style={styles.ratioItem}>
                  <View style={[styles.ratioColor, { backgroundColor: "#94A3B8" }]} />
                  <Text style={styles.ratioText}>
                    중립 {Math.round(neutralRatio * 100)}%
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* 최근 30일 통계 */}
        {stats && stats.total > 0 && (
          <View style={styles.recentStatsSection}>
            <Text style={styles.sectionTitle}>최근 30일</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="document-text" size={28} color="#4A90E2" />
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>일기</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="happy" size={28} color="#10B981" />
                <Text style={[styles.statValue, { color: "#10B981" }]}>
                  {stats.positive}
                </Text>
                <Text style={styles.statLabel}>긍정</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="sad" size={28} color="#F59E0B" />
                <Text style={[styles.statValue, { color: "#F59E0B" }]}>
                  {stats.negative}
                </Text>
                <Text style={styles.statLabel}>부정</Text>
              </View>
            </View>
          </View>
        )}

        {/* 빠른 메뉴 */}
        <View style={styles.quickMenuSection}>
          <Text style={styles.sectionTitle}>빠른 메뉴</Text>
          
          <View style={styles.menuGrid}>
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => navigation.navigate("Graph")}
            >
              <View style={[styles.menuIcon, { backgroundColor: "#E8F4FD" }]}>
                <Ionicons name="stats-chart" size={28} color="#4A90E2" />
              </View>
              <Text style={styles.menuTitle}>통계</Text>
              <Text style={styles.menuDesc}>감정 변화 분석</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => navigation.navigate("History")}
            >
              <View style={[styles.menuIcon, { backgroundColor: "#FEF3E8" }]}>
                <Ionicons name="book" size={28} color="#F59E0B" />
              </View>
              <Text style={styles.menuTitle}>기록</Text>
              <Text style={styles.menuDesc}>지난 일기 보기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => navigation.navigate("Calendar")}
            >
              <View style={[styles.menuIcon, { backgroundColor: "#F0FDF4" }]}>
                <Ionicons name="calendar" size={28} color="#10B981" />
              </View>
              <Text style={styles.menuTitle}>캘린더</Text>
              <Text style={styles.menuDesc}>날짜별 감정</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 일기 작성 버튼 */}
        <View style={styles.bottomSection}>
          <Text style={styles.promptText}>
            오늘은 어떤 하루였나요?
          </Text>

          <TouchableOpacity
            style={styles.writeBtn}
            onPress={() => navigation.navigate("Chat")}
          >
            <Ionicons name="create" size={24} color="#ffffff" />
            <Text style={styles.writeBtnText}>일기 작성하기</Text>
          </TouchableOpacity>
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
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  settingsBtn: {
    padding: 8,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ratioContainer: {
    marginTop: 16,
    gap: 8,
  },
  ratioItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ratioColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  ratioText: {
    fontSize: 15,
    color: "#2C3E50",
    fontWeight: "600",
  },
  recentStatsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2C3E50",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#7F8C8D",
  },
  quickMenuSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  menuGrid: {
    flexDirection: "row",
    gap: 12,
  },
  menuCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  menuIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: 4,
  },
  menuDesc: {
    fontSize: 11,
    color: "#7F8C8D",
    textAlign: "center",
  },
  bottomSection: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  promptText: {
    fontSize: 16,
    color: "#7F8C8D",
    marginBottom: 16,
    textAlign: "center",
  },
  writeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    gap: 12,
    shadowColor: "#4A90E2",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  writeBtnText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
});