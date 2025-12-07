// components/ChatBubble.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SENTIMENT_COLORS } from '../utils/wordDictionary';
import { getLabelEmoji } from '../utils/sentiment';

export default function ChatBubble({ 
  text, 
  isUser = false, 
  date,
  sentiment 
}) {
  // 사용자 메시지의 감정 색상
  const sentimentColor = sentiment?.label 
    ? SENTIMENT_COLORS[sentiment.label] 
    : null;

  return (
    <View style={[
      styles.container, 
      isUser ? styles.userContainer : styles.botContainer
    ]}>
      {/* 봇 아이콘 */}
      {!isUser && (
        <View style={styles.avatarContainer}>
          <View style={styles.botAvatar}>
            <Ionicons name="chatbubble-ellipses" size={16} color="#ffffff" />
          </View>
        </View>
      )}

      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.botBubble,
        sentimentColor && { borderLeftWidth: 4, borderLeftColor: sentimentColor }
      ]}>
        {/* 사용자 메시지에 감정 이모지 표시 */}
        {isUser && sentiment?.label && (
          <View style={styles.sentimentBadge}>
            <Text style={styles.sentimentEmoji}>
              {getLabelEmoji(sentiment.label)}
            </Text>
          </View>
        )}

        <Text style={[
          styles.text, 
          isUser ? styles.userText : styles.botText
        ]}>
          {text}
        </Text>
        
        {date && (
          <Text style={[
            styles.dateText,
            isUser ? styles.userDate : styles.botDate
          ]}>
            {date}
          </Text>
        )}
      </View>

      {/* 사용자 아이콘 */}
      {isUser && (
        <View style={styles.avatarContainer}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={16} color="#ffffff" />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-end',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  botContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    marginHorizontal: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7F8C8D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#4A90E2',
    borderTopRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sentimentBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sentimentEmoji: {
    fontSize: 14,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  botText: {
    color: '#2C3E50',
  },
  dateText: {
    fontSize: 11,
    marginTop: 6,
  },
  userDate: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  botDate: {
    color: '#95A5A6',
    textAlign: 'left',
  },
});