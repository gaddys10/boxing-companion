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

export default function RoundRow({
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
        </Swipeable>
    );
}

const styles = StyleSheet.create({
    redPlusMinus: {
        color: '#D32F2F',
    },
    roundEvents: {
        position: 'absolute',
        left: '23%',
        top: 11.5,
        height: 20,
        justifyContent: 'center'
    },
    roundEvents2: {
        position: 'absolute',
        left: '67%',
        top: 11.5,
        height: 20,
        justifyContent: 'center'
    },
    roundEventsText: {
        fontSize: 7.5,
        color: '#333',
        fontWeight: 600
    },
    bluePlusMinus: {
        color: '#1976D2',
    },
    button: {
        backgroundColor: '#000',
        marginRight: 3,
        paddingHorizontal: 13,
        paddingVertical: 10,
        borderRadius: 12,
    },
    buttonText: {   
        color: '#fff',
    },
    clearAction: {
        alignItems: 'center',
        backgroundColor: '#D32F2F',
        justifyContent: 'center',
        // marginBottom: 5,
        paddingHorizontal: 16,
        
        width: 82,
    },
    clearActionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
    row: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 35,
        // marginBottom: 5,
        marginBottom: 0,
        borderColor: '#000',
        borderBottomWidth: 1,
        // paddingBottom: 5,
        paddingVertical: 3.99,
    },
    roundLabel: {
        width: 50,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: -8,
        marginRight: -5
    },
    scoreText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '700',
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
    rightTotalScore: {
        color: '#1976D2',
        marginLeft: 0
    },
    rightRoundScore: {
        color: '#1976D2',
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    }
});
