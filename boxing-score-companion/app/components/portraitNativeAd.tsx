import { BUTTON_SHADOW } from '../../constants/button-shadow';
import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import {
    NativeAdView,
    NativeAsset,
    NativeAssetType,
    NativeMediaView,
    TestIds,
    useNativeAd,
} from 'react-native-google-mobile-ads';

const NATIVE_AD_CARD_HEIGHT = 136;
const NATIVE_AD_MEDIA_SIZE = 120;

export default function PortraitNativeAd() {
    const { nativeAd, error, retry } = useNativeAd({ adUnitId: TestIds.NATIVE });

    useEffect(() => {
        if (error) console.warn('Portrait native ad failed:', error);
    }, [error]);

    return (
        <View style={styles.slot}>
            {nativeAd ? (
                <NativeAdView nativeAd={nativeAd} style={styles.nativeAdView}>
                    <View style={styles.card}>
                        <NativeMediaView resizeMode="contain" style={styles.media} />
                        <View style={styles.details}>
                            <View style={styles.header}>
                                <Text style={styles.adLabel}>Ad</Text>
                            </View>
                            <NativeAsset assetType={NativeAssetType.HEADLINE}>
                                <Text numberOfLines={2} style={styles.headline}>{nativeAd.headline}</Text>
                            </NativeAsset>
                            <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
                                <Text numberOfLines={1} style={styles.action}>
                                    {nativeAd.callToAction || 'Learn more'}
                                </Text>
                            </NativeAsset>
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
    slot: {
        width: '90%',
        height: NATIVE_AD_CARD_HEIGHT,
        marginBottom: 15,
    },
    nativeAdView: {
        width: '100%',
        height: NATIVE_AD_CARD_HEIGHT,
    },
    card: {
        ...BUTTON_SHADOW,
        width: '100%',
        height: NATIVE_AD_CARD_HEIGHT,
        padding: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#B6C6D1',
        borderBottomWidth: 0,
    },
    media: {
        width: NATIVE_AD_MEDIA_SIZE,
        height: NATIVE_AD_MEDIA_SIZE,
        borderRadius: 10,
        overflow: 'hidden',
    },
    details: {
        flex: 1,
        flexShrink: 1,
        minWidth: 0,
        maxWidth: '100%',
        justifyContent: 'center',
        gap: 2,
    },
    header: {
        minHeight: 14,
        paddingRight: 26,
        justifyContent: 'center',
    },
    adLabel: {
        alignSelf: 'flex-start',
        color: '#526674',
        fontSize: 10,
        lineHeight: 13,
        borderWidth: 1,
        borderColor: '#B6C6D1',
        paddingHorizontal: 3,
    },
    headline: {
        width: '100%',
        color: '#333A3F',
        fontSize: 12,
        lineHeight: 14,
        fontWeight: '600',
    },
    action: {
        alignSelf: 'flex-start',
        maxWidth: '100%',
        minHeight: 22,
        lineHeight: 22,
        paddingHorizontal: 9,
        overflow: 'hidden',
        borderRadius: 6,
        backgroundColor: '#307FB6',
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    retry: {
        padding: 8,
    },
    retryText: {
        color: '#307FB6',
        fontSize: 12,
        fontWeight: '600',
    },
});
