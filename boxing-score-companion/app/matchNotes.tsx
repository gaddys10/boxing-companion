import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    PanResponder,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';
import { normalizeMatchRating, parseMatchDescription, serializeMatchDescription } from '../types/matchNotes';

const MAX_RATING = 5;
const RATING_STEP = 0.5;
const MAX_DESCRIPTORS = 6;
const STAR_SIZE = 38;
const THUMB_SIZE = 24;

const BLUE = '#307FB6';
const RED = '#D32F2F';
const GOLD = '#D99B28';
const SCREEN = '#F1F5F8';
const TEXT = '#333A3F';
const BORDER = '#B6C6D1';

const FIGHT_DESCRIPTORS = [
    'Adjustments',
    'Awkward',
    'Back and Forth',
    'Bad Coaching',
    'Bad Ref',
    'Bloody',
    'Body Shot KO',
    'Multiple Knockdowns',
    'Body Work',
    'Boring',
    'Both Hurt',
    'Brawl',
    'Brutal',
    'Chess Match',
    'Chin',
    'Clinch Heavy',
    'Close fight',
    'Combinations',
    'Comeback',
    'Competitive',
    'Controversial',
    'Counterpunching',
    'Cuts',
    'Dead Crowd',
    'Defensive ',
    'Developmental',
    'Dirty Fight',
    'Distance Management',
    'Durability',
    'Entertaining',
    'Exciting',
    'Fast Start',
    "Fast-Paced",
    'Feints',
    'Flash Knockdown',
    'Foul Heavy',
    'Gassed',
    'Good Coaching',
    'Good Referee',
    'Headbutts',
    'Headhunting',
    'High Level',
    'High Volume',
    'Hooks',
    'Hostile Crowd',
    'Injury',
    'Infighting',
    'Heart',
    'Jabs',
    'Jab Battle',
    'Late Rally',
    'Loud Crowd',
    'Low Blows',
    'Low Volume',
    'Masterclass',
    'Messy',
    'Methodical',
    'Mismatch',
    'One Sided',
    'Outboxing',
    'Out Cold',
    'Power difference',
    'Power punching',
    'Pressure',
    'Rematch Needed',
    'Replayable',
    'Robbery',
    'Rough',
    'Running',
    'Scrappy',
    'Showboating',
    'Showcase',
    'Shutout',
    'Size Difference',
    'Slow-Paced',
    'Slow Start',
    'Slugfest',
    'Smothering',
    'Southpaw Battle',
    'Speed Difference',
    "Stylish",
    'Swelling',
    'Swing Rounds',
    'Switch Hitting',
    'Tactical',
    'Technical',
    'Ugly',
    'Upset',
    'War',
    'Wide Cards',
];

const clampAndRound = (value: number) =>
    Math.min(MAX_RATING, Math.max(0, Math.round(value / RATING_STEP) * RATING_STEP));

function RatingStar({ fill }: { fill: number }) {
    return (
        <View style={styles.star} accessible={false}>
            <Ionicons name="star-outline" size={STAR_SIZE} color="#AAB2B8" />
            {fill > 0 && (
                <View
                    pointerEvents="none"
                    style={[styles.starFillClip, { width: STAR_SIZE * fill }]}
                >
                    <Ionicons name="star" size={STAR_SIZE} color={GOLD} />
                </View>
            )}
        </View>
    );
}

