import React, { forwardRef } from 'react';
import { Animated, Platform, StyleSheet, View, type ScrollView, type ScrollViewProps } from 'react-native';
import BlueScrollIndicator, { useBlueScrollIndicator } from './blue-scroll-indicator';

const BlueScrollView = forwardRef<ScrollView, ScrollViewProps>(function BlueScrollView({
  children,
  style,
  contentContainerStyle,
  horizontal = false,
  scrollEnabled = true,
  showsVerticalScrollIndicator = true,
  showsHorizontalScrollIndicator = true,
  persistentScrollbar = false,
  scrollEventThrottle = 16,
  onLayout,
  onContentSizeChange,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollBegin,
  onMomentumScrollEnd,
  ...scrollViewProps
}, ref) {
  const isHorizontal = horizontal === true;
  const indicator = useBlueScrollIndicator({ horizontal: isHorizontal, persistent: persistentScrollbar });
  const showIndicator = scrollEnabled && (isHorizontal ? showsHorizontalScrollIndicator : showsVerticalScrollIndicator);
  const {
    padding, paddingHorizontal, paddingVertical, paddingTop, paddingBottom,
    paddingLeft, paddingRight, paddingStart, paddingEnd,
    ...containerStyle
  } = StyleSheet.flatten(style) ?? {};

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.ScrollView
        {...scrollViewProps}
        ref={ref}
        style={[
          styles.scrollView,
          { padding, paddingHorizontal, paddingVertical, paddingTop, paddingBottom, paddingLeft, paddingRight, paddingStart, paddingEnd },
        ]}
        contentContainerStyle={contentContainerStyle}
        horizontal={horizontal}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onLayout={(event) => {
          indicator.onLayout(event);
          onLayout?.(event);
        }}
        onContentSizeChange={(width, height) => {
          indicator.onContentSizeChange(width, height);
          onContentSizeChange?.(width, height);
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { [isHorizontal ? 'x' : 'y']: indicator.scrollOffset } } }],
          { useNativeDriver: Platform.OS !== 'web', listener: onScroll },
        )}
        scrollEventThrottle={scrollEventThrottle}
        onScrollBeginDrag={(event) => {
          indicator.showIndicator();
          onScrollBeginDrag?.(event);
        }}
        onScrollEndDrag={(event) => {
          indicator.hideIndicator();
          onScrollEndDrag?.(event);
        }}
        onMomentumScrollBegin={(event) => {
          indicator.showIndicator();
          onMomentumScrollBegin?.(event);
        }}
        onMomentumScrollEnd={(event) => {
          indicator.hideIndicator();
          onMomentumScrollEnd?.(event);
        }}
      >
        {children}
      </Animated.ScrollView>
      <BlueScrollIndicator {...indicator.indicatorProps} visible={showIndicator && indicator.indicatorProps.visible} />
    </View>
  );
});

export default BlueScrollView;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollView: {
    flexGrow: 1,
    flexShrink: 1,
  },
});
