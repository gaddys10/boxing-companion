import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';
import { normalizeMatchRating, parseMatchDescription } from '../types/matchNotes';

const RED = '#D32F2F';
const BLUE = '#1976D2';
const HEADER_BLUE = '#307FB6';
const GOLD = '#F5A623';
const SCREEN = '#F1F5F8';
const TEXT = '#333A3F';
const BORDER = '#D3DCE2';
const MUTED = '#AAB2B8';
const ROW_HEIGHT = 33;
const STAR_SIZE = 19;
const MAX_DESCRIPTORS = 6;

type RoundScore = {
    left?: string;
    right?: string;
    plusMinus?: string;
    leftDeductions?: string;
    rightDeductions?: string;
    leftKnockdowns?: string;
    rightKnockdowns?: string;
    scoringMethod?: 'quick' | 'full';
    stoppageReason?: 'KO' | 'TKO' | 'DQ' | 'NC';
    stoppageWinner?: string;
};

type ExportRow = {
    roundNumber: number;
    score?: RoundScore;
    leftTotal: string;
    rightTotal: string;
};

const firstParam = (value: unknown) => {
    if (Array.isArray(value)) return value[0];
    return value;
};

const numericValue = (value: unknown) => {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
};

function RatingStar({ fill }: { fill: number }) {
    return (
        <View style={styles.star} accessible={false}>
            <Ionicons name="star-outline" size={STAR_SIZE} color={MUTED} />
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

function EventBadge({
    knockdowns,
    deductions,
    color,
    side,
}: {
    knockdowns: number;
    deductions: number;
    color: string;
    side: 'left' | 'right';
}) {
    if (knockdowns <= 0 && deductions <= 0) return null;

    return (
        <View
            style={[
                styles.eventBadge,
                side === 'left' ? styles.leftEventBadge : styles.rightEventBadge,
                { backgroundColor: color },
            ]}
        >
            {knockdowns > 0 && <Text style={styles.eventBadgeText}>KD{knockdowns}</Text>}
            {deductions > 0 && <Text style={styles.eventBadgeText}>PD{deductions}</Text>}
        </View>
    );
}

function MomentumCell({ value, isQuickScore }: { value?: string; isQuickScore?: boolean }) {
    if (isQuickScore) {
        return (
            <View style={styles.momentumWrap}>
                <View style={[styles.momentumPill, styles.momentumNeutral]}>
                    <Text style={styles.momentumNeutralText}>-</Text>
                </View>
            </View>
        );
    }

    const parsed = Number(value);
    const valid = value !== undefined && value !== '' && value !== '-' && Number.isFinite(parsed);

    if (!valid || parsed === 0) {
        return (
            <View style={styles.momentumWrap}>
                <View style={[styles.momentumPill, styles.momentumNeutral]}>
                    <Text style={styles.momentumNeutralText}>{valid ? '0' : '-'}</Text>
                </View>
            </View>
        );
    }

    const leftFavored = parsed > 0;
    const color = leftFavored ? RED : BLUE;

    return (
        <View style={styles.momentumWrap}>
            {
                leftFavored && 
                    <Ionicons 
                        name="caret-back" 
                        size={16} 
                        color={color} 
                        style={{ position: 'absolute', left: 2 }} />
            }
            <View style={[styles.momentumPill, { backgroundColor: color }]}>
                <Text style={styles.momentumText}>{Math.abs(parsed)}</Text>
            </View>
            {!leftFavored && <Ionicons name="caret-forward" size={16} color={color} style={{ position: 'absolute', right: 2 }} />}
        </View>
    );
}

function roundWinnerColor(score: RoundScore | undefined, fighter1: string, fighter2: string) {
    if (!score) return '#BDBDBD';

    if (score.stoppageWinner === 'NC') return '#9E9E9E';
    if (score.stoppageWinner === fighter1) return RED;
    if (score.stoppageWinner === fighter2) return BLUE;

    const hasScores = score.left !== undefined && score.left !== '' && score.right !== undefined && score.right !== '';
    if (!hasScores) return '#BDBDBD';

    const left = Number(score.left);
    const right = Number(score.right);

    if (left > right) return RED;
    if (right > left) return BLUE;
    return '#9E9E9E';
}

export default function ExportCardScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { insets, horizontalGutter } = useResponsiveLayout();
    const { height } = useWindowDimensions();
    const exportCardRef = useRef<View>(null);
    const [busyAction, setBusyAction] = useState<'share' | 'save' | null>(null);

    const fighter1 = String(firstParam(params.fighter1) || 'Fighter 1');
    const fighter2 = String(firstParam(params.fighter2) || 'Fighter 2');
    const roundCount = Math.max(1, Number(firstParam(params.rounds) || 10));
    const availableHeight = height - insets.top - insets.bottom;
    const compactLayout = roundCount >= 10 || availableHeight < 760;
    const rowHeight = compactLayout
        ? Math.max(24, Math.min(34, (availableHeight - 420) / roundCount))
        : ROW_HEIGHT;
    const rating = normalizeMatchRating(params.rating);
    const descriptors = parseMatchDescription(params.description).slice(0, MAX_DESCRIPTORS);

    const genderValue = String(firstParam(params.gender) || 'idk');
    const weightValue = String(firstParam(params.weight) || '0');

    const roundScores = useMemo<Record<number, RoundScore>>(() => {
        const raw = firstParam(params.savedScores);
        if (!raw) return {};

        try {
            const parsed = JSON.parse(String(raw)) as Record<string, RoundScore>;
            const normalized: Record<number, RoundScore> = {};

            Object.entries(parsed).forEach(([round, score]) => {
                const roundNumber = Number(round);
                if (Number.isFinite(roundNumber)) normalized[roundNumber] = score;
            });

            return normalized;
        } catch {
            return {};
        }
    }, [params.savedScores]);

    const exportRows = useMemo<ExportRow[]>(() => {
        let leftRunningTotal = 0;
        let rightRunningTotal = 0;

        return Array.from({ length: roundCount }, (_, index) => {
            const roundNumber = index + 1;
            const score = roundScores[roundNumber];
            const hasScores = Boolean(
                score &&
                score.left !== undefined &&
                score.left !== '' &&
                score.right !== undefined &&
                score.right !== '',
            );

            if (hasScores) {
                leftRunningTotal += numericValue(score?.left);
                rightRunningTotal += numericValue(score?.right);
            }

            let leftTotal = hasScores ? String(leftRunningTotal) : '-';
            let rightTotal = hasScores ? String(rightRunningTotal) : '-';

            if (score?.stoppageWinner === 'NC') {
                leftTotal = 'NC';
                rightTotal = 'NC';
            } else if (score?.stoppageWinner) {
                leftTotal = score.stoppageWinner === fighter1 ? String(score.stoppageReason || '-') : '';
                rightTotal = score.stoppageWinner === fighter2 ? String(score.stoppageReason || '-') : '';
            }

            return {
                roundNumber,
                score,
                leftTotal,
                rightTotal,
            };
        });
    }, [fighter1, fighter2, roundCount, roundScores]);

    const totals = useMemo(() => {
        return Object.values(roundScores).reduce(
            (current, score) => ({
                fighter1KD: current.fighter1KD + numericValue(score.leftKnockdowns),
                fighter2KD: current.fighter2KD + numericValue(score.rightKnockdowns),
                fighter1Pen: current.fighter1Pen + numericValue(score.leftDeductions),
                fighter2Pen: current.fighter2Pen + numericValue(score.rightDeductions),
            }),
            {
                fighter1KD: 0,
                fighter2KD: 0,
                fighter1Pen: 0,
                fighter2Pen: 0,
            },
        );
    }, [roundScores]);

    const latestResult = useMemo(() => {
        return [...exportRows]
            .filter((row) => {
                const score = row.score;
                return Boolean(
                    score?.stoppageWinner ||
                    (score?.left !== undefined && score.left !== '' && score?.right !== undefined && score.right !== ''),
                );
            })
            .pop();
    }, [exportRows]);

    const finalScores = useMemo(() => {
        if (!latestResult?.score) return { left: '-', right: '-' };

        const score = latestResult.score;

        if (score.stoppageWinner === 'NC') {
            return { left: 'NC', right: 'NC' };
        }

        if (score.stoppageWinner) {
            return {
                left: score.stoppageWinner === fighter1 ? String(score.stoppageReason || '-') : '',
                right: score.stoppageWinner === fighter2 ? String(score.stoppageReason || '-') : '',
            };
        }

        return {
            left: latestResult.leftTotal,
            right: latestResult.rightTotal,
        };
    }, [fighter1, fighter2, latestResult]);

    const metadata = useMemo(() => {
        const pieces = [`${roundCount} ${roundCount === 1 ? 'Round' : 'Rounds'}`];

        if (genderValue === 'mens') pieces.push("Men's");
        if (genderValue === 'womens') pieces.push("Women's");

        if (weightValue && weightValue !== '0' && weightValue !== 'undefined' && weightValue !== 'null') {
            pieces.push(`${weightValue} lbs`);
        }

        return pieces.join('  •  ');
    }, [genderValue, roundCount, weightValue]);

    const shareResult = finalScores.left && finalScores.right
        ? `${finalScores.left}-${finalScores.right}`
        : finalScores.left
            ? `${fighter1} ${finalScores.left}`
            : finalScores.right
                ? `${fighter2} ${finalScores.right}`
                : 'Scorecard';
    const shareMessage = `${fighter1} vs ${fighter2} — ${shareResult} | Boxing Score Companion`;

    const captureExportCard = async () => {
        if (!exportCardRef.current) throw new Error('Export card is not ready yet.');

        return captureRef(exportCardRef, {
            format: 'png',
            quality: 1,
            result: 'tmpfile',
        });
    };

    const handleShare = async () => {
        if (busyAction) return;
        setBusyAction('share');
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const imageUri = await captureExportCard();

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(imageUri, {
                    mimeType: 'image/png',
                    UTI: 'public.png',
                    dialogTitle: 'Share scorecard',
                });
            } else {
                await Share.share({ message: shareMessage });
            }
        } catch (error) {
            console.error('Unable to share scorecard:', error);
            Alert.alert('Share failed', 'The scorecard image could not be shared.');
        } finally {
            setBusyAction(null);
        }
    };

    const handleSaveImage = async () => {
        if (busyAction) return;
        setBusyAction('save');
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const permission = await MediaLibrary.requestPermissionsAsync();

            if (permission.status !== 'granted') {
                Alert.alert(
                    'Photos permission needed',
                    'Allow photo access to save the scorecard image to your device.',
                );
                return;
            }

            const imageUri = await captureExportCard();
            await MediaLibrary.createAssetAsync(imageUri);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Saved', 'Your scorecard image was saved to Photos.');
        } catch (error) {
            console.error('Unable to save scorecard:', error);
            Alert.alert('Save failed', 'The scorecard image could not be saved.');
        } finally {
            setBusyAction(null);
        }
    };

    const handleBack = () => {
        router.replace({
            pathname: '/matchInfo',
            params: {
                id: firstParam(params.id) ? String(firstParam(params.id)) : undefined,
                fighter1,
                fighter2,
                rounds: String(roundCount),
                savedScores: JSON.stringify(roundScores),
                gender: genderValue,
                weight: weightValue,
                rating: String(rating),
                description: firstParam(params.description)
                    ? String(firstParam(params.description))
                    : undefined,
            },
        });
    };

    return (
        <View style={styles.screen}>
            <Stack.Screen options={{ headerShown: false, orientation: 'portrait' }} />
            <StatusBar style="light" />

            <View style={{ height: insets.top, backgroundColor: HEADER_BLUE }} />

            {/* <View style={styles.header}>
                <Text style={styles.headerTitle}>Export Scorecard</Text>
            </View> */}

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                    styles.scrollContent,
                    styles.scrollContentNoScroll,
                    {
                        paddingHorizontal: Math.max(horizontalGutter * 0.3, 8),
                        paddingBottom: Math.max(insets.bottom, 8) + (compactLayout ? 4 : 14),
                    },
                ]}
                showsVerticalScrollIndicator={false}
                bounces={false}
                scrollEnabled={false}
            >
                <View
                    ref={exportCardRef}
                    collapsable={false}
                    style={[styles.exportCard, compactLayout && styles.compactExportCard]}
                >
                    <Image
                        source={require('../assets/images/bgfbsc.png')}
                        resizeMode="stretch"
                        style={styles.exportBackground}
                    />

                    
                    <Text style={[styles.metadata, compactLayout && styles.compactMetadata]}>{metadata}</Text> 
                    <View style={[styles.matchupRow, compactLayout && styles.compactMatchupRow]}>
                        <View style={styles.fighterBlock}>
                            <Text
                                // numberOfLines={2}
                                adjustsFontSizeToFit
                                minimumFontScale={0.7}
                                style={[styles.fighterName, compactLayout && styles.compactFighterName, { color: RED }]}
                            >
                                {fighter1}
                            </Text>
                            <Text
                                numberOfLines={1}
                                // adjustsFontSizeToFit
                                minimumFontScale={0.6}
                                style={[styles.finalScore, compactLayout && styles.compactFinalScore, { color: RED }]}
                            >
                                {finalScores.left}
                            </Text>
                            <Text numberOfLines={1} style={[styles.eventSummary, { color: RED }]}>
                                KD: {totals.fighter1KD} • Deductions: {totals.fighter1Pen}
                            </Text>
                        </View>

                        <Text style={styles.vs}>vs</Text>

                        <View style={styles.fighterBlock}>
                            <Text
                                // numberOfLines={2}
                                adjustsFontSizeToFit
                                minimumFontScale={0.7}
                                style={[styles.fighterName, compactLayout && styles.compactFighterName, { color: BLUE }]}
                            >
                                {fighter2}
                            </Text>
                            <Text
                                numberOfLines={1}
                                // adjustsFontSizeToFit
                                minimumFontScale={0.6}
                                style={[styles.finalScore, compactLayout && styles.compactFinalScore, { color: BLUE }]}
                            >
                                {finalScores.right}
                            </Text>
                            <Text numberOfLines={1} style={[styles.eventSummary, { color: BLUE }]}>
                                KD: {totals.fighter2KD} • Deductions: {totals.fighter2Pen}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.divider, compactLayout && styles.compactDivider]} />
                    {/* <Text style={[styles.metadata, compactLayout && styles.compactMetadata]}>{metadata}</Text> */}

                    <View style={[styles.tableHeader, compactLayout && styles.compactTableHeader]}>
                        <View style={styles.roundHeaderSpacer} />
                        <View style={styles.tableHeaderCell}><Text style={styles.tableHeaderText}>Total</Text></View>
                        <View style={styles.tableHeaderCell}><Text style={styles.tableHeaderText}>Round</Text></View>
                        <View style={styles.momentumHeader}><Text style={styles.tableHeaderText}>Momentum</Text></View>
                        <View style={styles.tableHeaderCell}><Text style={styles.tableHeaderText}>Round</Text></View>
                        <View style={styles.tableHeaderCell}><Text style={styles.tableHeaderText}>Total</Text></View>
                    </View>




                    <View style={[styles.rowsWrap, compactLayout && styles.compactRowsWrap]}>
                        {exportRows.map((row) => {
                            const score = row.score;
                            const leftKD = numericValue(score?.leftKnockdowns);
                            const leftPen = numericValue(score?.leftDeductions);
                            const rightKD = numericValue(score?.rightKnockdowns);
                            const rightPen = numericValue(score?.rightDeductions);
                            const winnerColor = roundWinnerColor(score, fighter1, fighter2);

                            return (
                                <View key={row.roundNumber} style={[styles.scoreRow, { minHeight: rowHeight }]}>
                                    <View style={[styles.roundLabel, { backgroundColor: winnerColor }]}>
                                        <Text style={styles.roundLabelText}>R{row.roundNumber}</Text>
                                    </View>

                                    <View style={styles.totalCell}>
                                        <Text style={[styles.scoreText, { color: RED }]}>{row.leftTotal}</Text>
                                    </View>

                                    <View style={styles.roundScoreCell}>
                                        <EventBadge
                                            knockdowns={leftKD}
                                            deductions={leftPen}
                                            color={RED}
                                            side="left"
                                        />
                                        <Text style={[styles.scoreText, { color: RED }]}>
                                            {score?.left || '-'}
                                        </Text>
                                    </View>

                                    <MomentumCell
                                        value={score?.plusMinus}
                                        isQuickScore={score?.scoringMethod === 'quick'}
                                    />

                                    <View style={styles.roundScoreCell}>
                                        <Text style={[styles.scoreText, { color: BLUE }]}>
                                            {score?.right || '-'}
                                        </Text>
                                        <EventBadge
                                            knockdowns={rightKD}
                                            deductions={rightPen}
                                            color={BLUE}
                                            side="right"
                                        />
                                    </View>

                                    <View style={styles.totalCell}>
                                        <Text style={[styles.scoreText, { color: BLUE }]}>{row.rightTotal}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    <View style={[styles.notesSummaryRow, compactLayout && styles.compactNotesSummaryRow]}>
                        <View style={[styles.infoCard, styles.ratingCard, compactLayout && styles.compactInfoCard]}>
                            <Text style={[styles.infoTitle, compactLayout && styles.compactInfoTitle]}>Fight Rating</Text>
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
                            <View style={styles.ratingValueRow}>
                                <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
                                <Text style={styles.ratingSuffix}> / 5</Text>
                            </View>
                        </View>

                        <View style={[styles.infoCard, styles.descriptorCard, compactLayout && styles.compactInfoCard]}>
                            <Text style={[styles.infoTitle, compactLayout && styles.compactInfoTitle]}>Fight Description</Text>
                            <View style={styles.descriptorWrap}>
                                {descriptors.length > 0 ? (
                                    descriptors.map((descriptor) => (
                                        <View key={descriptor} style={styles.descriptorChip}>
                                            <Text
                                                numberOfLines={1}
                                                adjustsFontSizeToFit
                                                minimumFontScale={0.75}
                                                style={styles.descriptorText}
                                            >
                                                {descriptor}
                                            </Text>
                                        </View>
                                    ))
                                ) : (
                                    <View style={styles.descriptorChip}>
                                        <Text style={styles.descriptorText}>None selected</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                    <View style={[styles.brandRow, compactLayout && styles.compactBrandRow]}>
                        <Image
                            source={require('../assets/images/flatwhiteicon.png')}
                            resizeMode="contain"
                            style={[styles.brandIcon, compactLayout && styles.compactBrandIcon]}
                        />
                        <View style={styles.brandTextWrap}>
                            <Text style={styles.brandBlue}>Boxing</Text>
                            <View style={styles.brandScoreBar}>
                                <Text style={styles.brandScore}>Score</Text>
                            </View>
                            <Text style={styles.brandBlue}>Companion</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.actionRow, compactLayout && styles.compactActionRow]}>
                    <Pressable
                        onPress={handleBack}
                        style={({ pressed }) => [
                            styles.backButton,
                            styles.actionBackButton,
                            compactLayout && styles.compactBackButton,
                            pressed && styles.pressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Back to scorecard"
                    >
                        <Ionicons name="chevron-back" size={22} color={BLUE} />
                        <Text style={styles.backText}>Back</Text>
                    </Pressable>
                    <Pressable
                        onPress={handleShare}
                        disabled={busyAction !== null}
                        style={({ pressed }) => [
                            styles.shareButton,
                            compactLayout && styles.compactActionButton,
                            (pressed || busyAction !== null) && styles.pressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Share scorecard image"
                    >
                        {busyAction === 'share' ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="share-social-outline" size={23} color="#fff" />
                                <Text style={styles.shareButtonText}>Share Scorecard</Text>
                            </>
                        )}
                    </Pressable>

                    <Pressable
                        onPress={handleSaveImage}
                        disabled={busyAction !== null}
                        style={({ pressed }) => [
                            styles.saveImageButton,
                            compactLayout && styles.compactActionButton,
                            (pressed || busyAction !== null) && styles.pressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Save scorecard image"
                    >
                        {busyAction === 'save' ? (
                            <ActivityIndicator color={BLUE} />
                        ) : (
                            <>
                                <Ionicons name="download-outline" size={23} color={BLUE} />
                                <Text style={styles.saveImageButtonText}>Save Image</Text>
                            </>
                        )}
                    </Pressable>

                    
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: SCREEN,
    },
    header: {
        minHeight: 30,
        paddingBottom: 9,
        backgroundColor: HEADER_BLUE,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
        shadowColor: '#11334B',
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 3,
        elevation: 4,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 10,
    },
    scrollContentNoScroll: {
        flexGrow: 1,
        justifyContent: 'flex-start',
    },
    exportCard: {
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(210, 220, 228, 0.9)',
        paddingHorizontal: 11,
        paddingTop: 10,
        paddingBottom: 14,
        shadowColor: '#676767',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 3,
    },
    compactExportCard: {
        paddingHorizontal: 8,
        paddingTop: 6,
        paddingBottom: 8,
    },
    exportBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.11,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 9,
        marginBottom: 0
    },
    compactBrandRow: {
        // marginBottom: 4,
    },
    brandIcon: {
        width: 36,
        height: 36,
        marginRight: 5,
    },
    compactBrandIcon: {
        width: 40,
        height: 40,
    },
    brandTextWrap: {
        minWidth: 70,
    },
    brandBlue: {
        color: BLUE,
        fontSize: 11,
        lineHeight: 13,
        fontWeight: '800',
        marginLeft: 1.5
    },
    brandScoreBar: {
        backgroundColor: RED,
        paddingHorizontal: 2,
        marginVertical: 1,
        alignSelf: 'stretch',
    },
    brandScore: {
        color: '#fff',
        fontSize: 11,
        lineHeight: 13,
        fontWeight: '800',
    },
    matchupRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    compactMatchupRow: {
        marginBottom: -2,
    },
    fighterBlock: {
        flex: 1,
        alignItems: 'center',
        minWidth: 0,
    },
    fighterName: {
        width: '100%',
        height: 40,
        textAlign: 'center',
        fontSize: 18,
        lineHeight: 20,
        fontWeight: '800',
    },
    compactFighterName: {
        height: 30,
        fontSize: 15,
        lineHeight: 16,
    },
    vs: {
        width: 34,
        color: '#222',
        fontSize: 16,
        fontWeight: '800',
        textAlign: 'center',
        paddingTop: 6,
    },
    finalScore: {
        width: '100%',
        textAlign: 'center',
        fontSize: 54,
        lineHeight: 60,
        fontWeight: '800',
        marginTop: 1,
    },
    compactFinalScore: {
        fontSize: 40,
        lineHeight: 44,
    },
    eventSummary: {
        width: '100%',
        textAlign: 'center',
        fontSize: 10,
        lineHeight: 15,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#C7D3DC',
        marginTop: 9,
        marginHorizontal: 5,
    },
    compactDivider: {
        marginTop: 5,
    },
    metadata: {
        color: TEXT,
        textAlign: 'center',
        fontSize: 10,
        fontWeight: '600',
        marginTop: 5,
        marginBottom: 2,
    },
    compactMetadata: {
        marginTop: 3,
        marginBottom: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 25,
        paddingHorizontal: 2,
    },
    compactTableHeader: {
        minHeight: 21,
    },
    roundHeaderSpacer: {
        width: 44,
    },
    tableHeaderCell: {
        flex: 1,
        alignItems: 'center',
    },
    momentumHeader: {
        width: 72,
        alignItems: 'center',
    },
    tableHeaderText: {
        color: '#40464B',
        fontSize: 10,
        fontWeight: '700',
    },
    rowsWrap: {
        gap: 3,
    },
    compactRowsWrap: {
        gap: 2,
    },
    scoreRow: {
        minHeight: ROW_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.94)',
        borderRadius: 11,
        borderWidth: 1,
        borderColor: 'rgba(206, 214, 220, 0.95)',
        shadowColor: '#676767',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.13,
        shadowRadius: 1.5,
        elevation: 1,
        overflow: 'hidden',
    },
    roundLabel: {
        width: 44,
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
    },
    roundLabelText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
    },
    totalCell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 0,
    },
    roundScoreCell: {
        flex: 1,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 0,
        alignSelf: 'stretch',
    },
    scoreText: {
        fontSize: 14,
        lineHeight: 19,
        fontWeight: '800',
        textAlign: 'center',
    },
    eventBadge: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        minWidth: 25,
        paddingHorizontal: 3,
        paddingVertical: 3,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    leftEventBadge: {
        left: -13,
    },
    rightEventBadge: {
        right: -13,
    },
    eventBadgeText: {
        color: '#fff',
        fontSize: 8,
        lineHeight: 10,
        fontWeight: '600',
    },
    momentumWrap: {
        width: 72,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    momentumPill: {
        minWidth: 38,
        height: 20,
        borderRadius: 15,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    momentumNeutral: {
        backgroundColor: '#BDBDBD',
    },
    momentumText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
    },
    momentumNeutralText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
    },
    notesSummaryRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 8,
        marginTop: 11,
    },
    compactNotesSummaryRow: {
        marginTop: 6,
        gap: 5,
    },
    infoCard: {
        backgroundColor: 'rgba(255,255,255,0.94)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 10,
    },
    compactInfoCard: {
        padding: 6,
    },
    ratingCard: {
        flex: 0.61,
        minWidth: 0,
        minHeight: 105,
        // justifyContent: 'flex-start',
        position: 'relative',
    },
    descriptorCard: {
        flex: 1.39,
        minWidth: 0,
        minHeight: 105,
    },
    infoTitle: {
        color: TEXT,
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 7,
        marginLeft: 2
    },
    compactInfoTitle: {
        fontSize: 12,
        marginBottom: 4,
    },
    starsRow: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: '50%',
        transform: [{ translateY: -(STAR_SIZE / 2) }],

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.25,
    },
    star: {
        width: STAR_SIZE,
        height: STAR_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    starFillClip: {
        position: 'absolute',
        left: 0,
        top: 0,
        height: STAR_SIZE,
        overflow: 'hidden',
    },
    ratingValueRow: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 10,

        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
    },
    ratingValue: {
        color: '#111',
        fontSize: 24,
        fontWeight: '800',
    },
    ratingSuffix: {
        color: '#6F7880',
        fontSize: 17,
        fontWeight: '700',
    },
    descriptorWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5,
    },
    descriptorChip: {
        maxWidth: '100%',
        minHeight: 28,
        paddingHorizontal: 7,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#C4D3DD',
        backgroundColor: 'rgba(248,250,252,0.96)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    descriptorText: {
        color: TEXT,
        fontSize: 9.5,
        fontWeight: '500',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
    },
    compactActionRow: {
        gap: 6,
        marginTop: 7,
    },
    compactActionButton: {
        minHeight: 40,
        borderRadius: 10,
    },
    shareButton: {
        flex: 1.35,
        minHeight: 52,
        borderRadius: 13,
        backgroundColor: '#0B78EF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        shadowColor: '#676767',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    shareButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
        textAlign: 'center',
        marginLeft: 7,
    },
    saveImageButton: {
        flex: 0.9,
        minHeight: 52,
        borderRadius: 13,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E0E4E7',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        shadowColor: '#676767',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.16,
        shadowRadius: 3,
        elevation: 2,
    },
    saveImageButtonText: {
        color: BLUE,
        fontSize: 12,
        fontWeight: '800',
        marginLeft: 5,
    },
    backButton: {
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 14,
        paddingHorizontal: 18,
        minHeight: 40,
    },
    actionBackButton: {
        flex: 0.65,
        marginTop: 0,
        paddingHorizontal: 6,
    },
    compactBackButton: {
        marginTop: 5,
        minHeight: 30,
    },
    backText: {
        color: BLUE,
        fontSize: 12,
        fontWeight: '800',
    },
    pressed: {
        opacity: 0.62,
    },
});
