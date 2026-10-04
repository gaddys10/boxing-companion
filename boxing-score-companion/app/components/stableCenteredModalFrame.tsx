import React, { ReactNode, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

type StableCenteredModalFrameProps = {
    children: ReactNode;
};

export default function StableCenteredModalFrame({ children }: StableCenteredModalFrameProps) {
    const [initialSize, setInitialSize] = useState<{ height: number; width: number } | null>(null);

    const captureInitialSize = (event: LayoutChangeEvent) => {
        const { height, width } = event.nativeEvent.layout;

        if (initialSize === null && height > 0 && width > 0) {
            setInitialSize({ height, width });
        }
    };

    return (
        <View
            style={[
                styles.positioner,
                initialSize !== null && {
                    left: 0,
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: [{ translateY: -(initialSize.height / 2) }],
                },
            ]}
        >
            <View
                onLayout={captureInitialSize}
                style={[styles.frame, initialSize !== null && { width: initialSize.width }]}
            >
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    positioner: {
        alignItems: 'center',
        alignSelf: 'stretch',
        overflow: 'visible',
    },
    frame: {
        alignItems: 'center',
        overflow: 'visible',
        width: '100%',
    },
});
