// screens/GraphScreen.js
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import {
  computeSentimentTimeSeries,
  computeWordTimeSeries,
  getStatsByDateRange,
} from "../utils/storage";
import { SENTIMENT_COLORS } from "../utils/wordDictionary";

const screenWidth = Dimensions.get("window").width;

export default function GraphScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(14); // 14일, 30일, 90일
  const [sentimentData, setSentimentData] = useState(null);
  const [wordData, setWordData] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, selectedPeriod]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const [sentimentResult, wordResult, statsResult] = await Promise.all([
        computeSentimentTimeSeries(selectedPeriod),
        computeWordTimeSeries(selectedPeriod),
        getStatsByDateRange(selectedPeriod),
      ]);

      setSentimentData(sentimentResult);
      setWordData(wordResult);
      setStats(statsResult);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#4A90E2",
    },
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {[
        { label: "2주", value: 14 },
        { label: "1개월", value: 30 },
        { label: "3개월", value: 90 },
      ].map((period) => (
        <TouchableOpacity
          key={period.value}
          style={[
            styles.periodBtn,
            selectedPeriod === period.value && styles.periodBtnActive,
          ]}
          onPress={() => setSelectedPeriod(period.value)}
        >
          <Text
            style={[
              styles.periodBtnText,
              selectedPeriod === period.value && styles.periodBtnTextActive,
            ]}
          >
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStatsCards = () => {
    if (!stats) return null;

    const totalEntries = stats.total || 0;
    const positiveRatio =
      totalEntries > 0 ? (stats.positive / totalEntries) * 100 : 0;
    const negativeRatio =
      totalEntries > 0 ? (stats.negative / totalEntries) * 100 : 0;

    return (
      <View style={styles.statsCards}>
        <View style={styles.statCard}>
          <Ionicons name="document-text" size={32} color="#4A90E2" />
          <Text style={styles.statValue}>{totalEntries}</Text>
          <Text style={styles.statLabel}>전체 일기</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="happy" size={32} color={SENTIMENT_COLORS.positive} />
          <Text style={[styles.statValue, { color: SENTIMENT_COLORS.positive }]}>
            {Math.round(positiveRatio)}%
          </Text>
          <Text style={styles.statLabel}>긍정</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="sad" size={32} color={SENTIMENT_COLORS.negative} />
          <Text style={[styles.statValue, { color: SENTIMENT_COLORS.negative }]}>
            {Math.round(negativeRatio)}%
          </Text>
          <Text style={styles.statLabel}>부정</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="trending-up" size={32} color="#10B981" />
          <Text style={[styles.statValue, { color: "#10B981" }]}>
            {stats.avgScore ? stats.avgScore.toFixed(2) : "0.00"}
          </Text>
          <Text style={styles.statLabel}>평균 점수</Text>
        </View>
      </View>
    );
  };

  const renderSentimentPieChart = () => {
    if (!stats || stats.total === 0) return null;

    const pieData = [
      {
        name: "긍정",
        population: stats.positive || 0,
        color: SENTIMENT_COLORS.positive,
        legendFontColor: "#7F8C8D",
        legendFontSize: 12,
      },
      {
        name: "부정",
        population: stats.negative || 0,
        color: SENTIMENT_COLORS.negative,
        legendFontColor: "#7F8C8D",
        legendFontSize: 12,
      },
      {
        name: "중립",
        population: stats.neutral || 0,
        color: SENTIMENT_COLORS.neutral,
        legendFontColor: "#7F8C8D",
        legendFontSize: 12,
      },
    ].filter((item) => item.population > 0);

    if (pieData.length === 0) return null;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>감정 분포</Text>
        <PieChart
          data={pieData}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
    );
  };

  const renderSentimentLineChart = () => {
    if (!sentimentData || sentimentData.dates.length === 0) return null;

    // 날짜 레이블 축약 (MM/DD 형식)
    const labels = sentimentData.dates.map((date) => {
      const d = new Date(date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });

    // 7일마다 레이블 표시
    const labelInterval = Math.ceil(labels.length / 7);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>감정 변화 추이</Text>
        <LineChart
          data={{
            labels: labels.filter((_, index) => index % labelInterval === 0),
            datasets: [
              {
                data: sentimentData.positive,
                color: (opacity = 1) => SENTIMENT_COLORS.positive,
                strokeWidth: 2,
              },
              {
                data: sentimentData.negative,
                color: (opacity = 1) => SENTIMENT_COLORS.negative,
                strokeWidth: 2,
              },
            ],
            legend: ["긍정", "부정"],
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderTopKeywords = () => {
    if (!stats || !stats.topKeywords || Object.keys(stats.topKeywords).length === 0) {
      return null;
    }

    const keywords = Object.entries(stats.topKeywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>자주 사용한 키워드</Text>
        <View style={styles.keywordsGrid}>
          {keywords.map(([keyword, count], index) => (
            <View key={keyword} style={styles.keywordItem}>
              <View style={styles.keywordRank}>
                <Text style={styles.keywordRankText}>{index + 1}</Text>
              </View>
              <Text style={styles.keywordName}>{keyword}</Text>
              <Text style={styles.keywordCount}>{count}회</Text>
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
          <Text style={styles.headerTitle}>통계</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>데이터를 분석하는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>통계</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={64} color="#BDC3C7" />
          <Text style={styles.emptyText}>
            아직 분석할 데이터가 없습니다.{"\n"}
            일기를 작성하면 통계를 확인할 수 있어요.
          </Text>
          <TouchableOpacity
            style={styles.writeBtn}
            onPress={() => navigation.navigate("Chat")}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.writeBtnText}>일기 작성하기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>통계</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 기간 선택 */}
        {renderPeriodSelector()}

        {/* 통계 카드 */}
        {renderStatsCards()}

        {/* 감정 분포 파이 차트 */}
        {renderSentimentPieChart()}

        {/* 감정 변화 추이 */}
        {renderSentimentLineChart()}

        {/* 자주 사용한 키워드 */}
        {renderTopKeywords()}
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
  scrollContent: {
    padding: 16,
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  periodBtnActive: {
    backgroundColor: "#4A90E2",
  },
  periodBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7F8C8D",
  },
  periodBtnTextActive: {
    color: "#ffffff",
  },
  statsCards: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2C3E50",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#7F8C8D",
  },
  chartContainer: {
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
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  keywordsGrid: {
    gap: 12,
  },
  keywordItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 12,
  },
  keywordRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4A90E2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  keywordRankText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  keywordName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
  },
  keywordCount: {
    fontSize: 14,
    color: "#7F8C8D",
  },
});