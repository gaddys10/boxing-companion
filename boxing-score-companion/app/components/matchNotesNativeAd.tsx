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

const AD_HEIGHT = 144;
const MEDIA_SIZE = 126;

export default function MatchNotesNativeAd() {
    const { nativeAd, error, retry } = useNativeAd({ adUnitId: TestIds.NATIVE });

    useEffect(() => {
        if (error) console.warn('Match notes native ad failed:', error);
    }, [error]);

    return (
        <View style={styles.slot}>
            {nativeAd ? (
                <NativeAdView nativeAd={nativeAd} style={styles.adView}>
                    <View style={styles.card}>
                        <NativeMediaView resizeMode="contain" style={styles.media} />
                        <View style={styles.details}>
                            <Text style={styles.adLabel}>Ad</Text>
                            <NativeAsset assetType={NativeAssetType.HEADLINE}>
                                <Text numberOfLines={2} style={styles.headline}>
                                    {nativeAd.headline}
                                </Text>
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
                <View style={[styles.adView, styles.placeholder]}>
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
        width: '100%',
        marginTop: 12,
        marginBottom: 4,
    },
    adView: {
        alignSelf: 'stretch',
        width: '100%',
        height: AD_HEIGHT,
        overflow: 'hidden',
    },
    card: {
        width: '100%',
        height: '100%',
        padding: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#C4D3DD',
        borderRadius: 18,
        backgroundColor: '#F8FAFB',
    },
    media: {
        width: MEDIA_SIZE,
        height: MEDIA_SIZE,
        borderRadius: 12,
        overflow: 'hidden',
    },
    details: {
        flex: 1,
        width: 0,
        flexShrink: 1,
        minWidth: 0,
        justifyContent: 'center',
        gap: 5,
    },
    adLabel: {
        alignSelf: 'flex-start',
        color: '#526674',
        fontSize: 10,
        lineHeight: 13,
        includeFontPadding: false,
        borderWidth: 1,
        borderColor: '#C4D3DD',
        borderRadius: 18,
        paddingHorizontal: 7,
    },
    headline: {
        width: '100%',
        color: '#333A3F',
        fontSize: 12,
        lineHeight: 15,
        includeFontPadding: false,
        fontWeight: '600',
    },
    action: {
        alignSelf: 'flex-start',
        maxWidth: '100%',
        minHeight: 32,
        lineHeight: 30,
        includeFontPadding: false,
        paddingHorizontal: 13,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#C4D3DD',
        borderRadius: 18,
        backgroundColor: '#F8FAFB',
        color: '#333A3F',
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    placeholder: {
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#C4D3DD',
        borderRadius: 18,
        backgroundColor: '#F8FAFB',
    },
    retry: {
        padding: 8,
    },
    retryText: {
        color: '#307FB6',
        fontSize: 12,
        includeFontPadding: false,
        fontWeight: '600',
    },
});
