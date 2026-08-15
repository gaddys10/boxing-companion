import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { router } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons} from '@expo/vector-icons';

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
    stoppageReason?: 'KO' | 'TKO' | 'DQ' | 'NC';
    stoppageWinner?: string;
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
    onMarkStoppage: (roundNumber: number, reason: 'KO' | 'TKO' | 'DQ' | 'NC') => void;
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
    stoppageReason,
    stoppageWinner,
    onClearRound,
    onSaveRound,
    onMarkStoppage,
    onConfirmStoppage,
}: RoundRowProps) {
    const swipeOffset = useSharedValue(0);
    const swipeStartOffset = useSharedValue(0);
    const plusMinusNumber = plusMinus && plusMinus !== '-' ? Number(plusMinus) : null;
    const [scoringModalVisible, setScoringModalVisible] = useState(false);
    const [quickScoringVisible, setQuickScoringVisible] = useState(false);
    const [stoppageModalVisible, setStoppageModalVisible] = useState(false);
    const [selectedStoppageWinner, setSelectedStoppageWinner] = useState<string | undefined>(stoppageWinner);
    const [quickLeftScore, setQuickLeftScore] = useState(10);
    const [quickRightScore, setQuickRightScore] = useState(10);
    const [quickLeftKds, setQuickLeftKds] = useState(0);
    const [quickRightKds, setQuickRightKds] = useState(0);
    const [quickLeftPen, setQuickLeftPen] = useState(0);
    const [quickRightPen, setQuickRightPen] = useState(0);

    const openQuickScoring = () => {
        setQuickLeftScore(Number(leftScore ?? 10));
        setQuickRightScore(Number(rightScore ?? 10));
        setQuickLeftKds(Number(leftKds ?? 0));
        setQuickRightKds(Number(rightKds ?? 0));
        setQuickLeftPen(Number(leftPen ?? 0));
        setQuickRightPen(Number(rightPen ?? 0));
        setQuickScoringVisible(true);
    };

    const closeScoringModal = () => {
        setScoringModalVisible(false);
        setQuickScoringVisible(false);
    };

    const saveQuickScore = () => {
        const hasFullScoringMomentum = !isQuickScore && plusMinus !== undefined && plusMinus !== '' && plusMinus !== '-';

        onSaveRound(roundNumber, {
            left: String(quickLeftScore),
            right: String(quickRightScore),
            plusMinus: hasFullScoringMomentum ? plusMinus : String(quickLeftScore - quickRightScore),
            leftDeductions: String(quickLeftPen),
            rightDeductions: String(quickRightPen),
            leftKnockdowns: String(quickLeftKds),
            rightKnockdowns: String(quickRightKds),
            scoringMethod: hasFullScoringMomentum ? 'full' : 'quick',
        });
        closeScoringModal();
    };

    const plusMinusDisplay =
        plusMinusNumber === null
            ? '-'
            : plusMinusNumber < 0
                ? String(Math.abs(plusMinusNumber))
                : String(plusMinusNumber);

    const plusMinusPillStyle =
        plusMinusNumber === null
            ? [styles.plusMinusPill, styles.neutralPlusMinusPill]
            : plusMinusNumber > 0
                ? [styles.plusMinusPill, styles.redPlusMinusPill]
                : plusMinusNumber < 0
                    ? [styles.plusMinusPill, styles.bluePlusMinusPill]
                    : [styles.plusMinusPill, styles.neutralPlusMinusPill];

    const roundLabelColor =
        stoppageWinner === fighter1
            ? '#D32F2F'
            : stoppageWinner === fighter2
                ? '#1976D2'
                : plusMinusNumber === null
                    ? '#b0b0b0'
                    : plusMinusNumber > 0
                        ? '#D32F2F'
                        : plusMinusNumber < 0
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
                            <View style={styles.scoreSlot}>
                                <Text style={[styles.pairedScoreText, styles.leftTotalScore]}>
                                    {leftTotal ?? '-'}
                                </Text>
                            </View>

                            <View style={styles.scoreSlot}>
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

                        {plusMinusNumber !== null && plusMinusNumber > 0 && (
                            <Ionicons name="caret-up" style={styles.leftTriangle} size={16}/>
                        )}

                        <View style={styles.plusMinusSlot}>
                            <View style={plusMinusPillStyle}>
                                <Text style={styles.plusMinusPillText}>
                                    {isQuickScore && plusMinusNumber !== null
                                        ? '\u00A0'
                                        : plusMinusDisplay}
                                </Text>
                            </View>
                        </View>

                        {plusMinusNumber !== null && plusMinusNumber < 0 && (
                            <Ionicons name="caret-down" style={styles.rightTriangle} size={16} />
                        )}
                        {/* <Text style={[styles.scoreText, styles.rightRoundScore, ]}>{rightScore ?? '-'}</Text>
                        <Text style={[styles.scoreText, styles.rightTotalScore]}>{rightTotal ?? '-'}</Text> */}
                        <View style={styles.scorePair}>
                            <View style={styles.scoreSlot}>
                                <Text style={[styles.pairedScoreText, styles.rightRoundScore]}>
                                    {rightScore ?? '-'}
                                </Text>
                            </View>

                            <View style={styles.scoreSlot}>
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
                        <Pressable
                            style={styles.button}
                            onPress={() => setScoringModalVisible(true)}
                        >
                            <MaterialCommunityIcons
                                name="pencil" size={20}
                                color="#333A3F"
                            />
                        </Pressable>
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
                    <View style={styles.scoringModal}>
                        {!quickScoringVisible ? (
                            <>
                                <Text style={styles.landscapeQuickModalTitle}>Select Scoring Method</Text>
                                <View style={styles.methodRow}>
                                    <View style={styles.methodOption}>
                                        <Pressable style={styles.scoringButton} onPress={openQuickScoring}>
                                            <Text style={styles.scoringButtonText}>Quick Scoring</Text>
                                        </Pressable>
                                        <Text style={styles.modalText}>Score the round in just a few taps!</Text>
                                    </View>
                                    <View style={styles.methodOption}>
                                        <Pressable
                                            style={styles.scoringButton}
                                            onPress={() => {
                                                closeScoringModal();
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
                                                        weight
                                                    },
                                                });
                                            }}
                                        >
                                            <Text style={styles.scoringButtonText}>Full Scoring</Text>
                                        </Pressable>
                                        <Text style={styles.modalText}>Interactive live scoring with momentum tracking</Text>
                                    </View>
                                </View>
                                <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={closeScoringModal}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </Pressable>
                            </>
                        ) : (
                            <>
                                <Text style={styles.quickModalTitle}>Quick Score Round {roundNumber}</Text>
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
                                    <Pressable style={[styles.modalButton, styles.backButton]} onPress={() => setQuickScoringVisible(false)}>
                                        <Text style={styles.backButtonText}>Back</Text>
                                    </Pressable>
                                    <Pressable style={[styles.modalButton, styles.saveButton]} onPress={saveQuickScore}>
                                        <Text style={styles.saveButtonText}>Save Round</Text>
                                    </Pressable>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
            <Modal
                animationType="fade"
                transparent
                visible={stoppageModalVisible}
                supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
                onRequestClose={() => setStoppageModalVisible(false)}
            >
                <View style={styles.stoppageModalOverlay}>
                    <View style={styles.stoppageModalCard}>
                        <Text style={styles.stoppageModalTitle}>Mark Stoppage</Text>
                        <Text style={[styles.stoppageModalText, { textAlign: 'center' }]}>Select why the fight was stopped.</Text>
                        <View style={styles.stoppageOptions}>
                            <View style={styles.stoppageOptionRow}>
                                {(['KO', 'TKO', 'DQ', 'NC'] as const).map((option) => (
                                    <Pressable
                                        key={option}
                                        style={[styles.stoppageOption, stoppageReason === option && styles.selectedStoppageOption]}
                                        onPress={() => {
                                            onMarkStoppage(roundNumber, option);
                                            setSelectedStoppageWinner(undefined);
                                        }}
                                    >
                                        <Text style={[styles.stoppageOptionText, stoppageReason === option && styles.selectedStoppageOptionText]}>{option}</Text>
                                    </Pressable>
                                ))}
                            </View>
                            {/* <View style={styles.stoppageOptionRow}>
                                {(['DQ', 'NC'] as const).map((option) => (
                                    <Pressable
                                        key={option}
                                        style={[styles.stoppageOption, stoppageReason === option && styles.selectedStoppageOption]}
                                        onPress={() => {
                                            onMarkStoppage(roundNumber, option);
                                            setSelectedStoppageWinner(undefined);
                                        }}
                                    >
                                        <Text style={[styles.stoppageOptionText, stoppageReason === option && styles.selectedStoppageOptionText]}>{option}</Text>
                                    </Pressable>
                                ))}
                            </View> */}
                        </View>
                        {(stoppageReason === 'KO' || stoppageReason === 'TKO' || stoppageReason === 'DQ') && (
                            <>
                                <Text style={[styles.stoppageModalText, { textAlign: 'center', marginTop: '10%' }]}>Who won the fight?</Text>
                                <View style={styles.stoppageWinnerOptions}>
                                    {[fighter1, fighter2].map((fighter) => (
                                        <Pressable
                                            key={fighter}
                                            style={[styles.stoppageWinnerOption, selectedStoppageWinner === fighter && styles.selectedStoppageOption]}
                                            onPress={() => setSelectedStoppageWinner(fighter)}
                                        >
                                            <Text style={[styles.stoppageWinnerText, selectedStoppageWinner === fighter && styles.selectedStoppageOptionText]}>{fighter}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </>
                        )}
                        <View style={styles.stoppageModalActions}>
                            <Pressable style={[styles.stoppageModalButton, styles.stoppageCancelButton]} onPress={() => setStoppageModalVisible(false)}>
                                <Text style={styles.stoppageCancelButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.stoppageModalButton, styles.stoppageConfirmButton]}
                                onPress={() => {
                                    if (stoppageReason === 'NC') {
                                        onConfirmStoppage(roundNumber, stoppageReason);
                                        setStoppageModalVisible(false);
                                    } else if (
                                        selectedStoppageWinner &&
                                        (stoppageReason === 'KO' || stoppageReason === 'TKO' || stoppageReason === 'DQ')
                                    ) {
                                        onConfirmStoppage(roundNumber, stoppageReason, selectedStoppageWinner);
                                        setStoppageModalVisible(false);
                                    }
                                }}
                            >
                                <Text style={styles.stoppageConfirmButtonText}>Confirm</Text>
                            </Pressable>
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
    },

    scoreSlot: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },

    pairedScoreText: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '700',
    },

    roundEvents: {
        position: 'absolute',

        // Exact midpoint between the two score slots.
        top: '50%',
        // marginTop: -11,
        

        // left: '3%',
        // right: '3%',
        // height: 20,
        transform: [{ translateY: -10 }],

        height: '22.5%',

        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
    },

    redRoundEvents: {
        backgroundColor: '#D32F2F',
    },

    blueRoundEvents: {
        backgroundColor: '#1976D2',
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
    buttonText: {   
        color: '#333',
    },
    cancelButton: {
        alignSelf: 'center',
        backgroundColor: '#d32f2f',
        marginTop: 12,
        width: 180,
        shadowColor: '#11334b',
        shadowOffset: { width: 2, height: 2 },
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
        fontSize: 10,
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
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    stoppageModalTitle: {
        color: '#333A3F',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    stoppageModalText: {
        color: '#333A3F',
        fontSize: 15,
        lineHeight: 21,
        marginBottom: 20,
    },
    stoppageOptions: { gap: 15, marginTop: 4, alignItems: 'center' },
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
        backgroundColor: '#1976D2',
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
    stoppageModalActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: '10%', gap: 10 },
    stoppageModalButton: { minWidth: 88, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
    stoppageCancelButton: {
        backgroundColor: '#d32f2f',
        shadowColor: '#11334b',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 1,
        borderWidth: 1,
        borderColor: 'rgba(200, 200, 200, 0.7)',
    },
    stoppageConfirmButton: {
        backgroundColor: '#fff',
        shadowColor: '#11334b',
        shadowOffset: { width: 2, height: 2 },
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
        marginTop: 8,
        textAlign: 'center',
    },
    modalTitle: {
        color: '#333A3F',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: '7 %',
        textAlign: 'center',
    },
    landscapeQuickModalTitle: {
        color: '#333A3F',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: '6%',
        textAlign: 'center',
    },
    quickModalTitle: {
        color: '#333A3F',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: '2.5%',
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
        backgroundColor: '#1976D2',
        borderRadius: 12,
        justifyContent: 'center',
        minHeight: 50,
        width: '75%',
        marginBottom: '2.5%',
        shadowColor: '#11334b',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 1,
        borderWidth: 1,
        borderColor: 'rgba(200, 200, 200, 0.7)',
    },
    scoringButtonText: {
        color: '#fff',
        fontSize: 18,
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
        maxHeight: '90%'
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
