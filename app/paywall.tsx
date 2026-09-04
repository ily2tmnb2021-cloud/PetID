import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Crown, X, Check, Sparkles, MessageCircle, ClipboardList, Camera } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import {
  useSubscription,
  SUBSCRIPTION_PLANS,
  PlanId,
  SubscriptionPlan,
} from '@/contexts/SubscriptionContext';

const FEATURES = [
  {
    icon: Crown,
    color: COLORS.accent,
    bg: COLORS.accentMuted,
    title: 'Unlimited Pets',
    description: 'Add unlimited pets to your breeder map profile',
  },
  {
    icon: Camera,
    color: COLORS.primary,
    bg: COLORS.primaryMuted,
    title: 'AI Breed Identification',
    description: 'Unlimited AI-powered breed identification scans',
  },
  {
    icon: MessageCircle,
    color: '#7B9FE0',
    bg: 'rgba(123,159,224,0.12)',
    title: 'Real-Time Messaging',
    description: 'Chat directly with breeders and pet owners',
  },
  {
    icon: ClipboardList,
    color: COLORS.success,
    bg: COLORS.successMuted,
    title: 'Full Health History',
    description: 'Complete health log history and wellness tracking',
  },
];

function FeatureRow({
  icon: Icon,
  color,
  bg,
  title,
  description,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  bg: string;
  title: string;
  description: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 16,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: COLORS.text,
            marginBottom: 2,
            letterSpacing: -0.2,
          }}
        >
          {title}
        </Text>
        <Text style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 }}>
          {description}
        </Text>
      </View>
      <Check size={18} color={COLORS.primary} strokeWidth={2.5} />
    </View>
  );
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: SubscriptionPlan;
  selected: boolean;
  onSelect: (id: PlanId) => void;
}) {
  const isBestValue = plan.badge === 'Best Value';
  const borderColor = selected ? COLORS.primary : COLORS.border;
  const bgColor = selected ? COLORS.primaryMuted : COLORS.surface;

  const handlePress = () => {
    console.log('[Paywall] Plan card selected:', plan.id, plan.title);
    onSelect(plan.id);
  };

  return (
    <AnimatedPressable onPress={handlePress} scaleValue={0.98}>
      <View
        style={{
          borderRadius: 16,
          borderWidth: selected ? 2 : 1.5,
          borderColor,
          backgroundColor: bgColor,
          padding: 16,
          marginBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Radio dot */}
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: selected ? COLORS.primary : COLORS.border,
            backgroundColor: selected ? COLORS.primary : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
            flexShrink: 0,
          }}
        >
          {selected ? (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#FFFFFF',
              }}
            />
          ) : null}
        </View>

        {/* Plan info */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: COLORS.text,
                letterSpacing: -0.2,
              }}
            >
              {plan.title}
            </Text>
            {plan.savings ? (
              <View
                style={{
                  backgroundColor: isBestValue ? COLORS.accent : COLORS.primaryMuted,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: isBestValue ? '#FFFFFF' : COLORS.primary,
                  }}
                >
                  {plan.savings}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>
            {plan.perMonth}
          </Text>
        </View>

        {/* Price */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '800',
              color: selected ? COLORS.primary : COLORS.text,
              letterSpacing: -0.5,
            }}
          >
            {plan.price}
          </Text>
          <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>
            {plan.period}
          </Text>
        </View>

        {/* Best Value badge */}
        {isBestValue ? (
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: COLORS.accent,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderBottomLeftRadius: 10,
              borderTopRightRadius: 14,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 }}>
              BEST VALUE
            </Text>
          </View>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { purchasePlan, restorePurchases, isLoading } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<PlanId>('annual');
  const [restoring, setRestoring] = useState(false);

  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });

  const bg = isDark ? COLORS.dark.background : COLORS.background;
  const surface = isDark ? COLORS.dark.surface : COLORS.surface;

  const handleDismiss = () => {
    console.log('[Paywall] Dismissed (Maybe Later)');
    router.back();
  };

  const handleContinue = async () => {
    console.log('[Paywall] Continue pressed, selected plan:', selectedPlan);
    try {
      await purchasePlan(selectedPlan);
      console.log('[Paywall] Purchase flow completed for plan:', selectedPlan);
      router.back();
    } catch {
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    }
  };

  const handleRestore = async () => {
    console.log('[Paywall] Restore purchases pressed');
    setRestoring(true);
    try {
      await restorePurchases();
      Alert.alert('Restored', 'Your purchases have been restored.');
    } catch {
      Alert.alert('Restore Failed', 'No purchases found to restore.');
    } finally {
      setRestoring(false);
    }
  };

  const selectedPlanData = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlan);
  const continueLabel = selectedPlanData
    ? `Continue — ${selectedPlanData.price}`
    : 'Continue';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Dismiss button */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 12,
          right: 16,
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          onPress={handleDismiss}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: isDark ? COLORS.dark.surfaceSecondary : COLORS.surfaceSecondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityLabel="Dismiss paywall"
        >
          <X size={16} color={isDark ? COLORS.dark.textSecondary : COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={{ alignItems: 'center', marginBottom: 28, marginTop: 16 }}>
          <Animated.View style={{ opacity: shimmerOpacity }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                backgroundColor: COLORS.accentMuted,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Crown size={34} color={COLORS.accent} />
            </View>
          </Animated.View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: isDark ? COLORS.dark.text : COLORS.text,
              textAlign: 'center',
              letterSpacing: -0.6,
              marginBottom: 8,
            }}
          >
            Unlock PetID Pro
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: isDark ? COLORS.dark.textSecondary : COLORS.textSecondary,
              textAlign: 'center',
              lineHeight: 22,
              maxWidth: 280,
            }}
          >
            Everything you need to care for your pets — all in one place
          </Text>
        </View>

        {/* Features */}
        <View
          style={{
            backgroundColor: surface,
            borderRadius: 20,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: isDark ? COLORS.dark.border : COLORS.border,
          }}
        >
          {FEATURES.map((f) => (
            <FeatureRow
              key={f.title}
              icon={f.icon}
              color={f.color}
              bg={f.bg}
              title={f.title}
              description={f.description}
            />
          ))}
        </View>

        {/* Plans */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: isDark ? COLORS.dark.textSecondary : COLORS.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 12,
          }}
        >
          Choose your plan
        </Text>
        {SUBSCRIPTION_PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={selectedPlan === plan.id}
            onSelect={setSelectedPlan}
          />
        ))}

        {/* Fine print */}
        <Text
          style={{
            fontSize: 12,
            color: isDark ? COLORS.dark.textTertiary : COLORS.textTertiary,
            textAlign: 'center',
            marginTop: 8,
            lineHeight: 18,
          }}
        >
          Subscription auto-renews. Cancel anytime in App Store settings.
        </Text>
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 16,
          paddingTop: 16,
          backgroundColor: bg,
          borderTopWidth: 1,
          borderTopColor: isDark ? COLORS.dark.border : COLORS.border,
        }}
      >
        <AnimatedPressable onPress={handleContinue} disabled={isLoading} scaleValue={0.97}>
          <View
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Sparkles size={18} color="#FFFFFF" />
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '700',
                    color: '#FFFFFF',
                    letterSpacing: -0.2,
                  }}
                >
                  {continueLabel}
                </Text>
              </>
            )}
          </View>
        </AnimatedPressable>

        <TouchableOpacity
          onPress={handleRestore}
          disabled={restoring}
          style={{ alignItems: 'center', marginTop: 14 }}
        >
          {restoring ? (
            <ActivityIndicator color={COLORS.textSecondary} size="small" />
          ) : (
            <Text
              style={{
                fontSize: 14,
                color: isDark ? COLORS.dark.textSecondary : COLORS.textSecondary,
                fontWeight: '500',
              }}
            >
              Restore Purchases
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
