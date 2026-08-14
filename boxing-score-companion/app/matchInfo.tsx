import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import LandscapeRoundRow from './components/landscapeRoundRow';
import RoundRow from './components/roundRow';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';

export default function MatchInfoScreen() {
    const router = useRouter();
    const { isLandscape, insets, sx, sy, horizontalGutter } = useResponsiveLayout();
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
        savedStoppageReason,
        savedStoppageWinner,
        gender,
        weight
    } = useLocalSearchParams();
    
    type RoundScore = {
        left: string;
        right: string;
        plusMinus: string;
        leftDeductions?: string;
        rightDeductions?: string;
        leftKnockdowns?: string;
        rightKnockdowns?: string;
        scoringMethod?: 'quick' | 'full';
        stoppageReason?: 'KO' | 'TKO' | 'DQ' | 'NC';
        stoppageWinner?: string;
    };

    const [roundScores, setRoundScores] = useState<Record<number, RoundScore>>({});

    const shareDescriptions = ['bloody', 'boring', 'chess match', 'competitive', 'one sided',
        'exciting', 'headbutts', 'ugly', 'replayable', 'low blows', 'slugfest', 'brutal', 'showcase', 'war',
        'robbery', 'debut', 'upset', 'high level', 'shut out', 'holding', 'brawl', 'clean', 'competitive early',
        'height difference', 'reach difference', 'home fight', 'adjustments', 'jabs', 'hooks', 'uppercuts',
        'overhands', 'crosses', 'high volume', 'low volume', 'counterpunches', 'crowd engagement', 'showboating',
        'walkouts', 'bad ref', 'good ref', 'bad commentary', 'good commentary', 'small ring', 'big ring', 
        'inside fighting', 'injury', 'quitter', 'towel', 'ref stoppage', 'close fight', 'out cold', 'rematch needed',
        'bad coaching', 'good coaching', 'funny moment', 'street fight', 'sparring', 'slow start', 'fast start', 
        'technical', 'tactical', 'high paced', 'slow paced', 'methodical', 'scrappy', 'rough', 'dirty fight', 'clinic',
        'masterclass', 'mismatch', 'body work', 'combinations', 'power punching', 'pressure', 'volume punching', 'jab heavy',
        'defensive', 'cuts', 'swelling', 'flash knockdown', 'controversial', 'gassed', 'power difference', 'speed differene',
        'short notice', 'hostile crowd', 'dead crowd', 'loud crowd', 'experience difference', 'gassed', 'chin', 'distance management',
        'switch hitting', 'feints', 'late rally', 'back and forth', 'favorite', "Sweet Carolina", "There's only one! ", 
    ]


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
                scoringMethod: 'full',
            };
        } else if (savedRound && savedStoppageReason) {
            const roundNumber = Number(savedRound);

            currentScores[roundNumber] = {
                left: '',
                right: '',
                plusMinus: '',
                leftDeductions: '0',
                rightDeductions: '0',
                leftKnockdowns: '0',
                rightKnockdowns: '0',
                stoppageReason: String(savedStoppageReason) as RoundScore['stoppageReason'],
                stoppageWinner: String(savedStoppageWinner),
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
        savedStoppageReason,
        savedStoppageWinner,
    ]);

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
        .filter((roundNumber) => isRoundScored(roundNumber) || Boolean(roundScores[roundNumber]?.stoppageWinner))
        .pop();

    const latestRoundScore = latestScoredRound ? roundScores[latestScoredRound] : undefined;
    const latestStoppageReason = latestRoundScore?.stoppageReason;
    const latestStoppageWinner = latestRoundScore?.stoppageWinner;
    const isLatestRoundNoContest = latestStoppageWinner === 'NC';
    const fighter1LatestTotal = isLatestRoundNoContest
        ? 'NC'
        : latestStoppageWinner
            ? latestStoppageWinner === String(fighter1) ? latestStoppageReason ?? '-' : ''
            : latestScoredRound ? String(getTotalScore('left', latestScoredRound)) : '-';
    const fighter2LatestTotal = isLatestRoundNoContest
        ? 'NC'
        : latestStoppageWinner
            ? latestStoppageWinner === String(fighter2) ? latestStoppageReason ?? '-' : ''
            : latestScoredRound ? String(getTotalScore('right', latestScoredRound)) : '-';

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

        events.push(`KD: ${knockdowns}`);
        events.push(`Deductions: ${penalties}`);

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
                    weight: Number(weight || null),
                    gender: String(gender || null),
                    ...scorecardTotals,
                    fighter1Score: fighter1LatestTotal,
                    fighter2Score: fighter2LatestTotal,
                }),
            },
        });
    };

    const handleCardDetails = () => {
        router.push({
            pathname: '/createMatch',
            params: {
                id: id ? String(id) : undefined,
                title: 'Edit Scorecard Details',
                backText: 'Menu',
                buttonText: 'Continue',
                isEdit: 'true',
                fighter1: String(fighter1 || 'Fighter 1'),
                fighter2: String(fighter2 || 'Fighter 2'),
                rounds: Number(rounds || 3),
                savedScores: JSON.stringify(getSavedScores()),
                gender: String(gender || null),
                weight: Number(weight || null),
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

    const handleMarkStoppage = (roundNumber: number, stoppageReason: 'KO' | 'TKO' | 'DQ' | 'NC') => {
        setRoundScores((currentScores) => ({
            ...currentScores,
            [roundNumber]: {
                ...(currentScores[roundNumber] ?? {
                    left: '',
                    right: '',
                    plusMinus: '',
                    leftDeductions: '0',
                    rightDeductions: '0',
                    leftKnockdowns: '0',
                    rightKnockdowns: '0',
                }),
                stoppageReason,
            },
        }));
    };

    const handleConfirmStoppage = (
        roundNumber: number,
        stoppageReason: 'KO' | 'TKO' | 'DQ' | 'NC',
        stoppageWinner?: string,
    ) => {
        setRoundScores((currentScores) => ({
            ...currentScores,
            [roundNumber]: {
                ...(currentScores[roundNumber] ?? {}),
                left: '',
                right: '',
                leftDeductions: '0',
                rightDeductions: '0',
                leftKnockdowns: '0',
                rightKnockdowns: '0',
                stoppageReason,
                stoppageWinner: stoppageReason === 'NC' ? 'NC' : stoppageWinner,
            },
        }));
    };

    const handleSaveRound = (roundNumber: number, score: RoundScore) => {
        setRoundScores((currentScores) => ({
            ...currentScores,
            [roundNumber]: {
                ...(currentScores[roundNumber] ?? {}),
                ...score,
            },
        }));
    };

    const formatLandScapeName = (name: string) => {
        const trimmed = String(name || '').trim();
        const parts = trimmed.split(/\s+/).filter(Boolean);
        if (parts.length <= 1) return trimmed;
        const first = parts[0];
        const last = parts[parts.length - 1];
        return `${first}\n${last}`;
    };

    return (
        <View style={styles.backgroundRoot}>
            <Image
                source={require('../assets/images/bgfbsc.png')}
                resizeMode="stretch"
                style={styles.backgroundImage}
            />
            <View style={[
                isLandscape ? styles.landscapeContainer : styles.container,
                
                !isLandscape && {paddingTop: insets.top + 2,},

                isLandscape && {
                    paddingLeft: Math.max(insets.left, sx),
                    paddingRight: Math.max(insets.right, 3 * sx),
                    paddingBottom: Math.max(insets.bottom, 8),
                },
            ]}>
                <Stack.Screen options={{ headerShown: false }} />

                {/* fighter name, point, and event container  */}
                { !isLandscape ?
                    <View style={[styles.summaryCard, { minHeight: 112 * sy, paddingHorizontal: Math.max(0, horizontalGutter - 15) }]}>
                        {/* Fighter 1 vs fighter 2 */}
                        <View style={styles.topDescription}>
                            <Text numberOfLines={2} style={[styles.fighterText, styles.fighter1Name]}>{fighter1}</Text>
                            <Text style={[styles.fighterText, styles.vsText]}>vs</Text>
                            <Text numberOfLines={2} style={[styles.fighterText, styles.fighter2Name]}>{fighter2}</Text>
                        </View>

                        {/* Score 1 .. score 2  */}
                        <View style={isLandscape ? styles.landscapePointHeader : styles.pointHeader}>
                            <Text style={[styles.fighter1PointHeader, isLatestRoundNoContest && styles.noContestPointHeader]}>{fighter1LatestTotal}</Text>
                            <Text style={styles.vsPointHeader}></Text>
                            <Text style={[styles.fighter2PointHeader, isLatestRoundNoContest && styles.noContestPointHeader]}>{fighter2LatestTotal}</Text>
                        </View>

                        {/* round events (KD, PEN) */}
                        <View style={isLandscape ? styles.landscapeTotalEvents : styles.totalEvents}>
                            {/* fighter 1 kd pen */}
                            <Text
                                style={[styles.totalEventsText, styles.fighter1TotalEvents]}
                                numberOfLines={1}
                            >
                                {getTotalEventsText(scorecardTotals.fighter1KD, scorecardTotals.fighter1Pen)}
                            </Text>
                            {/* fighter 2 kd pen */}
                            <Text style={styles.vsTotalEvents}></Text>
                            <Text style={[styles.totalEventsText, styles.fighter2TotalEvents]}
                                numberOfLines={1}
                                >
                                {getTotalEventsText(scorecardTotals.fighter2KD, scorecardTotals.fighter2Pen)}
                            </Text>
                        </View>
                    </View>
                :
                    <View style={[styles.landscapeSummaryCard, { width: 155 * sx }]}>
                        {/* Fighter 1 vs fighter 2 */}
                        <View style={styles.landscapeTopDescription}>
                            
                            <Text style={[styles.landscapeFighterText, styles.landscapeFighter1Name]}>
                                {isLandscape ? formatLandScapeName(String(fighter1)) : fighter1}
                            </Text>
                            <Text style={[styles.fighter1PointHeader, isLatestRoundNoContest && styles.noContestPointHeader]}>{fighter1LatestTotal}</Text>
                            <Text style={[styles.totalEventsText, styles.landscapeFighter1TotalEvents]}>
                                {getTotalEventsText(scorecardTotals.fighter1KD, scorecardTotals.fighter1Pen)}
                            </Text>
                            
                            <Text style={[styles.landscapeFighterText, styles.landscapeVsText]}>vs</Text>

                            <Text style={[styles.landscapeFighterText, styles.landscapeFighter2Name]}>
                                {isLandscape ? formatLandScapeName(String(fighter2)) : fighter2}
                            </Text>
                            <Text style={[styles.fighter2PointHeader, isLatestRoundNoContest && styles.noContestPointHeader]}>{fighter2LatestTotal}</Text>
                            <Text style={[styles.totalEventsText, styles.landscapeFighter2TotalEvents]}>
                                {getTotalEventsText(scorecardTotals.fighter2KD, scorecardTotals.fighter2Pen)}
                            </Text>
                        </View>
                    </View>
                }

                {isLandscape && (
                    <View style={[styles.landscapeButtonContainer, {  gap: 10 * sx }]}>
                        <Pressable style={[styles.landscapeCardDetailsButton, { width: 112 * sx, height: 38 * sy }]} onPress={handleCardDetails}>
                            <Text onPress={handleCardDetails} style={styles.landscapecardDetailsButtonText}>Card Details</Text>
                        </Pressable>
                        <Pressable style={[styles.landscapeShareButton, { width: 112 * sx, height: 38 * sy }]} onPress={handleSaveScorecard}>
                            <Text style={styles.landscapeShareButtonText}>Share</Text>
                        </Pressable>
                        <Pressable style={[styles.landscapeButton, { width: 112 * sx, height: 38 * sy }]} onPress={handleSaveScorecard}>
                            <Text style={styles.landscapeButtonText}>Save</Text>
                        </Pressable>
                    </View>
                )}

                {/* Total, round, +/- header  */}
                {isLandscape ? (
                    <View style={styles.landscapeHeaderRow}>
                        <Text numberOfLines={1} style={[styles.landscapeHeaderText, styles.landscapeLeftHeader]}>Total</Text>
                        <Text style={[styles.landscapeHeaderText, styles.landscapeLeftHeader]}>Round</Text>
                        <Text style={styles.landscapeHeaderText}>+/-</Text>
                        <Text style={[styles.landscapeHeaderText, styles.landscapeRightHeader]}>Round</Text>
                        <Text style={[styles.landscapeHeaderText, styles.landscapeRightHeader]}>Total</Text>
                    </View>
                ) : (
                    <View style={[styles.headerRow, { paddingHorizontal: Math.max(0, horizontalGutter - 15) }]}>
                        <View style={styles.headerRoundLabelSpacer} />
                        <View style={styles.headerScoreCell}><Text style={styles.headerText}>Total</Text></View>
                        <View style={styles.headerScoreCell}><Text style={styles.headerText}>Round</Text></View>
                        <View style={styles.headerPlusMinusCell}><Text style={styles.headerText}>+/-</Text></View>
                        <View style={styles.headerScoreCell}><Text style={styles.headerText}>Round</Text></View>
                        <View style={styles.headerScoreCell}><Text style={styles.headerText}>Total</Text></View>
                        <View style={styles.headerActionSpacer} />
                    </View>
                )}

                {/* Portrait row container  */}
                {!isLandscape ?
                    <ScrollView style={[styles.rowContainer, { paddingHorizontal: horizontalGutter * 0.62, marginHorizontal: -horizontalGutter }]}>
                        {Array.from({ length: parseInt(rounds as string) }).map((_, index) => {
                            const roundNumber = index + 1;
                            return (
                                <RoundRow
                                    key={roundNumber}
                                    roundNumber={roundNumber}
                                    leftScore={roundScores[roundNumber]?.left}
                                    rightScore={roundScores[roundNumber]?.right}
                                    leftTotal={roundScores[roundNumber]?.stoppageWinner === 'NC'
                                        ? 'NC'
                                        : roundScores[roundNumber]?.stoppageWinner
                                        ? roundScores[roundNumber].stoppageWinner === String(fighter1)
                                            ? roundScores[roundNumber].stoppageReason
                                            : ''
                                        : isRoundScored(roundNumber) ? String(getTotalScore('left', roundNumber)) : '-'}
                                    rightTotal={roundScores[roundNumber]?.stoppageWinner === 'NC'
                                        ? 'NC'
                                        : roundScores[roundNumber]?.stoppageWinner
                                        ? roundScores[roundNumber].stoppageWinner === String(fighter2)
                                            ? roundScores[roundNumber].stoppageReason
                                            : ''
                                        : isRoundScored(roundNumber) ? String(getTotalScore('right', roundNumber)) : '-'}
                                    // plusMinus={isRoundScored(roundNumber) ? String(getPlusMinus(roundNumber)) : '-'}
                                    plusMinus={roundScores[roundNumber]?.stoppageWinner
                                        ? roundScores[roundNumber]?.plusMinus
                                        : isRoundScored(roundNumber) ? roundScores[roundNumber]?.plusMinus : '-'}
                                    isQuickScore={roundScores[roundNumber]?.scoringMethod === 'quick'}
                                    leftKds={roundScores[roundNumber]?.leftKnockdowns}
                                    leftPen={roundScores[roundNumber]?.leftDeductions}
                                    rightKds={roundScores[roundNumber]?.rightKnockdowns}
                                    rightPen={roundScores[roundNumber]?.rightDeductions}
                                    stoppageReason={roundScores[roundNumber]?.stoppageReason}
                                    stoppageWinner={roundScores[roundNumber]?.stoppageWinner}
                                    // savedPlusMinus={savedPlusMinusForRound}
                                    fighter1={String(fighter1)}
                                    fighter2={String(fighter2)}
                                    rounds={String(rounds)}
                                    id={id ? String(id) : undefined}
                                    savedScores={JSON.stringify(roundScores)}
                                    onClearRound={handleClearRound}
                                    onSaveRound={handleSaveRound}
                                    onMarkStoppage={handleMarkStoppage}
                                    onConfirmStoppage={handleConfirmStoppage}
                                />
                            );
                        })}
                    </ScrollView>
                :
                    <ScrollView
                        style={styles.landscapeRowContainer}
                        contentContainerStyle={styles.landscapeRowContent}
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                    >
                        {Array.from({ length: parseInt(rounds as string) }).map((_, index) => {
                            const roundNumber = index + 1;
                            return (
                                
                                    <LandscapeRoundRow
                                        key={roundNumber}
                                        roundNumber={roundNumber}
                                        leftScore={roundScores[roundNumber]?.left}
                                        rightScore={roundScores[roundNumber]?.right}
                                        leftTotal={roundScores[roundNumber]?.stoppageWinner === 'NC'
                                            ? 'NC'
                                            : roundScores[roundNumber]?.stoppageWinner
                                            ? roundScores[roundNumber].stoppageWinner === String(fighter1)
                                                ? roundScores[roundNumber].stoppageReason
                                                : ''
                                            : isRoundScored(roundNumber) ? String(getTotalScore('left', roundNumber)) : '-'}
                                        rightTotal={roundScores[roundNumber]?.stoppageWinner === 'NC'
                                            ? 'NC'
                                            : roundScores[roundNumber]?.stoppageWinner
                                            ? roundScores[roundNumber].stoppageWinner === String(fighter2)
                                                ? roundScores[roundNumber].stoppageReason
                                                : ''
                                            : isRoundScored(roundNumber) ? String(getTotalScore('right', roundNumber)) : '-'}
                                        plusMinus={roundScores[roundNumber]?.stoppageWinner
                                            ? roundScores[roundNumber]?.plusMinus
                                            : isRoundScored(roundNumber) ? roundScores[roundNumber]?.plusMinus : '-'}
                                        isQuickScore={roundScores[roundNumber]?.scoringMethod === 'quick'}
                                        leftKds={roundScores[roundNumber]?.leftKnockdowns}
                                        leftPen={roundScores[roundNumber]?.leftDeductions}
                                        rightKds={roundScores[roundNumber]?.rightKnockdowns}
                                        rightPen={roundScores[roundNumber]?.rightDeductions}
                                        stoppageReason={roundScores[roundNumber]?.stoppageReason}
                                        stoppageWinner={roundScores[roundNumber]?.stoppageWinner}
                                        // savedPlusMinus={savedPlusMinusForRound}
                                        fighter1={String(fighter1)}
                                        fighter2={String(fighter2)}
                                        rounds={String(rounds)}
                                        id={id ? String(id) : undefined}
                                        savedScores={JSON.stringify(roundScores)}
                                        onClearRound={handleClearRound}
                                        onSaveRound={handleSaveRound}
                                        onMarkStoppage={handleMarkStoppage}
                                        onConfirmStoppage={handleConfirmStoppage}
                                    />
                                
                            );
                        })}
                    </ScrollView>
                    
                }
                {!isLandscape &&
                    <View style={styles.buttonContainer}>

{/* save button  */}
                        <Pressable
                            style={isLandscape ? styles.landscapeButton : styles.button}
                            // onPress={() => router.push('/')}
                            onPress={handleSaveScorecard}
                        >
                            <Text style={isLandscape ? styles.landscapeButtonText : styles.buttonText}>
                                Save
                            </Text>
                        </Pressable>

                        {/* save button  */}
                        <Pressable
                            style={isLandscape ? styles.landscapeButton : styles.cardDetailsButton}
                            onPress={handleCardDetails}
                        >
                            <Text style={isLandscape ? styles.landscapeButtonText : styles.cardDetailsButtonText}>
                                Card Info
                            </Text>
                        </Pressable>
                        <Pressable
                            style={isLandscape ? styles.landscapeButton : styles.shareButton}
                            onPress={handleCardDetails}
                        >
                            <Text style={isLandscape ? styles.landscapeButtonText : styles.shareButtonText}>
                                Notes
                            </Text>
                        </Pressable>
                        <Pressable
                            style={isLandscape ? styles.landscapeButton : styles.shareButton}
                            onPress={handleCardDetails}
                        >
                            <Text style={isLandscape ? styles.landscapeButtonText : styles.shareButtonText}>
                                Share
                            </Text>
                        </Pressable>

                        

                        
                    </View>
                }
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    backgroundRoot: {
        flex: 1,
        backgroundColor: '#f2f2f2',
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: .4
    },
    cancelButton: {
        backgroundColor: '#EEF1F3',
    },
    confirmDeleteButton: {
        backgroundColor: '#d32f2f',
    },
    cancelButtonText: {
        color: '#333A3F',
        fontWeight: '700',
    },
    confirmDeleteText: {
        color: '#fff',
        fontWeight: '700',
    },
    shareButton: {
        backgroundColor: '#fff',
        paddingHorizontal: '5%',
        paddingVertical: '2.5%',
        borderRadius: 12,
        overflow: 'hidden',
        alignSelf: 'center',
        alignItems: 'center',
        bottom: '4%',
        borderWidth: 1,
        borderColor: 'rgba(200, 200, 200, 0.7)',
        boxShadow: '1px 1px 3px rgba(103, 103, 103, 0.7)',
    },
    shareButtonText: {
        color: '#1976D2',
        fontSize: 14,
        fontWeight: '700',
        zIndex: 1
    },
    cardDetailsButton: {
        backgroundColor: '#fff',
        paddingHorizontal: '5%',
        paddingVertical: '2.5%',
        borderRadius: 12,
        overflow: 'hidden',
        alignSelf: 'center',
        alignItems: 'center',
        bottom: '4%',
        borderWidth: 1,
                // borderColor: 'rgba(200, 200, 200, 0.7)',
        borderColor:'rgba(25, 118, 210, 0.4)',

        boxShadow: '1px 1px 3px rgba(103, 103, 103, 0.7)',
    },
    cardDetailsButtonText: {
        color: '#1976D2',
        fontSize: 14,
        fontWeight: '700',
        zIndex: 1
    },

    button: {
        backgroundColor: '#D32F2F',
        paddingHorizontal: '6%',
        paddingVertical: '2.5%',
        borderRadius: 12,
        overflow: 'hidden',
        alignSelf: 'center',
        alignItems: 'center',
        boxShadow: '1px 1px 3px rgba(103, 103, 103, 0.7)',
        borderWidth: 1,
        borderColor: 'rgba(200, 200, 200, 0.7)',
        bottom: '4%'
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        zIndex: 1
    },
    // container: {
    //     flex: 1,
    //     backgroundColor: '#f2f2f2',
    //     padding: 15,
    //     paddingRight: 10,
    //     paddingTop: '13%'
    // },
    container: {
        flex: 1,
        backgroundColor: 'transparent',
        padding: 15,
        paddingRight: 10,
    },
    fighter1Name: {
        color: '#D32F2F',
        textAlign: 'center',
    },
    fighterText: {
        fontSize: 16,
        flex: 1.35,
        fontWeight: '700',
        lineHeight: 19,
        minWidth: 0,
    },
    fighter1PointHeader: {
        flex: 1.35,
        color: '#D32F2F',
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
    },
    fighter2Name: {
        color: '#1976D2',
        textAlign: 'center',
    },
    fighter2PointHeader: {
        flex: 1.35,
        color: '#1976D2',
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
    },
    noContestPointHeader: {
        color: '#808080',
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 0,
        paddingBottom: 5,
    },
    landscapeButtonContainer: {
        position: 'absolute',
        right: '8.5%',
        top: '3%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 40
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        bottom: '1%',
    },
    headerText: {
        textAlign: 'center',
        color: '#333',
        fontSize: 12,
        fontWeight: '600',
    },
    headerRoundLabelSpacer: {
        width: '9%',
        height: '100%',
    },
    headerScoreCell: {
        flex: 1,
        alignItems: 'center',
    },
    headerPlusMinusCell: {
        width: 42,
        alignItems: 'center',
    },
    headerActionSpacer: {
        width: '11.5%'
    },
    leftHeader: {
        color: 'red',
        width: '45%',
    },
    leftTotal: {
        marginLeft: 10
    },
    pointHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        width: '92%',
        alignSelf: 'center',
    },
    fighter1TotalEvents: {
        color: '#D32F2F',
        flex: 1.35,
    },
    landscapeFighter1TotalEvents: {
        color: '#D32F2F',
    },
    fighter2TotalEvents: {
        color: '#1976D2',
        flex: 1.35,
    },
    landscapeFighter2TotalEvents: {
        color: '#1976D2',
    },
    rightHeader: {
        color: 'blue',
        width: '45%'
    },
    rowContainer: {
        flex: 1,
        marginBottom: 5,
        paddingHorizontal: 15,
        marginHorizontal: -24,
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(200, 200, 200, 0.7)',
        paddingVertical: 16,
        height: '15%',
        marginBottom: 18,
        marginRight: '1%',
        width: '100%',
        justifyContent: 'center',
        boxShadow: '1px 1px 3px rgba(103, 103, 103, 0.7)',
        opacity: .85
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
        marginBottom: 8,
        width: '92%',
        alignSelf: 'center',
    },
    totalEvents: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: '2%',
        width: '92%',
        alignSelf: 'center',
    },
    totalEventsText: {
        flex: 1,
        color: '#333',
        fontSize: 9,
        fontWeight: '500',
        textAlign: 'center',
    },
    vsPointHeader: {
        flex: .3,
    },
    vsText: {
        color: '#000',
        textAlign: 'center',
        flex: .3
    },
    vsTotalEvents: {
        flex: .3,
    },

    //LANDSCAPE STYLES
    landscapeButton: {
        backgroundColor: '#D32F2F',
        paddingHorizontal: 12,
        borderRadius: 10,
        width: 140,
        minHeight: 36,
        zIndex: 2,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        boxShadow: '1px 1px 3px rgba(103, 103, 103, 0.7)',
    },
    landscapeCardDetailsButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        borderRadius: 10,
        width: 140,
        minHeight: 36,
        zIndex: 2,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        boxShadow: '1px 1px 3px rgba(103, 103, 103, 0.7)',
    },

    landscapeShareButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        borderRadius: 10,
        width: 140,
        minHeight: 36,
        zIndex: 2,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        boxShadow: '1px 1px 3px rgba(103, 103, 103, 0.7)',
    },
    landscapecardDetailsButtonText: {
        color: '#1976D2',
        fontSize: 14,
        fontWeight: '700',
    },
    landscapeShareButtonText: {
        color: '#1976D2',
        fontSize: 14,
        fontWeight: '700',
    },
    landscapeButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        zIndex: 1
    },
    landscapeContainer: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingTop: 58,
        paddingHorizontal: 8,
        flexDirection: 'row'
    },
    landscapeFighterText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
    landscapeFighter1Name: {
        color: '#D32F2F',
        textAlign: 'center',
    },
    landscapeFighter2Name: {
        color: '#1976D2',
        textAlign: 'center',
    },
    landscapeHeaderRow: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: '69.5%',
        width: '7%',
        paddingRight: 5,
        top: 16.25,
        marginRight: 5,
        alignSelf: 'center',
    },
    landscapeHeaderText: {
        flex: 1,
        textAlign: 'center',
        color: '#333',
        fontSize: 12,
        fontWeight: '600',
    },
    landscapeLeftHeader: {
        color: '#D32F2F',
    },
    landscapeRightHeader: {
        color: '#1976D2',
    },
    landscapeRowContainer: {
        flex: 1,
        minWidth: 0,
    },
    landscapeRowContent: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
    },
    landscapeSummaryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(200, 200, 200, 0.7)',
        height: '100%',
        marginLeft: '1%',
        width: '18%',
        minWidth: 126,
        maxWidth: 170,
        boxShadow: '1px 1px 3px rgba(103, 103, 103, 0.7)',
        flexDirection: 'column',
        paddingTop: "3.15%",
        paddingHorizontal: 5,
    },
    landscapeTopDescription: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        marginBottom: 0,
        paddingVertical: 8,
    },
    landscapePointHeader: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 0,
        paddingVertical: 12,
    },
    landscapeTotalEvents: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 0,
        paddingVertical: 12,
    },
    landscapeVsText: {
        color: '#000',
        textAlign: 'center',
    },
});
