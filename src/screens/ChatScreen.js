import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { askAthena } from '../api/client';
import { colors, spacing, radius } from '../theme';
import PaperTradingScreen from './PaperTradingScreen';

const QUICK_QUESTIONS = [
  'Portföyüm nasıl?',
  'En iyi hisse hangisi?',
  'Risk durumum nedir?',
  'BIST bugün ne yapar?',
];

function MarkdownText({ text, style }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <View>
      {lines.map((line, li) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <Text key={li} style={[styles.bubbleText, style, li > 0 && { marginTop: 2 }]}>
            {parts.map((part, pi) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <Text key={pi} style={{ fontWeight: '800', color: colors.textPrimary }}>
                    {part.slice(2, -2)}
                  </Text>
                );
              }
              return part;
            })}
          </Text>
        );
      })}
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Merhaba. Ben Athena 🦉 BIST hisseleri, portföyün veya piyasa hakkında soru sorabilirsin.\n\nSanal işlem yapmak için 📊 Paper Trading butonuna bas.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [paperVisible, setPaperVisible] = useState(false);
  const scrollRef = useRef(null);

  const send = async (text) => {
    const soru = (text || input).trim();
    if (!soru || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: soru };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages
        .slice(-11, -1)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await askAthena({ question: soru, history });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.answer }]);
    } catch (e) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `Hata: ${e.message}`,
      }]);
    }

    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View>
            <Text style={styles.headerLabel}>AI ASISTAN</Text>
            <Text style={styles.headerTitle}>Athena</Text>
          </View>
          <View style={styles.headerRight}>
            {/* Paper Trading Butonu */}
            <TouchableOpacity
              style={styles.paperBtn}
              onPress={() => setPaperVisible(true)}
            >
              <Text style={styles.paperBtnText}>📊 Paper</Text>
            </TouchableOpacity>
            <View style={styles.statusTag}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>ONLINE</Text>
            </View>
          </View>
        </View>

        {/* Quick Sorular */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickScroll}
          contentContainerStyle={styles.quickContent}
        >
          {QUICK_QUESTIONS.map((q) => (
            <TouchableOpacity key={q} style={styles.quickBtn} onPress={() => send(q)}>
              <Text style={styles.quickText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Mesajlar */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 8 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((m, i) => (
            <View
              key={i}
              style={[
                styles.bubble,
                m.role === 'user' ? styles.bubbleUser : styles.bubbleBot,
              ]}
            >
              {m.role === 'assistant' && (
                <Text style={styles.bubbleFrom}>ATHENA</Text>
              )}
              {m.role === 'user' ? (
                <Text style={[styles.bubbleText, styles.bubbleTextUser]}>{m.content}</Text>
              ) : (
                <MarkdownText text={m.content} />
              )}
            </View>
          ))}

          {loading && (
            <View style={[styles.bubble, styles.bubbleBot]}>
              <Text style={styles.bubbleFrom}>ATHENA</Text>
              <View style={styles.typingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.typingText}>Düşünüyor...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputRow, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Sorunuzu yazın..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => send()}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => send()}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendText}>›</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Paper Trading Full Screen Modal */}
      <Modal
        visible={paperVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <PaperTradingScreen onClose={() => setPaperVisible(false)} />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLabel: { fontSize: 9, color: colors.textSecondary, letterSpacing: 2, fontWeight: '700' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: colors.white, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  paperBtn: {
    backgroundColor: colors.primaryDim,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  paperBtnText: { fontSize: 11, color: colors.primary, fontWeight: '700' },

  statusTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.bgCard, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.green },
  statusText: { fontSize: 9, color: colors.textSecondary, letterSpacing: 1.5, fontWeight: '700' },

  quickScroll: { maxHeight: 46, borderBottomWidth: 1, borderBottomColor: colors.border },
  quickContent: { paddingHorizontal: spacing.md, paddingVertical: 8, gap: 8, alignItems: 'center' },
  quickBtn: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
  },
  quickText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },

  messages: { flex: 1 },

  bubble: { borderRadius: radius.lg, padding: 12, marginBottom: 10, maxWidth: '85%' },
  bubbleBot: {
    backgroundColor: colors.bgCard, borderWidth: 1,
    borderColor: colors.border, alignSelf: 'flex-start',
  },
  bubbleUser: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
  bubbleFrom: {
    fontSize: 8, color: colors.primary, fontWeight: '800',
    letterSpacing: 1.5, marginBottom: 6,
  },
  bubbleText: { fontSize: 14, color: colors.textPrimary, lineHeight: 22 },
  bubbleTextUser: { color: colors.black },

  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { fontSize: 12, color: colors.textSecondary },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.md, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: colors.border, gap: 8, backgroundColor: colors.bg,
  },
  input: {
    flex: 1, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 12,
    color: colors.white, fontSize: 14, maxHeight: 100,
  },
  sendBtn: {
    width: 46, height: 46, backgroundColor: colors.primary,
    borderRadius: 23, justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
  sendText: { fontSize: 26, color: colors.black, fontWeight: '900', lineHeight: 30, marginLeft: 2 },
});