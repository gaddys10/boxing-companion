import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PORTRAIT_WIDTH = 393;
const PORTRAIT_HEIGHT = 852;
const LANDSCAPE_WIDTH = 852;
const LANDSCAPE_HEIGHT = 393;

const clamp = (value: number, min = 0.82, max = 1.15) =>
  Math.min(max, Math.max(min, value));

/** Responsive measurements whose 1x reference is the iPhone 15 Pro simulator. */
export function useResponsiveLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const isLandscape = width > height;
    const baselineWidth = isLandscape ? LANDSCAPE_WIDTH : PORTRAIT_WIDTH;
    const baselineHeight = isLandscape ? LANDSCAPE_HEIGHT : PORTRAIT_HEIGHT;
    const sx = clamp(width / baselineWidth);
    const sy = clamp(height / baselineHeight);
    const scale = clamp(Math.sqrt(sx * sy));

    return {
      width,
      height,
      fontScale,
      insets,
      isLandscape,
      sx,
      sy,
      scale,
      contentWidth: Math.max(0, width - insets.left - insets.right),
      contentHeight: Math.max(0, height - insets.top - insets.bottom),
      horizontalGutter: Math.max(12, 24 * sx),
      s: (value: number) => value * scale,
      x: (value: number) => value * sx,
      y: (value: number) => value * sy,
    };
  }, [fontScale, height, insets, width]);
}
