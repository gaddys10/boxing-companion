import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ModalCloseButtonProps = {
    onPress: () => void;
    accessibilityLabel?: string;
    disabled?: boolean;
    contentSpacer?: boolean;
};

export default function ModalCloseButton({
    onPress,
    accessibilityLabel = 'Close modal',
    disabled = false,
    contentSpacer = true,
}: ModalCloseButtonProps) {
    return (
        <>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                disabled={disabled}
                hitSlop={8}
                onPress={onPress}
                style={({ pressed }) => [styles.button, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
            >
                <Ionicons name="close" size={18} color={disabled ? '#87939A' : '#46545D'} />
            </Pressable>
            {contentSpacer && <View pointerEvents="none" style={styles.contentSpacer} />}
        </>
    );
}

type ModalTitleHeaderProps = {
    title: string;
    titleStyle?: StyleProp<TextStyle>;
    style?: StyleProp<ViewStyle>;
    onClose: () => void;
    accessibilityLabel?: string;
    disabled?: boolean;
    isLandscape: boolean;
};

export function ModalTitleHeader({
    title,
    titleStyle,
    style,
    onClose,
    accessibilityLabel = 'Close modal',
    disabled = false,
    isLandscape,
}: ModalTitleHeaderProps) {
    return (
        <View style={[styles.titleRow, isLandscape ? styles.landscapeTitleRow : styles.portraitTitleRow, style]}>
            <ModalCloseButton
                onPress={onClose}
                accessibilityLabel={accessibilityLabel}
                disabled={disabled}
                contentSpacer={false}
            />
            <Text numberOfLines={2} style={[titleStyle, styles.titleRowText]}>
                {title}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        height: 24,
        justifyContent: 'center',
        left: 4,
        position: 'absolute',
        top: 4,
        width: 24,
        zIndex: 10,
    },
    contentSpacer: {
        height: 8,
    },
    titleRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginHorizontal: -20,
        marginTop: -20,
        minHeight: 32,
        position: 'relative',
    },
    landscapeTitleRow: {
        marginBottom: 16,
    },
    portraitTitleRow: {
        marginBottom: 20,
    },
    titleRowText: {
        flex: 1,
        marginBottom: 0,
        paddingHorizontal: 32,
        textAlign: 'center',
    },
    pressed: {
        opacity: 0.65,
    },
    disabled: {
        opacity: 0.55,
    },
});