import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';

type RoundRowProps = {
    roundNumber: number;
    leftScore?: string;
    rightScore?: string;
    leftTotal?: string;
    rightTotal?: string;
    plusMinus?: string;
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
    onClearRound: (roundNumber: number) => void;
};

export default function LandscapeRoundRow({
    roundNumber,
    leftScore,
    rightScore,
    leftTotal,
    rightTotal,
    plusMinus,
    leftKds,
    leftPen,
    rightKds,
    rightPen,
    fighter1,
    fighter2,
    rounds,
    id,
    savedScores,
    onClearRound,
}: RoundRowProps) {
    const swipeableRef = React.useRef<Swipeable | null>(null);
    const plusMinusNumber = plusMinus && plusMinus !== '-' ? Number(plusMinus) : null;

    const plusMinusDisplay =
        plusMinusNumber === null
            ? '-'
            : plusMinusNumber < 0
                ? String(Math.abs(plusMinusNumber))
                : String(plusMinusNumber);

    const plusMinusStyle =
        plusMinusNumber === null
            ? styles.plusMinus
            : plusMinusNumber > 0
                ? [styles.plusMinus, styles.redPlusMinus]
                : plusMinusNumber < 0
                    ? [styles.plusMinus, styles.bluePlusMinus]
                    : styles.plusMinus;

    const renderRightActions = () => (
        <Pressable
            style={styles.clearAction}
            onPress={() => {
                swipeableRef.current?.close();
                onClearRound(roundNumber);
            }}
        >
            <Text style={styles.clearActionText}>Clear{"\n"}Round</Text>
        </Pressable>
    );

    return (
        <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false}>
            <View style={styles.row}>
                <Text style={styles.roundLabel}>R{roundNumber}</Text>
                <Text style={[styles.scoreText, styles.leftTotalScore]}>{leftTotal ?? '-'}</Text>
                <Text style={[styles.scoreText, styles.leftRoundScore]}>{leftScore ?? '-'}</Text>
                <Text style={[styles.scoreText, plusMinusStyle]}>{plusMinusDisplay}</Text>
                <Text style={[styles.scoreText, styles.rightRoundScore]}>{rightScore ?? '-'}</Text>
                <Text style={[styles.scoreText, styles.rightTotalScore]}>{rightTotal ?? '-'}</Text>
                <View style={styles.eventsRow}>
                    <View style={styles.roundEvents}>
                        {Number(leftKds) > 0 && Number(leftPen) > 0 && (
                            <Text style={styles.roundEventsText}>KD&nbsp;&nbsp;&nbsp;{leftKds}{"\n"}PEN{leftPen}</Text>
                        )}
                        {Number(leftKds) > 0 && Number(leftPen) === 0 && (
                            <Text style={styles.roundEventsText}>KD{leftKds}</Text>
                        )}
                        {Number(leftKds) === 0 && Number(leftPen) > 0 && (
                            <Text style={styles.roundEventsText}>PEN{leftPen}</Text>
                        )}
                    </View>
                    <View style={styles.roundEvents2}>
                        {Number(rightKds) > 0 && Number(rightPen) > 0 && (
                            <Text style={styles.roundEventsText}>KD&nbsp;&nbsp;{rightKds}{"\n"}PEN{rightPen}</Text>
                        )}
                        {Number(rightKds) > 0 && Number(rightPen) === 0 && (
                            <Text style={styles.roundEventsText}>KD{rightKds}</Text>
                        )}
                        {Number(rightKds) === 0 && Number(rightPen) > 0 && (
                            <Text style={styles.roundEventsText}>PEN{rightPen}</Text>
                        )}
                    </View>
                </View>
                <Pressable
                    style={styles.button}
                    onPress={() => router.push({
                        pathname: '/roundScoring',
                        params: {
                            roundNumber: String(roundNumber),
                            fighter1,
                            fighter2,
                            rounds,
                            id,
                            savedScores,
                        },
                    })}
                >
                    <Text style={styles.buttonText}>Edit</Text>
                </Pressable>
            </View>
        </Swipeable>
    );
}

const styles = StyleSheet.create({
    bluePlusMinus: {
        color: '#1976D2',
    },
    button: {
        backgroundColor: '#000',
        marginTop: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        alignSelf: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
    },
    clearAction: {
        alignItems: 'center',
        backgroundColor: '#D32F2F',
        justifyContent: 'center',
        paddingHorizontal: 16,
        width: 82,
    },
    clearActionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
    leftRoundScore: {
        color: '#D32F2F',
    },
    leftTotalScore: {
        color: '#D32F2F',
    },
    plusMinus: {
        color: '#000',
    },
    redPlusMinus: {
        color: '#D32F2F',
    },
    rightTotalScore: {
        color: '#1976D2',
    },
    rightRoundScore: {
        color: '#1976D2',
    },
    roundEvents: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    roundEvents2: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    roundEventsText: {
        fontSize: 10,
        color: '#333',
        fontWeight: '600',
        textAlign: 'center',
    },
    roundLabel: {
        width: 60,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
        alignSelf: 'center',
    },
    row: {
        backgroundColor: '#fff',
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 5,
        borderColor: '#000',
        borderBottomWidth: 1,
        width: '20%'
    },
    eventsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 8,
    },
    scoreText: {
        width: '50%',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '700',
        marginVertical: 2,
    },
});
