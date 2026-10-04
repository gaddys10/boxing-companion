import React, { forwardRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type TextInputScrollEvent,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import BlueScrollIndicator, { useBlueScrollIndicator } from './blue-scroll-indicator';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const webScrollbarStyle = { scrollbarColor: '#307FB6 transparent' } as TextStyle;

const wrapperStyleKeys = new Set<keyof TextStyle>([
  'alignSelf', 'aspectRatio', 'bottom', 'display', 'end', 'flex', 'flexBasis',
  'flexGrow', 'flexShrink', 'height', 'left', 'margin', 'marginBottom',
  'marginEnd', 'marginHorizontal', 'marginLeft', 'marginRight', 'marginStart',
  'marginTop', 'marginVertical', 'maxHeight', 'maxWidth', 'minHeight', 'minWidth',
  'opacity', 'position', 'right', 'start', 'top', 'transform', 'width', 'zIndex',
]);

const BlueTextInput = forwardRef<TextInput, TextInputProps>(function BlueTextInput(
  {
    style,
    multiline,
    scrollEnabled,
    onLayout,
    onContentSizeChange,
    onScroll,
    ...props
  },
  ref,
) {
  const indicator = useBlueScrollIndicator({ trackInset: 1 });

  if (Platform.OS === 'web') {
    return (
      <TextInput
        {...props}
        ref={ref}
        multiline={multiline}
        scrollEnabled={scrollEnabled}
        style={[style, webScrollbarStyle]}
        onLayout={onLayout}
        onContentSizeChange={onContentSizeChange}
        onScroll={onScroll}
      />
    );
  }

  const flattenedStyle = StyleSheet.flatten(style) ?? {};
  const wrapperStyle = Object.fromEntries(
    Object.entries(flattenedStyle).filter(([key]) => wrapperStyleKeys.has(key as keyof TextStyle)),
  ) as ViewStyle;
  const inputStyle = Object.fromEntries(
    Object.entries(flattenedStyle).filter(([key]) => !wrapperStyleKeys.has(key as keyof TextStyle)),
  ) as TextStyle;
  const borderStyle = Object.fromEntries(
    Object.entries(flattenedStyle).filter(([key]) => key.startsWith('border')),
  ) as ViewStyle;
  const showScrollbar = multiline && scrollEnabled !== false;

  return (
    <View style={[wrapperStyle, { borderRadius: flattenedStyle.borderRadius, overflow: 'hidden' }]}>
      <AnimatedTextInput
        {...props}
        ref={ref}
        multiline={multiline}
        scrollEnabled={scrollEnabled}
        style={[
          inputStyle,
          { width: '100%', height: wrapperStyle.height != null ? '100%' : undefined },
        ]}
        onLayout={(event) => {
          indicator.onLayout(event);
          onLayout?.(event);
        }}
        onContentSizeChange={(event) => {
          const { width, height } = event.nativeEvent.contentSize;
          indicator.onContentSizeChange(width, height);
          onContentSizeChange?.(event);
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: indicator.scrollOffset } } }],
          {
            useNativeDriver: true,
            listener: (event: TextInputScrollEvent) => {
              indicator.showIndicator();
              indicator.hideIndicator();
              onScroll?.(event);
            },
          },
        )}
      />
      {showScrollbar && (
        <>
          {/* Keep native caret scrolling while replacing its indicator visually. */}
          <View
            pointerEvents="none"
            style={[
              styles.indicatorMask,
              { backgroundColor: flattenedStyle.backgroundColor ?? '#fff' },
            ]}
          />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, borderStyle]} />
          <BlueScrollIndicator {...indicator.indicatorProps} style={styles.indicator} />
        </>
      )}
    </View>
  );
});

export default BlueTextInput;

const styles = StyleSheet.create({
  indicatorMask: {
    bottom: 1,
    borderRadius: 4,
    position: 'absolute',
    right: 1,
    top: 1,
    width: 8,
  },
  indicator: {
    right: 2,
    top: 1,
  },
});
