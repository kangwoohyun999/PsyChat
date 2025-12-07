// App.js
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

import HomeScreen from "./screens/HomeScreen";
import ChatScreen from "./screens/ChatScreen";
import HistoryScreen from "./screens/HistoryScreen";
import GraphScreen from "./screens/GraphScreen";
import CalendarScreen from "./screens/CalendarScreen";
import LoginScreen from "./screens/LoginScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 탭 네비게이터
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = "help-circle-outline"; // 기본값 설정

          switch (route.name) {
            case "Home":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Chat":
              iconName = focused ? "chatbubble" : "chatbubble-outline";
              break;
            case "History":
              iconName = focused ? "list" : "list-outline";
              break;
            case "Graph":
              iconName = focused ? "stats-chart" : "stats-chart-outline";
              break;
            case "Calendar":
              iconName = focused ? "calendar" : "calendar-outline";
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#4A90E2",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: "홈" }} 
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{ title: "채팅" }} 
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{ title: "기록" }} 
      />
      <Tab.Screen 
        name="Graph" 
        component={GraphScreen} 
        options={{ title: "통계" }} 
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen} 
        options={{ title: "캘린더" }} 
      />
    </Tab.Navigator>
  );
}

// 로딩 화면
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4A90E2" />
      <Text style={styles.loadingText}>로딩 중...</Text>
    </View>
  );
}

// 에러 화면
function ErrorScreen({ error, onRetry }) {
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={60} color="#E74C3C" />
      <Text style={styles.errorTitle}>오류가 발생했습니다</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // Firebase 인증 상태 리스너
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (isMounted) {
          setUser(currentUser);
          setIsLoading(false);
          setError(null);
        }
      },
      (authError) => {
        // 인증 에러 처리
        if (isMounted) {
          console.error("Firebase 인증 에러:", authError);
          
          let errorMessage = "인증 오류가 발생했습니다.";
          
          switch (authError.code) {
            case "auth/network-request-failed":
              errorMessage = "네트워크 연결을 확인해주세요.";
              break;
            case "auth/too-many-requests":
              errorMessage = "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.";
              break;
            default:
              errorMessage = authError.message;
          }
          
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    );

    // 클린업 함수
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // 에러 재시도 함수
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // 컴포넌트 재마운트를 통해 useEffect 재실행
  };

  // 에러 화면 표시
  if (error) {
    return <ErrorScreen error={error} onRetry={handleRetry} />;
  }

  // 로딩 화면 표시
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#7F8C8D",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
