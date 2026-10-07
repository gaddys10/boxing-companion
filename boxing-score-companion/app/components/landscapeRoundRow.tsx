import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { router } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons} from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import CollapsibleBannerAd from './collapsibleBannerAd';
import StableCenteredModalFrame from './stableCenteredModalFrame';
import { ModalTitleHeader } from './modalCloseButton';
import { usePremium } from '../../contexts/PremiumContext';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';


const SWIPE_ACTIONS_HEIGHT = 85;
const SWIPE_ACTIONS_BOTTOM = 5;
const SWIPE_REVEAL_BUFFER = 1;
const SWIPE_REVEAL_DISTANCE = SWIPE_ACTIONS_HEIGHT + SWIPE_ACTIONS_BOTTOM + SWIPE_REVEAL_BUFFER;

type RoundRowProps = {
    roundNumber: number;
    leftScore?: string;
    rightScore?: string;
    leftTotal?: string;
    rightTotal?: string;
    plusMinus?: string;
    isQuickScore?: boolean;
    leftKds?: any;
    leftPen?: any;
    rightKds?: any;
    rightPen?: any;
    savedPlusMinus?: string;
    fighter1: string;
    fighter2: string;
    rounds: string;
    id?: string;
    savedScores: string;
    gender?: "idk" | "mens" | "womens";
    weight: number | "200+";
    fightDate?: string;
    rating: number;
    description: string;
    stoppageReason?: 'KO' | 'TKO' | 'DQ' | 'NC';
    stoppageWinner?: string;
    isAfterStoppage?: boolean;
    onClearRound: (roundNumber: number) => void;
    onSaveRound: (roundNumber: number, score: {
        left: string;
        right: string;
        plusMinus: string;
        leftDeductions: string;
        rightDeductions: string;
        leftKnockdowns: string;
        rightKnockdowns: string;
        scoringMethod: 'quick' | 'full';
    }) => void;
    onConfirmStoppage: (roundNumber: number, reason: 'KO' | 'TKO' | 'DQ' | 'NC', winner?: string) => void;
};

