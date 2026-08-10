import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { View, Text, Pressable, StyleSheet, Animated, useWindowDimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

    const { height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const usableHeight = height - insets.top - insets.bottom;
    const toolbarHeight = Math.max(44, Math.min(50, usableHeight * 0.14));
    const undoHeight = Math.max(38, Math.min(44, usableHeight * 0.13));
    const bottomControlHeight = Math.max(48, Math.min(56, usableHeight * 0.14));
    const centerHeight = Math.max(120, usableHeight - toolbarHeight - undoHeight - bottomControlHeight);
    const scoreBottom = bottomControlHeight + Math.max(6, centerHeight * 0.04);
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
                    style={[styles.undoDeductLeft, { height: undoHeight }]}
                >
                    <LinearGradient
                        colors={['#f7e7a8', '#d7b55d', '#b78c35']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <Animated.View style={[styles.fillOverlayTopLeft, { width: leftDeductUndoProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                    <Text style={styles.leftEvents}>Deductions: {leftDeductions}</Text>
                    <Text style={styles.leftDedUndo}>Hold to Undo</Text>
                </Pressable>

                {/* undo left knockdowns  */}
                <Pressable
                    onPress={() => {
                        pulseAnimation(leftPulseAnim);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleScorePress('left');
                    }}
                    onPressIn={() => startLongPressFill(leftKDUndoProgress, 1000)}
                    onPressOut={() => resetLongPressFill(leftKDUndoProgress)}
                    onLongPress={() => {
                        void confirmHaptic();
                        setScore((currentScore) => currentScore <= -70 ? currentScore = -99 : currentScore - 30);
                        setLeftKnockdowns((current) => current > 0 ? current - 1 : 0);
                        {/* setScore((currentScore) => currentScore + 30);
                        setRightKnockdowns((current) => current > 0 ? current - 1 : 0); */}
                        resetLongPressFill(leftKDUndoProgress);
                    }}
                    style={[styles.undoKDLeft, { height: undoHeight }]}
                    delayLongPress={950}>
                        <LinearGradient
                            colors={['#f7e7a8', '#d7b55d', '#b78c35']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <Animated.View style={[styles.fillOverlayTopLeft, { width: leftKDUndoProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                        <Text style={styles.leftEvents2}>Knockdowns: {leftKnockdowns}</Text>
                        <Text style={styles.leftKdUndo}>Hold to Undo</Text>
                </Pressable>
                        

                { score > 0 &&
                    <Text style={[styles.leftScore, { bottom: scoreBottom }]}>{score}&nbsp;<Ionicons name="caret-back" size={48} color="white" /></Text>
                }
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.62} style={[styles.leftName, compact && styles.compactName]}>{fighter1}</Text>

                <Animated.Text style={[styles.plusSign, { transform: [{ scale: leftPulseAnim }] }]} >+</Animated.Text>

                {/* Left PEN */}
                <Pressable
                    style={[styles.deductLeft, { height: bottomControlHeight }]}
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
                        style={StyleSheet.absoluteFillObject}
                    />
                    <Animated.View style={[styles.fillOverlayLeft, { width: leftDeductProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                    <Text style={[styles.buttonText, styles.deductLeftText]}>Hold to{"\n"}Deduct</Text>
                </Pressable>

                {/* Left Knockdown  */}
                <Pressable
                    style={[styles.kdButton, styles.leftkd, { height: bottomControlHeight }]}
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
                        style={StyleSheet.absoluteFillObject}
                    />
                    <Animated.View style={[styles.fillOverlay, { width: leftKdProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                    <Text style={styles.buttonText}>Hold for Knockdown</Text>
                </Pressable>
            </Pressable>

            <Pressable style={styles.rightArea} onPress={() => {
                pulseAnimation(rightPulseAnim);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleScorePress('right');
            }}>
                <Image
                    source={require('../assets/images/bg2.png')}
                    style={[StyleSheet.absoluteFillObject, styles.rightAreaImage, { opacity: 0.8 }]}
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
                    style={[styles.undoKDright, { height: undoHeight }]}
                    delayLongPress={1000}>
                        <LinearGradient
                            colors={['#f7e7a8', '#d7b55d', '#b78c35']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <Animated.View style={[styles.fillOverlayTopLeft, { width: rightKDUndoProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                        <Text style={styles.rightEvents2}>Knockdowns: {rightKnockdowns}</Text>
                        <Text style={styles.rightKdUndo}>Hold to Undo</Text>
                </Pressable>

                { score < 0 &&
                    <Text style={[styles.rightScore, { bottom: scoreBottom }]}><Ionicons name="caret-forward" size={48} color="white" />&nbsp;{absScore}</Text>
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
                    style={[styles.undoDeductRight, { height: undoHeight }]}
                >
                    <LinearGradient
                        colors={['#f7e7a8', '#d7b55d', '#b78c35']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <Animated.View style={[styles.fillOverlayTopLeft, { width: rightDeductUndoProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '150%'] }) }]} />
                    <Text style={styles.rightDedEvents}>Deductions: {rightDeductions}</Text>
                    <Text style={styles.leftDedUndo}>Hold to Undo</Text>
                </Pressable>

                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.62} style={[styles.rightName, compact && styles.compactName]}>{fighter2}</Text>
                <Animated.Text style={[styles.plusSign, { transform: [{ scale: rightPulseAnim }] }]} >+</Animated.Text>

                {/* Right Knockdown */}
                <Pressable
                    style={[styles.kdButton, styles.rightkd, { height: bottomControlHeight }]}
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
                        style={StyleSheet.absoluteFillObject}
                    />
                    <Animated.View style={[styles.fillOverlay, { width: rightKdProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                    <Text style={styles.buttonText}>Hold for Knockdown</Text>
                </Pressable>

                {/* right pen */}
                <Pressable
                    style={[styles.deductRight, { height: bottomControlHeight }]}
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
                        style={StyleSheet.absoluteFillObject}
                    />
                    <Animated.View style={[styles.fillOverlay, { width: rightDeductProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '105%'] }) }]} />
                    <Text style={[styles.deductRightText, styles.buttonText]}>Hold to{"\n"}Deduct</Text>
                </Pressable>
            </Pressable>

            {/* Exit  */}
            <Pressable
                style={[styles.exitButton]}
                onPressIn={() => startLongPressFill(exitProgress, 1000)}
                onPressOut={() => resetLongPressFill(exitProgress)}
                onLongPress={() => {
                    void tripleHaptic(Haptics.ImpactFeedbackStyle.Medium);
                    resetLongPressFill(exitProgress);
                    router.replace({
                        pathname: '/matchInfo',
                        params: {
                            fighter1: params.fighter1,
                            fighter2: params.fighter2,
                            rounds: params.rounds,
                            id: params.id,
                            savedScores: params.savedScores,
                            savedRound: String(round),
                            savedLeftScore: String(leftScore),
                            savedRightScore: String(rightScore),
                            savedPlusMinus: String(score),
                            savedLeftDeductions: String(leftDeductions),
                            savedRightDeductions: String(rightDeductions),
                            savedLeftKnockdowns: String(leftKnockdowns),
                            savedRightKnockdowns: String(rightKnockdowns),
                        },
                    });
                }}
                delayLongPress={1000}
            >
                <LinearGradient
                    colors={['#f7e7a8', '#d7b55d', '#b78c35']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                />
                <Animated.View style={[styles.fillOverlay, { width: exitProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.exitButtonText}>Hold to Save & Exit Round {round}</Text>
            </Pressable>
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
        backgroundColor: '#fff',
        flexDirection: 'row',
    },
    deductLeft: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 90,
        height: 58,
        // paddingLeft: ,
        paddingTop: 10,
        borderTopRightRadius: 10,
        overflow: 'hidden',
    },
    deductLeftText: {
        //move text to right of box
        marginLeft: 34,
        marginTop: 10,
        fontSize: 12,
        position: 'absolute',
        textAlign: 'right',
    },
    deductRight: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 90,
        height: 58,
        borderTopLeftRadius: 10,
        overflow: 'hidden',
        paddingLeft: 5,
        paddingTop: 1
    },
    deductRightText: {
        textAlign: 'left',
        top: 10,
        left: 10,
        fontSize: 12,
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
    exitButtonText: {   
        color: '#000',
        textAlign: 'center',
        fontSize: 14,
        marginTop: 0,
        zIndex: 1,
    },
    leftEvents: {
        color: '#000',
        fontSize: 12,
        textAlign: 'center',
    },
    leftDedUndo: {
        color: '#000',
        fontSize: 11,
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
    },
    kdButton: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        width: 150,
        height: 52,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        transform: [{ translateX: -75 }],
        paddingTop: 5,
        overflow: 'hidden',
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
    leftkd: {
        bottom: 0,
        left: '50%',
        paddingBottom: 6
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
    rightkd: {
        bottom: 0,
        left: '50%',
        paddingBottom: 6
    },
    rightName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 88,
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
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'black',
        opacity: 0.35,
    },
    fillOverlayLeft: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'black',
        opacity: 0.35,
        borderTopRightRadius: 10
    },
    fillOverlayTopLeft: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'black',
        opacity: 0.35,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 10
    }

});
