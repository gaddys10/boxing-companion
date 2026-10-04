import React, { useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

type CollapsibleBannerAdProps = {
    containerStyle?: StyleProp<ViewStyle>;
    failureMessage: string;
    onLoadStateChange?: (isLoaded: boolean) => void;
};

export default function CollapsibleBannerAd({
    containerStyle,
    failureMessage,
    onLoadStateChange,
}: CollapsibleBannerAdProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <View
            pointerEvents={isLoaded ? 'auto' : 'none'}
            style={isLoaded ? [styles.loadedContainer, containerStyle] : styles.unloadedContainer}
        >
            <BannerAd
                unitId={TestIds.BANNER}
                size={BannerAdSize.BANNER}
                onAdLoaded={() => {
                    setIsLoaded(true);
                    onLoadStateChange?.(true);
                }}
                onAdFailedToLoad={(error) => {
                    setIsLoaded(false);
                    onLoadStateChange?.(false);
                    console.warn(failureMessage, error);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    loadedContainer: {
        alignItems: 'center',
        width: '100%',
    },
    unloadedContainer: {
        height: 50,
        opacity: 0,
        overflow: 'hidden',
        position: 'absolute',
        width: 320,
    },
});