export default function LandscapeRoundRow({
    roundNumber,
    leftScore,
    rightScore,
    leftTotal,
    rightTotal,
    plusMinus,
    isQuickScore,
    leftKds,
    leftPen,
    rightKds,
    rightPen,
    fighter1,
    fighter2,
    rounds,
    id,
    savedScores,
    gender,
    weight,
    fightDate,
    rating,
    description,
    stoppageReason,
    stoppageWinner,
    isAfterStoppage,
    onClearRound,
    onSaveRound,
    onConfirmStoppage,
}: RoundRowProps) {
    const { isPremium } = usePremium();
    const { contentHeight, insets } = useResponsiveLayout();
    const swipeOffset = useSharedValue(0);
    const swipeStartOffset = useSharedValue(0);
    const plusMinusNumber = plusMinus && plusMinus !== '-' ? Number(plusMinus) : null;
    const leftRoundScoreNumber = Number(leftScore);
    const rightRoundScoreNumber = Number(rightScore);
    const quickScoreDifference =
        isQuickScore && Number.isFinite(leftRoundScoreNumber) && Number.isFinite(rightRoundScoreNumber)
            ? leftRoundScoreNumber - rightRoundScoreNumber
            : null;
    const winnerIndicator = quickScoreDifference ?? plusMinusNumber;
    const [scoringModalVisible, setScoringModalVisible] = useState(false);
    const [quickScoringVisible, setQuickScoringVisible] = useState(false);
    const [orientationChoiceVisible, setOrientationChoiceVisible] = useState(false);
    const [scoringMethodModalHeight, setScoringMethodModalHeight] = useState<number | null>(null);
    const [stoppageModalVisible, setStoppageModalVisible] = useState(false);
    const [draftStoppageReason, setDraftStoppageReason] = useState<RoundRowProps['stoppageReason']>(stoppageReason);
    const [selectedStoppageWinner, setSelectedStoppageWinner] = useState<string | undefined>(stoppageWinner);
    const [quickLeftScore, setQuickLeftScore] = useState(10);
    const [quickRightScore, setQuickRightScore] = useState(10);
    const [quickLeftKds, setQuickLeftKds] = useState(0);
    const [quickRightKds, setQuickRightKds] = useState(0);
    const [quickLeftPen, setQuickLeftPen] = useState(0);
    const [quickRightPen, setQuickRightPen] = useState(0);
    

    const openQuickScoring = () => {
        setQuickLeftScore(Number(leftScore ?? 10) + (isQuickScore ? Number(leftPen ?? 0) + Number(rightKds ?? 0) : 0));
        setQuickRightScore(Number(rightScore ?? 10) + (isQuickScore ? Number(rightPen ?? 0) + Number(leftKds ?? 0) : 0));
        setQuickLeftKds(Number(leftKds ?? 0));
        setQuickRightKds(Number(rightKds ?? 0));
        setQuickLeftPen(Number(leftPen ?? 0));
        setQuickRightPen(Number(rightPen ?? 0));
        setQuickScoringVisible(true);
    };

    const closeScoringModal = () => {
        setScoringModalVisible(false);
        setQuickScoringVisible(false);
        setOrientationChoiceVisible(false);
    };

    const cancelStoppageChanges = () => {
        setDraftStoppageReason(stoppageReason);
        setSelectedStoppageWinner(stoppageWinner);
        setStoppageModalVisible(false);
    };

    const startFullScoring = async (orientationLock: ScreenOrientation.OrientationLock) => {
        closeScoringModal();

        try {
            await ScreenOrientation.lockAsync(orientationLock);
        } catch {
            // Orientation locking may be unavailable on some devices; scoring can still continue.
        }

        router.push({
            pathname: '/roundScoring',
            params: {
                roundNumber: String(roundNumber),
                fighter1,
                fighter2,
                rounds,
                id,
                savedScores,
                gender,
                weight,
                fightDate,
                rating,
                description,
                scoringOrientation: orientationLock === ScreenOrientation.OrientationLock.PORTRAIT_UP
                    ? 'portrait'
                    : 'landscape',
            },
        });
    };

    const saveQuickScore = () => {
        const hasFullScoringMomentum = !isQuickScore && plusMinus !== undefined && plusMinus !== '' && plusMinus !== '-';
        const adjustedLeftScore = quickLeftScore - quickLeftPen - quickRightKds;
        const adjustedRightScore = quickRightScore - quickRightPen - quickLeftKds;
        const savedLeftScore = hasFullScoringMomentum ? quickLeftScore : adjustedLeftScore;
        const savedRightScore = hasFullScoringMomentum ? quickRightScore : adjustedRightScore;

        onSaveRound(roundNumber, {
            left: String(savedLeftScore),
            right: String(savedRightScore),
            plusMinus: hasFullScoringMomentum ? plusMinus : String(savedLeftScore - savedRightScore),
            leftDeductions: String(quickLeftPen),
            rightDeductions: String(quickRightPen),
            leftKnockdowns: String(quickLeftKds),
            rightKnockdowns: String(quickRightKds),
            scoringMethod: hasFullScoringMomentum ? 'full' : 'quick',
        });
        closeScoringModal();
    };

    const plusMinusDisplay = plusMinus === ''
        ? ''
        : winnerIndicator === null
            ? '-'
            : winnerIndicator < 0
                ? String(Math.abs(winnerIndicator))
                : String(winnerIndicator);

    const plusMinusPillStyle =
        winnerIndicator === null
            ? [styles.plusMinusPill, styles.neutralPlusMinusPill]
            : winnerIndicator > 0
                ? [styles.plusMinusPill, styles.redPlusMinusPill]
                : winnerIndicator < 0
                    ? [styles.plusMinusPill, styles.bluePlusMinusPill]
                    : [styles.plusMinusPill, styles.neutralPlusMinusPill];

    const roundLabelColor =
        stoppageWinner === fighter1
            ? '#D32F2F'
            : stoppageWinner === fighter2
                ? '#1976D2'
                : winnerIndicator === null
                    ? '#b0b0b0'
                    : winnerIndicator > 0
                        ? '#D32F2F'
                        : winnerIndicator < 0
                            ? '#1976D2'
                            : '#b0b0b0';

    const closeSwipeActions = () => {
        swipeOffset.value = withTiming(0);
    };

    const verticalSwipe = Gesture.Pan()
        .activeOffsetY([-10, 10])
        .failOffsetX([-10, 10])
        .onStart(() => {
            swipeStartOffset.value = swipeOffset.value;
        })
        .onUpdate((event) => {
            swipeOffset.value = Math.max(
                -SWIPE_REVEAL_DISTANCE,
                Math.min(0, swipeStartOffset.value + event.translationY),
            );
        })
        .onEnd((event) => {
            const shouldOpen = event.velocityY < -300 || swipeOffset.value < -SWIPE_REVEAL_DISTANCE / 2;
            swipeOffset.value = withTiming(shouldOpen ? -SWIPE_REVEAL_DISTANCE : 0);
        });

    const swipeContentStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: swipeOffset.value }],
    }));

    const renderSwipeActions = () => (
        <View style={styles.swipeActions}>
            <Pressable
                style={styles.stoppageAction}
                onPress={() => {
                    closeSwipeActions();
                    setDraftStoppageReason(stoppageReason);
                    setSelectedStoppageWinner(stoppageWinner);
                    setStoppageModalVisible(true);
                }}
            >
                <Text style={styles.stoppageActionText}>Stop{"\n"}Fight</Text>
            </Pressable>
            <Pressable
                style={styles.clearAction}
                onPress={() => {
                    closeSwipeActions();
                    onClearRound(roundNumber);
                }}
            >
                <Text style={styles.clearActionText}>Clear{"\n"}Round</Text>
            </Pressable>
        </View>
    );

    return (
        <>
            <GestureDetector gesture={verticalSwipe}>
                <View style={styles.swipeViewport}>
                    {renderSwipeActions()}
                    <Animated.View style={[styles.swipeContent, swipeContentStyle]}>
                    <View style={styles.row}>
                        <View style={[styles.roundLabelContainer, { backgroundColor: roundLabelColor }]}>
                            <Text style={styles.roundLabel}>R{roundNumber}</Text>
                        </View>
                        
                        
                        {/* <Text style={[styles.scoreText, styles.leftTotalScore]}>{leftTotal ?? '-'}</Text>
                        <Text style={[styles.scoreText, styles.leftRoundScore]}>{leftScore ?? '-'}</Text> */}

                        <View style={styles.scorePair}>
                            <View style={[styles.scoreSlot, styles.outerTopScoreSlot]}>
                                <Text style={[styles.pairedScoreText, styles.leftTotalScore]}>
                                    {leftTotal ?? '-'}
                                </Text>
                            </View>

                            <View style={[styles.scoreSlot, styles.innerTopScoreSlot]}>
                                <Text style={[styles.pairedScoreText, styles.leftRoundScore]}>
                                    {leftScore ?? '-'}
                                </Text>
                            </View>

                            {(Number(leftKds) > 0 || Number(leftPen) > 0) && (
                                <View style={[styles.roundEvents, styles.redRoundEvents]}>
                                    {Number(leftKds) > 0 && Number(leftPen) > 0 && (
                                        <Text style={styles.roundEventsText}>
                                            KD{leftKds}{"\n"}PD{leftPen}
                                        </Text>
                                    )}
                                    {Number(leftKds) > 0 && Number(leftPen) === 0 && (
                                        <Text style={styles.roundEventsText}>KD{leftKds}</Text>
                                    )}
                                    {Number(leftKds) === 0 && Number(leftPen) > 0 && (
                                        <Text style={styles.roundEventsText}>PD{leftPen}</Text>
                                    )}
                                </View>
                            )}
                        </View>

                        {winnerIndicator !== null && winnerIndicator > 0 && (
                            <Ionicons name="caret-up" style={styles.leftTriangle} size={16}/>
                        )}

                        <View style={styles.plusMinusSlot}>
                            <View style={plusMinusPillStyle}>
                                <Text style={styles.plusMinusPillText}>
                                    {isQuickScore ? '\u00A0' : plusMinusDisplay}
                                </Text>
                            </View>
                        </View>

                        {winnerIndicator !== null && winnerIndicator < 0 && (
                            <Ionicons name="caret-down" style={styles.rightTriangle} size={16} />
                        )}
                        {/* <Text style={[styles.scoreText, styles.rightRoundScore, ]}>{rightScore ?? '-'}</Text>
                        <Text style={[styles.scoreText, styles.rightTotalScore]}>{rightTotal ?? '-'}</Text> */}
                        <View style={styles.scorePair}>
                            <View style={[styles.scoreSlot, styles.innerBottomScoreSlot]}>
                                <Text style={[styles.pairedScoreText, styles.rightRoundScore]}>
                                    {rightScore ?? '-'}
                                </Text>
                            </View>

                            <View style={[styles.scoreSlot, styles.outerBottomScoreSlot]}>
                                <Text style={[styles.pairedScoreText, styles.rightTotalScore]}>
                                    {rightTotal ?? '-'}
                                </Text>
                            </View>

                            {(Number(rightKds) > 0 || Number(rightPen) > 0) && (
                                <View style={[styles.roundEvents, styles.blueRoundEvents]}>
                                    {Number(rightKds) > 0 && Number(rightPen) > 0 && (
                                        <Text style={styles.roundEventsText}>
                                            KD{rightKds}{"\n"}PD{rightPen}
                                        </Text>
                                    )}
                                    {Number(rightKds) > 0 && Number(rightPen) === 0 && (
                                        <Text style={styles.roundEventsText}>KD{rightKds}</Text>
                                    )}
                                    {Number(rightKds) === 0 && Number(rightPen) > 0 && (
                                        <Text style={styles.roundEventsText}>PD{rightPen}</Text>
                                    )}
                                </View>
                            )}
                        </View>
                        {isAfterStoppage ? (
                            <View style={styles.buttonSpacer} />
                        ) : (
                            <Pressable
                                style={styles.button}
                                onPress={() => setScoringModalVisible(true)}
                            >
                                <MaterialCommunityIcons name="pencil" size={20} color="#333A3F" />
                            </Pressable>
                        )}
                    </View>
                    {/* {
                        (Number(leftKds) > 0 || Number(leftPen) > 0) && (
                            <View style={styles.roundEvents}>
                                {Number(leftKds) > 0 && Number(leftPen) > 0 && (
                                    <Text style={styles.roundEventsText}>KD{leftKds}{"\n"}PD{leftPen}</Text>
                                )}
                                {Number(leftKds) > 0 && Number(leftPen) === 0 && (
                                    <Text style={styles.roundEventsText}>KD{leftKds}</Text>
                                )}
                                {Number(leftKds) === 0 && Number(leftPen) > 0 && (
                                    <Text style={styles.roundEventsText}>PD{leftPen}</Text>
                                )}
                            </View>
                        )
                    }
                    {
                        (Number(rightKds) > 0 || Number(rightPen) > 0) && (
                            <View style={styles.roundEvents2}>
                                {Number(rightKds) > 0 && Number(rightPen) > 0 && (
                                    <Text style={styles.roundEventsText}>KD{rightKds}{"\n"}PD{rightPen}</Text>
                                )}
                                {Number(rightKds) > 0 && Number(rightPen) === 0 && (
                                    <Text style={styles.roundEventsText}>KD{rightKds}</Text>
                                )}
                                {Number(rightKds) === 0 && Number(rightPen) > 0 && (
                                    <Text style={styles.roundEventsText}>PD{rightPen}</Text>
                                )}
                            </View>
                        )
                    } */}
                    </Animated.View>
                </View>
            </GestureDetector>
            <Modal
                animationType="fade"
                transparent
                visible={scoringModalVisible}
                supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
                onRequestClose={closeScoringModal}
            >
                <View style={styles.modalOverlay}>
                    <StableCenteredModalFrame
                        key={quickScoringVisible ? 'quick' : orientationChoiceVisible ? 'orientation' : 'method'}
                    >
                    <View
                        style={[
                            styles.scoringModal,
                            orientationChoiceVisible && scoringMethodModalHeight !== null && { height: scoringMethodModalHeight },
                        ]}
                        onLayout={({ nativeEvent }) => {
                            if (!quickScoringVisible && !orientationChoiceVisible) {
                                setScoringMethodModalHeight(nativeEvent.layout.height);
                            }
                        }}
                    >
                        {orientationChoiceVisible ? (
                            <ModalTitleHeader
                                title="Choose Orientation"
                                style={{ marginBottom: 24 }}
                                titleStyle={styles.landscapeQuickModalTitle}
                                accessibilityLabel="Close scoring dialog"
                                onClose={closeScoringModal}
                                isLandscape
                            />
                        ) : !quickScoringVisible ? (
                            <ModalTitleHeader
                                title="Select Scoring Method"
                                style={{ marginBottom: 28 }}
                                titleStyle={styles.landscapeQuickModalTitle}
                                accessibilityLabel="Close scoring dialog"
                                onClose={closeScoringModal}
                                isLandscape
                            />
                        ) : (
                            <ModalTitleHeader
                                title={`Quick Score Round ${roundNumber}`}
                                titleStyle={styles.quickModalTitle}
                                accessibilityLabel="Close scoring dialog"
                                onClose={closeScoringModal}
                                isLandscape
                            />
                        )}
                        {orientationChoiceVisible ? (
                            <>
                                <Text style={styles.orientationPrompt}>How would you like to score this round?</Text>
                                <View style={styles.methodRow}>
                                    <View style={styles.methodOption}>
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel="Score in portrait mode"
                                            style={styles.scoringButton}
                                            onPress={() => startFullScoring(ScreenOrientation.OrientationLock.PORTRAIT_UP)}
                                        >
                                            <View style={styles.orientationImageSlot}>
                                                <ExpoImage
                                                    source={require('../../assets/images/portrait-optimized.png')}
                                                    style={styles.orientationPortraitImage}
                                                    contentFit="contain"
                                                    cachePolicy="memory-disk"
                                                    transition={0}
                                                />
                                            </View>
                                            <Text style={styles.orientationButtonText}>Portrait</Text>
                                        </Pressable>
                                    </View>
                                    <View style={styles.methodOption}>
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel="Score in landscape mode"
                                            style={styles.scoringButton}
                                            onPress={() => startFullScoring(ScreenOrientation.OrientationLock.LANDSCAPE)}
                                        >
                                            <View style={styles.orientationImageSlot}>
                                                <ExpoImage
                                                    source={require('../../assets/images/landscape-optimized.png')}
                                                    style={styles.orientationLandscapeImage}
                                                    contentFit="contain"
                                                    cachePolicy="memory-disk"
                                                    transition={0}
                                                />
                                            </View>
                                            <Text style={styles.orientationButtonText}>Landscape</Text>
                                        </Pressable>
                                    </View>
                                </View>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Back to scoring method selection"
                                    style={[styles.modalButton, styles.cancelButton, { marginTop: -1 }]}
                                    onPress={() => setOrientationChoiceVisible(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Back</Text>
                                </Pressable>
                            </>
                        ) : !quickScoringVisible ? (
                            <>
                                <View style={styles.methodRow}>
                                    <View style={styles.methodOption}>
                                        <Pressable style={[styles.scoringButton, { marginBottom: '1.25%' }]} onPress={openQuickScoring}>
                                            <Ionicons name="flash" size={20} color="#1976D2" style={styles.scoringMethodIcon} />
                                            <Text numberOfLines={1} style={[styles.scoringButtonText, styles.scoringMethodText]}>Quick Scoring</Text>
                                        </Pressable>
                                        <Text style={styles.modalText}>Score the round in just a few taps!</Text>
                                    </View>
                                    <View style={styles.methodOption}>
                                        <Pressable
                                            style={[styles.scoringButton, { marginBottom: '1.25%' }]}
                                            onPress={() => setOrientationChoiceVisible(true)}
                                        >
                                            <ExpoImage
                                                source={require('../../assets/images/portrait-optimized.png')}
                                                style={styles.scoringMethodImage}
                                                contentFit="contain"
                                                cachePolicy="memory-disk"
                                                transition={0}
                                            />
                                            <Text style={[styles.scoringButtonText, styles.scoringMethodText]}>Full Scoring</Text>
                                        </Pressable>
                                        <Text style={styles.modalText}>Interactive live scoring with momentum tracking</Text>
                                    </View>
                                </View>
                                <View style={styles.scoringMethodActions}>
                                    <Pressable
                                        style={[styles.modalButton, styles.cancelButton, styles.scoringMethodAction]}
                                        onPress={closeScoringModal}
                                    >
                                        <Ionicons name="close" size={18} color="#fff" />
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </Pressable>
                                    <Pressable
                                        accessibilityRole="button"
                                        style={[styles.modalButton, styles.clearRoundButton, styles.scoringMethodAction]}
                                        onPress={() => {
                                            onClearRound(roundNumber);
                                            closeScoringModal();
                                        }}
                                    >
                                        <Text style={styles.cancelButtonText}>Clear Round</Text>
                                    </Pressable>
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={styles.quickFieldsRow}>
                                    <View style={styles.quickCornerNameRow}>
                                        <Text numberOfLines={2} style={[styles.quickCornerName, styles.quickLeftName]}>{fighter1}</Text>
                                        <Text numberOfLines={2} style={[styles.quickCornerName, styles.quickRightName]}>{fighter2}</Text>
                                    </View>
                                    <View key={"Round Score"} style={styles.quickField}>
                                        <Text style={styles.quickEventLabel}>Round Score</Text>
                                        <View style={styles.quickCornerRow}>
                                            <View style={styles.stepper}>
                                                <Pressable style={styles.stepperButton} onPress={() => setQuickLeftScore(Math.max(0, quickLeftScore - 1))}><Text style={styles.stepperButtonText}>−</Text></Pressable>
                                                <Text style={[styles.stepperValue, styles.quickLeftName]}>{quickLeftScore}</Text>
                                                <Pressable style={styles.stepperButton} onPress={() => setQuickLeftScore(Math.min(10, quickLeftScore + 1))}><Text style={styles.stepperButtonText}>+</Text></Pressable>
                                            </View>
                                            <View style={styles.stepper}>
                                                <Pressable style={styles.stepperButton} onPress={() => setQuickRightScore(Math.max(0, quickRightScore - 1))}><Text style={styles.stepperButtonText}>−</Text></Pressable>
                                                <Text style={[styles.stepperValue, styles.quickRightName]}>{quickRightScore}</Text>
                                                <Pressable style={styles.stepperButton} onPress={() => setQuickRightScore(Math.min(10, quickRightScore + 1))}><Text style={styles.stepperButtonText}>+</Text></Pressable>
                                            </View>
                                        </View>
                                    </View>
                                    {[
                                        // { label: 'Round score', left: quickLeftScore, right: quickRightScore, setLeft: setQuickLeftScore, setRight: setQuickRightScore, max: 10 },
                                        { label: 'Knockdowns', left: quickLeftKds, right: quickRightKds, setLeft: setQuickLeftKds, setRight: setQuickRightKds },
                                        { label: 'Point deductions', left: quickLeftPen, right: quickRightPen, setLeft: setQuickLeftPen, setRight: setQuickRightPen },
                                    ].map((field) => (
                                        <View key={field.label} style={styles.quickField}>
                                            <Text style={styles.quickEventLabel}>{field.label}</Text>
                                            <View style={styles.quickCornerRow}>
                                                <View style={styles.stepper}>
                                                    <Pressable style={styles.stepperButton} onPress={() => field.setLeft(Math.max(0, field.left - 1))}><Text style={styles.stepperButtonText}>−</Text></Pressable>
                                                    <Text style={[styles.stepperValue, field.label === 'Round score' && styles.quickLeftName]}>{field.left}</Text>
                                                    <Pressable style={styles.stepperButton} onPress={() => field.setLeft(field.left + 1)}><Text style={styles.stepperButtonText}>+</Text></Pressable>
                                                </View>
                                                <View style={styles.stepper}>
                                                    <Pressable style={styles.stepperButton} onPress={() => field.setRight(Math.max(0, field.right - 1))}><Text style={styles.stepperButtonText}>−</Text></Pressable>
                                                    <Text style={[styles.stepperValue, field.label === 'Round score' && styles.quickRightName]}>{field.right}</Text>
                                                    <Pressable style={styles.stepperButton} onPress={() => field.setRight(field.right + 1)}><Text style={styles.stepperButtonText}>+</Text></Pressable>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                                <View style={styles.quickModalActions}>
                                    <Pressable
                                        style={[styles.modalButton, styles.backButton]}
                                        onPress={() => setQuickScoringVisible(false)}
                                    >
                                        <Text style={styles.backButtonText}>Back</Text>
                                    </Pressable>
                                    <Pressable style={[styles.modalButton, styles.saveButton]} onPress={saveQuickScore}>
                                        <Text style={styles.saveButtonText}>Save Round</Text>
                                    </Pressable>
                                </View>
                                {scoringModalVisible && quickScoringVisible && !isPremium && (
                                    <CollapsibleBannerAd
                                        containerStyle={styles.quickScoringAdPositioner}
                                        failureMessage="Landscape quick scoring banner failed:"
                                    />
                                )}
                            </>
                        )}
                    </View>
                    </StableCenteredModalFrame>
                </View>
            </Modal>
            <Modal
                animationType="fade"
                transparent
                visible={stoppageModalVisible}
                supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
                onRequestClose={cancelStoppageChanges}
            >
                <View style={[styles.stoppageModalOverlay, {
                    paddingTop: insets.top + 20,
                    paddingBottom: insets.bottom + 4,
                    paddingLeft: insets.left + 16,
                    paddingRight: insets.right + 16,
                }]}>
                    <View style={[styles.stoppageModalCard, { height: Math.max(0, Math.min(380, contentHeight - 24) - (isPremium ? 50 : 0)) }]}>
                        <View style={styles.stoppageModalContent}>
                            <ModalTitleHeader
                                title="Mark Stoppage"
                                style={{ marginBottom: 4 }}
                                titleStyle={styles.stoppageModalTitle}
                                accessibilityLabel="Close stoppage dialog"
                                onClose={cancelStoppageChanges}
                                isLandscape
                            />
                            <Text style={[styles.stoppageModalText, { textAlign: 'center', marginBottom: 0 }]}>Select why the fight was stopped.</Text>
                            <View style={styles.stoppageOptions}>
                                <View style={styles.stoppageOptionRow}>
                                    {(['KO', 'TKO', 'DQ', 'NC'] as const).map((option) => (
                                        <Pressable
                                            key={option}
                                            style={[styles.stoppageOption, draftStoppageReason === option && styles.selectedStoppageOption]}
                                            onPress={() => {
                                                setDraftStoppageReason(option);
                                                setSelectedStoppageWinner(undefined);
                                            }}
                                        >
                                            <Text style={[styles.stoppageOptionText, draftStoppageReason === option && styles.selectedStoppageOptionText]}>{option}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                            {(draftStoppageReason === 'KO' || draftStoppageReason === 'TKO' || draftStoppageReason === 'DQ') && (
                                <>
                                    <Text style={[styles.stoppageModalText, { textAlign: 'center', marginTop: 0, marginBottom: 0 }]}>Who won the fight?</Text>
                                    <View style={styles.stoppageWinnerOptions}>
                                        {[fighter1, fighter2].map((fighter) => (
                                            <Pressable
                                                key={fighter}
                                                style={[styles.stoppageWinnerOption, selectedStoppageWinner === fighter && styles.selectedStoppageOption]}
                                                onPress={() => setSelectedStoppageWinner(fighter)}
                                            >
                                                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[styles.stoppageWinnerText, selectedStoppageWinner === fighter && styles.selectedStoppageOptionText]}>{fighter}</Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </>
                            )}
                            <View style={[styles.stoppageModalActions, { marginTop: 0 }]}>
                                <Pressable style={[styles.stoppageModalButton, styles.stoppageCancelButton]} onPress={cancelStoppageChanges}>
                                    <Text style={styles.stoppageCancelButtonText}>Cancel</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.stoppageModalButton, styles.stoppageConfirmButton]}
                                    onPress={() => {
                                        if (draftStoppageReason === 'NC') {
                                            onConfirmStoppage(roundNumber, draftStoppageReason);
                                            setStoppageModalVisible(false);
                                        } else if (
                                            selectedStoppageWinner &&
                                            (draftStoppageReason === 'KO' || draftStoppageReason === 'TKO' || draftStoppageReason === 'DQ')
                                        ) {
                                            onConfirmStoppage(roundNumber, draftStoppageReason, selectedStoppageWinner);
                                            setStoppageModalVisible(false);
                                        }
                                    }}
                                >
                                    <Text style={styles.stoppageConfirmButtonText}>Confirm</Text>
                                </Pressable>
                            </View>
                            {!isPremium && (
                                <View style={styles.stoppageAdPositioner}>
                                    {stoppageModalVisible && (
                                        <CollapsibleBannerAd
                                            failureMessage="Landscape match info stoppage banner failed:"
                                        />
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    scorePair: {
        flex: 2,
        width: '100%',
        position: 'relative',
        // Visually align the scores and their event badges with the side headers
        // without changing the flex layout or the momentum slot position.
        bottom: '3.75%',
    },

    scoreSlot: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },

    outerTopScoreSlot: {
        transform: [{ translateY: -4 }],
    },

    innerTopScoreSlot: {
        transform: [{ translateY: -2 }],
    },

    innerBottomScoreSlot: {
        transform: [{ translateY: 2 }],
    },

    outerBottomScoreSlot: {
        transform: [{ translateY: 4 }],
    },

    pairedScoreText: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '700',
    },

    roundEvents: {
        position: 'absolute',
        // A 22.5%-high box starts at 38.75% to center on the pair midpoint.
        top: '38.75%',
        height: '22.5%',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
    },

    redRoundEvents: {
        backgroundColor: '#D32F2F',
        // The left pair's widened values have a midpoint 3px above center.
        transform: [{ translateY: -3 }],
    },

    blueRoundEvents: {
        backgroundColor: '#1976D2',
        // The right pair's widened values have a midpoint 3px below center.
        transform: [{ translateY: 3 }],
    },
    plusMinusSlot: {
            flex: 1,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            bottom: '3.75%',
    },

    plusMinusPillText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 18,
        textAlign: 'center',
    },
    plusMinusPill: {
        minWidth: 28,
        minHeight: 22,
        borderRadius: 999,
        paddingHorizontal: 7,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bluePlusMinusPill: {
        backgroundColor: '#1976D2',
    },
    neutralPlusMinusPill: {
        backgroundColor: '#b0b0b0',
    },
    redPlusMinusPill: {
        backgroundColor: '#D32F2F',
    },
    backButton: {
        backgroundColor: '#EEF1F3',
    },
    backButtonText: {
        color: '#333A3F',
        fontWeight: '700',
    },
    bluePlusMinus: {
        color: '#fff',
    },
    button: {
        backgroundColor: 'white',
        marginRight: 5,
        paddingHorizontal: 8,
        paddingBottom: 5,
        borderRadius: 12,
    },
    buttonSpacer: {
        height: 30,
        marginRight: 5,
        width: 36,
    },
    buttonText: {   
        color: '#333',
    },
    cancelButton: {
        alignSelf: 'center',
        backgroundColor: '#d32f2f',
        marginTop: 12,
        width: 180,
        shadowColor: '#11334b',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 1,
    },
    scoringMethodActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    scoringMethodAction: {
        flex: 1,
        width: 'auto',
        maxWidth: 180,
        marginTop: 8,
        marginLeft: 0,
    },
    clearRoundButton: {
        backgroundColor: '#000',
        boxShadow: '4',
        shadowColor: '#11334b',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 1,
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    swipeActions: {
        justifyContent: 'center',
        flexDirection: 'column',
        height: SWIPE_ACTIONS_HEIGHT,
        left: '4%',
        position: 'absolute',
        width: '88%',
        bottom: SWIPE_ACTIONS_BOTTOM,
        gap: 2,
    },
    swipeContent: {
        height: '100%',
    },
    swipeViewport: {
        height: '100%',
        overflow: 'hidden',
    },
    stoppageAction: {
        alignItems: 'center',
        backgroundColor: '#000',
        justifyContent: 'center',
        flex: 1,
        paddingHorizontal: 0,
        borderRadius: 15,
    },
    stoppageActionText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
    },
    clearAction: {
        alignItems: 'center',
        backgroundColor: '#bc1616',
        justifyContent: 'center',
        flex: 1,
        paddingHorizontal: 0,
        borderRadius: 15,
    },
    clearActionText: {
        color: '#fff',
        fontSize: 8.5,
        fontWeight: '700',
        textAlign: 'center',
    },
    stoppageModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    stoppageModalCard: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    stoppageModalContent: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 20,
    },
    stoppageModalTitle: {
        color: '#333A3F',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        paddingHorizontal: 24,
        textAlign: 'center',
    },
    stoppageModalText: {
        color: '#333A3F',
        fontSize: 14,
        lineHeight: 21,
        marginBottom: 13,
    },
    stoppageOptions: { alignItems: 'center' },
    stoppageOptionRow: { flexDirection: 'row', gap: 10 },
    stoppageWinnerOptions: { flexDirection: 'row', gap: 15, justifyContent: 'center' },
    stoppageOption: {
        alignItems: 'center',
        backgroundColor: '#EEF1F3',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        width: '20%',
        borderColor: 'rgba(200, 200, 200, 0.7)',
        justifyContent: 'center',
    },
    stoppageWinnerOption: {
        alignItems: 'center',
        backgroundColor: '#EEF1F3',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        width: '41%',
        borderColor: 'rgba(200, 200, 200, 0.7)',
        justifyContent: 'center',
    },
    selectedStoppageOption: {
        backgroundColor: '#307FB6',
    },
    stoppageOptionText: {
        color: '#333A3F',
        fontSize: 16,
        fontWeight: '700',
    },
    selectedStoppageOptionText: {
        color: '#fff',
    },
    stoppageWinnerText: {
        color: '#333A3F',
        fontSize: 16,
        fontWeight: '700',
        width: '100%',
        textAlign: 'center',
    },
    stoppageModalActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, gap: 10 },
    stoppageAdPositioner: {
        alignItems: 'center',
        height: 50,
        flexShrink: 0,
        width: '100%',
    },
    stoppageModalButton: { minWidth: 88, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
    stoppageCancelButton: {
        backgroundColor: '#d32f2f',
        shadowColor: '#11334b',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 1,
        borderWidth: 1,
        borderColor: 'rgba(200, 200, 200, 0.7)',
    },
    stoppageConfirmButton: {
        backgroundColor: '#fff',
        shadowColor: '#11334b',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 1,
        borderWidth: 1,
        borderColor: 'rgba(200, 200, 200, 0.7)',
    },
    stoppageCancelButtonText: { color: '#fff', fontWeight: '700' },
    stoppageConfirmButtonText: { color: '#1976D2', fontWeight: '700' },
    leftRoundScore: {
        color: '#D32F2F',
    },
    leftTotalScore: {
        color: '#D32F2F',
    },
    leftTriangle: {
        position: 'absolute',
        left: '32%',
        // height: 9,
        top: '44%',
        color: "#d32f2f"
    },
    rightTriangle: {
        position: 'absolute',
        left: '32%',
        top: '55%',
        color: "#1976D2"
    },
    plusMinus: {
        color: '#000',
    },
    methodOption: {
        alignItems: 'center',
        flex: 1,
        marginBottom: '5%',
    },
    methodRow: {
        flexDirection: 'row',
        gap: 20,
    },
    modalButton: {
        alignItems: 'center',
        borderRadius: 10,
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        minHeight: 38,
        paddingHorizontal: 18,
    },
    modalOverlay: {
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        flex: 1,
        justifyContent: 'center',
        padding: 16,
    },
    modalText: {
        color: '#333A3F',
        fontSize: 12,
        marginTop: 6,
        textAlign: 'center',
    },
    orientationPrompt: {
        color: '#333A3F',
        fontSize: 15,
        marginBottom: 18,
        textAlign: 'center',
    },
    orientationButtonText: {
        color: '#1976D2',
        fontSize: 18,
        fontWeight: '700',
    },
    orientationPortraitImage: {
        width: 26,
        height: 26,
    },
    orientationLandscapeImage: {
        width: 36,
        height: 22,
    },
    orientationImageSlot: {
        width: 36,
        height: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        color: '#333A3F',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: '7 %',
        paddingHorizontal: 24,
        textAlign: 'center',
    },
    landscapeQuickModalTitle: {
        color: '#333A3F',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: '6%',
        paddingHorizontal: 24,
        textAlign: 'center',
    },
    quickModalTitle: {
        color: '#333A3F',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: '2.5%',
        paddingHorizontal: 24,
        textAlign: 'center',
    },
    redPlusMinus: {
        color: '#D32F2F',
    },
    saveButton: {
        backgroundColor: '#1976D2',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    scoringButton: {
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        minHeight: 50,
        width: '75%',
        marginBottom: '2.5%',
        shadowColor: '#11334b',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 1,
        borderWidth: 1,
        borderColor: 'rgba(200, 200, 200, 0.7)',
    },
    scoringButtonText: {
        color: '#1976D2',
        fontSize: 18,
        fontWeight: '700',
    },
    scoringMethodImage: {
        width: 24,
        height: 24,
        tintColor: '#1976D2',
    },
    scoringMethodIcon: {
        width: 24,
        textAlign: 'center',
    },
    scoringMethodText: {
        width: 125,
        textAlign: 'left',
    },
    scoringModal: {
        backgroundColor: '#fff',
        borderRadius: 12,
        elevation: 6,
        maxWidth: 680,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        width: '75%',
    },
    quickCornerName: {
        fontSize: 13,
        fontWeight: '700',
        height: 32,
        lineHeight: 16,
        textAlign: 'left',
        textAlignVertical: 'center',
    },
    quickCornerNameRow: {
        gap: 35,
        justifyContent: 'flex-start',
        paddingTop: 22,
        width: 110,
    },
    quickCornerRow: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 35,
        marginBottom: '10%'
    },
    quickEventLabel: {
        color: '#333A3F',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    quickField: {
        flex: 1,
    },
    quickFieldsRow: {
        flexDirection: 'row',
        gap: 14,
        marginTop: 16,
    },
    quickLeftName: {
        color: '#D32F2F',
    },
    quickModalActions: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
        marginTop: 18,
    },
    quickScoringAdPositioner: {
        alignItems: 'center',
        marginTop: 22,
        width: '100%',
    },
    quickRightName: {
        color: '#1976D2',
    },
    stepper: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    stepperButton: {
        alignItems: 'center',
        backgroundColor: '#EEF1F3',
        borderRadius: 8,
        height: 32,
        justifyContent: 'center',
        width: 30,
    },
    stepperButtonText: {
        color: '#333A3F',
        fontSize: 19,
        fontWeight: '700',
    },
    stepperValue: {
        color: '#333A3F',
        fontSize: 17,
        fontWeight: '700',
        minWidth: 28,
        textAlign: 'center',
    },
    rightTotalScore: {
        color: '#1976D2',
        marginLeft: 0
    },
    rightRoundScore: {
        color: '#1976D2',
    },
    // roundEvents: {
    //     position: 'absolute',
    //     left: '2.5%',
    //     right: 0,
    //     top: '26.5%',
    //     height: '6.25%',
    //     justifyContent: 'center',
    //     alignItems: 'center',
    //     backgroundColor: '#D32F2F',
    //     width: '88.5%',
    //     paddingHorizontal: 6,
    // },
    roundEvents2: {
        position: 'absolute',
        left: '2.5%',
        right: 0,
        top: '68%',
        height: '6.25%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1976D2',
        width: '88.5%',
        paddingHorizontal: 6,
    },
    roundEventsText: {
        fontSize: 7.5,
        color: '#fff',
        fontWeight: 600
    },
    roundLabel: {
        // width: 40,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    roundLabelContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        width: '109%',
        paddingVertical: '25%',
        marginBottom: '70%',
        // height: '10%'
        // height: '150%',
        // minHeight: 51,
    },
    row: {
        backgroundColor: '#fff',
        flexDirection: 'column',
        alignItems: 'center',
        gap:0,
        height: '99%',
        marginBottom: 4.5,
        borderWidth: 1,
        borderRightWidth: 0,
        borderColor: 'rgba(200, 200, 200, 0.7)',
        borderRadius: 15,
        overflow: 'hidden',
        boxShadow: '1px 1px 3px rgba(103, 103, 103, 0.7)',
        width: '94%',
        paddingBottom: 5
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    scoreText: {
        flex: 1,
        textAlign: 'center',
        alignSelf: 'center',
        fontSize: 16,
        fontWeight: '700',
    },
});
