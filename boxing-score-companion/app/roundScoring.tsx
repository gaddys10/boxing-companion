import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { View, Text, Pressable, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Haptics from 'expo-haptics';

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

    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;

    const startLongPressFill = (progress: Animated.Value, duration: number) => {
        progress.setValue(0);
        Animated.timing(progress, {
            toValue: 1,
            duration,
            useNativeDriver: false,
        }).start();
    };

    const resetLongPressFill = (progress: Animated.Value) => {
        Animated.timing(progress, {
            toValue: 0,
            duration: 100,
            useNativeDriver: false,
        }).start();
    };

    useEffect(() => {
        // Lock to landscape mode
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

        // Cleanup: restore default orientation when leaving screen
        return () => { ScreenOrientation.unlockAsync(); };
    }, []);

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
        
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <Pressable 
                style={styles.leftArea}
                onPress={() => {
                    pulseAnimation(leftPulseAnim);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleScorePress('left');
                }}
                >

                {/* Undo left deductions */}
                <Pressable
                    onPress={() => {
                        pulseAnimation(leftPulseAnim);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleScorePress('left');
                    }}
                    onPressIn={() => startLongPressFill(leftDeductUndoProgress, 2000)}
                    onPressOut={() => resetLongPressFill(leftDeductUndoProgress)}
                    onLongPress={() => {
                        void confirmHaptic();
                        setLeftDeductions((current) => current > 0 ? current - 1 : 0);
                    }}
                    delayLongPress={1500}
                    style={styles.undoDeductLeft}
                >
                    <Animated.View style={[styles.fillOverlayLeft, { width: leftDeductUndoProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '150%'] }) }]} />
                    <Text style={styles.leftEvents}>Deductions: {leftDeductions}</Text>
                    <Text style={styles.leftDedUndo}>Hold to Undo</Text>
                </Pressable>


                <Pressable>
                    <Text style={styles.leftEvents2}>Knockdowns: {leftKnockdowns}</Text>
                    <Text style={styles.leftKdUndo}>Hold to Undo</Text>
                </Pressable>
                { score > 0 &&
                    <Text style={styles.leftScore}>{score}<Ionicons name="caret-back" size={24} color="white" /></Text>
                }
                <Text style={styles.leftName}>{fighter1}</Text>
                <Animated.Text style={[ styles.plusSign, { transform: [{ scale: leftPulseAnim }] }]} >+</Animated.Text>


                {/* Left PEN */}
                <Pressable
                    style={[styles.deductLeft]}
                    onPress={() => {
                        pulseAnimation(leftPulseAnim);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleScorePress('left');
                    }}
                    onPressIn={() => startLongPressFill(leftDeductProgress, 2000)}
                    onPressOut={() => resetLongPressFill(leftDeductProgress)}
                    onLongPress={() => {
                        void confirmHaptic();
                        setLeftDeductions((current) => current + 1);
                    }}
                    delayLongPress={1500}
                >
                    <Animated.View style={[styles.fillOverlayLeft, { width: leftDeductProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '150%'] }) }]} />
                    <Text style={styles.buttonText}>Hold to{"\n"}Deduct</Text>
                </Pressable>

                {/* Left Knockdown  */}
                <Pressable
                    style={[styles.kdButton, styles.leftkd]}
                    onPress={() => {
                        pulseAnimation(leftPulseAnim);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleScorePress('left');
                    }}
                    onPressIn={() => startLongPressFill(leftKdProgress, 2000)}
                    onPressOut={() => resetLongPressFill(leftKdProgress)}
                    onLongPress={() => {
                        void confirmHaptic();
                        setScore((currentScore) => currentScore + 30);
                        setLeftKnockdowns((current) => current + 1);
                    }}
                    delayLongPress={1900}
                >
                    <Animated.View style={[styles.fillOverlay, { width: leftKdProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                    <Text style={styles.buttonText}>Hold for Knockdown</Text>
                </Pressable>
            </Pressable>

            <Pressable style={styles.rightArea} onPress={() => {
                pulseAnimation(rightPulseAnim);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleScorePress('right');
            }}>
                <Text style={styles.rightEvents}>Knockdowns: {rightKnockdowns} &nbsp;&nbsp;&nbsp;&nbsp; Deductions: {rightDeductions}</Text>
                { score < 0 &&
                    <Text style={styles.rightScore}><Ionicons name="caret-forward" size={24} color="white" />{absScore}</Text>
                }
                <Text style={styles.rightName}>{fighter2}</Text>
                <Animated.Text style={[styles.plusSign, { transform: [{ scale: rightPulseAnim }] }]} >+</Animated.Text>


                {/* Right Knockdown */}
                <Pressable
                    style={[styles.kdButton, styles.rightkd, {  height: height * 0.1 }]}
                    onPress={() => {
                        pulseAnimation(rightPulseAnim);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleScorePress('right');
                    }}
                    onPressIn={() => startLongPressFill(rightKdProgress, 2000)}
                    onPressOut={() => resetLongPressFill(rightKdProgress)}
                    onLongPress={() => {
                        void confirmHaptic();
                        setScore((currentScore) => currentScore - 30);
                        setRightKnockdowns((current) => current + 1);
                    }}
                    delayLongPress={1900}
                >
                    <Animated.View style={[styles.fillOverlay, { width: rightKdProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                    <Text style={styles.buttonText}>Hold for Knockdown</Text>
                </Pressable>

                {/* right pen */}
                <Pressable
                    style={[styles.deductRight]}
                    onPress={() => {
                        pulseAnimation(rightPulseAnim);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleScorePress('right');
                    }}
                    onPressIn={() => startLongPressFill(rightDeductProgress, 2000)}
                    onPressOut={() => resetLongPressFill(rightDeductProgress)}
                    onLongPress={() => {
                        void confirmHaptic();
                        setRightDeductions((current) => current + 1);
                    }}
                    delayLongPress={1800}
                >
                    <Animated.View style={[styles.fillOverlay, { width: rightDeductProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '105%'] }) }]} />
                    <Text style={[styles.deductRightText, styles.buttonText]}>Hold to{"\n"}Deduct</Text>
                </Pressable>
            </Pressable>

            {/* Exit  */}
            <Pressable
                style={styles.exitButton}
                onPressIn={() => startLongPressFill(exitProgress, 2000)}
                onPressOut={() => resetLongPressFill(exitProgress)}
                onLongPress={() => {
                    void tripleHaptic(Haptics.ImpactFeedbackStyle.Medium);

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
                delayLongPress={1695}
            >
                <Animated.View style={[styles.fillOverlay, { width: exitProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '106.5%'] }) }]} />
                <Text style={styles.exitButtonText}>Hold to Save & Exit Round {round}</Text>
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
        width: '100%',
        height: '100%',
    },
    description: {
        color: '#333',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 20,
    },
    leftEvents: {
        color: '#000',
        fontSize: 12,
        textAlign: 'center',
    },
    undoDeductLeft: {
        alignItems: 'center',
        backgroundColor: 'gold',
        justifyContent: 'center',
        gap: 2,
        overflow: 'hidden',
        height: 40,
        position: 'absolute',
        left: 50,
        width: '26%',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
    },
    leftDedUndo: {
        color: '#000',
        fontSize: 11,
        textAlign: 'center',
    },
    leftKdUndo: {
        fontSize: 12,
        left: 191,
        top: 8,
        color: '#000'
    },
    deductLeft: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        backgroundColor: 'gold',
        width: 90,
        height: 58,
        paddingLeft: 30,
        paddingTop: 10,
        borderTopRightRadius: 10,
    },
    deductLeftText: {
        //move text to right of box
        marginLeft: 10,
        position: 'absolute',
        textAlign: 'right',
        // top: 8,
        // left: 90,
    },
    deductRight: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'gold',
        width: 90,
        height: 58,
        borderTopLeftRadius: 10,
        overflow: 'hidden',
        paddingLeft: 5,
        paddingTop: 1
    },
    deductRightText: {
        textAlign: 'left',
        top: 8,
        left: 10,
    },
    exitButton: {
        backgroundColor: 'gold',
        width: 225,
        height: 75,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 36,
        top: '-12%',
        left: '45%',
        transform: [{ translateX: -75 }],
        overflow: 'hidden',
    },
    exitButtonText: {   
        color: '#000',
        textAlign: 'center',
        fontSize: 14,
        marginTop: 40,
        zIndex: 1,
    },

    kdButton: {
        position: 'absolute',
        // justifyContent: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        width: 200,
        height: 50,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        transform: [{ translateX: -75 }],
        backgroundColor: 'gold',
        paddingTop: 5,
        overflow: 'hidden',
    },
    leftArea: {
        backgroundColor: '#b63030',
        height: '100%',
        width: '50%',
        position: 'absolute',
    },

    leftEvents2: {
        position: 'absolute',
        color: '#000',
        left: 180,
        top: -11,
        textAlign: 'center',
        
    },
    rightEvents: {
        position: 'absolute',
        color: 'white',
        right: 60,
        textAlign: 'center',
    },
    leftName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 50,
    },

    plusSign: {
        position: 'absolute',
        top: '32%',
        left: '40%',
        transform: [{ translateX: -50 }, { translateY: -50 }],
        fontSize: 120,
        color: 'white',
        fontWeight: 'bold',
    },
    leftkd: {
        bottom: -20,
        left: '50%',
        paddingBottom: 20
    },
    leftScore: {
        position: 'absolute',
        top: 50,
        right: 30,
        color: '#fff',
        fontSize: 24,
        textAlign: 'right'
    },
    rightkd: {
        bottom: -10,
        left: '40%',
        paddingBottom: 10
    },
    rightArea: {
        backgroundColor: '#307Fb6',
        height: '100%',
        width: '50%',
        position: 'absolute',
        right: 0,
    },
    rightName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 50,
    },
    rightScore: {
        position: 'absolute',
        top: 50,
        left: 30,
        color: '#fff',
        fontSize: 24,
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
    }

});
