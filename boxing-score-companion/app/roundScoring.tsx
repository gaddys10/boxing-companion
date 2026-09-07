import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { View, Text, Pressable, StyleSheet, Animated, useWindowDimensions, Image, Modal, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';

const PORTRAIT_ACTION_CONTROL_HEIGHT = 60;

export default function RoundScoringScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    const round = params.roundNumber;
    const fighter1 = params.fighter1 || 'Fighter 1';
    const fighter2 = params.fighter2 || 'Fighter 2';
    
    const getSavedRound = () => {
        try {
            const savedScores = params.savedScores ? JSON.parse(String(params.savedScores)) : {};
            return savedScores[String(round)] ?? savedScores[Number(round)];
        } catch {
            return undefined;
        }
    };

    const savedRound = getSavedRound();
    const [score, setScore] = useState(Number(savedRound?.plusMinus ?? 0));
    const [leftDeductions, setLeftDeductions] = useState(Number(savedRound?.leftDeductions ?? 0));
    const [rightDeductions, setRightDeductions] = useState(Number(savedRound?.rightDeductions ?? 0));
    const [leftKnockdowns, setLeftKnockdowns] = useState(Number(savedRound?.leftKnockdowns ?? 0));
    const [rightKnockdowns, setRightKnockdowns] = useState(Number(savedRound?.rightKnockdowns ?? 0));
    const [leftScore, setLeftScore] = useState(Number(savedRound?.left ?? 10));
    const [rightScore, setRightScore] = useState(Number(savedRound?.right ?? 10));
    const [tenEightModalVisible, setTenEightModalVisible] = useState(false);
    const [stoppageModalVisible, setStoppageModalVisible] = useState(false);
    const [stoppageReason, setStoppageReason] = useState<'KO' | 'TKO' | 'DQ' | 'NC' | undefined>(savedRound?.stoppageReason);
    const [selectedStoppageWinner, setSelectedStoppageWinner] = useState<string | undefined>(savedRound?.stoppageWinner === 'NC' ? undefined : savedRound?.stoppageWinner);

    const leftPulseAnim = useRef<Animated.Value>(new Animated.Value(1)).current;
    const rightPulseAnim = useRef<Animated.Value>(new Animated.Value(1)).current;
    const leftDeductProgress = useRef<Animated.Value>(new Animated.Value(0)).current;
    const leftDeductUndoProgress = useRef<Animated.Value>(new Animated.Value(0)).current;
    const leftKDUndoProgress = useRef<Animated.Value>(new Animated.Value(0)).current;
    const rightDeductUndoProgress = useRef<Animated.Value>(new Animated.Value(0)).current;
    const rightKDUndoProgress = useRef<Animated.Value>(new Animated.Value(0)).current;

    const leftKdProgress = useRef<Animated.Value>(new Animated.Value(0)).current;
    const rightKdProgress = useRef<Animated.Value>(new Animated.Value(0)).current;
    const rightDeductProgress = useRef<Animated.Value>(new Animated.Value(0)).current;
    const exitProgress = useRef<Animated.Value>(new Animated.Value(0)).current;
    const stoppageProgress = useRef<Animated.Value>(new Animated.Value(0)).current;

    const { width, height } = useWindowDimensions();
    const { isLandscape, insets, sx, scale } = useResponsiveLayout();
    const usableHeight = height - insets.top - insets.bottom;
    const toolbarHeight = Math.max(44, Math.min(50, usableHeight * 0.14));
    const undoHeight = Math.max(38, Math.min(44, usableHeight * 0.13));
    const portraitActionControlHeight = PORTRAIT_ACTION_CONTROL_HEIGHT;
    const portraitSafeInsetFallback = Platform.OS === 'android'
        ? StatusBar.currentHeight ?? 24
        : height >= 812 ? 47 : 20;
    const portraitSafeAreaTop = Math.max(insets.top, portraitSafeInsetFallback);
    const topControlTop = isLandscape ? insets.top : portraitSafeAreaTop;
    const topControlHeight = Math.max(toolbarHeight, undoHeight);
    const portraitExitWidth = Math.min(230 * sx, width * 0.32);
    const portraitRibbonHeight = portraitActionControlHeight;
    const portraitTopGap = Math.max(6, Math.min(10, usableHeight * 0.014));
    const portraitRibbonTierGap = portraitRibbonHeight + portraitTopGap;
    const portraitKnockdownTop = portraitSafeAreaTop;
    const portraitDeductionTop = portraitKnockdownTop + portraitRibbonTierGap;
    const portraitControlsBottom = portraitDeductionTop + portraitRibbonHeight;
    const portraitContentGap = Math.max(10, Math.min(16, usableHeight * 0.022));
    const landscapeTopContentOffset = topControlTop + topControlHeight + Math.max(10, usableHeight * 0.025);
    const topContentOffset = isLandscape
        ? landscapeTopContentOffset
        : portraitControlsBottom + portraitContentGap;
    const landscapeBottomControlHeight = Math.max(44, Math.min(52, usableHeight * 0.12));
    const landscapeEdgeBottomControlWidth = Math.min(150, width * 0.16);
    const landscapeInteriorBottomControlWidth = Math.min(180, width * 0.19);
    const landscapeStoppageBottomControlWidth = Math.min(200, width * 0.21);
    const portraitStoppageWidth = Math.min(180 * sx, width * 0.35);
    const landscapeBottomControlGap = Math.max(0, (
        width
        - (2 * landscapeEdgeBottomControlWidth)
        - (2 * landscapeInteriorBottomControlWidth)
        - landscapeStoppageBottomControlWidth
    ) / 4);
    const landscapeLeftKnockdownCenter = landscapeEdgeBottomControlWidth
        + landscapeBottomControlGap
        + (landscapeInteriorBottomControlWidth / 2);
    const landscapeRightKnockdownCenter = (width / 2) - landscapeLeftKnockdownCenter;
    const landscapeBottomControlStyle = {
        bottom: 0,
        width: landscapeInteriorBottomControlWidth,
        height: landscapeBottomControlHeight,
        transform: [{ translateX: -landscapeInteriorBottomControlWidth / 2 }],
    };
    const landscapeStoppageBottomControlStyle = {
        bottom: 0,
        width: landscapeStoppageBottomControlWidth,
        height: landscapeBottomControlHeight,
        transform: [{ translateX: -landscapeStoppageBottomControlWidth / 2 }],
    };
    const landscapeEdgeBottomControlStyle = {
        bottom: 0,
        width: landscapeEdgeBottomControlWidth,
        height: landscapeBottomControlHeight,
        transform: [{ translateX: 0 }],
    };
    const activeBottomControlHeight = isLandscape ? landscapeBottomControlHeight : portraitActionControlHeight;
    const centerHeight = Math.max(120, height - topContentOffset - insets.bottom - activeBottomControlHeight);
    const scoreBottom = activeBottomControlHeight + Math.max(10, centerHeight * 0.3);
    const landscapeScoreBottom = activeBottomControlHeight + Math.max(10, centerHeight * 0.08);
    const fighterNameTop = isLandscape ? topContentOffset : Math.max(width * 0.5, topContentOffset);

    const plusSignSize = 96 * scale;
    const compact = usableHeight < 370;

    const startLongPressFill = (progress: Animated.Value, duration: number) => {
        progress.setValue(0);
        Animated.timing(progress, {
            toValue: 1,
            duration,
            useNativeDriver: false,
        }).start();
    };

    const resetLongPressFill = (progress: Animated.Value) => {
        progress.setValue(0);
    };

    useEffect(() => {
        if (score > 0) {
            setRightScore(9 - rightDeductions - leftKnockdowns);
            setLeftScore(10 - leftDeductions - rightKnockdowns);
        } else if (score < 0) {
            setLeftScore(9 - leftDeductions - rightKnockdowns);
            setRightScore(10 - rightDeductions - leftKnockdowns);
        } else {
            setLeftScore(10 - leftDeductions - rightKnockdowns);
            setRightScore(10 - rightDeductions - leftKnockdowns);
        }
    }, [score, rightDeductions, leftKnockdowns, leftDeductions, rightKnockdowns]);

    const pulseAnimation = (animation: Animated.Value) => {
        Animated.sequence([
            Animated.timing(animation, {
                toValue: 1.3,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(animation, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const tripleHaptic = async (style: Haptics.ImpactFeedbackStyle) => {
        await Haptics.impactAsync(style);
        await wait(520);
        await Haptics.impactAsync(style);
        await wait(520);
        await Haptics.impactAsync(style);
    };

    const confirmHaptic = async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleScorePress = (side: 'left' | 'right') => {
        setScore((currentScore) => {
            if (side === 'left') { return currentScore + 1; }
            return currentScore - 1;
        });
    };

    const absScore = Math.abs(score);
    const qualifiesForTenEightPrompt =
        absScore >= 35 &&
        leftKnockdowns === 0 &&
        rightKnockdowns === 0 &&
        leftDeductions === 0 &&
        rightDeductions === 0;

    const saveRoundAndExit = (makeTenEight: boolean) => {
        const savedLeftScore = makeTenEight ? (score > 0 ? 10 : 8) : leftScore;
        const savedRightScore = makeTenEight ? (score < 0 ? 10 : 8) : rightScore;

        setTenEightModalVisible(false);
        router.dismissTo({
            pathname: '/matchInfo',
            params: {
                fighter1: params.fighter1,
                fighter2: params.fighter2,
                rounds: params.rounds,
                id: params.id,
                savedScores: params.savedScores,
                gender: params.gender,
                weight: params.weight,
                rating: params.rating,
                description: params.description,
                savedRound: String(round),
                savedLeftScore: String(savedLeftScore),
                savedRightScore: String(savedRightScore),
                savedPlusMinus: String(score),
                savedLeftDeductions: String(leftDeductions),
                savedRightDeductions: String(rightDeductions),
                savedLeftKnockdowns: String(leftKnockdowns),
                savedRightKnockdowns: String(rightKnockdowns),
            },
        });
    };

    const saveStoppageAndExit = () => {
        if (!stoppageReason || (stoppageReason !== 'NC' && !selectedStoppageWinner)) return;

        setStoppageModalVisible(false);
        router.dismissTo({
            pathname: '/matchInfo',
            params: {
                fighter1: params.fighter1,
                fighter2: params.fighter2,
                gender: params.gender,
                weight: params.weight,
                rounds: params.rounds,
                id: params.id,
                savedScores: params.savedScores,
                rating: params.rating,
                description: params.description,
                savedRound: String(round),
                savedStoppageReason: stoppageReason,
                savedStoppageWinner: stoppageReason === 'NC' ? 'NC' : selectedStoppageWinner,
            },
        });
    };

    return (
        
        <View style={[styles.container]}>
            <Stack.Screen options={{ headerShown: false }} />

            <Pressable 
                style={styles.leftArea}
                onPress={() => {
                    pulseAnimation(leftPulseAnim);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleScorePress('left');
                }}
            >
                <Image
                    source={require('../assets/images/bg1.png')}
                    style={[StyleSheet.absoluteFill, styles.leftAreaImage, { opacity: 0.8 }]}
                    resizeMode="cover"
                />

                {/* Undo left deductions */}
                <Pressable
                    onPress={() => {
                        pulseAnimation(leftPulseAnim);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleScorePress('left');
                    }}
                    onPressIn={() => startLongPressFill(leftDeductUndoProgress, 1000)}
                    onPressOut={() => resetLongPressFill(leftDeductUndoProgress)}
                    onLongPress={() => {
                        void confirmHaptic();
                        setLeftDeductions((current) => current > 0 ? current - 1 : 0);
                        resetLongPressFill(leftDeductUndoProgress);
                    }}
                    delayLongPress={1000}
                    style={[
                        isLandscape ? styles.undoDeductLeft : styles.portraitUndoRibbonLeft,
                        {
                            top: isLandscape ? topControlTop : portraitDeductionTop,
                            height: isLandscape ? undoHeight : portraitRibbonHeight,
                        },
                    ]}
                >
                    <LinearGradient
                        colors={['#f7e7a8', '#d7b55d', '#b78c35']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        pointerEvents="none"
                        style={StyleSheet.absoluteFill}
                    />
                    <Animated.View pointerEvents="none" style={[styles.fillOverlayTopLeft, { width: leftDeductUndoProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78} style={isLandscape ? styles.leftEvents : styles.portraitUndoEvent}>Deductions: {leftDeductions}</Text>
                </Pressable>

                {/* undo left knockdowns  */}
                <Pressable
                    onPress={() => {
                        pulseAnimation(leftPulseAnim);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleScorePress('left');
                    }}
                    onPressIn={() => startLongPressFill(leftKDUndoProgress, 1000)}
                    onLongPress={() => {
                        void confirmHaptic();
                        setScore((currentScore) => currentScore <= -70 ? currentScore = -99 : currentScore - 30);
                        setLeftKnockdowns((current) => current > 0 ? current - 1 : 0);
                        resetLongPressFill(leftKDUndoProgress);
                    }}
                    style={[
                        isLandscape ? styles.undoKDLeft : styles.portraitUndoRibbonLeft,
                        {
                            height: isLandscape ? undoHeight : portraitRibbonHeight,
                            top: isLandscape ? topControlTop : portraitKnockdownTop,
                        },
                    ]}
                    delayLongPress={950}
                >
                        <LinearGradient
                            colors={['#f7e7a8', '#d7b55d', '#b78c35']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            pointerEvents="none"
                            style={StyleSheet.absoluteFill}
                        />
                        <Animated.View pointerEvents="none" style={[styles.fillOverlayTopLeft, { width: leftKDUndoProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={isLandscape ? styles.leftEvents2 : styles.portraitUndoEvent}>Knockdowns: {leftKnockdowns}</Text>
                        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={isLandscape ? styles.leftKdUndo : styles.portraitUndoInstruction}>Hold to Undo</Text>
                </Pressable>
                        
                { score > 0 &&
                    <Text style={[styles.leftScore, { bottom: isLandscape ? landscapeScoreBottom : scoreBottom, fontSize: 63 * scale }]}>{score}&nbsp;<Ionicons name="caret-back" size={48 * scale} color="white" /></Text>
                }
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.62} style={[isLandscape? styles.leftName : styles.portraitLeftName, { marginTop: fighterNameTop }, compact && styles.compactName]}>{fighter1}</Text>

                <Animated.Text
                    style={[
                        styles.plusSign,
                        isLandscape
                            ? {
                                top: '50%',
                                fontSize: plusSignSize,
                                lineHeight: plusSignSize,
                                transform: [{ translateY: -plusSignSize / 2 }, { scale: leftPulseAnim }],
                            }
                            : {
                                top: '50%',
                                fontSize: plusSignSize,
                                lineHeight: plusSignSize,
                                transform: [{ translateY: -plusSignSize / 2 }, { scale: leftPulseAnim }],
                            },
                    ]}
                >+</Animated.Text>

                {/* Left PEN */}

                <Pressable
                    style={isLandscape
                        ? [styles.deductLeft, landscapeEdgeBottomControlStyle, { left: 0 }]
                        : styles.portraitDeductLeft}
                    onPress={() => {
                        pulseAnimation(leftPulseAnim);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleScorePress('left');
                    }}
                    onPressIn={() => startLongPressFill(leftDeductProgress, 1000)}
                    onPressOut={() => resetLongPressFill(leftDeductProgress)}
                    onLongPress={() => {
                        void confirmHaptic();
                        setLeftDeductions((current) => current + 1);
                        resetLongPressFill(leftDeductProgress);
                    }}
                    delayLongPress={1000}
                >
                    <LinearGradient
                        colors={['#f7e7a8', '#d7b55d', '#b78c35']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        pointerEvents="none"
                        style={StyleSheet.absoluteFill}
                    />
                    <Animated.View pointerEvents="none" style={[styles.fillOverlayLeft, { width: leftDeductProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                    {isLandscape ? (
                        <Text
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.75}
                            style={[styles.buttonText, styles.deductLeftText]}
                        >
                            Hold to Deduct
                        </Text>
                    ) : (
                        <Text numberOfLines={2} style={[styles.buttonText, styles.portraitDeductText]}>
                            Hold to{"\n"}Deduct
                        </Text>
                    )}
                </Pressable>


                {/* Left Knockdown  */}
                <Pressable
                    style={isLandscape
                        ? [styles.kdButton, styles.leftkd, landscapeBottomControlStyle, { left: landscapeLeftKnockdownCenter }]
                        : [styles.portraitKdButton, styles.portraitLeftKd]}
                    onPress={() => {
                        pulseAnimation(leftPulseAnim);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleScorePress('left');
                    }}
                    onPressIn={() => startLongPressFill(leftKdProgress, 1000)}
                    onPressOut={() => resetLongPressFill(leftKdProgress)}
                    onLongPress={() => {
                        void confirmHaptic();
                        setScore((currentScore) => currentScore >= 70 ? currentScore = 99 : currentScore + 30);
                        setLeftKnockdowns((current) => current + 1);
                        resetLongPressFill(leftKdProgress);
                    }}
                    delayLongPress={1000}
                >
                    <LinearGradient
                        colors={['#f7e7a8', '#d7b55d', '#b78c35']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        pointerEvents="none"
                        style={StyleSheet.absoluteFill}
                    />
                    <Animated.View pointerEvents="none" style={[styles.fillOverlay, { width: leftKdProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                    <Text
                        numberOfLines={isLandscape ? 1 : 2}
                        adjustsFontSizeToFit={isLandscape}
                        minimumFontScale={isLandscape ? 0.62 : undefined}
                        style={[styles.buttonText, !isLandscape && styles.portraitKnockdownText]}
                    >
                        {isLandscape ? 'Hold for Knockdown' : 'Hold for\nKnockdown'}
                    </Text>
                </Pressable>
            </Pressable>

            <Pressable style={styles.rightArea} onPress={() => {
                pulseAnimation(rightPulseAnim);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleScorePress('right');
            }}>
                <Image
                    source={require('../assets/images/bg2.png')}
                    style={[StyleSheet.absoluteFill, styles.rightAreaImage, { opacity: 0.8 }]}
                    resizeMode="cover"
                />

                {/* undo right knockdowns */}
                <Pressable
                    onPress={() => {
                        pulseAnimation(rightPulseAnim);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleScorePress('right');
                    }}
                    onPressIn={() => startLongPressFill(rightKDUndoProgress, 1000)}
                    onPressOut={() => resetLongPressFill(rightKDUndoProgress)}
                    onLongPress={() => {
                        void confirmHaptic();
                        setScore((currentScore) => currentScore + 30);
                        setRightKnockdowns((current) => current > 0 ? current - 1 : 0);
                        resetLongPressFill(rightKDUndoProgress);
                    }}
                    style={[
                        isLandscape ? styles.undoKDright : styles.portraitUndoRibbonRight,
                        {
                            top: isLandscape ? topControlTop : portraitKnockdownTop,
                            height: isLandscape ? undoHeight : portraitRibbonHeight,
                        },
                    ]}
                    delayLongPress={1000}>
                        <LinearGradient
                            colors={['#f7e7a8', '#d7b55d', '#b78c35']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            pointerEvents="none"
                            style={StyleSheet.absoluteFill}
                        />
                        <Animated.View pointerEvents="none" style={[styles.fillOverlayTopLeft, { width: rightKDUndoProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={isLandscape ? styles.rightEvents2 : styles.portraitUndoEvent}>Knockdowns: {rightKnockdowns}</Text>
                        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={isLandscape ? styles.rightKdUndo : styles.portraitUndoInstruction}>Hold to Undo</Text>
                </Pressable>

                { score < 0 &&
                    <Text style={[styles.rightScore, { bottom: isLandscape ? landscapeScoreBottom : scoreBottom, fontSize: 63 * scale }]}><Ionicons name="caret-forward" size={48 * scale} color="white" />&nbsp;{absScore}</Text>
                }

                {/* Undo right deductions */}
                <Pressable
                    onPress={() => {
                        pulseAnimation(rightPulseAnim);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleScorePress('right');
                    }}
                    onPressIn={() => startLongPressFill(rightDeductUndoProgress, 1000)}
                    onPressOut={() => resetLongPressFill(rightDeductUndoProgress)}
                    onLongPress={() => {
                        void confirmHaptic();
                        setRightDeductions((current) => current > 0 ? current - 1 : 0);
                        resetLongPressFill(rightDeductUndoProgress);
                    }}
                    delayLongPress={700}
                    style={[
                        isLandscape ? styles.undoDeductRight : styles.portraitUndoRibbonRight,
                        {
                            top: isLandscape ? topControlTop : portraitDeductionTop,
                            height: isLandscape ? undoHeight : portraitRibbonHeight,
                        },
                    ]}
                >
                    <LinearGradient
                        colors={['#f7e7a8', '#d7b55d', '#b78c35']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        pointerEvents="none"
                        style={StyleSheet.absoluteFill}
                    />
                    <Animated.View pointerEvents="none" style={[styles.fillOverlayTopLeft, { width: rightDeductUndoProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '150%'] }) }]} />
                    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78} style={isLandscape ? styles.rightDedEvents : styles.portraitUndoEvent}>Deductions: {rightDeductions}</Text>
                    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={isLandscape ? styles.leftDedUndo : styles.portraitUndoInstruction}>Hold to Undo</Text>
                </Pressable>

                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.62} style={[isLandscape ? styles.rightName : styles.portraitRightName, { marginTop: fighterNameTop }, compact && styles.compactName]}>{fighter2}</Text>
                <Animated.Text
                    style={[
                        styles.plusSign,
                        isLandscape
                            ? {
                                top: '50%',
                                fontSize: plusSignSize,
                                lineHeight: plusSignSize,
                                transform: [{ translateY: -plusSignSize / 2 }, { scale: rightPulseAnim }],
                            }
                            : {
                                top: '50%',
                                fontSize: plusSignSize,
                                lineHeight: plusSignSize,
                                transform: [{ translateY: -plusSignSize / 2 }, { scale: rightPulseAnim }],
                            },
                    ]}
                >+</Animated.Text>

                {/* Right Knockdown */}
                <Pressable
                    style={isLandscape
                        ? [styles.kdButton, styles.rightkd, landscapeBottomControlStyle, { left: landscapeRightKnockdownCenter }]
                        : [styles.portraitKdButton, styles.portraitRightKd]}
                    onPress={() => {
                        pulseAnimation(rightPulseAnim);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleScorePress('right');
                    }}
                    onPressIn={() => startLongPressFill(rightKdProgress, 1000)}
                    onPressOut={() => resetLongPressFill(rightKdProgress)}
                    onLongPress={() => {
                        void confirmHaptic();
                        setScore((currentScore) => currentScore - 30);
                        setRightKnockdowns((current) => current + 1);
                        resetLongPressFill(rightKdProgress);
                    }}
                    delayLongPress={1000}
                >
                    <LinearGradient
                        colors={['#f7e7a8', '#d7b55d', '#b78c35']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        pointerEvents="none"
                        style={StyleSheet.absoluteFill}
                    />
                    <Animated.View pointerEvents="none" style={[styles.fillOverlay, { width: rightKdProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                    <Text
                        numberOfLines={isLandscape ? 1 : 2}
                        adjustsFontSizeToFit={isLandscape}
                        minimumFontScale={isLandscape ? 0.62 : undefined}
                        style={[styles.buttonText, !isLandscape && styles.portraitKnockdownText]}
                    >
                        {isLandscape ? 'Hold for Knockdown' : 'Hold for\nKnockdown'}
                    </Text>
                </Pressable>

                {/* right pen */}
                <Pressable
                    style={isLandscape
                        ? [styles.deductRight, landscapeEdgeBottomControlStyle, { right: 0 }]
                        : styles.portraitDeductRight}
                    onPress={() => {
                        pulseAnimation(rightPulseAnim);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleScorePress('right');
                    }}
                    onPressIn={() => startLongPressFill(rightDeductProgress, 1000)}
                    onPressOut={() => resetLongPressFill(rightDeductProgress)}
                    onLongPress={() => {
                        void confirmHaptic();
                        setRightDeductions((current) => current + 1);
                        resetLongPressFill(rightDeductProgress);
                    }}
                    delayLongPress={1000}
                >
                    <LinearGradient
                        colors={['#f7e7a8', '#d7b55d', '#b78c35']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        pointerEvents="none"
                        style={StyleSheet.absoluteFill}
                    />
                    <Animated.View pointerEvents="none" style={[styles.fillOverlay, { width: rightDeductProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '105%'] }) }]} />
                    {isLandscape ? (
                        <Text
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.75}
                            style={[styles.buttonText, styles.deductRightText]}
                        >
                            Hold to Deduct
                        </Text>
                    ) : (
                        <Text numberOfLines={2} style={[styles.buttonText, styles.portraitDeductText]}>
                            Hold to{"\n"}Deduct
                        </Text>
                    )}
                </Pressable>

            </Pressable>

            {/* Exit  */}
            <Pressable
                style={[
                    isLandscape ? styles.exitButton : styles.portraitExitButton,
                    {
                        top: topControlTop,
                        width: isLandscape ? 230 * sx : portraitExitWidth,
                        height: isLandscape ? toolbarHeight : portraitActionControlHeight,
                        transform: [{ translateX: isLandscape ? -115 * sx : -portraitExitWidth / 2 }],
                        backgroundColor: '#d7b55d',
                    },
                ]}
                onPressIn={() => startLongPressFill(exitProgress, 1000)}
                onPressOut={() => resetLongPressFill(exitProgress)}
                onLongPress={() => {
                    void tripleHaptic(Haptics.ImpactFeedbackStyle.Medium);
                    resetLongPressFill(exitProgress);
                    if (qualifiesForTenEightPrompt) {
                        setTenEightModalVisible(true);
                        return;
                    }

                    saveRoundAndExit(false);
                }}
                delayLongPress={1000}
            >
            <LinearGradient
                colors={['#f7e7a8', '#d7b55d', '#b78c35']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                pointerEvents="none"
                style={{
                    flex: 1,
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
            <Animated.View
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    backgroundColor: 'black',
                    opacity: 0.35,
                    width: exitProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                    }),
                }}
            />

                {isLandscape ? (
                    <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                        style={styles.exitButtonText}
                    >
                        Hold to Save & Exit Round {round}
                    </Text>
                ) : (
                    <Text style={styles.portraitExitButtonText}>
                        Hold to Save & Exit{"\n"}Round {round}
                    </Text>
                )}
            </LinearGradient>
            </Pressable>

            {/* Mark Stoppage  */}
            <Pressable
                style={isLandscape
                    ? [styles.stoppageButton, landscapeStoppageBottomControlStyle]
                    : [styles.portraitStoppageButton, {
                        width: portraitStoppageWidth,
                        transform: [{ translateX: -portraitStoppageWidth / 2 }],
                    }]}
                onPressIn={() => startLongPressFill(stoppageProgress, 1000)}
                onPressOut={() => resetLongPressFill(stoppageProgress)}
                onLongPress={() => {
                    void tripleHaptic(Haptics.ImpactFeedbackStyle.Medium);
                    resetLongPressFill(stoppageProgress);
                    setStoppageReason(savedRound?.stoppageReason);
                    setSelectedStoppageWinner(savedRound?.stoppageWinner === 'NC' ? undefined : savedRound?.stoppageWinner);
                    setStoppageModalVisible(true);
                }}
                delayLongPress={1000}
            >
                <LinearGradient
                    colors={['#f7e7a8', '#d7b55d', '#b78c35']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    pointerEvents="none"
                    style={StyleSheet.absoluteFill}
                />
                <Animated.View pointerEvents="none" style={[styles.fillOverlay, { width: stoppageProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                {isLandscape ? 
                    <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit={isLandscape}
                        minimumFontScale={isLandscape ? 0.62 : 0.8}
                        style={styles.stoppageButtonText}
                    >
                        Hold to Mark Stoppage
                    </Text>
                : 
                    <Text
                        numberOfLines={2}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                        style={[styles.buttonText, styles.portraitStoppageButtonText]}
                    >
                        Hold to{"\n"}Mark Stoppage
                    </Text>
                }
            </Pressable>

            <Modal
                animationType="fade"
                transparent
                visible={stoppageModalVisible}
                supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
                onRequestClose={() => setStoppageModalVisible(false)}
            >
                <View style={styles.stoppageModalOverlay}>
                    <View style={[styles.stoppageModalCard, { padding: 20 * scale }]}>
                        <Text style={styles.stoppageModalTitle}>Mark Stoppage</Text>
                        <Text style={[styles.stoppageModalText, { textAlign: 'center' }]}>Select why the fight was stopped.</Text>
                        <View style={styles.stoppageOptions}>
                            <View style={styles.stoppageOptionRow}>
                                {(['KO', 'TKO', 'DQ', 'NC'] as const).map((option) => (
                                    <Pressable
                                        key={option}
                                        style={[styles.stoppageOption, stoppageReason === option && styles.selectedStoppageOption]}
                                        onPress={() => {
                                            setStoppageReason(option);
                                            setSelectedStoppageWinner(undefined);
                                        }}
                                    >
                                        <LinearGradient
                                            colors={stoppageReason === option ? ['#5aa7df', '#1976D2'] : ['#f7e7a8', '#d7b55d', '#b78c35']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            pointerEvents="none"
                                            style={StyleSheet.absoluteFill}
                                        />
                                        <Text style={[styles.stoppageOptionText, stoppageReason === option && styles.selectedStoppageOptionText]}>{option}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                        {(stoppageReason === 'KO' || stoppageReason === 'TKO' || stoppageReason === 'DQ') && (
                            <>
                                <Text style={[styles.stoppageModalText, { textAlign: 'center', marginTop: '10%' }]}>Who won the fight?</Text>
                                <View style={styles.stoppageWinnerOptions}>
                                    {[String(fighter1), String(fighter2)].map((fighter) => (
                                        <Pressable
                                            key={fighter}
                                            style={[styles.stoppageWinnerOption, selectedStoppageWinner === fighter && styles.selectedStoppageOption]}
                                            onPress={() => setSelectedStoppageWinner(fighter)}
                                        >
                                            <LinearGradient
                                                colors={selectedStoppageWinner === fighter ? ['#5aa7df', '#1976D2'] : ['#f7e7a8', '#d7b55d', '#b78c35']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                pointerEvents="none"
                                                style={StyleSheet.absoluteFill}
                                            />
                                            <Text style={[styles.stoppageWinnerText, selectedStoppageWinner === fighter && styles.selectedStoppageOptionText]}>{fighter}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </>
                        )}
                        <View style={styles.stoppageModalActions}>
                            <Pressable style={[styles.stoppageModalButton, styles.stoppageCancelButton]} onPress={() => setStoppageModalVisible(false)}>
                                <LinearGradient
                                    colors={['#ef6b6b', '#d32f2f']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    pointerEvents="none"
                                    style={styles.modalButtonGradient}
                                />
                                <Text style={styles.stoppageCancelButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable style={[styles.stoppageModalButton, styles.stoppageConfirmButton]} onPress={saveStoppageAndExit}>
                                <LinearGradient
                                    colors={['#f7e7a8', '#d7b55d', '#b78c35']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    pointerEvents="none"
                                    style={styles.modalButtonGradient}
                                />
                                <Text style={styles.stoppageConfirmButtonText}>Confirm</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="fade"
                transparent
                visible={tenEightModalVisible}
                supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
                onRequestClose={() => setTenEightModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.tenEightModal, { padding: 22 * scale }]}>
                        <Text style={styles.modalTitle}>Make this a 10–8 round?</Text>
                        <Text style={styles.modalText}>
                            This round reached {absScore} momentum points. Would you like the losing fighter to receive 8 points?
                        </Text>
                        <View style={styles.modalActions}>
                            <Pressable style={[styles.modalButton, styles.keepTenNineButton]} onPress={() => saveRoundAndExit(false)}>
                                <LinearGradient
                                    colors={['#f7e7a8', '#d7b55d', '#b78c35']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    pointerEvents="none"
                                    style={styles.modalButtonGradient}
                                />
                                <Text style={styles.keepTenNineButtonText}>No, keep 10–9</Text>
                            </Pressable>
                            <Pressable style={[styles.modalButton, styles.makeTenEightButton]} onPress={() => saveRoundAndExit(true)}>
                                <LinearGradient
                                    colors={['#ef6b6b', '#d32f2f']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    pointerEvents="none"
                                    style={styles.modalButtonGradient}
                                />
                                <Text style={styles.makeTenEightButtonText}>Yes, make it 10–8</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    buttonText: {
        color: '#000',
        zIndex: 1,
    },
    container: {
        flex: 1,
        // backgroundColor: '#fff',
        backgroundColor: '#333A3F',
        flexDirection: 'row',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    tenEightModal: {
        width: 420,
        maxWidth: '90%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 22,
    },
    modalTitle: {
        color: '#111',
        fontSize: 21,
        fontWeight: '700',
        textAlign: 'center',
    },
    modalText: {
        color: '#333',
        fontSize: 15,
        lineHeight: 21,
        marginTop: 10,
        textAlign: 'center',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        minHeight: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        overflow: 'hidden',
    },
    modalButtonGradient: {
        ...StyleSheet.absoluteFill,
        borderRadius: 10,
    },
    keepTenNineButton: {
        backgroundColor: '#EEF1F3',
    },
    keepTenNineButtonText: {
        color: '#333A3F',
        fontWeight: '700',
        textAlign: 'center',
    },
    makeTenEightButton: {
        backgroundColor: '#D32F2F',
    },
    makeTenEightButtonText: {
        color: '#fff',
        fontWeight: '700',
        textAlign: 'center',
    },
    deductLeft: {
        position: 'absolute',
        bottom: 0,
        width: '35%',
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopRightRadius: 15,
        overflow: 'hidden',
        backgroundColor: '#d7b55d',
    },
    portraitDeductLeft: {
        position: 'absolute',
        bottom: '16%',
        left: 0,
        width: "50%",
        height: PORTRAIT_ACTION_CONTROL_HEIGHT,
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#d7b55d',
    },
    deductLeftText: {
        fontSize: 14,
        textAlign: 'center',
        width: '100%',
        marginLeft: '7%'
    },
    portraitDeductText: {
        lineHeight: 18,
        fontSize: 12,
        textAlign: 'center',
    },
    deductRight: {
        position: 'absolute',
        bottom: 0,
        width: '35%',
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 15,
        overflow: 'hidden',
        backgroundColor: '#d7b55d',
    },
    portraitDeductRight: {
        position: 'absolute',
        bottom: '16%',
        right: 0,
        width: "50%",
        height: PORTRAIT_ACTION_CONTROL_HEIGHT,
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#d7b55d',
    },

    deductRightText: {
        fontSize: 14,
        textAlign: 'center',
        width: '100%',
        marginRight: '7%'
    },
    description: {
        color: '#333',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 20,
    },
        
    exitButton: {
        position: 'absolute',
        width: 230,
        maxWidth: '38%',
        minHeight: 44,
        borderBottomRightRadius: 15,
        borderBottomLeftRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        top: 0,
        left: '50%',
        transform: [{ translateX: -115 }],
        overflow: 'hidden',
        zIndex: 5,
    },

    portraitExitButton: {
        position: 'absolute',
        width: 230,
        maxWidth: '32%',
        height: PORTRAIT_ACTION_CONTROL_HEIGHT,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        top: 0,
        left: '50%',
        transform: [{ translateX: -115 }],
        overflow: 'hidden',
        zIndex: 5,
    },
    exitButtonText: {   
        color: '#000',
        textAlign: 'center',
        fontSize: 14,
        marginTop: 0,
        zIndex: 1,
    },
    portraitExitButtonText: {   
        color: '#000',
        textAlign: 'center',
        fontSize: 12,
        marginTop: 0,
        zIndex: 1,
    },

    leftEvents: {
        color: '#000',
        fontSize: 12,
        textAlign: 'center',
    },
    portraitLeftEvents: {
        color: '#000',
        fontSize: 10,
        textAlign: 'center',
    },
    portraitUndoRibbonLeft: {
        position: 'absolute',
        left: 0,
        width: '50%',
        height: PORTRAIT_ACTION_CONTROL_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        paddingHorizontal: 6,
        paddingVertical: 4,
        overflow: 'hidden',
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        backgroundColor: '#d7b55d',
        zIndex: 4,
    },
    portraitUndoRibbonRight: {
        position: 'absolute',
        right: 0,
        backgroundColor: '#d7b55d',
        width: '50%',
        height: PORTRAIT_ACTION_CONTROL_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        paddingHorizontal: 6,
        paddingVertical: 4,
        overflow: 'hidden',
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
        zIndex: 4,
    },
    portraitUndoEvent: {
        width: '100%',
        color: '#000',
        fontSize: 12,
        lineHeight: 14,
        textAlign: 'center',
        zIndex: 1,
    },
    portraitUndoInstruction: {
        width: '100%',
        color: '#000',
        fontSize: 10,
        lineHeight: 13,
        textAlign: 'center',
        zIndex: 1,
    },
    leftDedUndo: {
        color: '#000',
        fontSize: 10,
        textAlign: 'center',
    },
    leftKdUndo: {
        fontSize: 11,
        // left: 191,
        top: 8,
        color: '#000',
    },
    rightKdUndo: {
        fontSize: 11,
        // left: 191,
        top: 8,
        color: '#000',
    },
    undoDeductLeft: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        overflow: 'hidden',
        height: 40,
        position: 'absolute',
        left: '10%',
        width: '26%',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        backgroundColor: '#d7b55d',
    },
    portraitUndoDeductLeft: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        overflow: 'hidden',
        height: 40,
        position: 'absolute',
        left: '0%',
        width: '40%',
        borderRadius: 15,
        backgroundColor: '#d7b55d',
    },
    undoDeductRight: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        overflow: 'hidden',
        height: 40,
        position: 'absolute',
        right: '10%',
        width: '26%',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        backgroundColor: '#d7b55d',
    },
    undoKDLeft: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        overflow: 'hidden',
        position: 'absolute',
        left: '41.5%',
        width: '26%',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        backgroundColor: '#d7b55d',
    },
    undoKDright: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        overflow: 'hidden',
        position: 'absolute',
        right: '41.5%',
        width: '26%',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        backgroundColor: '#d7b55d',
    },
    kdButton: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        width: 150,
        minHeight: 44,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        transform: [{ translateX: -75 }],
        paddingTop: 5,
        overflow: 'hidden',
        backgroundColor: '#d7b55d',
    },
    portraitKdButton: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        width: 150,
        height: PORTRAIT_ACTION_CONTROL_HEIGHT,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        transform: [{ translateX: -75 }],
        overflow: 'hidden',
        backgroundColor: '#d7b55d',
    },
    stoppageButton: {
        position: 'absolute',
        width: 230,
        backgroundColor: '#d7b55d',
        maxWidth: '38%',
        minHeight: 44,
        borderTopRightRadius: 15,
        borderTopLeftRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        bottom: 0,
        left: '50%',
        transform: [{ translateX: -115 }],
        overflow: 'hidden',
        zIndex: 5,
    },
    portraitStoppageButton: {
        position: 'absolute',
        width: 170,
        backgroundColor: '#d7b55d',
        height: PORTRAIT_ACTION_CONTROL_HEIGHT,
        borderTopRightRadius: 15,
        borderTopLeftRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        bottom: 0,
        left: '50%',
        transform: [{ translateX: -90 }],
        overflow: 'hidden',
        zIndex: 5,
    },
    stoppageButtonText: {

    },
    portraitStoppageButtonText: {
        alignSelf: 'center',
        width: '100%',
        fontSize: 12,
        textAlign: 'center',
        textAlignVertical: 'center',
        lineHeight: 16,
        paddingHorizontal: 4,
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
    stoppageModalTitle: { color: '#333A3F', fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
    stoppageModalText: { color: '#333A3F', fontSize: 15, lineHeight: 21, marginBottom: 20 },
    stoppageOptions: { gap: 15, marginTop: 4, alignItems: 'center' },
    stoppageOptionRow: { flexDirection: 'row', gap: 10 },
    stoppageWinnerOptions: { flexDirection: 'row', gap: 15, justifyContent: 'center' },
    stoppageOption: {
        alignItems: 'center', backgroundColor: '#EEF1F3', borderRadius: 10, paddingHorizontal: 16,
        paddingVertical: 8, borderWidth: 1, width: '20%', borderColor: 'rgba(200, 200, 200, 0.7)', justifyContent: 'center', overflow: 'hidden',
    },
    stoppageWinnerOption: {
        alignItems: 'center', backgroundColor: '#EEF1F3', borderRadius: 10, paddingHorizontal: 16,
        paddingVertical: 8, borderWidth: 1, width: '41%', borderColor: 'rgba(200, 200, 200, 0.7)', justifyContent: 'center', overflow: 'hidden',
    },
    selectedStoppageOption: { backgroundColor: '#1976D2' },
    stoppageOptionText: { color: '#333A3F', fontSize: 16, fontWeight: '700' },
    selectedStoppageOptionText: { color: '#fff' },
    stoppageWinnerText: { color: '#333A3F', fontSize: 16, fontWeight: '700', width: '100%', textAlign: 'center' },
    stoppageModalActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: '10%', gap: 10 },
    stoppageModalButton: { minWidth: 88, paddingVertical: 8, borderRadius: 8, alignItems: 'center', overflow: 'hidden' },
    stoppageCancelButton: {
        backgroundColor: '#d32f2f', shadowColor: '#11334b', shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.4, shadowRadius: 1, borderWidth: 1, borderColor: 'rgba(200, 200, 200, 0.7)',
    },
    stoppageConfirmButton: {
        backgroundColor: '#fff', shadowColor: '#11334b', shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.4, shadowRadius: 1, borderWidth: 1, borderColor: 'rgba(200, 200, 200, 0.7)',
    },
    stoppageCancelButtonText: { color: '#fff', fontWeight: '700' },
    stoppageConfirmButtonText: { color: '#1976D2', fontWeight: '700' },
    rightkd: {
        bottom: 0,
        left: '43%',
        paddingBottom: 6
    },
    portraitRightKd: {
        bottom: '8%',
        width: "50%",
        right: 0,
        height: PORTRAIT_ACTION_CONTROL_HEIGHT,
        transform: [{ translateX: 0 }],
        borderTopLeftRadius: 10,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 0,
    },
    portraitKnockdownText: {
        lineHeight: 18,
        textAlign: 'center',
        fontSize: 12
    },
    leftArea: {
        backgroundColor: '#b63030',
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
    },
    leftAreaImage: {
        position: 'absolute',
        left: 0,
        top: -6,
        width: '120%',
        height: '105%',
    },
    rightAreaImage: {
        position: 'absolute',
        right: 0,
        top: -70,
        width: '120%',
        height: '120%',
    },
    leftEvents2: {
        position: 'absolute',
        color: '#000',
        left: 12,
        top: 5,
        textAlign: 'center',
        fontSize: 12
    },
    leftName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 88,
        paddingHorizontal: 18,
    },
    portraitLeftName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: "100%",
        paddingHorizontal: 18,
    },
    leftkd: {
        bottom: 0,
        left: '57%',
        paddingBottom: 6
    },
    portraitLeftKd: {
        bottom: '8%',
        width: "50%",
        left: 0,
        height: PORTRAIT_ACTION_CONTROL_HEIGHT,
        transform: [{ translateX: 0 }],
        borderTopLeftRadius: 0,
        borderTopRightRadius: 10,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 10,
    },
    leftScore: {
        position: 'absolute',
        right: '5%',
        color: '#fff',
        fontSize: 63,
        fontWeight: '700',
        textAlign: 'right'
    },
    rightScore: {
        position: 'absolute',
        left: '5%',
        color: '#fff',
        fontSize: 63,
        fontWeight: '700',
    },
    plusSign: {
        position: 'absolute',
        top: '34%',
        alignSelf: 'center',
        fontSize: 96,
        color: 'white',
        fontWeight: 'bold',
    },
    rightArea: {
        backgroundColor: '#307Fb6',
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
    },
    rightDedEvents: {
        color: '#000',
        fontSize: 12,
        textAlign: 'center',
        zIndex: 1,
    },
    rightEvents: {
        position: 'absolute',
        color: 'white',
        top: 8,
        left: 0,
        right: 0,
        textAlign: 'center',
    },
    rightEvents2: {
        position: 'absolute',
        color: '#000',
        left: 12,
        top: 5,
        textAlign: 'center',
        fontSize: 12
    },

    rightName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 88,
        paddingHorizontal: 18,
    },
    portraitRightName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: "100%",
        paddingHorizontal: 18,
    },

    compactName: {
        fontSize: 20,
    },
    title: {
        color: '#000',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 20,
    },

    fillOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'black',
        opacity: 0.35,
        zIndex: 0
    },
    fillOverlayLeft: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'black',
        opacity: 0.35,
        borderTopRightRadius: 10,
        zIndex: 0

    },
    fillOverlayTopLeft: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'black',
        opacity: 0.35,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 10
    }

});