export default function MatchNotesScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { isLandscape, insets, sx, sy, horizontalGutter } = useResponsiveLayout();

    const initialRating = normalizeMatchRating(params.rating);
    const [rating, setRating] = useState(
        clampAndRound(initialRating),
    );
    const [selectedDescriptors, setSelectedDescriptors] = useState<string[]>(() =>
        parseMatchDescription(params.description).slice(0, MAX_DESCRIPTORS),
    );
    const [descriptorContentHeight, setDescriptorContentHeight] = useState(0);
    const [descriptorViewportHeight, setDescriptorViewportHeight] = useState(0);
    const [descriptorScrollOffset, setDescriptorScrollOffset] = useState(0);

    const sliderWidthRef = useRef(0);
    const lastHapticRatingRef = useRef(rating);
    const [sliderWidth, setSliderWidth] = useState(0);

    const updateRatingFromX = (x: number) => {
        const width = sliderWidthRef.current;
        if (width <= THUMB_SIZE) return;

        const trackStart = THUMB_SIZE / 2;
        const usableWidth = width - THUMB_SIZE;
        const ratio = Math.min(1, Math.max(0, (x - trackStart) / usableWidth));
        const nextRating = clampAndRound(ratio * MAX_RATING);

        if (nextRating !== lastHapticRatingRef.current) {
            lastHapticRatingRef.current = nextRating;
            void Haptics.selectionAsync();
        }

        setRating(nextRating);
    };

    const sliderPanResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                onPanResponderGrant: (event) => updateRatingFromX(event.nativeEvent.locationX),
                onPanResponderMove: (event) => updateRatingFromX(event.nativeEvent.locationX),
            }),
        [],
    );

    const handleSliderLayout = (event: LayoutChangeEvent) => {
        const width = event.nativeEvent.layout.width;
        sliderWidthRef.current = width;
        setSliderWidth(width);
    };

    const changeRating = (amount: number) => {
        setRating((current) => {
            const next = clampAndRound(current + amount);
            lastHapticRatingRef.current = next;
            return next;
        });
        void Haptics.selectionAsync();
    };

    const toggleDescriptor = (descriptor: string) => {
        if (selectedDescriptors.includes(descriptor)) {
            setSelectedDescriptors((current) => current.filter((item) => item !== descriptor));
            void Haptics.selectionAsync();
            return;
        }

        if (selectedDescriptors.length >= MAX_DESCRIPTORS) {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return;
        }

        setSelectedDescriptors((current) => [...current, descriptor]);
        void Haptics.selectionAsync();
    };

    const goBack = () => {
        router.replace({
            pathname: '/matchInfo',
            params,
        });
    };

    const saveNotes = () => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        router.replace({
            pathname: '/matchInfo',
            params: {
                ...params,
                rating: rating.toFixed(1),
                description: serializeMatchDescription(selectedDescriptors),
            },
        });
    };

    const thumbLeft = sliderWidth > THUMB_SIZE
        ? (THUMB_SIZE / 2) + (rating / MAX_RATING) * (sliderWidth - THUMB_SIZE)
        : THUMB_SIZE / 2;

    const descriptorScrollbarHeight = descriptorViewportHeight > 0 && descriptorContentHeight > 0
        ? Math.max(
            28,
            (descriptorViewportHeight / descriptorContentHeight) * descriptorViewportHeight,
        )
        : 28;
    const descriptorScrollbarTrackHeight = Math.max(
        0,
        descriptorViewportHeight - descriptorScrollbarHeight,
    );
    const descriptorScrollbarTop = descriptorContentHeight > descriptorViewportHeight
        ? (descriptorScrollOffset / (descriptorContentHeight - descriptorViewportHeight)) * descriptorScrollbarTrackHeight
        : 0;
    const handleDescriptorScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        setDescriptorScrollOffset(event.nativeEvent.contentOffset.y);
    };

    return (
        <View style={styles.screen}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            <View style={{ height: insets.top, backgroundColor: BLUE }} />

            <View style={[styles.titleContainer, isLandscape && styles.landscapeTitleContainer]}>
                <Pressable
                    onPress={goBack}
                    style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Back to scorecard"
                >
                    <Ionicons name="chevron-back" size={26} color="#fff" />
                </Pressable>
                <Text style={styles.title}>Match Notes</Text>
                <View style={styles.headerSpacer} />
            </View>

            <View
                style={styles.scrollView}
                // contentContainerStyle={[
                //     styles.content,
                //     { paddingHorizontal: Math.max(horizontalGutter, 18 * sx) },
                //     isLandscape && styles.landscapeContent,
                //     {
                //         paddingBottom: Math.max(insets.bottom, 10) + (isLandscape ? 72 * sy : 94 * sy),
                //     },
                // ]}
                // showsVerticalScrollIndicator={isLandscape}
            >
                <View style={[styles.card, styles.ratingCard, isLandscape && styles.landscapeRatingCard]}>
                    <Text style={styles.sectionTitle}>Rate this fight</Text>
                    <Text style={styles.sectionDescription}>
                        Rate your overall enjoyment from 0 to 5 stars.
                    </Text>

                    <View
                        style={styles.starsRow}
                        accessibilityRole="image"
                        accessibilityLabel={`${rating.toFixed(1)} out of 5 stars`}
                    >
                        {[1, 2, 3, 4, 5].map((star) => (
                            <RatingStar
                                key={star}
                                fill={Math.min(1, Math.max(0, rating - (star - 1)))}
                            />
                        ))}
                    </View>

                    <View
                        style={styles.sliderTouchArea}
                        onLayout={handleSliderLayout}
                        {...sliderPanResponder.panHandlers}
                        accessible
                        accessibilityRole="adjustable"
                        accessibilityLabel="Fight rating"
                        accessibilityValue={{
                            min: 0,
                            max: 10,
                            now: Math.round(rating*2),
                            text: `${rating.toFixed(1)} out of 5 stars`,
                        }}
                        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                        onAccessibilityAction={(event) => {
                            if (event.nativeEvent.actionName === 'increment') changeRating(RATING_STEP);
                            if (event.nativeEvent.actionName === 'decrement') changeRating(-RATING_STEP);
                        }}
                    >
                        <View style={styles.track}>
                            <View
                                style={[
                                    styles.trackFill,
                                    { width: `${(rating / MAX_RATING) * 100}%` },
                                ]}
                            />
                        </View>
                        <View style={[styles.thumb, { left: thumbLeft }]} />
                    </View>

                    <View style={styles.sliderMeta}>
                        <Text style={styles.endpoint}>0</Text>
                        <View style={styles.ratingValueContainer}>
                            <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
                            <Text style={styles.ratingValueSuffix}> / 5</Text>
                        </View>
                        <Text style={[styles.endpoint, styles.endpointRight]}>5</Text>
                    </View>
                </View>

                <View style={[styles.bottomCard, styles.descriptorCard, isLandscape && styles.landscapeDescriptorCard]}>
                    <View style={styles.descriptorHeadingRow}>
                        <View style={styles.descriptorHeadingCopy}>
                            <Text style={styles.sectionTitle}>
                                {/* How would you  */}
                                Describe this fight</Text>
                            <Text style={styles.sectionDescription}>
                                Pick up to {MAX_DESCRIPTORS} match descriptors.
                                {/* that tell the story of the fight. */}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.counterBadge,
                                selectedDescriptors.length === MAX_DESCRIPTORS && styles.counterBadgeFull,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.counterText,
                                    selectedDescriptors.length === MAX_DESCRIPTORS && styles.counterTextFull,
                                ]}
                            >
                                {selectedDescriptors.length}/{MAX_DESCRIPTORS}
                            </Text>
                        </View>
                    </View>

                    <View
                        style={styles.descriptorScrollWrapper}
                        onLayout={(event) => setDescriptorViewportHeight(event.nativeEvent.layout.height)}
                    >
                        <ScrollView
                            style={[
                                styles.descriptorScroll,
                                isLandscape && styles.landscapeDescriptorScroll,
                            ]}
                            contentContainerStyle={styles.pillContainer}
                            nestedScrollEnabled
                            bounces={false}
                            overScrollMode="never"
                            showsVerticalScrollIndicator={false}
                            onContentSizeChange={(_, height) => setDescriptorContentHeight(height)}
                            onScroll={handleDescriptorScroll}
                            scrollEventThrottle={16}
                        >
                            {FIGHT_DESCRIPTORS.map((descriptor) => {
                                const selected = selectedDescriptors.includes(descriptor);
                                const blocked = !selected && selectedDescriptors.length >= MAX_DESCRIPTORS;

                                return (
                                    <Pressable
                                        key={descriptor}
                                        onPress={() => toggleDescriptor(descriptor)}
                                        style={({ pressed }) => [
                                            styles.descriptorPill,
                                            selected && styles.descriptorPillSelected,
                                            blocked && styles.descriptorPillBlocked,
                                            pressed && !blocked && styles.pressed,
                                        ]}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected, disabled: blocked }}
                                        accessibilityLabel={`${descriptor}${selected ? ', selected' : ''}`}
                                    >
                                        {selected && (
                                            <Ionicons
                                                name="checkmark"
                                                size={14}
                                                color="#fff"
                                                style={styles.pillCheck}
                                            />
                                        )}
                                        <Text
                                            style={[
                                                styles.descriptorPillText,
                                                selected && styles.descriptorPillTextSelected,
                                                blocked && styles.descriptorPillTextBlocked,
                                            ]}
                                        >
                                            {descriptor}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                            
                        </ScrollView>
                        <View pointerEvents="none" style={styles.descriptorScrollbarTrack}>
                            <View
                                style={[
                                    styles.descriptorScrollbarThumb,
                                    {
                                        height: descriptorScrollbarHeight,
                                        transform: [{ translateY: descriptorScrollbarTop }],
                                    },
                                ]}
                            />
                        </View>
                    </View>
                </View>
            </View>

            <View
                style={[
                    styles.bottomBar,
                    {
                        paddingBottom: Math.max(insets.bottom, 8),
                        paddingHorizontal: Math.max(horizontalGutter, 18 * sx),
                    },
                ]}
            >
                <Pressable
                    onPress={goBack}
                    style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel note changes"
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                    onPress={saveNotes}
                    style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Save notes to scorecard"
                >
                    <Text style={styles.saveButtonText}>Save Notes</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: SCREEN,
    },
    scrollView: {
        flex: 1,
        width: '90%',
        alignSelf: 'center',
    },
    titleContainer: {
        minHeight: 36,
        backgroundColor: BLUE,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        shadowColor: '#11334B',
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 2,
        elevation: 3,
    },
    landscapeTitleContainer: {
        minHeight: 52,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    backButton: {
        width: 54,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerSpacer: {
        width: 54,
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    pressed: {
        opacity: 0.62,
    },
    content: {
        paddingTop: 22,
        gap: 18,
    },
    landscapeContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
        paddingTop: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(182, 198, 209, 0.8)',
        padding: 18,
        paddingBottom: 15,
        paddingTop: 15,
        shadowColor: '#676767',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.22,
        shadowRadius: 3,
        elevation: 2,
    },
    bottomCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(182, 198, 209, 0.8)',
        padding: 18,
        paddingBottom: 0,
        paddingTop: 15,
        paddingRight: 0,
        shadowColor: '#676767',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.22,
        shadowRadius: 3,
        elevation: 2,
    },
    ratingCard: {
        width: '100%',
        marginVertical: '4%'
    },
    descriptorCard: {
        width: '100%',
    },
    landscapeRatingCard: {
        width: '38%',
        minWidth: 300,
    },
    landscapeDescriptorCard: {
        flex: 1,
        minWidth: 0,
    },
    sectionTitle: {
        color: TEXT,
        fontSize: 20,
        lineHeight: 25,
        fontWeight: '700',
    },
    sectionDescription: {
        color: '#6D7C86',
        fontSize: 13,
        lineHeight: 18,
        marginTop: 5,
        
    },
    starsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 14,
        width: '80%',
        marginHorizontal: 'auto'
    },
    star: {
        width: STAR_SIZE,
        height: STAR_SIZE,
    },
    starFillClip: {
        position: 'absolute',
        left: 0,
        top: 0,
        height: STAR_SIZE,
        overflow: 'hidden',
    },
    sliderTouchArea: {
        height: 48,
        justifyContent: 'center',
        left: '2%',
        position: 'relative',
        width: '95%'
    },
    track: {
        height: 6,
        marginHorizontal: THUMB_SIZE / 2,
        borderRadius: 3,
        backgroundColor: '#D8E1E7',
        overflow: 'hidden',
    },
    trackFill: {
        height: '100%',
        backgroundColor: GOLD,
    },
    thumb: {
        position: 'absolute',
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        marginLeft: -(THUMB_SIZE / 2),
        borderRadius: THUMB_SIZE / 2,
        backgroundColor: '#fff',
        borderWidth: 3,
        borderColor: GOLD,
        shadowColor: '#1C2730',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.22,
        shadowRadius: 3,
        elevation: 3,
    },
    sliderMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: -1,
        width: '95%',
        left: '2%',
    },
    endpoint: {
        width: 30,
        color: '#667680',
        fontSize: 13,
        fontWeight: '600',
    },
    endpointRight: {
        textAlign: 'right',
    },
    ratingValueContainer: {
        minWidth: 80,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'baseline',
    },
    ratingValue: {
        color: TEXT,
        fontSize: 22,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    ratingValueSuffix: {
        color: '#71808A',
        fontSize: 14,
        fontWeight: '600',
    },
    sliderHint: {
        color: '#74828B',
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    descriptorHeadingRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 17,
    },
    descriptorHeadingCopy: {
        flex: 1,
    },
    descriptorScrollWrapper: {
        maxHeight: 305,
        position: 'relative',
    },
    counterBadge: {
        minWidth: 48,
        height: 30,
        paddingHorizontal: 9,
        borderRadius: 15,
        marginRight: '5%',
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: '#F7FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterBadgeFull: {
        borderColor: RED,
        backgroundColor: '#FFF4F4',
    },
    counterText: {
        color: '#5E6D76',
        fontSize: 12,
        fontWeight: '700',
    },
    counterTextFull: {
        color: RED,
    },
    pillContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 9,
        paddingBottom: 18,
    },
    descriptorScroll: {
        maxHeight: 305,
        paddingRight: '5%'
    },
    descriptorPillSpacer: {
        width: 6,
        height: 50,
    },
    landscapeDescriptorScroll: {
        maxHeight: 140,
    },
    descriptorScrollbarTrack: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 6,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
        backgroundColor: '#D8E1E7',
    },
    descriptorScrollbarThumb: {
        width: 6,
        borderRadius: 3,
        backgroundColor: BLUE,
    },
    descriptorPill: {
        minHeight: 32,
        paddingHorizontal: 13,
        paddingVertical: 8.5,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: '#F8FAFB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    descriptorPillSelected: {
        backgroundColor: BLUE,
        borderColor: BLUE,
    },
    descriptorPillBlocked: {
        opacity: 0.42,
    },
    pillCheck: {
        marginRight: 5,
    },
    descriptorPillText: {
        color: TEXT,
        fontSize: 12,
        fontWeight: '500',
    },
    descriptorPillTextSelected: {
        color: '#fff',
        fontWeight: '700',
    },
    descriptorPillTextBlocked: {
        color: '#7D8991',
    },
    bottomBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: SCREEN,
        paddingTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    cancelButton: {
        minHeight: 42,
        backgroundColor: RED,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#676767',
        shadowOffset: { width: 2, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
                width: '45%'

    },
    saveButton: {
        minHeight: 42,
        backgroundColor: "#fff",
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#676767',
        shadowOffset: { width: 2, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
        width: '45%'
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    saveButtonText: {
        color: '#1976D2',
        fontSize: 16,
        fontWeight: '700',
    },
});
