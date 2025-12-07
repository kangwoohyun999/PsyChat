// components/PieChartComponent.js
import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { SENTIMENT_COLORS } from "../utils/wordDictionary";

const screenWidth = Dimensions.get("window").width;

export default function PieChartComponent({ 
  positive = 0.0, 
  negative = 0.0,
  neutral = 0.0,
  showLegend = true,
  size = "medium" // "small" | "medium" | "large"
}) {
  // 사이즈별 설정
  const sizeConfig = {
    small: { width: screenWidth * 0.6, height: 160, fontSize: 12 },
    medium: { width: screenWidth * 0.75, height: 200, fontSize: 14 },
    large: { width: screenWidth * 0.9, height: 240, fontSize: 16 },
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // 퍼센트 계산
  const total = positive + negative + neutral;
  
  if (total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>아직 데이터가 없습니다</Text>
      </View>
    );
  }

  const posPercent = Math.round((positive / total) * 100);
  const negPercent = Math.round((negative / total) * 100);
  const neuPercent = Math.round((neutral / total) * 100);

  // 차트 데이터
  const chartData = [
    {
      name: "긍정",
      population: posPercent,
      color: SENTIMENT_COLORS.positive,
      legendFontColor: "#2C3E50",
      legendFontSize: config.fontSize,
    },
    {
      name: "부정",
      population: negPercent,
      color: SENTIMENT_COLORS.negative,
      legendFontColor: "#2C3E50",
      legendFontSize: config.fontSize,
    },
  ];

  // 중립이 있으면 추가
  if (neutral > 0) {
    chartData.push({
      name: "중립",
      population: neuPercent,
      color: SENTIMENT_COLORS.neutral,
      legendFontColor: "#2C3E50",
      legendFontSize: config.fontSize,
    });
  }

  // 0인 항목 제거
  const filteredData = chartData.filter(item => item.population > 0);

  if (filteredData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>데이터를 표시할 수 없습니다</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PieChart
        data={filteredData}
        width={config.width}
        height={config.height}
        chartConfig={{
          backgroundColor: "#ffffff",
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        center={[10, 0]}
        absolute={false}
        hasLegend={showLegend}
      />

      {/* 커스텀 범례 */}
      {showLegend && (
        <View style={styles.legendContainer}>
          {filteredData.map((item) => (
            <View key={item.name} style={styles.legendItem}>
              <View 
                style={[
                  styles.legendColor, 
                  { backgroundColor: item.color }
                ]} 
              />
              <Text style={styles.legendText}>
                {item.name}: {item.population}%
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* 총 개수 표시 */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>전체</Text>
        <Text style={styles.totalValue}>
          {Math.round(positive + negative + neutral)}개
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 16,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#95A5A6",
  },
  legendContainer: {
    marginTop: 16,
    alignItems: "flex-start",
    width: "100%",
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: "#2C3E50",
    fontWeight: "600",
  },
  totalContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 12,
    color: "#7F8C8D",
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2C3E50",
  },
});