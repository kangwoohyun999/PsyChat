// screens/ChatScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ChatBubble from "../components/ChatBubble";
import { extractKeywordsWithWeights } from "../utils/keywordExtractor";
import { estimateSentimentFromWeighted, getLabelText, getLabelEmoji } from "../utils/sentiment";
import { saveEntry, getEntriesByDate, saveMoodColor } from "../utils/storage";

function formatDateISO(d) {
  return d.toISOString().slice(0, 10);
}

function formatDateKorean(d) {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = days[d.getDay()];
  return `${year}년 ${month}월 ${date}일 (${dayName})`;
}

export default function ChatScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    fetchForDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const fetchForDate = async (d) => {
    try {
      setIsLoading(true);
      const entries = await getEntriesByDate(formatDateISO(d));
      
      const loadedMessages = [];
      entries.forEach((entry) => {
        loadedMessages.push({
          id: entry.id,
          text: entry.text,
          isUser: true,
          date: entry.date,
          sentiment: entry.sentiment,
        });
        
        const botReply = entry.botReply || generateFeedback(entry);
        loadedMessages.push({
          id: `${entry.id}_bot`,
          text: botReply,
          isUser: false,
          date: entry.date,
        });
      });
      
      setMessages(loadedMessages);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
      Alert.alert("오류", "데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const changeDate = (deltaDays) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + deltaDays);
    setSelectedDate(d);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = () => {
    const today = new Date();
    return formatDateISO(selectedDate) === formatDateISO(today);
  };

  const isFutureDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected > today;
  };

  const handleSend = async () => {
    if (!text.trim() || isSending) return;

    // 미래 날짜는 작성 불가
    if (isFutureDate()) {
      Alert.alert("알림", "미래 날짜에는 일기를 작성할 수 없습니다.");
      return;
    }

    try {
      setIsSending(true);

      // 키워드 추출
      const { keywords, counts, weighted } = extractKeywordsWithWeights(text);
      
      // 감성 분석
      const sentiment = estimateSentimentFromWeighted(weighted);

      // 감정색 저장
      const dateStr = formatDateISO(selectedDate);
      await saveMoodColor(dateStr, sentiment.label);

      // Entry 생성 - 선택된 날짜 + 현재 시간
      const now = new Date();
      const entryDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
      );

      const botReply = generateFeedback({ text: text.trim(), sentiment, keywords });

      const entry = {
        id: Date.now().toString(),
        date: entryDate.toISOString(),
        text: text.trim(),
        keywords,
        counts,
        weighted,
        sentiment,
        botReply,
      };

      const success = await saveEntry(entry);

      if (!success) {
        throw new Error("저장 실패");
      }

      // 메시지 추가
      setMessages((prev) => [
        ...prev,
        {
          id: entry.id,
          text: entry.text,
          isUser: true,
          date: entry.date,
          sentiment: entry.sentiment,
        },
        {
          id: `${entry.id}_bot`,
          text: botReply,
          isUser: false,
          date: new Date().toISOString(),
        },
      ]);

      setText("");
      
    } catch (error) {
      console.error("메시지 전송 실패:", error);
      Alert.alert("오류", "메시지 전송에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSending(false);
    }
  };

  const generateFeedback = (entry) => {
    if (!entry || !entry.sentiment) {
      return "작성해주셔서 감사합니다. 오늘의 감정이 기록되었어요.";
    }

    const { label, score, confidence } = entry.sentiment;
    const keywords = entry.keywords || [];
    const emoji = getLabelEmoji(label);
    const labelText = getLabelText(label);

    // 신뢰도가 낮으면 일반적인 응답
    if (confidence < 0.3) {
      return `${emoji} 오늘의 감정을 기록했어요. 더 자세히 말씀해주시면 더 잘 이해할 수 있어요.`;
    }

    // 매우 긍정적
    if (label === "very_positive") {
      const responses = [
        `${emoji} 와! 정말 멋진 하루셨네요! ${keywords.length > 0 ? `특히 '${keywords[0]}'에 대한 이야기가 인상적이에요.` : ""} 이런 기분 오래 지속되길 바라요!`,
        `${emoji} 너무 좋은 하루였나 봐요! 행복이 느껴져요. ${keywords.length > 1 ? `'${keywords[0]}'와 '${keywords[1]}'이 함께한 하루라니 완벽하네요!` : ""}`,
        `${emoji} 정말 환상적인 하루였군요! 이런 날들이 자주 있기를 바래요. ${keywords.length > 0 ? `'${keywords[0]}'를 통해 많은 기쁨을 느끼셨네요!` : ""}`,
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // 긍정적
    if (label === "positive") {
      const responses = [
        `${emoji} 좋은 하루를 보내셨네요! ${keywords.length > 0 ? `'${keywords[0]}'에 대해 더 이야기해주시겠어요?` : "계속 이런 기분 유지하세요!"}`,
        `${emoji} 기분 좋은 일이 있었나 봐요. ${keywords.length > 0 ? `'${keywords[0]}'가 오늘의 하이라이트였나요?` : "행복한 하루 되세요!"}`,
        `${emoji} 오늘은 긍정적인 하루였어요! ${keywords.length > 1 ? `'${keywords[0]}'와 '${keywords[1]}'이 함께했네요.` : ""}`,
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // 매우 부정적
    if (label === "very_negative") {
      return `${emoji} 오늘 정말 힘든 하루를 보내셨군요. ${keywords.length > 0 ? `'${keywords[0]}' 때문에 많이 힘드셨나요?` : ""} 괜찮으세요? 더 이야기하고 싶으시면 언제든 적어주세요. 당신의 감정을 존중합니다.`;
    }

    // 부정적
    if (label === "negative") {
      const responses = [
        `${emoji} 조금 힘든 하루였나 봐요. ${keywords.length > 0 ? `'${keywords[0]}' 때문이신가요?` : ""} 필요하면 더 이야기해주세요.`,
        `${emoji} 오늘은 좋지 않은 일이 있었나 봐요. ${keywords.length > 0 ? `'${keywords[0]}'에 대해 더 말씀해주시겠어요?` : "힘내세요!"}`,
        `${emoji} 힘든 감정을 느끼셨네요. ${keywords.length > 0 ? `'${keywords[0]}'가 부담스러우셨나요?` : ""} 천천히 이야기해주세요.`,
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // 중립
    return `${emoji} 평범한 하루였네요. ${keywords.length > 0 ? `'${keywords[0]}'에 대해 더 이야기해주시겠어요?` : "더 말씀해주시면 좋겠어요."}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>일기 작성</Text>

          <View style={{ width: 40 }} />
        </View>

        {/* 날짜 선택 */}
        <View style={styles.dateRow}>
          <TouchableOpacity
            onPress={() => changeDate(-1)}
            style={styles.dateBtn}
          >
            <Ionicons name="chevron-back" size={24} color="#4A90E2" />
          </TouchableOpacity>

          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDateKorean(selectedDate)}</Text>
            {isToday() ? (
              <Text style={styles.todayBadge}>오늘</Text>
            ) : (
              <TouchableOpacity
                style={styles.todayBtn}
                onPress={goToToday}
              >
                <Ionicons name="calendar" size={14} color="#4A90E2" />
                <Text style={styles.todayBtnText}>오늘</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => changeDate(1)}
            style={styles.dateBtn}
            disabled={isFutureDate()}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={isFutureDate() ? "#BDC3C7" : "#4A90E2"}
            />
          </TouchableOpacity>
        </View>

        {/* 메시지 목록 */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>불러오는 중...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color="#BDC3C7" />
                <Text style={styles.emptyText}>
                  {isFutureDate()
                    ? "미래 날짜입니다.\n과거 날짜를 선택해주세요."
                    : "이 날짜에는 작성된 일기가 없습니다.\n아래에 일기를 작성해보세요."}
                </Text>
              </View>
            ) : (
              messages.map((m) => (
                <ChatBubble
                  key={m.id}
                  text={m.text}
                  isUser={m.isUser}
                  sentiment={m.sentiment}
                  date={new Date(m.date).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                />
              ))
            )}
          </ScrollView>
        )}

        {/* 입력 영역 */}
        <View style={styles.inputContainer}>
          {isFutureDate() && (
            <View style={[styles.disabledOverlay, { backgroundColor: "#FFE5E5" }]}>
              <Ionicons name="alert-circle" size={16} color="#C62828" />
              <Text style={[styles.disabledText, { color: "#C62828" }]}>
                미래 날짜에는 일기를 작성할 수 없습니다
              </Text>
            </View>
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={
                isFutureDate()
                  ? "과거 날짜를 선택해주세요..."
                  : "일기를 작성해보세요..."
              }
              placeholderTextColor="#95A5A6"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={1000}
              editable={!isSending && !isFutureDate()}
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!text.trim() || isSending || isFutureDate()) && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!text.trim() || isSending || isFutureDate()}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {text.length > 0 && !isFutureDate() && (
            <Text style={styles.charCount}>{text.length} / 1000</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C3E50",
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  dateBtn: {
    padding: 8,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    color: "#2C3E50",
    fontSize: 16,
    fontWeight: "600",
  },
  todayBadge: {
    backgroundColor: "#4A90E2",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F4FD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A90E2",
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
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#95A5A6",
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  inputContainer: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  disabledOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF3CD",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  disabledText: {
    color: "#856404",
    fontSize: 14,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    color: "#2C3E50",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    fontSize: 16,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  sendBtn: {
    backgroundColor: "#4A90E2",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#BDC3C7",
    opacity: 0.6,
  },
  charCount: {
    fontSize: 12,
    color: "#95A5A6",
    textAlign: "right",
    marginTop: 4,
  },
});