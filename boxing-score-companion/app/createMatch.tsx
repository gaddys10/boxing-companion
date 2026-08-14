import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';
const tIcon = require('../assets/images/flatwhitet.png');



type RoundScore = {
    left?: string;
    right?: string;
    plusMinus?: string;
    leftDeductions?: string;
    rightDeductions?: string;
    leftKnockdowns?: string;
    rightKnockdowns?: string;
    stoppageReason?: 'KO' | 'TKO' | 'DQ' | 'NC';
    stoppageWinner?: string;
};

export default function CreateMatch() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const title = String(params.title || 'New Scorecard');
    const fighter1 = String(params.fighter1 || '');
    const fighter2 = String(params.fighter2 || '');
    const isEditing = params.isEdit ? true : false
    const roundAmount = Number(params.rounds || params.roundAmount || 10);
    const [fighter1Name, setFighter1Name] = useState(fighter1);
    const [fighter2Name, setFighter2Name] = useState(fighter2);
    const [selectedRounds, setSelectedRounds] = useState(roundAmount);
    const [discardModalVisible, setDiscardModalVisible] = useState(false);


    // const [selectedGender, setSelectedGender] = useState("");
    // const [selectedWeight, setSelectedWeight] = useState<number | string>(0);

    const initialGender = Array.isArray(params.gender)
        ? params.gender[0]
        : params.gender;

    const initialWeight = Array.isArray(params.weight)
        ? params.weight[0]
        : params.weight;

    const [selectedGender, setSelectedGender] = useState<"idk" | "mens" | "womens">(
        initialGender === "mens" || initialGender === "womens"
            ? initialGender
            : "idk"
    );

    const [selectedWeight, setSelectedWeight] = useState<number | string>(() => {
        if (!initialWeight) return 0;
        return initialWeight === "200+" ? "200+" : Number(initialWeight);
    });


    const buttonText = String(params.buttonText || "Create Scorecard");
    const rounds = [4, 5, 6, 8, 10, 12];
    const { height, isLandscape, insets, sx, sy, scale, horizontalGutter } = useResponsiveLayout();
    const landscapeHeightRef = useRef(0);
    if (isLandscape && height > landscapeHeightRef.current) {
        landscapeHeightRef.current = height;
    }
    const stableLandscapeHeight = landscapeHeightRef.current || height;
    const id = params.id ? String(params.id) : undefined;
    const landscapeInputHeight = Math.max(36, Math.min(56, stableLandscapeHeight * 0.05));


    const handleStartFight = () => {
        router.replace({
            pathname: '/matchInfo',
            params: {
                id,
                fighter1: fighter1Name || 'Fighter 1',
                fighter2: fighter2Name || 'Fighter 2',
                rounds: selectedRounds,
                savedScores: params.savedScores,
                gender: selectedGender,
                weight: selectedWeight
            },
        });
    };

    const handleDiscardScorecard = () => {
        setDiscardModalVisible(false);
        router.dismissTo('/');
    };

    const getSavedScoresForRoundCount = () => {
        const currentScores: Record<number, RoundScore> = {};

        if (params.savedScores) {
            try {
                const parsedScores = JSON.parse(String(params.savedScores)) as Record<string, RoundScore>;

                for (let round = 1; round <= selectedRounds; round++) {
                    const roundScore = parsedScores[String(round)] ?? parsedScores[round];

                    if (roundScore) {
                        currentScores[round] = roundScore;
                    }
                }
            } catch {
                return currentScores;
            }
        }

        return currentScores;
    };

    const getScorecardTotals = (savedScores: Record<number, RoundScore>) => {
        return Object.values(savedScores).reduce(
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

    const getSavedCardTotals = (savedScores: Record<number, RoundScore>) => {
        const totals = getScorecardTotals(savedScores);
        const latestResult = Object.entries(savedScores)
            .sort(([firstRound], [secondRound]) => Number(firstRound) - Number(secondRound))
            .map(([, roundScore]) => roundScore)
            .filter((roundScore) => Boolean(roundScore.stoppageWinner) || (
                roundScore.left !== undefined && roundScore.left !== '' &&
                roundScore.right !== undefined && roundScore.right !== ''
            ))
            .pop();

        if (!latestResult?.stoppageWinner) return totals;

        if (latestResult.stoppageWinner === 'NC') {
            return {...totals, fighter1Score: 'NC', fighter2Score: 'NC'};
        }

        return {
            ...totals,
            fighter1Score: latestResult.stoppageWinner === fighter1Name
                ? latestResult.stoppageReason ?? '-'
                : '',
            fighter2Score: latestResult.stoppageWinner === fighter2Name
                ? latestResult.stoppageReason ?? '-'
                : '',
        };
    };

    const handleSaveChangesAndExit = () => {
        const savedScores = getSavedScoresForRoundCount();

        Object.values(savedScores).forEach((roundScore) => {
            if (roundScore.stoppageWinner === fighter1) {
                roundScore.stoppageWinner = fighter1Name || 'Fighter 1';
            }

            if (roundScore.stoppageWinner === fighter2) {
                roundScore.stoppageWinner = fighter2Name || 'Fighter 2';
            }
        });

        router.dismissTo({
            pathname: '/',
            params: {
                savedScorecard: JSON.stringify({
                    id: id ? Number(id) : Date.now(),
                    fighter1: fighter1Name || 'Fighter 1',
                    fighter2: fighter2Name || 'Fighter 2',
                    rounds: selectedRounds,
                    savedScores: JSON.stringify(savedScores),
                    gender: selectedGender,
                    weight: selectedWeight,
                    ...getSavedCardTotals(savedScores),
                }),
            },
        });
    };

    const roundSelector = (
        <>
            <Text style={isLandscape ? styles.landscapeRoundLabel : styles.blackNameLabel}>Select number of rounds:</Text>
            <View style={isLandscape ? styles.landscapeRoundsContainer : styles.roundsContainer}>
                {rounds.map((round) => (
                    <Pressable
                        key={round}
                        style={[
                            isLandscape ? styles.landscapeRoundButton : styles.roundButton,
                            selectedRounds === round && styles.roundButtonSelected,
                        ]}
                        onPress={() => setSelectedRounds(round)}
                    >
                        <Text style={[
                            styles.roundButtonText,
                            selectedRounds === round && styles.roundButtonTextSelected,
                        ]}>
                            {round}
                        </Text>
                    </Pressable>
                ))}
            </View>
        </>
    );

    const genderSelector = (
        <>
            <Text style={isLandscape ? styles.landscapeRoundLabel : styles.blackNameLabel}>
                Select gender: <Text style={styles.optionalLabel}>(optional)</Text>
            </Text>
            <View style={[styles.genderPills, isLandscape && styles.landscapeGenderPills]}>
                <Pressable
                    style={[
                        styles.malePill,
                        selectedGender === "mens" && styles.malePillSelected
                    ]}
                    onPress={() => selectedGender === "mens" ? setSelectedGender("idk") : setSelectedGender('mens')}
                >
                    {selectedGender === "mens" ?
                        <Ionicons name={'male-outline'} size={18} color="#fff"/>
                    :
                        <Ionicons name={'male-outline'} size={18} color="#000"/>
                    }
                    <Text style={[
                        styles.maleText,
                        selectedGender === "mens" && styles.maleTextSelected
                    ]}>{"Men's"}</Text>
                </Pressable>

                <Pressable style={[
                    styles.femalePill,
                    selectedGender === "womens" && styles.femalePillSelected
                    ]}
                    onPress={() => selectedGender=== "womens" ? setSelectedGender("idk") : setSelectedGender("womens")}
                >
                    {selectedGender === "womens" ?
                        <Ionicons name={'female-outline'} size={18} color="#fff"/>
                    :
                        <Ionicons name={'female-outline'} size={18} color="#000"/>
                    }
                    <Text style={[
                        styles.femaleText,
                        selectedGender === "womens" && styles.femaleTextSelected
                    ]}>{"Women's"}</Text>
                </Pressable>
            </View>
        </>
    );

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={!isLandscape && Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView
                style={styles.formScroll}
                contentContainerStyle={[
                    isLandscape ? styles.landscapeContainer : styles.container,
                    !isLandscape && {
                        paddingTop: insets.top,
                        paddingBottom: Math.max(insets.bottom, 12) + 60,
                        paddingHorizontal: horizontalGutter,
                    },
                    isLandscape && {
                        paddingLeft: Math.max(insets.left, 16 * sx),
                        paddingRight: Math.max(insets.right, 16 * sx),
                        paddingBottom: Math.max(insets.bottom, 8 * sy),
                        minHeight: stableLandscapeHeight,
                    },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={isLandscape}
            >

            {/* Page title -- Create Scorecard  */}
            <View style={isLandscape ? styles.landscapeTitleContainer : styles.titleContainer}>
                <Text style={isLandscape ? styles.landscapeTitle : styles.title}>{title}</Text>
            </View>

            {/* Text Input Container  */}
            <View style={isLandscape ? styles.landscapeInputContainer : styles.inputContainer}>

                {/* Red corner title and input  */}
                <View style ={isLandscape ? styles.landscapeFighter1Box : styles.fighter1Box}>
                    <Text style={isLandscape ? styles.landscapeNameLabel : styles.redNameLabel}>Red corner name:</Text>
                    <TextInput
                        placeholder="Enter red corner's name.."
                        value={fighter1Name}
                        placeholderTextColor="#D32f2f"
                        onChangeText={setFighter1Name}
                        style={isLandscape ? [styles.landscapeFighter1Input, { height: landscapeInputHeight }] : [styles.fighter1input, { minHeight: Math.max(40, 40 * scale) }]}
                    />
                </View>

                {/* Blue corner title and input  */}
                <View style={ isLandscape ? styles.landscapeFighter2Box : styles.fighter2Box}>
                    <Text style={isLandscape ? styles.landscapeNameLabel : styles.blueNameLabel}>Blue corner name:</Text>
                    <TextInput
                        placeholder="Enter blue corner's name.."
                        placeholderTextColor="#307Fb6"
                        value={fighter2Name}
                        onChangeText={setFighter2Name}
                        style={isLandscape ? [styles.landscapeFighter2Input, { height: landscapeInputHeight }] : [styles.fighter2Input, { minHeight: Math.max(40, 40 * scale) }]}
                    />
                </View>
            </View>
            {isLandscape ? (
                <View style={styles.landscapeRoundGenderRow}>
                    <View style={styles.landscapeRoundContainer}>{roundSelector}</View>
                    <View style={styles.landscapeGenderContainer}>{genderSelector}</View>
                </View>
            ) : (
                <>
                    {roundSelector}
                    {genderSelector}
                </>
            )}

            <Text style={isLandscape ? styles.landscapeWeightLabel : styles.blackNameLabel}>
                Select weight class: <Text style={styles.optionalLabel}>(optional)</Text>
            </Text>

            {!isLandscape ?
                <View style={[styles.weightClassContainer]}>
                    <View style={styles.weightColumnLeft}>
                        {[102, 112, 122, 135, 154, 175].map((weight) => (
                            <Pressable
                                key={weight}
                                style={[
                                    styles.weightPill,
                                    selectedWeight === weight && styles.weightPillSelected,
                                ]}
                                onPress={() => setSelectedWeight(selectedWeight === weight ? 0 : weight)}
                            >
                                <Text style={selectedWeight === weight ? styles.weightPillTextSelected : styles.weightPillText}>
                                    {weight}lbs
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                    <View style={styles.weightColumnCenter}>
                        {[105, 115, 127, 140, 160, 200].map((weight) => (
                            <Pressable
                                key={weight}
                                style={[
                                    styles.weightPill,
                                    selectedWeight === weight && styles.weightPillSelected
                                ]}
                                onPress={() => setSelectedWeight(selectedWeight === weight ? 0 : weight)}
                            >
                                <Text style={selectedWeight === weight ? styles.weightPillTextSelected : styles.weightPillText}>
                                    {weight}lbs
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                    <View style={styles.weightColumnRight}>
                        {[110, 118, 130, 147, 168, '200+'].map((weight) => (
                            <Pressable
                                key={weight}
                                style={[
                                    isLandscape ? styles.landscapeWeightPill : styles.weightPill,
                                    selectedWeight === weight && styles.weightPillSelected
                                ]}
                                onPress={() => setSelectedWeight(selectedWeight === weight ? 0 : weight)}
                            >
                                <Text style={selectedWeight === weight ? styles.weightPillTextSelected : styles.weightPillText}>
                                    {weight}lbs
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            :
                <View style={[
                    styles.weightClassContainer, 
                    isLandscape && styles.landscapeWeightClassContainer]}>
                    <View style={[styles.weightColumnLeft, styles.landscapeWeightColumn]}>
                        {[102, 122, 154].map((weight) => (
                            <Pressable
                                key={weight}
                                style={[
                                    styles.landscapeWeightPill,
                                    selectedWeight === weight && styles.landscapeWeightPillSelected
                                ]}
                                onPress={() => setSelectedWeight(selectedWeight === weight ? 0 : weight)}
                            >
                                <Text style={selectedWeight === weight ? styles.weightPillTextSelected : styles.weightPillText}>
                                    {weight}lbs
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                    <View style={[styles.weightColumnCenter, styles.landscapeWeightColumn]}>
                        {[105, 126, 160, ].map((weight) => (
                            <Pressable
                                key={weight}
                                style={[
                                    isLandscape ? styles.landscapeWeightPill : styles.weightPill,
                                    selectedWeight === weight && styles.landscapeWeightPillSelected
                                ]}
                                onPress={() => setSelectedWeight(selectedWeight === weight ? 0 : weight)}
                            >
                                <Text style={selectedWeight === weight ? styles.weightPillTextSelected : styles.weightPillText}>
                                    {weight}lbs
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                    <View style={[styles.weightColumnRight, styles.landscapeWeightColumn]}>
                        {[110, 130, 168].map((weight) => (
                            <Pressable
                                key={weight}
                                style={[
                                    isLandscape ? styles.landscapeWeightPill : styles.weightPill,
                                    selectedWeight === weight && styles.landscapeWeightPillSelected
                                ]}
                                onPress={() => setSelectedWeight(selectedWeight === weight ? 0 : weight)}
                            >
                                <Text style={selectedWeight === weight ? styles.weightPillTextSelected : styles.weightPillText}>
                                    {weight}lbs
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                    <View style={[styles.weightColumnRight, styles.landscapeWeightColumn]}>
                        {[112, 135, 175].map((weight) => (
                            <Pressable
                                key={weight}
                                style={[
                                    isLandscape ? styles.landscapeWeightPill : styles.weightPill,
                                    selectedWeight === weight && styles.landscapeWeightPillSelected
                                ]}
                                onPress={() => setSelectedWeight(selectedWeight === weight ? 0 : weight)}
                            >
                                <Text style={selectedWeight === weight ? styles.weightPillTextSelected : styles.weightPillText}>
                                    {weight}lbs
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                    <View style={[styles.weightColumnRight, styles.landscapeWeightColumn]}>
                        {[115, 140, 200].map((weight) => (
                            <Pressable
                                key={weight}
                                style={[
                                    isLandscape ? styles.landscapeWeightPill : styles.weightPill,
                                    selectedWeight === weight && styles.landscapeWeightPillSelected
                                ]}
                                onPress={() => setSelectedWeight(selectedWeight === weight ? 0 : weight)}
                            >
                                <Text style={selectedWeight === weight ? styles.weightPillTextSelected : styles.weightPillText}>
                                    {weight}lbs
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                    <View style={[styles.weightColumnRight, styles.landscapeWeightColumn]}>
                        {[118, 147, '200+'].map((weight) => (
                            <Pressable
                                key={weight}
                                style={[
                                    isLandscape ? styles.landscapeWeightPill : styles.weightPill,
                                    selectedWeight === weight && styles.landscapeWeightPillSelected
                                ]}
                                onPress={() => setSelectedWeight(selectedWeight === weight ? 0 : weight)}
                            >
                                <Text style={selectedWeight === weight ? styles.weightPillTextSelected : styles.weightPillText}>
                                    {weight}lbs
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            }


            {isLandscape &&
                <View style={isEditing ? styles.landscapeEditButtonContainer: styles.landscapeButtonContainer}>

                    {/* Cancel button  */}
                    <Pressable
                        style={[
                            isEditing ? styles.landscapeEditCancelButton : styles.landscapeCancelButton,
                        ]}
                        onPress={() => setDiscardModalVisible(true)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>


                    {/* save and exit button  */}
                    {isEditing && 
                        <Pressable
                            style={[styles.landscapeEditSaveButton, styles.landscapeActionButton]}
                            onPress={handleSaveChangesAndExit}
                        >
                            <Text style={[styles.buttonText, styles.editingButtonText]}>Save & Exit</Text>
                        </Pressable>
                    }


                    {/* Enter scorecard button  */}
                    <Pressable
                        style={[
                            isEditing? styles.landscapeEditContinueButton : styles.landscapeButton,
                        ]}
                        onPress={handleStartFight}
                    >
                        <Text style={[styles.buttonText, isEditing && styles.editingButtonText]} onPress={handleStartFight}>
                            {buttonText}
                        </Text>
                    </Pressable>
                </View>
            }
            {/* <Image source={tIcon} style={styles.icon} resizeMode="contain" /> */}
            </ScrollView>
            {!isLandscape && (
                <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                    <Pressable style={styles.cancelButton} onPress={() => setDiscardModalVisible(true)}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                    {isEditing && (
                        <Pressable
                            style={[styles.editButton, styles.editingActionButton]}
                            onPress={handleSaveChangesAndExit}
                        >
                            <Text style={[styles.buttonText, styles.editingButtonText]}>Save & Exit</Text>
                        </Pressable>
                    )}
                    <Pressable
                        style={[styles.button, isEditing && styles.editingActionButton]}
                        onPress={handleStartFight}
                    >
                        <Text style={[styles.buttonText, isEditing && styles.editingButtonText]}>{buttonText}</Text>
                    </Pressable>
                </View>
            )}
            <Modal
                animationType="fade"
                transparent
                visible={discardModalVisible}
                supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
                onRequestClose={() => setDiscardModalVisible(false)}
            >
                <View style={styles.discardModalOverlay}>
                    <View style={styles.discardModalCard}>
                        <Text style={styles.discardModalTitle}>
                            {isEditing ? 'Discard changes?' : 'Discard scorecard?'}
                        </Text>
                        <Text style={styles.discardModalText}>
                            {isEditing
                                ? 'Are you sure you want to discard your changes?'
                                : 'Are you sure you want to discard this scorecard?'}
                        </Text>
                        <View style={styles.discardModalActions}>
                            <Pressable style={[styles.discardModalButton, styles.discardButton]} onPress={handleDiscardScorecard}>
                                <Text style={styles.discardButtonText}>Discard</Text>
                            </Pressable>
                            <Pressable style={[styles.discardModalButton, styles.keepEditingButton]} onPress={() => setDiscardModalVisible(false)}>
                                <Text style={styles.keepEditingButtonText}>Keep Editing</Text>
                            </Pressable>
                            
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const landscape = StyleSheet.create({
});

const styles = StyleSheet.create({
    discardModalOverlay: {
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    discardModalCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        elevation: 6,
        maxWidth: 360,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        width: '100%',
    },
    discardModalTitle: {
        color: '#333A3F',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 10,
        textAlign: 'center',
    },
    discardModalText: {
        color: '#333A3F',
        fontSize: 15,
        lineHeight: 21,
        marginBottom: 20,
        textAlign: 'center',
    },
    discardModalActions: {
        flexDirection: 'row',
        gap: 10,
    },
    discardModalButton: {
        alignItems: 'center',
        borderColor: 'rgba(200, 200, 200, 0.7)',
        borderRadius: 10,
        borderWidth: 1,
        elevation: 2,
        flex: 1,
        justifyContent: 'center',
        minHeight: 44,
        paddingHorizontal: 12,
        shadowColor: '#11334b',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 1,
    },
    keepEditingButton: {
        backgroundColor: '#fff',
    },
    keepEditingButtonText: {
        color: '#307Fb6',
        fontWeight: '700',
    },
    discardButton: {
        backgroundColor: '#D32F2F',
    },
    discardButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    landscapeRoundGenderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        height: '17%'
    },
    landscapeRoundContainer: {
        width: '50%',
        height: '100%',
        marginRight: '1%'
    },
    landscapeGenderContainer: {
        width: '50%',
        height: '100%',
    },
    screen: {
        flex: 1,
        backgroundColor: '#f1f5f8',
    },
    formScroll: {
        flex: 1,
    },
    backBox: {
        flexDirection: 'row',
        position: 'absolute',
        left: 15,
        top: 75,
    },
    backText: {
        top: 5,
        fontSize: 14,
        color: '#fff',
        fontWeight: 500
    },
    button: {
        backgroundColor: '#fff',
        paddingHorizontal: '6%',
        paddingVertical: '2.5%',
        borderRadius: 12,
        // marginTop: 25,
        minWidth: '29%',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '2px 4px 6px rgba(0, 0, 0, 0.3)',
        borderWidth: 1,
        borderColor: '#B6C6D1'
    },
    editButton: {
        backgroundColor: '#fff',
                minWidth: '25%',
        borderRadius: 12,
        // marginTop: 25,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '2px 4px 6px rgba(0, 0, 0, 0.3)',
        borderWidth: 1,
        borderColor: '#B6C6D1',
        paddingHorizontal: '6%',
        paddingVertical: '2.5%',
    },

    
    editingActionButton: {
        width: '31%',
        paddingHorizontal: '1%',
    },
    
    buttonContainer: {
        backgroundColor: '#f1f5f8',
        bottom: '0%',
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'space-between',
        left: 0,
        paddingHorizontal: '7%',
        paddingTop: 8,
        position: 'absolute',
        right: 0,
        width: '100%',
        zIndex: 10,
    },
    landscapeButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%',
        gap: 12,
        paddingBottom: 12,
        height: '14%'
    },

    buttonText: {
        color: '#307Fb6',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center'
    },

    editingCancelButton: {
        width: '31%',
        paddingHorizontal: '1%',
                minWidth: '25%',

    },
    editingButtonText: {
        fontSize: 14,
        color: '#307Fb6',
    },
    cancelButton: {
        backgroundColor: '#de2f2f',
        // paddingHorizontal: 24,
        borderRadius: 12,
        paddingHorizontal: '6%',
        paddingVertical: '2.5%',
        bottom: 0,
                minWidth: '25%',

        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '2px 4px 6px rgba(0, 0, 0, 0.3)',
    },
    landscapeCancelButton: {
        backgroundColor: '#de2f2f',
        paddingHorizontal: 24,
        borderRadius: 12,
        height: '80%',
        flex: 1,
        maxWidth: 200,
        minWidth: 0,
        borderWidth: 1,
        borderColor: '#B6C6D1',
        justifyContent: 'center',
        boxShadow: '2px 4px 6px rgba(0, 0, 0, 0.3)',
    },
    landscapeEditCancelButton: {
        backgroundColor: '#de2f2f',
        paddingHorizontal: 24,
        borderRadius: 12,
        height: '100%',
        borderWidth: 1,
        width: '31%',
        minWidth: 0,
        borderColor: '#B6C6D1',
        justifyContent: 'center',
        boxShadow: '2px 4px 6px rgba(0, 0, 0, 0.3)',
    },
    landscapeEditButton: {
        backgroundColor: '#fff',
        paddingHorizontal: '1%',
        borderRadius: 12,
        width: 200,
        height: '39%',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '2px 4px 6px rgba(0, 0, 0, 0.3)',
        borderWidth: 1,
        borderColor: '#B6C6D1',
        color: '#307Fb6',
    },
    landscapeEditSaveButton: {
        backgroundColor: '#fff',
        paddingHorizontal: '1%',
        borderRadius: 12,
        flex: 1,
        maxWidth: 200,
        minWidth: 0,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '2px 4px 6px rgba(0, 0, 0, 0.3)',
        borderWidth: 1,
        borderColor: '#B6C6D1',
        color: '#307Fb6',
    },
    landscapeButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        borderRadius: 12,
        flex: 1,
        maxWidth: 200,
        minWidth: 0,
        height: '80%',
        borderWidth: 1,
        borderColor: '#B6C6D1',
        justifyContent: 'center',
        boxShadow: '2px 4px 6px rgba(0, 0, 0, 0.3)',
    },
    landscapeEditContinueButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        borderRadius: 12,
        flex: 1,
        maxWidth: 200,
        minWidth: 0,
        height: '100%',
        borderWidth: 1,
        borderColor: '#B6C6D1',
        justifyContent: 'center',
        boxShadow: '2px 4px 6px rgba(0, 0, 0, 0.3)',
    },
    landscapeActionButton: {
        flex: 1,
        width: 'auto',
        maxWidth: 240,
    },


    

    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center'
    },
    weightClassContainer: {
        height: '28%',
        width: '100%',
        flexDirection: 'row'
    },
    weightColumnLeft: {
        height: '100%',
        width: '33%',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5%',

    },
    weightColumnCenter: {
        height: '100%',
        width: '33%',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5%',

    },
    weightColumnRight: {
        height: '100%',
        width: '33%',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5%',
    },
    landscapeWeightPill: {
        height: '27%',
        width:  '70%',
        borderColor: '#B6C6D1',
        borderWidth: 1,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center'
    },
    landscapeWeightPillSelected: {
        height: '27%',
        width: '60%',
        // borderColor: '#fff',
        borderWidth: 0,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#307Fb6'
    },
    weightPill: {
        height: '14.5%',
        width: '85%',
        borderColor: '#B6C6D1',
        borderWidth: 1,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center'
    },
    weightPillSelected: {
        height: '14.5%',
        width: '85%',
        // borderColor: '#fff',
        borderWidth: 0,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#307Fb6'
    },

    weightPillText: {
        color: 'black',
        fontSize: 12
    },
    weightPillTextSelected: {
        color: 'white',
        fontSize: 12
    },

    container: {
        flex: 1,
        backgroundColor: '#f1f5f8',
        alignItems: 'center',
        // justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: '0%'
    },
    fighter1input: {
        backgroundColor: '#fff',
        width: '100%',
        padding: "3%",
        borderRadius: 8,
        marginBottom: '8%',
        color: '#D32f2f',
        fontWeight: 600,
        borderWidth: 1,
        borderColor: '#B6C6D1',

    },
    fighter2Input: {
        backgroundColor: '#fff',
        width: '100%',
        padding: "3%",
        borderRadius: 8,
        color: '#307Fb6',
        marginBottom: '8%',
        fontWeight: 600,
        borderWidth: 1,

        borderColor: '#B6C6D1',
    },
    icon: {
        width: "20%",
        position: 'absolute',
        top: '21%',
    },
    inputContainer: {
        width: '100%'
    },
    nameLabel: {
        color: '#D32f2f',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 10,
        marginLeft: 0,
        alignSelf: 'flex-start'
    },
    blackNameLabel: {
        color: '#000',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: '3%',
        marginLeft: 0,
        alignSelf: 'flex-start'
    },
    optionalLabel: {
        fontWeight: '400'
    },
    blueNameLabel: {
        color: '#307Fb6',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: '3%',
        marginLeft: 0,
        alignSelf: 'flex-start'
    },
    redNameLabel: {
        color: '#D32f2f',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: '3%',
        marginLeft: 0,
        alignSelf: 'flex-start'
    },
    genderPills: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: '5%',
        width: '100%',
        paddingHorizontal: '8%',
        paddingRight: '10%',
        marginBottom: '6%'
    },
        malePill: {
            flexDirection: 'row',
            borderWidth: 1,
            borderColor: '#B6C6D1',
            color: 'red',

            width: '40%',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 25,
            height: '80%'

        },
        malePillSelected: {
            backgroundColor: '#307Fb6',
            borderWidth: 0
        },

        femalePill: {
            flexDirection: 'row',
            borderWidth: 1,
            borderColor: '#B6C6D1',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#B6c6d1',
            height: '80%',
            width: '40%',
            borderRadius: 25

        },
        femalePillSelected: {
            flexDirection: 'row',
            borderWidth: 0,
            backgroundColor: '#d32fba',
            justifyContent: 'center',
            alignItems: 'center',
            height: '80%',
            width: '40%',
            borderRadius: 25
        },
        maleText: {
            color: '#000',
            marginLeft: 5
        },
        maleTextSelected: {
            color: 'white',
            marginLeft: 5

        },
        femaleText: {
            color: '#000',
            marginLeft: 5
        },
        femaleTextSelected: {
            color: 'white',
            marginLeft: 5
        },
    nameLabelRed: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 12,
        marginLeft: 0,
        alignSelf: 'flex-start',
        backgroundColor: '#D32f2f'
    },
    roundButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#B6C6D1',
        // paddingHorizontal: '4.25%',
        width: '8%',

        paddingVertical: '1.25%',
        borderRadius: 8,
        marginRight: '2.5%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    landscapeRoundButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#B6C6D1',
        width: '13%',
        height: '100%',
        borderRadius: 8,
        marginHorizontal: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roundButtonSelected: {
        backgroundColor: '#307fb6',
        borderColor: "#fff"
    },
    roundButtonText: {
        color: '#000',
        fontSize: 12,
    },
    roundButtonTextSelected: {
        color: '#fff',
    },
    roundsContainer: {
        flexDirection: 'row',
        marginBottom: '8%',
        alignSelf: 'center',
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        // marginTop: '12%'
    },
    titleContainer: {
        backgroundColor: '#307fb6',
        height: '7%',
        width: '115%',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        marginBottom: '7%',
    },

    // LANDSCAPE STYLES
    landscapeTitleContainer: {
        backgroundColor: '#307fb6',
        height: '9.5%',
        width: '115%',
        justifyContent: 'flex-end',
        paddingBottom: '1%',
        alignItems: 'center',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        marginBottom: '2%',
        boxShadow: '4',
        shadowColor: '#11334b',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 1,
    },



    landscapeGenderPills: {
        height: '55%',
        maxWidth: 520,
    },
    landscapeWeightClassContainer: {
        height: '30%',
        width: '100%',
        alignSelf: 'center',
        justifyContent: 'center',
        marginBottom: '.5%'
    },
    landscapeWeightColumn: {
        width: '17.5%',
        justifyContent: 'flex-start',
    },


    landscapeEditButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 12,
        paddingBottom: 12,
        height: '10.5%'
    },
    landscapeContainer: {
        flexGrow: 1,
        backgroundColor: '#f1f5f8',
        alignItems: 'center',
        // paddingHorizontal: 5,
        // paddingTop: 10,
    },
    landscapeFighter1Box: {
        flex: 1,
    },
    fighter1Box: {

    },
    fighter2Box: {

    },
    landscapeFighter2Box: {
        flex: 1,
    },
    landscapeFighter1Input: {
        backgroundColor: '#fff',
        color: "#D32f2f",
        width: '100%',
        height: 33,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 8,
        textAlign: 'center'
    },
    landscapeFighter2Input: {
        backgroundColor: '#fff',
        color: "#307Fb6",
        width: '100%',
        height: 31,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 8,
        textAlign: 'center'

    },
    landscapeNameLabel: {
        color: '#333A3F',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: '2%',
    },
    landscapeRoundLabel: {
        color: '#333A3F',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: '2%',
        alignSelf: 'flex-start',
    },

    landscapeWeightLabel: {
        color: '#333A3F',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: '1.5%',
        alignSelf: 'flex-start',
    },
    landscapeInputContainer: {
        width: '100%',
        flexDirection: 'row',
        gap: 14,
        marginBottom: '1%',
    },
    landscapeRoundsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        height: '40%'
    },

    landscapeTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        // marginBottom: 25,
        // marginTop: -25,
        // position: 'absolute',
        // top: 25
    },
});
