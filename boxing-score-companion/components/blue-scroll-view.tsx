import React, { useState } from 'react';
import { Animated, Platform, StyleSheet, useAnimatedValue, View, type ScrollViewProps } from 'react-native';

type BlueScrollViewProps = Pick<ScrollViewProps, 'children' | 'style' | 'contentContainerStyle'>;

export default function BlueScrollView({ children, style, contentContainerStyle }: BlueScrollViewProps) {
  const scrollOffset = useAnimatedValue(0);
  const indicatorOpacity = useAnimatedValue(Platform.OS === 'web' ? 1 : 0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const useNativeDriver = Platform.OS !== 'web';
  const hasOverflow = viewportHeight > 0 && contentHeight > viewportHeight;
  const thumbHeight = hasOverflow
    ? Math.min(viewportHeight, Math.max(24, (viewportHeight * viewportHeight) / contentHeight))
    : 0;
  const translateY = scrollOffset.interpolate({
    inputRange: [0, Math.max(1, contentHeight - viewportHeight)],
    outputRange: [0, Math.max(0, viewportHeight - thumbHeight)],
    extrapolate: 'clamp',
  });

  const showIndicator = () => {
    indicatorOpacity.stopAnimation();
    indicatorOpacity.setValue(1);
  };

  const hideIndicator = () => {
    if (Platform.OS === 'web') return;
    Animated.timing(indicatorOpacity, {
      toValue: 0,
      delay: 800,
      duration: 250,
      useNativeDriver,
    }).start();
  };

  return (
    <View style={style}>
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
        onContentSizeChange={(_width, height) => setContentHeight(height)}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollOffset } } }],
          { useNativeDriver },
        )}
        scrollEventThrottle={16}
        onScrollBeginDrag={showIndicator}
        onScrollEndDrag={hideIndicator}
        onMomentumScrollBegin={showIndicator}
        onMomentumScrollEnd={hideIndicator}
      >
        {children}
      </Animated.ScrollView>
      {hasOverflow && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            { height: thumbHeight, opacity: indicatorOpacity, transform: [{ translateY }] },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
    flexShrink: 1,
  },
  indicator: {
    backgroundColor: '#307FB6',
    borderRadius: 2,
    position: 'absolute',
    right: 1,
    top: 0,
    width: 3,
  },
});
