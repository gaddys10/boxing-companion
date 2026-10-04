import React, { useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  useAnimatedValue,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type IndicatorOptions = {
  horizontal?: boolean;
  persistent?: boolean;
  trackInset?: number;
};

export function useBlueScrollIndicator({ horizontal = false, persistent = false, trackInset = 0 }: IndicatorOptions = {}) {
  const scrollOffset = useAnimatedValue(0);
  const opacity = useAnimatedValue(Platform.OS === 'web' || persistent ? 1 : 0);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [content, setContent] = useState({ width: 0, height: 0 });
  const viewportExtent = horizontal ? viewport.width : viewport.height;
  const contentExtent = horizontal ? content.width : content.height;
  const trackExtent = Math.max(0, viewportExtent - trackInset * 2);
  const visible = trackExtent > 0 && contentExtent > viewportExtent;
  const size = visible
    ? Math.min(trackExtent, Math.max(24, (trackExtent * viewportExtent) / contentExtent))
    : 0;
  const translate = scrollOffset.interpolate({
    inputRange: [0, Math.max(1, contentExtent - viewportExtent)],
    outputRange: [0, Math.max(0, trackExtent - size)],
    extrapolate: 'clamp',
  });

  const showIndicator = () => {
    opacity.stopAnimation();
    opacity.setValue(1);
  };

  const hideIndicator = () => {
    if (Platform.OS === 'web' || persistent) return;
    Animated.timing(opacity, {
      toValue: 0,
      delay: 800,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  return {
    scrollOffset,
    showIndicator,
    hideIndicator,
    onLayout: (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      setViewport({ width, height });
    },
    onContentSizeChange: (width: number, height: number) => setContent({ width, height }),
    indicatorProps: { visible, size, translate, opacity, horizontal },
  };
}

type BlueScrollIndicatorProps = {
  visible: boolean;
  size: number;
  translate: Animated.AnimatedInterpolation<number>;
  opacity: Animated.Value;
  horizontal: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function BlueScrollIndicator({ visible, size, translate, opacity, horizontal, style }: BlueScrollIndicatorProps) {
  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.indicator,
        horizontal
          ? { bottom: 1, left: 0, height: 3, width: size, transform: [{ translateX: translate }] }
          : { right: 1, top: 0, width: 3, height: size, transform: [{ translateY: translate }] },
        { opacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  indicator: {
    backgroundColor: '#307FB6',
    borderRadius: 2,
    position: 'absolute',
  },
});
