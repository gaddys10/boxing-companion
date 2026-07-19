import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

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

    const roundLabelColor =
        plusMinusNumber === null
            ? '#b0b0b0'
            : plusMinusNumber > 0
                ? '#D32F2F'
                : plusMinusNumber < 0
                    ? '#1976D2'
                    : '#b0b0b0';

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
                <View style={[styles.roundLabelContainer, { backgroundColor: roundLabelColor }]}> 
                    <Text style={styles.roundLabel}>R{roundNumber}</Text>
                </View>
                <Text style={[styles.scoreText, styles.leftTotalScore]}>{leftTotal ?? '-'}</Text>
                <Text style={[styles.scoreText, styles.leftRoundScore]}>{leftScore ?? '-'}</Text>

                {plusMinusNumber !== null && plusMinusNumber > 0 && (
                    <Ionicons name="triangle" style={styles.leftTriangle} />
                )}
                <Text style={[styles.scoreText, plusMinusStyle]}>{plusMinusDisplay}</Text>

                {plusMinusNumber !== null && plusMinusNumber < 0 && (
                    <Ionicons name="triangle" style={styles.rightTriangle} />
                )}
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
                    <Ionicons name="pencil" size={20} color="#333" />
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
                    <Text style={styles.roundEventsText}>PD{leftPen}</Text>
                )}
            </View>
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
        </Swipeable>
    );
}

const styles = StyleSheet.create({
    bluePlusMinus: {
        color: '#1976D2',
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
        width: 75,
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
    leftTriangle: {
        position: 'absolute',
        left: '35%',
        height: 9,
        top: '45%',
        color: "#d32f2f"
    },
    rightTriangle: {
        position: 'absolute',
        transform: [{ rotate: '180deg' }],
        left: '35.5%',
        top: '56%',
        height: 9,
        color: "#1976D2"
    },
    plusMinus: {
        color: '#000',
    },
    redPlusMinus: {
        color: '#D32F2F',
    },
    rightTotalScore: {
        color: '#1976D2',
        marginLeft: 0
    },
    rightRoundScore: {
        color: '#1976D2',
    },
    roundEvents: {
        position: 'absolute',
        left: '27.5%',
        top: '22.75%',
        height: 42,
        justifyContent: 'center'
    },
    roundEvents2: {
        position: 'absolute',
        left: '27.5%',
        top: '64.5%',
        height: 42,
        justifyContent: 'center'
    },
    roundEventsText: {
        fontSize: 7.5,
        color: '#333',
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
        // justifyContent: 'space-between',
        gap:0,
        height: '99%',
        marginBottom: 4.5,
        marginHorizontal: '.5%',
        marginRight: '0.5%',
        borderWidth: 1,
        borderColor: 'rgba(200, 200, 200, 0.7)',
        borderRadius: 15,
        // paddingVertical: 2,
        overflow: 'hidden',
        boxShadow: '1px 1px 3px rgba(103, 103, 103, 0.7)',
        width: 40,
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
