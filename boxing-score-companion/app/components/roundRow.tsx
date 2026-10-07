import React, {useState} from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Image, useWindowDimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import CollapsibleBannerAd from './collapsibleBannerAd';
import StableCenteredModalFrame from './stableCenteredModalFrame';
import { ModalTitleHeader } from './modalCloseButton';
import { usePremium } from '../../contexts/PremiumContext';

const SCORING_MODAL_AD_GAP = 30;
const SCORING_MODAL_AD_FOOTPRINT = 50 + SCORING_MODAL_AD_GAP;

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

export default function RoundRow({
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
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const isLandscape = windowWidth > windowHeight;
    const { isPremium } = usePremium();
    const swipeableRef = React.useRef<Swipeable | null>(null);
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
    const [stoppageModalVisible, setStoppageModalVisible] = useState(false);
    const [draftStoppageReason, setDraftStoppageReason] = useState<RoundRowProps['stoppageReason']>(stoppageReason);
    const [selectedStoppageWinner, setSelectedStoppageWinner] = useState<string | undefined>(stoppageWinner);
    const [quickLeftScore, setQuickLeftScore] = useState(10);
    const [quickRightScore, setQuickRightScore] = useState(10);
    const [quickLeftKds, setQuickLeftKds] = useState(0);
    const [quickRightKds, setQuickRightKds] = useState(0);
    const [quickLeftPen, setQuickLeftPen] = useState(0);
    const [quickRightPen, setQuickRightPen] = useState(0);
    const scoringChoiceHeight = Math.min(110, Math.max(72, windowHeight * 0.129));
    const orientationModalOffset = Math.max(8, Math.min(18, windowHeight * 0.02));
    const scoringMethodModalTitle = quickScoringVisible
        ? `Quick Score Round ${roundNumber}`
        : orientationChoiceVisible
            ? 'Choose Scoring Orientation'
            : 'Select Scoring Method';
    const scoringMethodModalTitleStyle = quickScoringVisible
        ? styles.portraitQuickTitle
        : orientationChoiceVisible
            ? [styles.modalTitle, styles.orientationChoiceTitle]
            : [styles.modalTitle, styles.scoringMethodTitle];

    const openQuickScoring = () => {
        setQuickLeftScore(Number(leftScore ?? 10) + (isQuickScore ? Number(leftPen ?? 0) + Number(rightKds ?? 0) : 0));
        setQuickRightScore(Number(rightScore ?? 10) + (isQuickScore ? Number(rightPen ?? 0) + Number(leftKds ?? 0) : 0));
        setQuickLeftKds(Number(leftKds ?? 0));
        setQuickRightKds(Number(rightKds ?? 0));
        setQuickLeftPen(Number(leftPen ?? 0));
        setQuickRightPen(Number(rightPen ?? 0));
        setQuickScoringVisible(true);
    };

    const openFullScoring = () => {
        setOrientationChoiceVisible(true);
    };

    const cancelStoppageChanges = () => {
        setDraftStoppageReason(stoppageReason);
        setSelectedStoppageWinner(stoppageWinner);
        setStoppageModalVisible(false);
    };

    const startFullScoring = async (
    orientationLock: ScreenOrientation.OrientationLock
    ) => {
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
                weight,
                fightDate,
                rating,
                description,
                scoringOrientation:
                    orientationLock === ScreenOrientation.OrientationLock.PORTRAIT_UP
                        ? 'portrait'
                        : 'landscape',
            },
        });
    };

    const closeScoringModal = () => {
        setScoringModalVisible(false);
        setQuickScoringVisible(false);
        setOrientationChoiceVisible(false);
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

    const plusMinusStyle =
        winnerIndicator === null
            ? styles.plusMinus
            : winnerIndicator > 0
                ? [styles.plusMinus, styles.redPlusMinus]
                : winnerIndicator < 0
                    ? [styles.plusMinus, styles.bluePlusMinus]
                    : styles.plusMinus;

    const plusMinusContainerStyle =
        winnerIndicator === null
            ? [styles.plusMinusContainer, styles.neutralPlusMinusContainer]
            : winnerIndicator > 0
                ? [styles.plusMinusContainer, styles.redPlusMinusContainer]
                : winnerIndicator < 0
                    ? [styles.plusMinusContainer, styles.bluePlusMinusContainer]
                    : [styles.plusMinusContainer, styles.neutralPlusMinusContainer];

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

    const renderRightActions = () => (
        <View style={styles.swipeContainer}>
            <Pressable
                style={styles.stoppageAction}
                onPress={() => {
                    swipeableRef.current?.close();
                    setDraftStoppageReason(stoppageReason);
                    setSelectedStoppageWinner(stoppageWinner);
                    setStoppageModalVisible(true);
                }}
            >
                <Text style={styles.clearActionText}>{'Mark'+'\n'+'Stoppage'}</Text>
            </Pressable>
            <Pressable
                style={styles.clearAction}
                onPress={() => {
                    swipeableRef.current?.close();
                    onClearRound(roundNumber);
                }}
            >
                <Text style={styles.clearActionText}>Clear{"\n"}Round</Text>
            </Pressable>
        </View>
    );

    return (
        <>
            <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false}>
                <View style={styles.row}>
                    <View style={[styles.roundLabelContainer, { backgroundColor: roundLabelColor }]}> 
                        <Text style={styles.roundLabel}>R{roundNumber}</Text>
                    </View>
                    <View style={[styles.scoreCell, styles.leftTotalScoreCell]}>
                        <Text style={[styles.scoreText, styles.leftTotalScore, stoppageWinner === 'NC' && styles.noContestTotalScore]}>{leftTotal ?? '-'}</Text>
                    </View>
                    <View style={[styles.scoreCell, styles.leftRoundScoreCell]}>
                        <Text style={[styles.scoreText, styles.leftRoundScore]}>{leftScore ?? '-'}</Text>
                    </View>

                    {winnerIndicator !== null && winnerIndicator > 0 && (
                        <Ionicons name="caret-back" style={styles.leftTriangle} size={16} />
                    )}
                    <View style={plusMinusContainerStyle}>
                        <Text style={[styles.scoreText, plusMinusStyle]}>
                            {isQuickScore ? '\u00A0' : plusMinusDisplay}
                        </Text>
                    </View>

                    {winnerIndicator !== null && winnerIndicator < 0 && (
                        <Ionicons name="caret-forward" style={styles.rightTriangle} size={16} />
                    )}
                    <View style={[styles.scoreCell, styles.rightRoundScoreCell]}>
                        <Text style={[styles.scoreText, styles.rightRoundScore]}>{rightScore ?? '-'}</Text>
                    </View>
                    <View style={[styles.scoreCell, styles.rightTotalScoreCell]}>
                        <Text style={[styles.scoreText, styles.rightTotalScore, stoppageWinner === 'NC' && styles.noContestTotalScore]}>{rightTotal ?? '-'}</Text>
                    </View>
                    {isAfterStoppage ? (
                        <View style={styles.buttonSpacer} />
                    ) : (
                        <Pressable
                            style={styles.button}
                            onPress={() => {
                                setScoringModalVisible(true);
                            }}
                        >
                            <MaterialCommunityIcons name="pencil" size={20} color="#333A3F" />
                        </Pressable>
                    )}
                </View>
                {
                    (Number(leftKds) > 0 || Number(leftPen) > 0) &&
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
                }
                {    
                    (Number(rightKds) > 0 || Number(rightPen) > 0) &&
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
                }
            </Swipeable>
            <Modal
                animationType="fade"
                transparent
                visible={scoringModalVisible}
                supportedOrientations={[
                    'portrait',
                    'landscape',
                    'landscape-left',
                    'landscape-right',
                ]}
                onRequestClose={closeScoringModal}
            >
                <View style={styles.modalOverlay}>
                    <StableCenteredModalFrame
                        key={quickScoringVisible ? 'quick' : orientationChoiceVisible ? 'orientation' : 'method'}
                    >
                    <View
                        style={
                            quickScoringVisible
                                ? styles.portraitQuickModal
                                : [
                                    styles.selectScoringModal,
                                    orientationChoiceVisible && {
                                        transform: [{ translateY: orientationModalOffset }],
                                    },
                                ]
                        }
                    >
                        <ModalTitleHeader
                            title={scoringMethodModalTitle}
                            titleStyle={scoringMethodModalTitleStyle}
                            accessibilityLabel="Close scoring dialog"
                            onClose={closeScoringModal}
                            isLandscape={isLandscape}
                        />
                        {orientationChoiceVisible ? (
                            <>
                                {/* <Text style={[styles.modalText, styles.orientationPrompt]}>How would you like to score this round?</Text> */}
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Score in portrait mode"
                                    style={[styles.quickScoring, { height: scoringChoiceHeight }]}
                                    onPress={() => startFullScoring(ScreenOrientation.OrientationLock.PORTRAIT_UP)}
                                >
                                    <View style={styles.orientationImageSlot}>
                                        <ExpoImage
                                            source={require('../../assets/images/portrait-optimized.png')}
                                            style={styles.orientationPortraitImage}
                                            resizeMode="contain"
                                            cachePolicy="memory-disk"
                                            transition={0}
                                        />
                                    </View>
                                    <Text style={[styles.quickScoringText, styles.orientationChoiceText]}>Portrait</Text>
                                </Pressable>
                                <Text style={[styles.modalText, styles.orientationPrompt, styles.orientationChoiceDescription]}>
                                    Score the round with momentum tracking using a single hand.
                                </Text>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Score in landscape mode"
                                    style={[styles.fullScoring, { height: scoringChoiceHeight }]}
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
                                    <Text style={[styles.quickScoringText, styles.orientationChoiceText]}>Landscape</Text>
                                </Pressable>
                                <Text style={[styles.modalText, styles.orientationPrompt, styles.orientationChoiceDescription]}>
                                    Recommended way to score rounds with momentum tracking using the Boxing Score Companion.
                                </Text>
                                <Ionicons
                                    name="alert-circle-outline"
                                    size={28}
                                    color="#D99B28"
                                    style={[styles.orientationLockIcon, styles.orientationChoiceIcon]}
                                    accessibilityLabel="Important note"
                                />
                                <Text style={[styles.modalText, styles.orientationPrompt, styles.orientationLockNotice, styles.orientationChoiceDescription]}>
                                    <Text style={styles.orientationLockUnderline}>Orientation lock</Text>{' '}
                                    will be ACTIVE while on the round scoring screen.
                                </Text>
                                <View style={[styles.scoringModalFooter, styles.orientationChoiceFooter]}>
                                <View style={styles.modalActions}>
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel="Back to scoring method selection"
                                        style={[styles.modalButton, styles.cancelButton, styles.scoringFooterButton]}
                                        onPress={() => {
                                            setOrientationChoiceVisible(false);
                                        }}
                                    >
                                        <Text style={styles.cancelButtonText}>Back</Text>
                                    </Pressable>
                                </View>
                                {scoringModalVisible && !isPremium && (
                                    <View style={styles.scoringMethodAdSlot}>
                                        <CollapsibleBannerAd
                                            containerStyle={styles.scoringMethodAdPositioner}
                                            failureMessage="Score orientation banner failed:"
                                        />
                                    </View>
                                )}
                                </View>
                            </>
                        ) : !quickScoringVisible ? (
                            <>
                                <Pressable
                                    style={[styles.quickScoring, { height: scoringChoiceHeight }]}
                                    onPress={openQuickScoring}
                                >
                                    <Ionicons name="flash" size={46} color="#1976D2" style={styles.scoringMethodIcon} />
                                    <Text numberOfLines={1} style={[styles.quickScoringText, styles.scoringMethodText]}>Quick Scoring</Text>
                                </Pressable>
                                <Text style={[styles.modalText, styles.scoringMethodDescription, { textAlign: 'center', marginBottom: 24 }]}>Score the round in just a few taps.</Text>
                                <Pressable 
                                    style={[styles.fullScoring, { height: scoringChoiceHeight }]}
                                    // onPress={() => {
                                    //     closeScoringModal();
                                    //     router.push({
                                    //         pathname: '/roundScoring',
                                    //         params: {
                                    //             roundNumber: String(roundNumber),
                                    //             fighter1,
                                    //             fighter2,
                                    //             rounds,
                                    //             id,
                                    //             savedScores,
                                    //             gender,
                                    //             weight
                                    //         },
                                    //     });
                                    // }}
                                    onPress={openFullScoring}
                                >
                                    <Image
                                        source={require('../../assets/images/portrait-optimized.png')}
                                        style={styles.scoringMethodImage}
                                        resizeMode="contain"
                                    />
                                    <Text style={[styles.quickScoringText, styles.scoringMethodText]}>Full Scoring</Text>
                                </Pressable>
                                <Text style={[styles.modalText, styles.scoringMethodDescription, { textAlign: 'center', marginBottom: 12 }]}>
                                    Use the full, interactive scoring experience with round momentum tracking.</Text>
                                    <Text style={[styles.modalSubtext, styles.scoringMethodDescription, {textAlign: 'center'}]}>
                                    Tap each side of the screen to track punches, pressure, and other meaningful moments throughout the round. {"\n"} {"\n"}
                                    Hold buttons to track knockdowns, deductions, and stoppages.
                                </Text>
                                <View style={[styles.scoringModalFooter, styles.scoringMethodFooter]}>
                                <View style={[styles.modalActions, styles.scoringMethodActions]}>
                                    <Pressable style={[styles.modalButton, styles.cancelButton, styles.scoringFooterButton]} onPress={closeScoringModal}>
                                        <Ionicons name="close" size={18} color="#fff" />
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </Pressable>
                                    <Pressable
                                        accessibilityRole="button"
                                        style={[styles.modalButton, styles.clearRoundButton, styles.scoringFooterButton]}
                                        onPress={() => {
                                            onClearRound(roundNumber);
                                            closeScoringModal();
                                        }}
                                    >
                                        <Text style={styles.cancelButtonText}>Clear Round</Text>
                                    </Pressable>
                                </View>
                                {scoringModalVisible && !isPremium && (
                                    <View style={styles.scoringMethodAdSlot}>
                                        <CollapsibleBannerAd
                                            containerStyle={styles.scoringMethodAdPositioner}
                                            failureMessage="Scoring method banner failed:"
                                        />
                                    </View>
                                )}
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={styles.portraitQuickNameRow}>
                                    <Text numberOfLines={2} style={[styles.portraitQuickName, styles.portraitQuickLeft]}>{fighter1}</Text>
                                    <Text numberOfLines={2} style={[styles.portraitQuickName, styles.portraitQuickRight]}>{fighter2}</Text>
                                </View>
                                <View style={styles.portraitQuickEventSection}>
                                    <Text style={styles.portraitQuickEventLabel}>Round score</Text>
                                    <View style={styles.portraitQuickCornerRow}>
                                        <View style={styles.portraitQuickStepper}>
                                            <Pressable style={styles.portraitQuickStepperButton} onPress={() => setQuickLeftScore((score) => Math.max(0, score - 1))}><Text style={styles.portraitQuickStepperButtonText}>−</Text></Pressable>
                                            <Text style={[styles.portraitQuickStepperValue, styles.portraitQuickLeft]}>{quickLeftScore}</Text>
                                            <Pressable style={styles.portraitQuickStepperButton} onPress={() => setQuickLeftScore((score) => Math.min(10, score + 1))}><Text style={styles.portraitQuickStepperButtonText}>+</Text></Pressable>
                                        </View>
                                        <View style={styles.portraitQuickStepper}>
                                            <Pressable style={styles.portraitQuickStepperButton} onPress={() => setQuickRightScore((score) => Math.max(0, score - 1))}><Text style={styles.portraitQuickStepperButtonText}>−</Text></Pressable>
                                            <Text style={[styles.portraitQuickStepperValue, styles.portraitQuickRight]}>{quickRightScore}</Text>
                                            <Pressable style={styles.portraitQuickStepperButton} onPress={() => setQuickRightScore((score) => Math.min(10, score + 1))}><Text style={styles.portraitQuickStepperButtonText}>+</Text></Pressable>
                                        </View>
                                    </View>
                                </View>
                                
                                {[
                                    { label: 'Knockdowns', left: quickLeftKds, right: quickRightKds, setLeft: setQuickLeftKds, setRight: setQuickRightKds },
                                    { label: 'Point deductions', left: quickLeftPen, right: quickRightPen, setLeft: setQuickLeftPen, setRight: setQuickRightPen },
                                ].map((event) => (
                                    <View key={event.label} style={styles.portraitQuickEventSection}>
                                        <Text style={styles.portraitQuickEventLabel}>{event.label}</Text>
                                        <View style={styles.portraitQuickCornerRow}>
                                            <View style={styles.portraitQuickStepper}>
                                                <Pressable style={styles.portraitQuickStepperButton} onPress={() => event.setLeft(Math.max(0, event.left - 1))}><Text style={styles.portraitQuickStepperButtonText}>−</Text></Pressable>
                                                <Text style={styles.portraitQuickStepperValue}>{event.left}</Text>
                                                <Pressable style={styles.portraitQuickStepperButton} onPress={() => event.setLeft(event.left + 1)}><Text style={styles.portraitQuickStepperButtonText}>+</Text></Pressable>
                                            </View>
                                            <View style={styles.portraitQuickStepper}>
                                                <Pressable style={styles.portraitQuickStepperButton} onPress={() => event.setRight(Math.max(0, event.right - 1))}><Text style={styles.portraitQuickStepperButtonText}>−</Text></Pressable>
                                                <Text style={styles.portraitQuickStepperValue}>{event.right}</Text>
                                                <Pressable style={styles.portraitQuickStepperButton} onPress={() => event.setRight(event.right + 1)}><Text style={styles.portraitQuickStepperButtonText}>+</Text></Pressable>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                                <View style={styles.portraitQuickActions}>
                                    <Pressable
                                        style={[styles.modalButton, styles.cancelButton, styles.portraitQuickActionButton]}
                                        onPress={() => {
                                            setQuickScoringVisible(false);
                                        }}
                                    >
                                        <Text style={styles.cancelButtonText}>Back</Text>
                                    </Pressable>
                                    <Pressable style={[styles.modalButton, styles.saveQuickButton, styles.portraitQuickActionButton]} onPress={saveQuickScore}>
                                        <Text style={styles.saveQuickButtonText}>Save Round</Text>
                                    </Pressable>
                                </View>
                                {scoringModalVisible && quickScoringVisible && !isPremium && (
                                    <CollapsibleBannerAd
                                        containerStyle={styles.quickScoringAdPositioner}
                                        failureMessage="Quick scoring banner failed:"
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
                onRequestClose={cancelStoppageChanges}
            >
                <View style={styles.stoppageModalOverlay}>
                    <StableCenteredModalFrame>
                    <View style={styles.stoppageModalCard}>
                        <ModalTitleHeader
                            title="Mark Stoppage"
                            titleStyle={styles.stoppageModalTitle}
                            accessibilityLabel="Close stoppage dialog"
                            onClose={cancelStoppageChanges}
                            isLandscape={isLandscape}
                        />
                        <Text style={[styles.stoppageModalText, {textAlign: 'center'}]}>Select why the fight was stopped.</Text>
                        <View style={styles.stoppageOptions}>
                            <View style={styles.stoppageOptionTopRow}>
                                <Pressable
                                        style={[styles.stoppageOption, draftStoppageReason === 'KO' && styles.selectedStoppageOption]}
                                        onPress={() => {
                                            setDraftStoppageReason('KO');
                                            setSelectedStoppageWinner(undefined);
                                            // setStoppageModalVisible(false);
                                        }}
                                    >
                                        <Text style={[styles.stoppageOptionText, draftStoppageReason === "KO" && styles.selectedStoppageOptionText]}>KO</Text>
                                </Pressable>
                                    <Pressable
                                        style={[styles.stoppageOption, draftStoppageReason === 'TKO' && styles.selectedStoppageOption]}
                                        onPress={() => {
                                            setDraftStoppageReason('TKO');
                                            setSelectedStoppageWinner(undefined);
                                            // setStoppageModalVisible(false);
                                        }}
                                    >
                                        <Text style={[styles.stoppageOptionText, draftStoppageReason === "TKO" && styles.selectedStoppageOptionText]}>TKO</Text>
                                </Pressable>
                            </View>
                            <View style={styles.stoppageOptionBottomRow}>
                                <Pressable
                                        style={[styles.stoppageOption, draftStoppageReason === 'DQ' && styles.selectedStoppageOption]}
                                        onPress={() => {
                                            setDraftStoppageReason('DQ');
                                            setSelectedStoppageWinner(undefined);
                                            // setStoppageModalVisible(false);
                                        }}
                                    >
                                        <Text style={[styles.stoppageOptionText, draftStoppageReason === "DQ" && styles.selectedStoppageOptionText]}>DQ</Text>
                                </Pressable>
                                    <Pressable
                                        style={[styles.stoppageOption, draftStoppageReason === 'NC' && styles.selectedStoppageOption]}
                                        onPress={() => {
                                            setDraftStoppageReason('NC');
                                            setSelectedStoppageWinner(undefined);
                                            // setStoppageModalVisible(false);
                                        }}
                                    >
                                        <Text style={[styles.stoppageOptionText, draftStoppageReason === "NC" && styles.selectedStoppageOptionText]}>NC</Text>
                                </Pressable>
                            </View>
                        </View>
                        {(draftStoppageReason === 'KO' || draftStoppageReason === 'TKO' || draftStoppageReason === 'DQ') && (
                            <>
                                <Text style={[styles.stoppageModalText, {textAlign: 'center'}, {marginTop: '10%'}]}>Who won the fight?</Text>
                                <View style={styles.stoppageWinnerOptions}>
                                    <Pressable
                                        style={[styles.stoppageOption, selectedStoppageWinner === fighter1 && styles.selectedStoppageOption]}
                                        onPress={() => setSelectedStoppageWinner(fighter1)}
                                    >
                                        <Text style={[styles.stoppageWinnerText, selectedStoppageWinner === fighter1 && styles.selectedStoppageOptionText]}>{fighter1}</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.stoppageOption, selectedStoppageWinner === fighter2 && styles.selectedStoppageOption]}
                                        onPress={() => setSelectedStoppageWinner(fighter2)}
                                    >
                                        <Text style={[styles.stoppageWinnerText, selectedStoppageWinner === fighter2 && styles.selectedStoppageWinnerText]}>{fighter2}</Text>
                                    </Pressable>
                                </View>
                            </>
                        )}
                        <View style={styles.stoppageModalActions}>
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
                        {stoppageModalVisible && !isPremium && (
                            <CollapsibleBannerAd
                                containerStyle={styles.stoppageAdPositioner}
                                failureMessage="Match info stoppage banner failed:"
                            />
                        )}
                    </View>
                    </StableCenteredModalFrame>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    stoppageModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    stoppageWinnerOptions: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center'
    },
    stoppageOptionTopRow: {
        flexDirection: 'row',
        gap: 10
    },
    stoppageOptionBottomRow: {
        flexDirection: 'row',
        gap: 10
    },
    stoppageModalCard: {
        width: '100%',
        maxWidth: 340,
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
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        paddingHorizontal: 24,
        textAlign: 'center',
    },
    stoppageModalText: {
        color: '#333A3F',
        fontSize: 15,
        lineHeight: 21,
        marginBottom: 20,
    },
    stoppageModalActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: '10%',
        gap: 10
    },
    stoppageAdPositioner: {
        alignItems: 'center',
        marginTop: 18,
        width: '100%',
    },
    stoppageModalButton: {
        minWidth: 88,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    stoppageCancelButton: {
        backgroundColor: '#d32f2f',
        marginLeft: 0,
        boxShadow: '4',
        shadowColor: '#11334b',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 1,
        borderWidth: 1,
        borderColor: 'rgba(200, 200, 200, 0.7)',
    },
    stoppageConfirmButton: {
        backgroundColor: '#fff',
        marginLeft: 0,
        boxShadow: '4',
        shadowColor: '#11334b',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 1,
        borderWidth: 1,
        borderColor: 'rgba(200, 200, 200, 0.7)',
    },
    stoppageConfirmButtonText: {
        color: '#1976D2',
        fontWeight: '700'
    },
    stoppageCancelButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    stoppageOptions: {
        gap: 15,
        marginTop: 4,
        alignItems: 'center'
    },
    stoppageOption: {
        alignItems: 'center',
        backgroundColor: '#EEF1F3',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        width: '48%',
        borderColor: 'rgba(200, 200, 200, 0.7)',
        justifyContent: 'center'

    },
    selectedStoppageOption: {
        backgroundColor: '#1976D2',
    },
    stoppageOptionText: {
        color: '#333A3F',
        fontSize: 16,
        fontWeight: '700',
    },
    stoppageWinnerText: {
        color: '#333A3F',
        fontSize: 16,
        fontWeight: '700',
        width: '100%',
        textAlign: 'center',
    },

    selectedStoppageOptionText: {
        color: '#fff',
    },
    selectedStoppageWinnerText: {
        color: '#fff',
    },
    quickScoring: {
        width: '75%',
        alignSelf: 'center',
        backgroundColor: '#fff',
        flexDirection: 'row',
        gap: 8,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '5%',
        boxShadow: '4',
        shadowColor: '#11334b',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 1,
        borderWidth: 1,
        borderColor: 'rgba(200, 200, 200, 0.7)',
    },
    quickScoringText: {
        fontSize: 18,
        fontWeight: 700,
        color: '#1976D2'
    },
    scoringMethodImage: {
        width: 56,
        height: 56,
    },
    scoringMethodIcon: {
        width: 56,
        textAlign: 'center',
    },
    scoringMethodText: {
        width: 130,
        textAlign: 'left',
    },
    orientationPortraitImage: {
        width: 56,
        height: 56,
    },
    orientationLandscapeImage: {
        width: 73,
        height: 48,
    },
    orientationImageSlot: {
        width: 73,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    orientationChoiceText: {
        width: 100,
        textAlign: 'left',
    },
    portraitQuickModal: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    portraitQuickTitle: {
        color: '#333A3F',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: '10%',
        textAlign: 'center',
    },
    portraitQuickCornerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    portraitQuickNameRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: '4%'
    },
    portraitQuickName: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 17,
        minHeight: 34,
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    portraitQuickLeft: {
        color: '#D32F2F',
    },
    portraitQuickRight: {
        color: '#1976D2',
    },
    portraitQuickEventSection: {
        marginBottom: 22,
    },
    portraitQuickEventLabel: {
        color: '#333A3F',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    portraitQuickStepper: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        width: '48%',
    },
    portraitQuickStepperButton: {
        alignItems: 'center',
        backgroundColor: '#EEF1F3',
        borderRadius: 8,
        height: 34,
        justifyContent: 'center',
        width: 34,
    },
    portraitQuickStepperButtonText: {
        color: '#333A3F',
        fontSize: 20,
        fontWeight: '700',
    },
    portraitQuickStepperValue: {
        color: '#333A3F',
        fontSize: 20,
        fontWeight: '700',
        minWidth: 34,
        textAlign: 'center',
    },
    portraitQuickActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: '5%',
    },
    portraitQuickActionButton: {
        flex: 1,
        marginLeft: 0,
        width: 'auto',
    },
    quickScoringAdPositioner: {
        alignItems: 'center',
        marginTop: 26,
        width: '100%',
    },
    fullScoring: {
        width: '75%',
        alignSelf: 'center',
        backgroundColor: '#fff',
        flexDirection: 'row',
        gap: 8,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '4',
        shadowColor: '#11334b',
        shadowOffset: { width: 5, height: 5 },
        borderWidth: 1,
        borderColor: 'rgba(200, 200, 200, 0.7)',
        shadowOpacity: 0.4,
        shadowRadius: 1,
        marginBottom: '5%',
    },
    cancelButton: {
        backgroundColor: '#d32f2f',
        boxShadow: '4',
        shadowColor: '#11334b',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 1,
    },
    confirmDeleteButton: {
        backgroundColor: '#d32f2f',
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    scoringMethodAdPositioner: {
        width: '100%',
        alignItems: 'center',
        marginTop: SCORING_MODAL_AD_GAP,
    },
    scoringMethodAdSlot: {
        width: '100%',
        height: SCORING_MODAL_AD_FOOTPRINT,
        justifyContent: 'flex-end',
    },
    scoringModalFooter: {
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: 20,
        alignItems: 'center',
    },
    scoringMethodTitle: {
        marginBottom: 16,
    },
    scoringMethodDescription: {
        marginBottom: 12,
    },
    scoringMethodFooter: {
        position: 'relative',
        left: 0,
        right: 0,
        bottom: 0,
        marginTop: 12,
    },
    orientationChoiceFooter: {
        position: 'relative',
        left: 0,
        right: 0,
        bottom: 0,
        marginTop: 12,
    },
    scoringFooterButton: {
        flex: 1,
        width: 'auto',
        maxWidth: 180,
        minHeight: 42,
        marginLeft: 0,
    },
    scoringMethodActions: {
        width: '100%',
        gap: 12,
    },
    clearRoundButton: {
        backgroundColor: '#000',
        boxShadow: '4',
        shadowColor: '#11334b',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 1,
    },
    saveQuickButton: {
        backgroundColor: '#1976D2',
        boxShadow: '4',
        shadowColor: '#11334b',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 1
    },
    saveQuickButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    deleteModal: {
        width: '100%',
        height: '66%',
        maxWidth: 340,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    selectScoringModal: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
        position: 'relative',
    },
    modalTitle: {
        color: '#333A3F',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: '11%',
        paddingHorizontal: 24,
        textAlign: 'center'
    },
    modalText: {
        color: '#333A3F',
        fontSize: 14,
        lineHeight: 17,
        marginBottom: '10%',
    },
    modalSubtext: {
        color: '#333A3F',
        fontSize: 10,
        lineHeight: 17,
        marginBottom: '10%',
    },
    orientationPrompt: {
        textAlign: 'center',
    },
    orientationChoiceTitle: {
        marginBottom: 16,
    },
    orientationChoiceDescription: {
        marginBottom: 8,
    },
    orientationLockNotice: {
        fontWeight: '700',
        fontSize: 14
    },
    orientationLockIcon: {
        alignSelf: 'center',
        marginBottom: 8,
    },
    orientationChoiceIcon: {
        marginBottom: 4,
    },
    orientationLockUnderline: {
        textDecorationLine: 'underline',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    modalButton: {
        minWidth: 88,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        marginLeft: 10,
    },
    bluePlusMinus: {
        color: '#fff',
    },
    bluePlusMinusContainer: {
        backgroundColor: '#1976D2',
    },
    button: {
        backgroundColor: 'white',
        marginRight: 5,
        paddingHorizontal: 8,
        marginTop: 2,
        paddingVertical: 5,
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
    clearAction: {
        alignItems: 'center',
        backgroundColor: '#bc1616',
        justifyContent: 'center',
        // marginBottom: 5,
        paddingHorizontal: 0,
        height: '85%',
        marginRight: 4,
        marginTop: 2,
        borderRadius: 12,
        width: 70,
    },
    clearActionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
    stoppageAction: {
        alignItems: 'center',
        backgroundColor: '#000',
        justifyContent: 'center',
        // marginBottom: 5,
        paddingHorizontal: 0,
        height: '85%',
        marginRight: 4,
        marginTop: 2,
        borderRadius: 12,
        width: 70,
    },
    leftRoundScore: {
        color: '#D32F2F',
        flex: 0,
    },
    leftTotalScore: {
        color: '#D32F2F',
        flex: 0,
    },
    leftTotalScoreCell: {
        // backgroundColor: '#D9F0FF',
    },
    leftRoundScoreCell: {
        // backgroundColor: '#DDF5E3',
    },
    leftTriangle: {
        position: 'absolute',
        left: '41.5%',
        // height: 26,
        top: '30.5%',
        color: "#d32f2f"
    },
    rightTriangle: {
        position: 'absolute',
        left: '54%',
        top: '30.5%',
        height: 14,
        color: "#1976D2"
    },
    plusMinus: {
        color: '#fff',
        fontSize: 14,
        flex: 0,
    },
    swipeContainer: {
        flexDirection: 'row'
    },
    plusMinusContainer: {
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2,
        minHeight: 24,
        minWidth: 34,
        marginHorizontal: 4,
    },
    neutralPlusMinusContainer: {
        backgroundColor: '#b0b0b0',
    },
    redPlusMinus: {
        color: '#fff',
    },
    redPlusMinusContainer: {
        backgroundColor: '#D32F2F',
    },
    rightTotalScore: {
        color: '#1976D2',
        marginLeft: 0,
        flex: 0,
    },
    noContestTotalScore: {
        color: '#808080',
    },
    scoreCell: {
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    rightTotalScoreCell: {
    },
    rightRoundScore: {
        color: '#1976D2',
        flex: 0,
    },
    rightRoundScoreCell: {
    },
    roundEvents: {
        position: 'absolute',
        left: '24.65%',
        height: '90%',
        borderColor: "#000",
        width: '5.75%',
        shadowOffset: {height: 5, width: 0},
        boxShadow: '1px 2px 2px rgba(103, 103, 103, 0.4)',
        justifyContent: 'center',
        backgroundColor: "#D32F2F",
        alignItems: 'center',
        color: '#fff'
    },
    roundEvents2: {
        position: 'absolute',
        left: '67.85%',
        backgroundColor: "#1976D2",
        alignItems: 'center',
        shadowOffset: {height: 5, width: 0},
        boxShadow: '0px 2px 2px rgba(103, 103, 103, 0.4)',
        height: '90%',
        width: '5.75%',
        justifyContent: 'center'
    },
    roundEventsText: {
        fontSize: 7.5,
        color: '#fff',
        fontWeight: 600
    },
    roundLabel: {
        width: 40,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    roundLabelContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 0,
        borderTopLeftRadius: 15,
        borderBottomLeftRadius: 15,
        height: '150%',
    },
    row: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 40,
        marginBottom: 4.5,
        marginHorizontal: '.5%',
        marginRight: '2%',
        borderWidth: 1,
        borderBottomWidth: 0,
        borderColor: 'rgba(200, 200, 200, 0.7)',
        borderRadius: 15,
        // paddingVertical: 2,
        overflow: 'hidden',
        boxShadow: '1px 1px 3px rgba(103, 103, 103, 0.7)',
        height: 40,
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
