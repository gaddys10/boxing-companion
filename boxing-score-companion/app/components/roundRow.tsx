import React, {useState} from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

type RoundRowProps = {
    roundNumber: number;
    leftScore?: string;
    rightScore?: string;
    leftTotal?: string;
    rightTotal?: string;
    plusMinus?: string;
    savedPlusMinus?: string;
    fighter1: string;
    fighter2: string;
    rounds: string;
    savedScores: string;
};

export default function RoundRow({ roundNumber, leftScore, rightScore, leftTotal, rightTotal, plusMinus, fighter1, fighter2, rounds, savedScores }: RoundRowProps) {
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
    return (
        <View style={styles.row}>
            <Text style={styles.roundLabel}>RD {roundNumber}</Text>
            <Text style={[styles.scoreText, styles.leftRoundScore]}>{leftScore ?? '-'}</Text>
            <Text style={[styles.scoreText, styles.leftTotalScore]}>{leftTotal ?? '-'}</Text>
            <Text style={[styles.scoreText, plusMinusStyle]}>{plusMinusDisplay}</Text>
            <Text style={[styles.scoreText, styles.rightTotalScore]}>{rightTotal ?? '-'}</Text>
            <Text style={[styles.scoreText, styles.rightRoundScore]}>{rightScore ?? '-'}</Text>
            <Pressable
                style={styles.button}
                onPress={() => router.push({
                    pathname: '/roundScoring',
                    params: {
                        roundNumber: String(roundNumber),
                        fighter1,
                        fighter2,
                        rounds,
                        savedScores,
                    },
                })}
            >
                <Text style={styles.buttonText}>Edit</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    redPlusMinus: {
        color: '#D32F2F',
    },

    bluePlusMinus: {
        color: '#1976D2',
    },
    button: {
        backgroundColor: '#000',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    buttonText: {   
        color: '#fff',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        borderColor: '#000',
        borderBottomWidth: 1,
        paddingBottom: 5,
    },
    roundLabel: {
        width: 50,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '700',
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
    },
    rightRoundScore: {
        color: '#1976D2',
        marginLeft: 0,
    },
        rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    }
});
