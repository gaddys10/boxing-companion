import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons, MaterialCommunityIcons} from '@expo/vector-icons';

type RoundRowProps = {
    roundNumber: number;
    leftScore?: string;
    rightScore?: string;
    leftTotal?: string;
    rightTotal?: string;
    plusMinus?: string;
    isQuickScore?: boolean;
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
    onSaveRound: (roundNumber: number, score: {
        left: string;
        right: string;
        plusMinus: string;
        leftDeductions: string;
        rightDeductions: string;
        leftKnockdowns: string;
        rightKnockdowns: string;
        scoringMethod: 'quick';
    }) => void;
};

export default function LandscapeRoundRow({
    roundNumber,
    leftScore,
    rightScore,
    leftTotal,
    rightTotal,
    plusMinus,
    isQuickScore,
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
    onSaveRound,
}: RoundRowProps) {
    const swipeableRef = React.useRef<Swipeable | null>(null);
    const plusMinusNumber = plusMinus && plusMinus !== '-' ? Number(plusMinus) : null;
    const [scoringModalVisible, setScoringModalVisible] = useState(false);
    const [quickScoringVisible, setQuickScoringVisible] = useState(false);
    const [quickLeftScore, setQuickLeftScore] = useState(10);
    const [quickRightScore, setQuickRightScore] = useState(10);
    const [quickLeftKds, setQuickLeftKds] = useState(0);
    const [quickRightKds, setQuickRightKds] = useState(0);
    const [quickLeftPen, setQuickLeftPen] = useState(0);
    const [quickRightPen, setQuickRightPen] = useState(0);

    const openQuickScoring = () => {
        setQuickLeftScore(Number(leftScore ?? 10));
        setQuickRightScore(Number(rightScore ?? 10));
        setQuickLeftKds(Number(leftKds ?? 0));
        setQuickRightKds(Number(rightKds ?? 0));
        setQuickLeftPen(Number(leftPen ?? 0));
        setQuickRightPen(Number(rightPen ?? 0));
        setQuickScoringVisible(true);
    };

    const closeScoringModal = () => {
        setScoringModalVisible(false);
        setQuickScoringVisible(false);
    };

    const saveQuickScore = () => {
        onSaveRound(roundNumber, {
            left: String(quickLeftScore),
            right: String(quickRightScore),
            plusMinus: String(quickLeftScore - quickRightScore),
            leftDeductions: String(quickLeftPen),
            rightDeductions: String(quickRightPen),
            leftKnockdowns: String(quickLeftKds),
            rightKnockdowns: String(quickRightKds),
            scoringMethod: 'quick',
        });
        closeScoringModal();
    };

    const {height} = useWindowDimensions();

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

    const plusMinusPillStyle =
        plusMinusNumber === null
            ? [styles.plusMinusPill, styles.neutralPlusMinusPill]
            : plusMinusNumber > 0
                ? [styles.plusMinusPill, styles.redPlusMinusPill]
                : plusMinusNumber < 0
                    ? [styles.plusMinusPill, styles.bluePlusMinusPill]
                    : [styles.plusMinusPill, styles.neutralPlusMinusPill];

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
        <>
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

                

                
                {/* <Text style={[styles.scoreText, plusMinusStyle]}>
                    <Text style={plusMinusPillStyle}>
                        {isQuickScore && plusMinusNumber !== null ? '\u00A0' : plusMinusDisplay}
                    </Text>
                </Text> */}

                <View style={[styles.plusMinusSlot, { transform: [{ translateY: -(height * 0.03) }] }]}>
                    <View style={plusMinusPillStyle}>
                        <Text style={styles.plusMinusPillText}>
                            {isQuickScore && plusMinusNumber !== null
                                ? '\u00A0'
                                : plusMinusDisplay}
                        </Text>
                    </View>
                </View>



                {plusMinusNumber !== null && plusMinusNumber < 0 && (
                    <Ionicons name="triangle" style={styles.rightTriangle} />
                )}
                <Text style={[styles.scoreText, styles.rightRoundScore, ]}>{rightScore ?? '-'}</Text>
                <Text style={[styles.scoreText, styles.rightTotalScore]}>{rightTotal ?? '-'}</Text>
                <Pressable
                    style={styles.button}
                    onPress={() => setScoringModalVisible(true)}
                >
                    <MaterialCommunityIcons 
                        name="pencil" size={20} 
                        color="#333A3F" 
                        // style={styles.editButtonIcon}
                    />
                    {/* <Ionicons name="pencil" size={20} color="#333" /> */}
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
        <Modal
            animationType="fade"
            transparent
            visible={scoringModalVisible}
            supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
            onRequestClose={closeScoringModal}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.scoringModal}>
                    {!quickScoringVisible ? (
                        <>
                            <Text style={styles.modalTitle}>Select Scoring Method</Text>
                            <View style={styles.methodRow}>
                                <View style={styles.methodOption}>
                                    <Pressable style={styles.scoringButton} onPress={openQuickScoring}>
                                        <Text style={styles.scoringButtonText}>Quick Scoring</Text>
                                    </Pressable>
                                    <Text style={styles.modalText}>Score the round in just a few taps!</Text>
                                </View>
                                <View style={styles.methodOption}>
                                    <Pressable
                                        style={styles.scoringButton}
                                        onPress={() => {
                                            closeScoringModal();
                                            router.push({
                                                pathname: '/roundScoring',
                                                params: {
                                                    roundNumber: String(roundNumber),
                                                    fighter1,
                                                    fighter2,
                                                    rounds,
                                                    id,
                                                    savedScores,
                                                },
                                            });
                                        }}
                                    >
                                        <Text style={styles.scoringButtonText}>Full Scoring</Text>
                                    </Pressable>
                                    <Text style={styles.modalText}>Interactive live scoring with momentum tracking</Text>
                                </View>
                            </View>
                            <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={closeScoringModal}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>
                        </>
                    ) : (
                        <>
                            <Text style={styles.modalTitle}>Quick Score Round {roundNumber}</Text>
                            <View style={styles.quickCornerRow}>
                                <Text numberOfLines={1} style={[styles.quickCornerName, styles.quickLeftName]}>{fighter1}</Text>
                                <Text numberOfLines={1} style={[styles.quickCornerName, styles.quickRightName]}>{fighter2}</Text>
                            </View>
                            <View style={styles.quickFieldsRow}>
                                {[
                                    { label: 'Round score', left: quickLeftScore, right: quickRightScore, setLeft: setQuickLeftScore, setRight: setQuickRightScore, max: 10 },
                                    { label: 'Knockdowns', left: quickLeftKds, right: quickRightKds, setLeft: setQuickLeftKds, setRight: setQuickRightKds },
                                    { label: 'Point deductions', left: quickLeftPen, right: quickRightPen, setLeft: setQuickLeftPen, setRight: setQuickRightPen },
                                ].map((field) => (
                                    <View key={field.label} style={styles.quickField}>
                                        <Text style={styles.quickEventLabel}>{field.label}</Text>
                                        <View style={styles.quickCornerRow}>
                                            <View style={styles.stepper}>
                                                <Pressable style={styles.stepperButton} onPress={() => field.setLeft(Math.max(0, field.left - 1))}><Text style={styles.stepperButtonText}>−</Text></Pressable>
                                                <Text style={[styles.stepperValue, field.label === 'Round score' && styles.quickLeftName]}>{field.left}</Text>
                                                <Pressable style={styles.stepperButton} onPress={() => field.setLeft(field.max ? Math.min(field.max, field.left + 1) : field.left + 1)}><Text style={styles.stepperButtonText}>+</Text></Pressable>
                                            </View>
                                            <View style={styles.stepper}>
                                                <Pressable style={styles.stepperButton} onPress={() => field.setRight(Math.max(0, field.right - 1))}><Text style={styles.stepperButtonText}>−</Text></Pressable>
                                                <Text style={[styles.stepperValue, field.label === 'Round score' && styles.quickRightName]}>{field.right}</Text>
                                                <Pressable style={styles.stepperButton} onPress={() => field.setRight(field.max ? Math.min(field.max, field.right + 1) : field.right + 1)}><Text style={styles.stepperButtonText}>+</Text></Pressable>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.quickModalActions}>
                                <Pressable style={[styles.modalButton, styles.backButton]} onPress={() => setQuickScoringVisible(false)}>
                                    <Text style={styles.backButtonText}>Back</Text>
                                </Pressable>
                                <Pressable style={[styles.modalButton, styles.saveButton]} onPress={saveQuickScore}>
                                    <Text style={styles.saveButtonText}>Save Round</Text>
                                </Pressable>
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    plusMinusSlot: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
},

plusMinusPillText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
},
    plusMinusPill: {
    minWidth: 28,
    minHeight: 22,
    borderRadius: 999,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
},
    bluePlusMinusPill: {
        backgroundColor: '#1976D2',
    },
    neutralPlusMinusPill: {
        backgroundColor: '#b0b0b0',
    },
    redPlusMinusPill: {
        backgroundColor: '#D32F2F',
    },
    backButton: {
        backgroundColor: '#EEF1F3',
    },
    backButtonText: {
        color: '#333A3F',
        fontWeight: '700',
    },
    bluePlusMinus: {
        color: '#fff',
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
    cancelButton: {
        alignSelf: 'center',
        backgroundColor: '#d32f2f',
        marginTop: 12,
        width: 180,
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: '700',
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
        top: '44%',
        color: "#d32f2f"
    },
    rightTriangle: {
        position: 'absolute',
        transform: [{ rotate: '180deg' }],
        left: '35.5%',
        top: '57%',
        height: 9,
        color: "#1976D2"
    },
    plusMinus: {
        color: '#000',
    },
    methodOption: {
        alignItems: 'center',
        flex: 1,
        marginBottom: '5%'
    },
    methodRow: {
        flexDirection: 'row',
        gap: 20,
    },
    modalButton: {
        alignItems: 'center',
        borderRadius: 10,
        justifyContent: 'center',
        minHeight: 38,
        paddingHorizontal: 18,
    },
    modalOverlay: {
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        flex: 1,
        justifyContent: 'center',
        padding: 16,
    },
    modalText: {
        color: '#333A3F',
        fontSize: 12,
        marginTop: 8,
        textAlign: 'center',
    },
    modalTitle: {
        color: '#333A3F',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        textAlign: 'center',
    },
    redPlusMinus: {
        color: '#D32F2F',
    },
    saveButton: {
        backgroundColor: '#1976D2',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    scoringButton: {
        alignItems: 'center',
        backgroundColor: '#1976D2',
        borderRadius: 12,
        justifyContent: 'center',
        minHeight: 50,
        width: '100%',
        marginBottom: '2.5%'
    },
    scoringButtonText: {
        color: '#fff',
        fontSize: 18,
    },
    scoringModal: {
        backgroundColor: '#fff',
        borderRadius: 12,
        elevation: 6,
        maxWidth: 680,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        width: '88%',
        height: '70%'
    },
    quickCornerName: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
    },
    quickCornerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickEventLabel: {
        color: '#333A3F',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    quickField: {
        flex: 1,
    },
    quickFieldsRow: {
        flexDirection: 'row',
        gap: 14,
        marginTop: 16,
    },
    quickLeftName: {
        color: '#D32F2F',
    },
    quickModalActions: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
        marginTop: 18,
    },
    quickRightName: {
        color: '#1976D2',
    },
    stepper: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    stepperButton: {
        alignItems: 'center',
        backgroundColor: '#EEF1F3',
        borderRadius: 8,
        height: 32,
        justifyContent: 'center',
        width: 30,
    },
    stepperButtonText: {
        color: '#333A3F',
        fontSize: 19,
        fontWeight: '700',
    },
    stepperValue: {
        color: '#333A3F',
        fontSize: 17,
        fontWeight: '700',
        minWidth: 28,
        textAlign: 'center',
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
