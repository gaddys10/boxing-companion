import React, {useState, useRef, useEffect} from 'react';
import { View, Text, Pressable, StyleSheet, Animated, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import RoundRow from './components/roundRow';

export default function MatchInfoScreen() {
    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const { 
        fighter1,
        fighter2,
        rounds,
        savedRound,
        savedLeftScore,
        savedRightScore,
        savedScores,
        savedPlusMinus, 
    } = useLocalSearchParams();
    
    type RoundScore = {
        left: string;
        right: string;
        plusMinus: string;
    };

    const [roundScores, setRoundScores] = useState<Record<number, RoundScore>>({});
    const [fighter1Name, setFighter1Name] = useState(fighter1);
    const [fighter2Name, setFighter2Name] = useState(fighter2);
    const [selectedRounds, setSelectedRounds] = useState(rounds);
    const [landscape, setLandscape] = useState(false);
    const exitProgress = useRef<Animated.Value>(new Animated.Value(0)).current;


    const isLandscape = width > height;
    useEffect(() => {
        setLandscape(isLandscape);
    }, [height, width, isLandscape]);

    useEffect(() => {
        let currentScores: Record<number, RoundScore> = {};

        if (savedScores) {
            try {
                currentScores = JSON.parse(String(savedScores));
            } catch {
                currentScores = {};
            }
        }

        if (savedRound && savedLeftScore && savedRightScore && savedPlusMinus !== undefined) {
            const roundNumber = Number(savedRound);

            currentScores[roundNumber] = {
                left: String(savedLeftScore),
                right: String(savedRightScore),
                plusMinus: String(savedPlusMinus),
            };
        }

        setRoundScores(currentScores);
    }, [savedScores, savedRound, savedLeftScore, savedRightScore, savedPlusMinus]);

    const startLongPressFill = (progress: Animated.Value, duration: number) => {
        progress.setValue(0);
        Animated.timing(progress, {
            toValue: 1,
            duration,
            useNativeDriver: false,
        }).start();
    };

    const startLandscapeLongPressFill = (progress: Animated.Value, duration: number) => {
        progress.setValue(0);
        Animated.timing(progress, {
            toValue: 1.33,
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

    const isRoundScored = (roundNumber: number) => {
        return !!roundScores[roundNumber]?.left && !!roundScores[roundNumber]?.right;
    };

    const getTotalScore = (side: 'left' | 'right', currentRound: number) => {
        let total = 0;
        for (let round = 1; round <= currentRound; round++) {
            const score = roundScores[round]?.[side];

            if (score) {
                total += Number(score);
            }
        }
        return total || '-';
    };

    const getPlusMinus = (currentRound: number) => {
        const leftTotal = getTotalScore('left', currentRound);
        const rightTotal = getTotalScore('right', currentRound);

        if (leftTotal === '-' || rightTotal === '-') return '-';

        const diff = Number(leftTotal) - Number(rightTotal);

        if (diff > 0) return `+${diff}`;
        if (diff < 0) return String(diff);
        return '0';
    };

    return (
        <View style={isLandscape ? styles.landscapeContainer : styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={isLandscape ? styles.landscapeTopDescription : styles.topDescription}>
                <Text style={isLandscape ? [styles.landscapeFighterText, styles.landscapeFighter1Name] : [styles.fighterText, styles.fighter1Name]}>{fighter1}</Text>
                <Text style={isLandscape ? [styles.landscapeFighterText, styles.landscapeVsText] : [styles.fighterText, styles.vsText]}>vs</Text>
                <Text style={isLandscape ? [styles.landscapeFighterText, styles.landscapeFighter2Name] : [styles.fighterText, styles.fighter2Name]}>{fighter2}</Text>
            </View>
            <View style={isLandscape ? styles.landscapeHeaderRow : styles.headerRow}>
                <Text style={isLandscape ? [styles.landscapeHeaderText, styles.landscapeLeftHeader] : [styles.headerText, styles.leftHeader]}>Round</Text>
                <Text style={isLandscape ? [styles.landscapeHeaderText, styles.landscapeLeftHeader] : [styles.headerText, styles.leftHeader]}>Total</Text>
                <Text style={isLandscape ? styles.landscapeHeaderText : styles.headerText}>+/-</Text>
                <Text style={isLandscape ? [styles.landscapeHeaderText, styles.landscapeRightHeader] : [styles.headerText, styles.rightHeader]}>Total</Text>
                <Text style={isLandscape ? [styles.landscapeHeaderText, styles.landscapeRightHeader] : [styles.headerText, styles.rightHeader]}>Round</Text>
            </View>
            
            <ScrollView style={isLandscape ? styles.landscapeRowContainer : styles.rowContainer}>
                
                {Array.from({ length: parseInt(rounds as string) }).map((_, index) => {
                    const roundNumber = index + 1;
                    const savedPlusMinusForRound = Number(savedRound) === roundNumber && savedPlusMinus ? savedPlusMinus : undefined;

                    return (
                        <RoundRow
                            key={roundNumber}
                            roundNumber={roundNumber}
                            leftScore={roundScores[roundNumber]?.left}
                            rightScore={roundScores[roundNumber]?.right}
                            leftTotal={isRoundScored(roundNumber) ? String(getTotalScore('left', roundNumber)) : '-'}
                            rightTotal={isRoundScored(roundNumber) ? String(getTotalScore('right', roundNumber)) : '-'}
                            // plusMinus={isRoundScored(roundNumber) ? String(getPlusMinus(roundNumber)) : '-'}
                            plusMinus={isRoundScored(roundNumber) ? roundScores[roundNumber]?.plusMinus : '-'}
                            // savedPlusMinus={savedPlusMinusForRound}
                            fighter1={String(fighter1)}
                            fighter2={String(fighter2)}
                            rounds={String(rounds)}
                            savedScores={JSON.stringify(roundScores)}
                        />
                    );
                })}
            </ScrollView>
            <Pressable 
                style={isLandscape ? styles.landscapeButton : styles.button}
                // onPress={() => router.push('/')}
                onLongPress={() => 
                    router.push('/createMatch')
                }
                onPressIn={() => isLandscape ? startLandscapeLongPressFill(exitProgress, 3000) : startLongPressFill(exitProgress, 5000)}
                onPressOut={() => resetLongPressFill(exitProgress)}
                delayLongPress={3000}
            >
                <Animated.View 
                    style={[styles.fillOverlay, { width: exitProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                <Text style={isLandscape ? styles.landscapeButtonText : styles.buttonText}>Hold to Save & Exit Match</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 24,
        paddingTop: 75
    },
    landscapeContainer: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 24,
        paddingHorizontal: 100
    },
    leftHeader: {
        color: 'red'
    },
    rightHeader: {
        color: 'blue'
    },
    rowContainer: {
        flex: 1,
        marginBottom: 16,
        paddingHorizontal: 15,
        marginHorizontal: -24,

    },
    landscapeRowContainer: {
        flex: 1,
        marginBottom: 15,
        marginHorizontal: -24,
        paddingHorizontal: 15,
    },
    title: {
        color: '#000',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 20,
    },
    topDescription: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 50,
        width: '85%',
        marginLeft: 27,
        marginHorizontal: 0,
    },
    landscapeTopDescription: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 25,
        width: '80%',
        alignSelf: 'center',
    },
    fighterText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
    },
    landscapeFighterText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    fighter1Name: {
        color: '#D32F2F',
        textAlign: 'left',
    },
    landscapeFighter1Name: {
        color: '#D32F2F',
        textAlign: 'center',
    },
    vsText: {
        color: '#000',
        textAlign: 'center',
    },
    fighter2Name: {
        color: '#1976D2',
        textAlign: 'right',
    },
    landscapeFighter2Name: {
        color: '#1976D2',
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#D32F2F',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        overflow: 'hidden',
        alignSelf: 'center',
        alignItems: 'center',
        bottom: 25
    },
    landscapeButton: {
        backgroundColor: '#D32F2F',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        width: '30%',
        // center button in landscape
        alignSelf: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        zIndex: 1
    },
    landscapeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        zIndex: 1
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        marginHorizontal: 0,
        paddingBottom: 10,
        marginLeft: 40,
        width: '75%'
    },
    landscapeHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 10,
        width: '77%',
        alignSelf: 'center',
    },
    fillOverlay: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'black',
        borderRadius: 12,
        opacity: 0.35,
    },
    headerText: {
        flex: 1,
        textAlign: 'center',
        color: '#333',
        fontSize: 12,
        fontWeight: '600',
    },
});
