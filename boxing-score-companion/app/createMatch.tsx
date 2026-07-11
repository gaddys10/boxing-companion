import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, useWindowDimensions, Image } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
const tIcon = require('../assets/images/flatwhitet.png');

type RoundScore = {
    left?: string;
    right?: string;
    plusMinus?: string;
    leftDeductions?: string;
    rightDeductions?: string;
    leftKnockdowns?: string;
    rightKnockdowns?: string;
};

export default function CreateMatch() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const title = String(params.title || 'Create Scorecard');
    const fighter1 = String(params.fighter1 || '');
    const fighter2 = String(params.fighter2 || '');
    const isEditing = params.isEdit ? true : false
    const roundAmount = Number(params.rounds || params.roundAmount || 3);
    const [fighter1Name, setFighter1Name] = useState(fighter1);
    const [fighter2Name, setFighter2Name] = useState(fighter2);
    const [selectedRounds, setSelectedRounds] = useState(roundAmount);
    const buttonText = String(params.buttonText || "Start Match");
    const rounds = [1, 3, 4, 5, 6, 8, 10, 12];
    const { width, height } = useWindowDimensions();
    const id = params.id ? String(params.id) : undefined;
    let isLandscape = width > height;

    const handleStartFight = () => {
        router.dismissTo({
            pathname: '/matchInfo',
            params: {
                id,
                fighter1: fighter1Name || 'Fighter 1',
                fighter2: fighter2Name || 'Fighter 2',
                rounds: selectedRounds,
                savedScores: params.savedScores,
            },
        });
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

    const handleSaveChangesAndExit = () => {
        const savedScores = getSavedScoresForRoundCount();

        router.dismissTo({
            pathname: '/',
            params: {
                savedScorecard: JSON.stringify({
                    id: id ? Number(id) : Date.now(),
                    fighter1: fighter1Name || 'Fighter 1',
                    fighter2: fighter2Name || 'Fighter 2',
                    rounds: selectedRounds,
                    savedScores: JSON.stringify(savedScores),
                    ...getScorecardTotals(savedScores),
                }),
            },
        });
    };

    return (
        <View style={isLandscape ? styles.landscapeContainer : styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Page title -- Create Scorecard  */}
            <Text style={isLandscape ? styles.landscapeTitle : styles.title}>{title}</Text>

            {/* Text Input Container  */}
            <View style={isLandscape ? styles.landscapeInputContainer : styles.inputContainer}>

                {/* Red corner title and input  */}
                <View style ={isLandscape ? styles.landscapeFighter1Box : ""}>
                    <Text style={isLandscape ? styles.landscapeNameLabel : styles.nameLabel}>Red corner name:</Text>
                    <TextInput
                        placeholder="Enter name.."
                        value={fighter1Name}
                        placeholderTextColor="#D32f2f"
                        onChangeText={setFighter1Name}
                        style={isLandscape ? styles.landscapeFighter1Input : styles.fighter1input}
                    />
                </View>

                {/* Blue corner title and input  */}
                <View style={ isLandscape ? styles.landscapeFighter2Box : ""}>
                    <Text style={isLandscape ? styles.landscapeNameLabel : styles.nameLabel}>Blue corner name:</Text>
                    <TextInput
                        placeholder="Enter name.."
                        placeholderTextColor="#322fd3"
                        value={fighter2Name}
                        onChangeText={setFighter2Name}
                        style={isLandscape ? styles.landscapeFighter2Input : styles.fighter2Input}
                    />
                </View>
            </View>

            {/* Round input  */}
            <Text style={isLandscape ? styles.landscapeRoundLabel : styles.nameLabel}>Number of rounds:</Text>
            <View style={isLandscape ? styles.landscapeRoundsContainer : styles.roundsContainer}>
                {rounds.map((round) => (
                    <Pressable
                        key={round}
                        style={[
                            styles.roundButton,
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

            {!isLandscape && 
                <View style={isLandscape ? styles.landscapeButtonContainer : ""}>
                
                    {/* Enter scorecard button  */}
                    <Pressable
                        style={isLandscape ? styles.landscapeButton : styles.button}
                        onPress={handleStartFight}
                    >
                        <Text style={styles.buttonText}>{buttonText}</Text>
                    </Pressable>
                    
                    {/* save and exit button  */}
                    {isEditing && 
                        <Pressable
                            style={isLandscape ? styles.landscapeButton : styles.button}
                            onPress={handleSaveChangesAndExit}
                        >
                            <Text style={styles.buttonText}>Save Changes & Exit</Text>
                        </Pressable>
                    }
                    {/* Cancel button  */}
                    <Pressable
                        style={isLandscape ? styles.landscapeButton : styles.cancelButton}
                        onPress={() => router.dismissTo('/')}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                </View>
            }
            {isLandscape && 
                <View style={isEditing ? styles.landscapeButtonContainer : styles.landscapeEditButtonContainer}>
                
                    {/* Cancel button  */}
                    <Pressable
                        style={isLandscape ? styles.landscapeCancelButton : styles.cancelButton}
                        onPress={() => router.dismissTo('/')}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>

                    {/* save and exit button  */}
                    {isEditing && 
                        <Pressable
                            style={isLandscape ? styles.landscapeButton : styles.button}
                            onPress={handleSaveChangesAndExit}
                        >
                            <Text style={styles.buttonText}>Save Changes & Exit</Text>
                        </Pressable>
                    }
                    {/* Enter scorecard button  */}
                    <Pressable
                        style={isLandscape ? styles.landscapeButton : styles.button}
                        onPress={handleStartFight}
                    >
                        <Text style={styles.buttonText}>{buttonText}</Text>
                    </Pressable>
                </View>
            }
            <Image source={tIcon} style={styles.icon} resizeMode="contain" />
        </View>
    );
}

const styles = StyleSheet.create({
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
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 25,
        width: 250
    },
    buttonText: {
        color: '#307Fb6',
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center'
    },
    cancelButton: {
        backgroundColor: '#de2f2f',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 25,
        width: 250,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#fff'
    },
    landscapeCancelButton: {
        backgroundColor: '#de2f2f',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 25,
        width: 200,
        borderWidth: 1,
        borderColor: '#fff'
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center'
    },
    container: {
        flex: 1,
        backgroundColor: '#307Fb6',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    fighter1input: {
        backgroundColor: '#fff',
        width: '100%',
        padding: 12,
        borderRadius: 8,
        marginBottom: 36,
        color: '#D32f2f',
        fontWeight: 600,
    },
    fighter2Input: {
        backgroundColor: '#fff',
        width: '100%',
        padding: 12,
        borderRadius: 8,
        color: '#322fd3',
        marginBottom: 36,
        fontWeight: 600,
    },
    icon: {
        width: 100,
        position: 'absolute',
        top: '30%'
    },
    inputContainer: {
        width: '100%'
    },
    nameLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 12,
        marginLeft: 0,
        alignSelf: 'flex-start'
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
        borderColor: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 8,
        marginRight: 10.5,
    },
    roundButtonSelected: {
        backgroundColor: '#fff',
    },
    roundButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    roundButtonTextSelected: {
        color: '#307Fb6',
    },
    roundsContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        alignSelf: 'flex-start',
    },
    title: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 50,
        marginTop: -75
    },

    // LANDSCAPE STYLES
    landscapeButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 25,
        width: 200
    },
    landscapeButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '87%',
        position: 'absolute',
        top: '85%'
    },
    landscapeEditButtonContainer: {
    flexDirection: 'row',
        justifyContent: 'space-between',
        width: '63%',
        position: 'absolute',
        top: '85%'
    },
    landscapeContainer: {
        flex: 1,
        backgroundColor: '#307Fb6',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        paddingTop: 25
    },
    landscapeFighter1Box: {
        width: '50%'
    },
    landscapeFighter2Box: {
        width: '50%'
    },
    landscapeFighter1Input: {
        backgroundColor: '#fff',
        color: "#fff",
        width: '75%',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        textAlign: 'center'
    },
    landscapeFighter2Input: {
        backgroundColor: '#fff',
        width: '75%',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        textAlign: 'center'

    },
    landscapeNameLabel: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 12,
        width: '75%',
        textAlign: 'center'
    },
    landscapeRoundLabel: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 12,
        marginTop: '8%',
        // marginLeft: '33%',
        alignSelf: 'center'
    },
    landscapeInputContainer: {
        width: '100%',
        left: '9%',
        flexDirection: 'row',
        top: '25%',
        position: 'absolute'
    },
    landscapeRoundsContainer: {
        flexDirection: 'row',
        // marginBottom: 25,
        //center rounds container in landscape
        justifyContent: 'center',
        // alignSelf: 'flex-start',
        
    },
    landscapeTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '700',
        // marginBottom: 25,
        // marginTop: -25,
        position: 'absolute',
        top: 25
    },
});
