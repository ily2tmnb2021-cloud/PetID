import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { supabase, Message } from '@/utils/supabase';

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;
  const borderColor = isDark ? COLORS.dark.border : COLORS.border;
  const inputBg = isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [recipientId, setRecipientId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    console.log('[Chat] Fetching messages for conversation:', conversationId);

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;
    setCurrentUserId(userId);

    // Get conversation to find recipient
    const { data: conv } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (conv && userId) {
      const other = conv.participant_a === userId ? conv.participant_b : conv.participant_a;
      setRecipientId(other);
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Chat] Error fetching messages:', error.message);
    } else {
      console.log('[Chat] Messages loaded:', data?.length ?? 0);
      setMessages(data ?? []);
    }
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('[Chat] New message received via realtime');
          setMessages((prev) => [...prev, payload.new as Message]);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages, conversationId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !currentUserId || !recipientId || !conversationId) return;

    console.log('[Chat] Send message pressed:', text.slice(0, 30));
    setSending(true);
    setInputText('');

    try {
      const { error: msgError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        recipient_id: recipientId,
        content: text,
        is_read: false,
      });

      if (msgError) {
        console.error('[Chat] Error sending message:', msgError.message);
        setInputText(text);
      } else {
        // Update conversation last_message_at
        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversationId);
        console.log('[Chat] Message sent successfully');
      }
    } catch (err) {
      console.error('[Chat] Exception sending message:', err);
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMine = item.sender_id === currentUserId;
    const timeDisplay = formatTime(item.created_at);
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showTime = !prevMsg || new Date(item.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000;

    return (
      <View style={{ paddingHorizontal: 16, marginBottom: 4 }}>
        {showTime ? (
          <Text
            style={{
              fontSize: 11,
              color: textSecondary,
              textAlign: 'center',
              marginVertical: 8,
            }}
          >
            {timeDisplay}
          </Text>
        ) : null}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: isMine ? 'flex-end' : 'flex-start',
          }}
        >
          <View
            style={{
              maxWidth: '75%',
              backgroundColor: isMine ? COLORS.primary : surface,
              borderRadius: 18,
              borderBottomRightRadius: isMine ? 4 : 18,
              borderBottomLeftRadius: isMine ? 18 : 4,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderWidth: isMine ? 0 : 1,
              borderColor: borderColor,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                color: isMine ? '#FFFFFF' : textColor,
                lineHeight: 20,
              }}
            >
              {item.content}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ title: 'Chat', headerShown: true }} />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 60 }}>
              <Text style={{ fontSize: 15, color: textSecondary, textAlign: 'center' }}>
                No messages yet. Say hello!
              </Text>
            </View>
          }
        />
      )}

      {/* Input bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: 12,
          paddingVertical: 10,
          paddingBottom: insets.bottom + 10,
          borderTopWidth: 1,
          borderTopColor: borderColor,
          backgroundColor: isDark ? COLORS.dark.surface : COLORS.surface,
          gap: 8,
        }}
      >
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Message..."
          placeholderTextColor={COLORS.textTertiary}
          multiline
          style={{
            flex: 1,
            backgroundColor: inputBg,
            borderRadius: 22,
            paddingHorizontal: 16,
            paddingVertical: 10,
            fontSize: 15,
            color: textColor,
            maxHeight: 120,
            borderWidth: 1,
            borderColor: borderColor,
          }}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: inputText.trim() ? COLORS.primary : (isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Send size={18} color={inputText.trim() ? '#FFFFFF' : textSecondary} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
