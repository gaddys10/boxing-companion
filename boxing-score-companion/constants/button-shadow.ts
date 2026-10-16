import { Platform, type ViewStyle } from 'react-native';

// Android elevation cannot reproduce the directional iOS button shadow.
// Use an explicit box shadow on Android and retain the native iOS shadow.
function buttonShadow(offset: number, opacity: number): ViewStyle {
  return Platform.OS === 'android'
    ? {
        boxShadow: `${offset}px ${offset}px 2px rgba(17, 51, 75, ${opacity})`,
        elevation: 0,
      }
    : {
        shadowColor: '#11334b',
        shadowOffset: { width: offset, height: offset },
        shadowOpacity: opacity,
        shadowRadius: 1,
      };
}

export const BUTTON_SHADOW = buttonShadow(5, 0.4);
export const SMALL_BUTTON_SHADOW = buttonShadow(3, 0.35);
