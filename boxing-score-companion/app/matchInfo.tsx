import React, {useState, useRef, useEffect} from 'react';
import { View, Text, Pressable, StyleSheet, Animated, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import RoundRow from './components/roundRow';

export default function MatchInfoScreen() {
    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const { 
        id,
        fighter1,
        fighter2,
        rounds,
        savedRound,
        savedLeftScore,
        savedRightScore,
        savedScores,
        savedPlusMinus, 
        savedLeftDeductions,
        savedRightDeductions,
        savedLeftKnockdowns,
        savedRightKnockdowns,
    } = useLocalSearchParams();
    
    type RoundScore = {
        left: string;
        right: string;
        plusMinus: string;
        leftDeductions?: string;
        rightDeductions?: string;
        leftKnockdowns?: string;
        rightKnockdowns?: string;
    };

    const [roundScores, setRoundScores] = useState<Record<number, RoundScore>>({});
    const exitProgress = useRef<Animated.Value>(new Animated.Value(0)).current;


    const isLandscape = width > height;
    const scorecardId = id ? Number(String(id)) : undefined;
    const isEditingScorecard = scorecardId !== undefined && !Number.isNaN(scorecardId);
    const selectedRoundCount = Number(rounds || 3);

    useEffect(() => {
        let currentScores: Record<number, RoundScore> = {};

        if (savedScores) {
            try {
                currentScores = JSON.parse(String(savedScores));
            } catch {
                currentScores = {};
            }
        }

        if (savedRound && savedLeftScore !== undefined && savedRightScore !== undefined && savedPlusMinus !== undefined){
            const roundNumber = Number(savedRound);

            currentScores[roundNumber] = {
                left: String(savedLeftScore),
                right: String(savedRightScore),
                plusMinus: String(savedPlusMinus),
                leftDeductions: String(savedLeftDeductions ?? 0),
                rightDeductions: String(savedRightDeductions ?? 0),
                leftKnockdowns: String(savedLeftKnockdowns ?? 0),
                rightKnockdowns: String(savedRightKnockdowns ?? 0),
            };
        }

        setRoundScores(currentScores);
    }, [
        savedScores,
        savedRound,
        savedLeftScore,
        savedRightScore,
        savedPlusMinus,
        savedLeftDeductions,
        savedRightDeductions,
        savedLeftKnockdowns,
        savedRightKnockdowns,
    ]);

    const startLongPressFill = (progress: Animated.Value, duration: number) => {
        progress.setValue(0);
        Animated.timing(progress, {
            toValue: 1.75,
            duration,
            useNativeDriver: false,
        }).start();
    };

    const startLandscapeLongPressFill = (progress: Animated.Value, duration: number) => {
        progress.setValue(0);
        Animated.timing(progress, {
            toValue: 1.7,
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

    const latestScoredRound = Array.from({ length: selectedRoundCount }, (_, index) => index + 1)
        .filter((roundNumber) => isRoundScored(roundNumber))
        .pop();

    const fighter1LatestTotal = latestScoredRound ? String(getTotalScore('left', latestScoredRound)) : '-';
    const fighter2LatestTotal = latestScoredRound ? String(getTotalScore('right', latestScoredRound)) : '-';

    const getScorecardTotals = () => {
        return getSavedRoundScores().reduce(
            (totals, roundScore) => {
                return {
                    fighter1Score: totals.fighter1Score + Number(roundScore.left || 0),
                    fighter2Score: totals.fighter2Score + Number(roundScore.right || 0),
                    fighter1KD: totals.fighter1KD + Number(roundScore.leftKnockdowns || 0),
                    fighter2KD: totals.fighter2KD + Number(roundScore.rightKnockdowns || 0),
                    fighter1Pen: totals.fighter1Pen + Number(roundScore.leftDeductions || 0),
                    fighter2Pen: totals.fighter2Pen + Number(roundScore.rightDeductions || 0),
                };
            },
            {
                fighter1Score: 0,
                fighter2Score: 0,
                fighter1KD: 0,
                fighter2KD: 0,
                fighter1Pen: 0,
                fighter2Pen: 0,
            }
        );
    };

    const getSavedRoundScores = () => {
        const selectedRoundCount = Number(rounds || 3);

        return Array.from({ length: selectedRoundCount }, (_, index) => roundScores[index + 1]).filter(
            (roundScore): roundScore is RoundScore => !!roundScore
        );
    };

    const getSavedScores = () => {
        const selectedRoundCount = Number(rounds || 3);
        const savedRoundScores: Record<number, RoundScore> = {};

        for (let round = 1; round <= selectedRoundCount; round++) {
            if (roundScores[round]) {
                savedRoundScores[round] = roundScores[round];
            }
        }

        return savedRoundScores;
    };

    const scorecardTotals = getScorecardTotals();
    const getTotalEventsText = (knockdowns: number, penalties: number) => {
        const events = [];

        if (knockdowns > 0) {
            events.push(`KD ${knockdowns}`);
        }

        if (penalties > 0) {
            events.push(`PEN ${penalties}`);
        }

        return events.join(' · ');
    };

    const handleSaveScorecard = () => {
        const savedRoundScores = getSavedScores();

        router.push({
            pathname: '/',
            params: {
                savedScorecard: JSON.stringify({
                    id: isEditingScorecard ? scorecardId : Date.now(),
                    fighter1: String(fighter1 || 'Fighter 1'),
                    fighter2: String(fighter2 || 'Fighter 2'),
                    rounds: Number(rounds || 3),
                    savedScores: JSON.stringify(savedRoundScores),
                    ...scorecardTotals,
                }),
            },
        });
    };

    const handleClearRound = (roundNumber: number) => {
        setRoundScores((currentScores) => {
            const nextScores = { ...currentScores };
            delete nextScores[roundNumber];
            return nextScores;
        });
    };

    return (
        <View style={isLandscape ? styles.landscapeContainer : styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={isLandscape ? styles.landscapeTopDescription : styles.topDescription}>
                <Text style={isLandscape ? [styles.landscapeFighterText, styles.landscapeFighter1Name] : [styles.fighterText, styles.fighter1Name]}>{fighter1}</Text>
                <Text style={isLandscape ? [styles.landscapeFighterText, styles.landscapeVsText] : [styles.fighterText, styles.vsText]}>vs</Text>
                <Text style={isLandscape ? [styles.landscapeFighterText, styles.landscapeFighter2Name] : [styles.fighterText, styles.fighter2Name]}>{fighter2}</Text>
            </View>

            <View style={isLandscape ? styles.landscapePointHeader : styles.pointHeader}>
                <Text style={styles.fighter1PointHeader}>{fighter1LatestTotal}</Text>
                <Text style={styles.vsPointHeader}></Text>
                <Text style={styles.fighter2PointHeader}>{fighter2LatestTotal}</Text>
            </View>

            <View style={isLandscape ? styles.landscapeTotalEvents : styles.totalEvents}>
                <Text style={[styles.totalEventsText, styles.fighter1TotalEvents]}>
                    {getTotalEventsText(scorecardTotals.fighter1KD, scorecardTotals.fighter1Pen)}
                </Text>
                <Text style={styles.vsTotalEvents}></Text>
                <Text style={[styles.totalEventsText, styles.fighter2TotalEvents]}>
                    {getTotalEventsText(scorecardTotals.fighter2KD, scorecardTotals.fighter2Pen)}
                </Text>
            </View>

            <View style={isLandscape ? styles.landscapeHeaderRow : styles.headerRow}>
                <Text
                    numberOfLines={1}
                    style={isLandscape ? [styles.landscapeHeaderText, styles.landscapeLeftHeader] : [styles.headerText, styles.leftTotal]}
                >
                    Total
                </Text>
                <Text style={isLandscape ? [styles.landscapeHeaderText, styles.landscapeLeftHeader] : [styles.headerText, styles.leftRound]}>Round</Text>
                
                <Text style={isLandscape ? styles.landscapeHeaderText : styles.headerText}>+/-</Text>
                <Text style={isLandscape ? [styles.landscapeHeaderText, styles.landscapeRightHeader] : [styles.headerText, styles.rightRound]}>Round</Text>
                <Text style={isLandscape ? [styles.landscapeHeaderText, styles.landscapeRightHeader] : [styles.headerText, styles.rightTotal]}>Total</Text>
            </View>
            
            <ScrollView style={isLandscape ? styles.landscapeRowContainer : styles.rowContainer}>
                
                {Array.from({ length: parseInt(rounds as string) }).map((_, index) => {
                    const roundNumber = index + 1;
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
                            leftKds={roundScores[roundNumber]?.leftKnockdowns}
                            leftPen={roundScores[roundNumber]?.leftDeductions}
                            rightKds={roundScores[roundNumber]?.rightKnockdowns}
                            rightPen={roundScores[roundNumber]?.rightDeductions}
                            // savedPlusMinus={savedPlusMinusForRound}
                            fighter1={String(fighter1)}
                            fighter2={String(fighter2)}
                            rounds={String(rounds)}
                            id={id ? String(id) : undefined}
                            savedScores={JSON.stringify(roundScores)}
                            onClearRound={handleClearRound}
                        />
                    );
                })}
            </ScrollView>
            <Pressable 
                style={isLandscape ? styles.landscapeButton : styles.button}
                // onPress={() => router.push('/')}
                onLongPress={handleSaveScorecard}
                onPressIn={() => isLandscape ? startLandscapeLongPressFill(exitProgress, 2000) : startLongPressFill(exitProgress, 4000)}
                onPressOut={() => resetLongPressFill(exitProgress)}
                delayLongPress={2000}
            >
                <Animated.View 
                    style={[styles.fillOverlay, { width: exitProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                <Text style={isLandscape ? styles.landscapeButtonText : styles.buttonText}>
                    {isEditingScorecard ? 'Hold to Save Changes' : 'Hold to Save & Exit Match'}
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#D32F2F',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        overflow: 'hidden',
        alignSelf: 'center',
        alignItems: 'center',
        bottom: 5
    },
    landscapeButton: {
        backgroundColor: '#D32F2F',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        width: '43%',
        // center button in landscape
        alignSelf: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        zIndex: 1
    },
    landscapeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        zIndex: 1
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 18,
        paddingTop: 70
    },
    landscapeContainer: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 24,
        paddingHorizontal: 100
    },
    fighter1Name: {
        color: '#D32F2F',
        textAlign: 'center',
    },
    landscapeFighter1Name: {
        color: '#D32F2F',
        textAlign: 'center',
    },
    fighter2Name: {
        color: '#1976D2',
        textAlign: 'center',
    },
    landscapeFighter2Name: {
        color: '#1976D2',
        textAlign: 'center',
    },
    fighterText: {
        fontSize: 16,
        flex: 1,
        fontWeight: '700',
    },
    landscapeFighterText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        // justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: -6,
        marginHorizontal: 0,
        paddingBottom: 10,
        marginLeft: 18,
        width: '82%'
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
    headerText: {
        flex: 1,
        textAlign: 'center',
        color: '#333',
        fontSize: 12,
        fontWeight: '600',
        width: '17%',
        // marginLeft: '4%'
    },
    landscapeHeaderText: {
        flex: 1,
        textAlign: 'center',
        color: '#333',
        fontSize: 12,
        fontWeight: '600',
    },
    leftHeader: {
        color: 'red',
        width: '45%',
        // marginLeft: 15
    },
    landscapeLeftHeader: {
        color: '#D32F2F',
    },
    leftTotal: {
        marginLeft: 10
    },
    leftRound: {

    },
    rightRound: {

    },
    rightTotal: {

    },
    rightHeader: {
        color: 'blue',
        width: '45%'
    },
    landscapeRightHeader: {
        color: '#1976D2',
    },
    pointHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        width: '85%',
        marginLeft: 21,
    },
    landscapePointHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 3,
        width: '80%',
        alignSelf: 'center',
    },
    fighter1PointHeader: {
        flex: 1,
        color: '#D32F2F',
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
    },
    vsPointHeader: {
        flex: 1,
    },
    fighter2PointHeader: {
        flex: 1,
        color: '#1976D2',
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
    },
    totalEvents: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 25,
        width: '85%',
        marginLeft: 22,
    },
    landscapeTotalEvents: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
        width: '80%',
        alignSelf: 'center',
    },
    totalEventsText: {
        flex: 1,
        color: '#333',
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
    },
    fighter1TotalEvents: {
        color: '#D32F2F',
        width: '45%'
    },
    vsTotalEvents: {
        flex: 1,
    },
    fighter2TotalEvents: {
        color: '#1976D2',
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
        marginBottom: 12,
        width: '85%',
        marginLeft: 21,
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
    fillOverlay: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'black',
        borderRadius: 12,
        opacity: 0.35,
    },
    vsText: {
        color: '#000',
        textAlign: 'center',
        
    },
    landscapeVsText: {
        color: '#000',
        textAlign: 'center',
    },

});
