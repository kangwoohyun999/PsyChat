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
import { LineChart, PieChart } from "react-native-chart-kit";

import {
  computeSentimentTimeSeries,
  computeWordTimeSeries,
  getStatsByDateRange,
} from "../utils/storage";

import { SENTIMENT_COLORS } from "../utils/wordDictionary";

const screenWidth = Dimensions.get("window").width;

// 👉 차트 터치 완전 차단용(HistoryScreen 버튼 클릭 막힘 해결)
const disableChartTouch = {
  pointerEvents: "none",
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export default function GraphScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(14);
  const [sentimentData, setSentimentData] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => loadData());
    return unsubscribe;
  }, [navigation, selectedPeriod]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const [sentimentResult, , statsResult] = await Promise.all([
        computeSentimentTimeSeries(selectedPeriod),
        computeWordTimeSeries(selectedPeriod),
        getStatsByDateRange(selectedPeriod),
      ]);

      setSentimentData(sentimentResult);
      setStats(statsResult);
    } catch (error) {
      console.error("그래프 로딩 실패:", error);
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
    labelColor: () => "#2C3E50",
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
      ].map((p) => (
        <TouchableOpacity
          key={p.value}
          style={[
            styles.periodBtn,
            selectedPeriod === p.value && styles.periodBtnActive,
          ]}
          onPress={() => setSelectedPeriod(p.value)}
        >
          <Text
            style={[
              styles.periodBtnText,
              selectedPeriod === p.value && styles.periodBtnTextActive,
            ]}
          >
            {p.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSentimentPieChart = () => {
    if (!stats || stats.total === 0) return null;

    const pieData = [
      {
        name: "긍정",
        population: stats.positive || 0,
        color: SENTIMENT_COLORS.positive,
        legendFontColor: "#7F8C8D",
      },
      {
        name: "부정",
        population: stats.negative || 0,
        color: SENTIMENT_COLORS.negative,
        legendFontColor: "#7F8C8D",
      },
      {
        name: "중립",
        population: stats.neutral || 0,
        color: SENTIMENT_COLORS.neutral,
        legendFontColor: "#7F8C8D",
      },
    ].filter((i) => i.population > 0);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>감정 분포</Text>

        {/* 차트 + 터치차단 레이어 */}
        <View style={{ position: "relative" }}>
          <PieChart
            data={pieData}
            width={screenWidth - 40}
            height={220}
            accessor="population"
            chartConfig={chartConfig}
            backgroundColor="transparent"
          />

          {/* 터치 차단 */}
          <View style={disableChartTouch} />
        </View>
      </View>
    );
  };

  const renderSentimentLineChart = () => {
    if (!sentimentData || sentimentData.dates.length === 0) return null;

    const labels = sentimentData.dates.map((d) => {
      const date = new Date(d);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const interval = Math.ceil(labels.length / 7);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>감정 변화 추이</Text>

        <View style={{ position: "relative" }}>
          <LineChart
            data={{
              labels: labels.filter((_, i) => i % interval === 0),
              datasets: [
                {
                  data: sentimentData.positive,
                  color: () => SENTIMENT_COLORS.positive,
                  strokeWidth: 2,
                },
                {
                  data: sentimentData.negative,
                  color: () => SENTIMENT_COLORS.negative,
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
          {/* 터치 차단 */}
          <View style={disableChartTouch} />
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>로딩 중...</Text>
      </SafeAreaView>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>데이터 없음</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        {renderPeriodSelector()}
        {renderSentimentPieChart()}
        {renderSentimentLineChart()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  scrollContent: { padding: 16 },
  loadingText: { marginTop: 50, textAlign: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#999" },

  periodSelector: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  periodBtn: { flex: 1, paddingVertical: 10, alignItems: "center" },
  periodBtnActive: { backgroundColor: "#4A90E2", borderRadius: 8 },
  periodBtnText: { fontSize: 14, color: "#7F8C8D", fontWeight: "600" },
  periodBtnTextActive: { color: "#fff" },

  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#2C3E50",
  },
  chart: { borderRadius: 12 },
});
