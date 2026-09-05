import React, { useRef, useCallback } from 'react';
import { Animated, StyleSheet, View, Text } from 'react-native';

// 6 colorful paw prints burst outward from a tap point, then fade out
// Usage: const pawBurstRef = useRef<PawBurstHandle>(null);
//        pawBurstRef.current?.burst(x, y);  // x,y are page coordinates
//        <PawBurst ref={pawBurstRef} />

export interface PawBurstHandle {
  burst: (x: number, y: number) => void;
}

const PAW_COLORS = ['#FF6B9D', '#FFB347', '#7EC8E3', '#98FB98', '#DDA0DD', '#FFD700'];
const COUNT = 6;

const PawBurst = React.forwardRef<PawBurstHandle, Record<string, never>>((_, ref) => {
  const paws = useRef(
    Array.from({ length: COUNT }, () => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  const [positions, setPositions] = React.useState<{ x: number; y: number }[]>(
    Array.from({ length: COUNT }, () => ({ x: 0, y: 0 }))
  );

  const burst = useCallback(
    (cx: number, cy: number) => {
      console.log('[PawBurst] Burst triggered at:', cx, cy);
      const newPositions = Array.from({ length: COUNT }, () => ({ x: cx, y: cy }));
      setPositions(newPositions);

      paws.forEach((paw, i) => {
        const angle = (i / COUNT) * 2 * Math.PI;
        const distance = 60 + Math.random() * 40;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;

        paw.opacity.setValue(1);
        paw.translateX.setValue(0);
        paw.translateY.setValue(0);
        paw.scale.setValue(0);

        Animated.parallel([
          Animated.spring(paw.scale, {
            toValue: 1,
            useNativeDriver: true,
            damping: 8,
            stiffness: 200,
          }),
          Animated.timing(paw.translateX, {
            toValue: dx,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(paw.translateY, {
            toValue: dy,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(300),
            Animated.timing(paw.opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
    },
    [paws]
  );

  React.useImperativeHandle(ref, () => ({ burst }), [burst]);

  return (
    <>
      {paws.map((paw, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              left: positions[i].x - 16,
              top: positions[i].y - 16,
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: paw.opacity,
              transform: [
                { translateX: paw.translateX },
                { translateY: paw.translateY },
                { scale: paw.scale },
              ],
            },
          ]}
        >
          <Text style={{ fontSize: 22, color: PAW_COLORS[i] }}>🐾</Text>
        </Animated.View>
      ))}
    </>
  );
});

PawBurst.displayName = 'PawBurst';
export default PawBurst;
