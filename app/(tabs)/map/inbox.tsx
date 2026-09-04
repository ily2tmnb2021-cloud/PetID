import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle, ChevronRight } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { supabase, Conversation } from '@/utils/supabase';
import { AnimatedPressable } from '@/components/AnimatedPressable';

interface ConversationWithPreview extends Conversation {
  last_message?: string;
  other_user_id?: string;
}

export default function InboxScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;
  const textColor = isDark ? COLORS.dark.text : COLORS.text;
  const textSecondary = isDark ? COLORS.dark.textSecondary : COLORS.textSecondary;
  const borderColor = isDark ? COLORS.dark.border : COLORS.border;

  const [conversations, setConversations] = useState<ConversationWithPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    console.log('[Inbox] Fetching conversations');
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;
    setCurrentUserId(userId);

    if (!userId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('[Inbox] Error fetching conversations:', error.message);
    } else {
      console.log('[Inbox] Conversations loaded:', data?.length ?? 0);
      // Fetch last message for each conversation
      const enriched: ConversationWithPreview[] = await Promise.all(
        (data ?? []).map(async (conv) => {
          const { data: msgs } = await supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);
          const otherUser = conv.participant_a === userId ? conv.participant_b : conv.participant_a;
          return {
            ...conv,
            last_message: msgs?.[0]?.content ?? '',
            other_user_id: otherUser,
          };
        })
      );
      setConversations(enriched);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleConversationPress = (conv: ConversationWithPreview) => {
    console.log('[Inbox] Conversation pressed:', conv.id);
    router.push(`/map/chat/${conv.id}`);
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Stack.Screen options={{ title: 'Messages', headerShown: true }} />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: COLORS.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MessageCircle size={32} color={COLORS.primary} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>No messages yet</Text>
          <Text style={{ fontSize: 14, color: textSecondary, textAlign: 'center' }}>
            Message breeders from the map to start a conversation
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          renderItem={({ item }) => {
            const timeDisplay = formatTime(item.last_message_at);
            return (
              <AnimatedPressable onPress={() => handleConversationPress(item)}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    gap: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: borderColor,
                    backgroundColor: surface,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: COLORS.primaryMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MessageCircle size={22} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                      {item.other_user_id ? `User ${item.other_user_id.slice(0, 8)}...` : 'Conversation'}
                    </Text>
                    {item.last_message ? (
                      <Text style={{ fontSize: 13, color: textSecondary }} numberOfLines={1}>
                        {item.last_message}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    {timeDisplay ? (
                      <Text style={{ fontSize: 12, color: textSecondary }}>{timeDisplay}</Text>
                    ) : null}
                    <ChevronRight size={16} color={textSecondary} />
                  </View>
                </View>
              </AnimatedPressable>
            );
          }}
        />
      )}
    </View>
  );
}
