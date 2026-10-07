import React, { useEffect } from 'react';
import { LANDSCAPE_CARD_MIN_HEIGHT, LANDSCAPE_CARD_MIN_WIDTH } from '../../constants/landscape-card';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import {
    NativeAdView,
    NativeAsset,
    NativeAssetType,
    NativeMediaView,
    TestIds,
    useNativeAd,
} from 'react-native-google-mobile-ads';

export default function LandscapeNativeAd() {
    const { width } = useWindowDimensions();
    const { nativeAd, error, retry } = useNativeAd({ adUnitId: TestIds.NATIVE });

    useEffect(() => {
        if (error) console.warn('Landscape native ad failed:', error);
    }, [error]);

    return (
        <View style={[styles.slot, { width: Math.max(width * 0.201, LANDSCAPE_CARD_MIN_WIDTH) }]}>
            {nativeAd ? (
                <NativeAdView nativeAd={nativeAd} style={styles.card}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.adLabel}>Ad</Text>
                        </View>
                        <View style={styles.body}>
                            <NativeMediaView resizeMode="contain" style={styles.media} />
                            <View style={styles.details}>
                                <NativeAsset assetType={NativeAssetType.HEADLINE}>
                                    <Text numberOfLines={2} style={styles.headline}>{nativeAd.headline}</Text>
                                </NativeAsset>
                                <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
                                    <Text numberOfLines={1} style={styles.action}>{nativeAd.callToAction}</Text>
                                </NativeAsset>
                            </View>
                        </View>
                    </View>
                </NativeAdView>
            ) : (
                <View style={[styles.card, styles.placeholder]}>
                    <Text style={styles.adLabel}>Ad</Text>
                    {error ? (
                        <Pressable onPress={retry} accessibilityRole="button" style={styles.retry}>
                            <Text style={styles.retryText}>Retry ad</Text>
                        </Pressable>
                    ) : <ActivityIndicator color="#307FB6" />}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    slot: { height: '100%', minHeight: LANDSCAPE_CARD_MIN_HEIGHT },
    card: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#B6C6D1',
    },
    content: {
        flex: 1,
        minHeight: 0,
        paddingHorizontal: 6,
        paddingTop: 6,
        paddingBottom: 10,
        gap: 4,
    },
    body: { flex: 1, minHeight: 0, gap: 4 },
    details: { flexShrink: 0, gap: 4 },
    placeholder: { padding: 10, alignItems: 'center', justifyContent: 'center', gap: 12 },
    retry: { padding: 10 },
    retryText: { color: '#307FB6', fontSize: 12, fontWeight: '600' },
    // Reserve the top right corner for the SDK's AdChoices overlay.
    header: { height: 16, flexShrink: 0, paddingRight: 24, alignItems: 'flex-start' },
    adLabel: { fontSize: 10, lineHeight: 14, color: '#526674', borderWidth: 1, borderColor: '#B6C6D1', paddingHorizontal: 3 },
    media: { flex: 1, minWidth: 120, minHeight: 120, width: '100%', aspectRatio: undefined },
    headline: { fontSize: 11, lineHeight: 12, height: 24, fontWeight: '600', color: '#333A3F' },
    action: { height: 28, lineHeight: 28, textAlign: 'center', fontSize: 11, fontWeight: '700', backgroundColor: '#307FB6', color: '#fff', borderRadius: 6, overflow: 'hidden' },
});
