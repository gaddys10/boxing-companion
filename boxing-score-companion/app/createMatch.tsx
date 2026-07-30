import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, useWindowDimensions, Image } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
const tIcon = require('../assets/images/flatwhitet.png');
import Dimensions from 'react-native/Libraries/Utilities/Dimensions';
import { Ionicons } from '@expo/vector-icons';



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
    const title = String(params.title || 'New Scorecard');
    const fighter1 = String(params.fighter1 || '');
    const fighter2 = String(params.fighter2 || '');
    const isEditing = params.isEdit ? true : false
    const roundAmount = Number(params.rounds || params.roundAmount || 10);
    const [fighter1Name, setFighter1Name] = useState(fighter1);
    const [fighter2Name, setFighter2Name] = useState(fighter2);
    const [selectedRounds, setSelectedRounds] = useState(roundAmount);


    // const [selectedGender, setSelectedGender] = useState("");
    // const [selectedWeight, setSelectedWeight] = useState<number | string>(0);

    const initialGender = Array.isArray(params.gender)
        ? params.gender[0]
        : params.gender;

    const initialWeight = Array.isArray(params.weight)
        ? params.weight[0]
        : params.weight;

    const [selectedGender, setSelectedGender] = useState<"" | "mens" | "womens">(
        initialGender === "mens" || initialGender === "womens"
            ? initialGender
            : ""
    );

    const [selectedWeight, setSelectedWeight] = useState<number | string>(() => {
        if (!initialWeight) return 0;
        return initialWeight === "200+" ? "200+" : Number(initialWeight);
    });


    const buttonText = String(params.buttonText || "Create Scorecard");
    const rounds = [4, 5, 6, 8, 10, 12];
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
                gender: selectedGender,
                weight: selectedWeight
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
                    gender: selectedGender,
                    weight: selectedWeight,
                    ...getScorecardTotals(savedScores),
                }),
            },
        });
    };

    return (
        <View style={isLandscape ? styles.landscapeContainer : styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Page title -- Create Scorecard  */}
            <View style={styles.titleContainer}>
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
                        style={isLandscape ? styles.landscapeFighter1Input : styles.fighter1input}
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
                        style={isLandscape ? styles.landscapeFighter2Input : styles.fighter2Input}
                    />
                </View>
            </View>

            {/* Round input  */}
            <Text style={isLandscape ? styles.landscapeRoundLabel : styles.blackNameLabel}>Select number of rounds:</Text>
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

            <Text style={isLandscape ? styles.landscapeRoundLabel : styles.blackNameLabel}>
                Select gender: <Text style={styles.optionalLabel}>(optional)</Text>
            </Text>
            <View style={styles.genderPills}>
                <Pressable
                    style={[
                        styles.malePill,
                        selectedGender === "mens" && styles.malePillSelected
                    ]}
                    onPress={() => selectedGender === "mens" ? setSelectedGender("") : setSelectedGender('mens')}
                >
                    {selectedGender === "mens" ?
                        <Ionicons name={'male-outline'} size={18} color="#fff"/>
                    :
                        <Ionicons name={'male-outline'} size={18} color="#b6c6d1"/>
                    }
                    {/* <Ionicons name={'male-outline'} size={18} color="#b6c6d1" /> */}
                    <Text style={[
                        styles.maleText,
                        selectedGender === "mens" && styles.maleTextSelected
                    ]}>{"Men's"}</Text>
                </Pressable>


                <Pressable style={[
                    styles.femalePill,
                    selectedGender === "womens" && styles.femalePillSelected
                    ]}
                    onPress={() => selectedGender=== "womens"? setSelectedGender("") : setSelectedGender("womens")}
                >
                    {selectedGender === "womens" ?
                        <Ionicons name={'female-outline'} size={18} color="#fff"/>
                    :
                        <Ionicons name={'female-outline'} size={18} color="#b6c6d1"/>
                    }
                    <Text style={[
                        styles.femaleText,
                        selectedGender === "womens" && styles.femaleTextSelected
                    ]}>{"Women's"}</Text>
                </Pressable>
            </View>

            <Text style={isLandscape ? styles.landscapeRoundLabel : styles.blackNameLabel}>
                Select weight class: <Text style={styles.optionalLabel}>(optional)</Text>
            </Text>

            {/* <Pressable
                key={round}
                style={[
                    styles.roundButton,
                    selectedRounds === round && styles.roundButtonSelected,
                ]}
                onPress={() => setSelectedRounds(round)}
            ></Pressable> */}

            <View style={styles.weightClassContainer}>
                <View style={styles.weightColumnLeft}>
                    {[102, 112, 122, 135, 154, 175].map((weight) => (
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
            </View>


            {!isLandscape ? 
                <View style={styles.buttonContainer}>
                
                    {/* Cancel button  */}
                    <Pressable
                        style={[styles.cancelButton, isEditing && styles.editingActionButton]}
                        onPress={() => router.dismissTo('/')}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>

                    {/* save and exit button  */}
                    {isEditing && 
                        <Pressable
                            style={[styles.button, styles.editingActionButton]}
                            onPress={handleSaveChangesAndExit}
                        >
                            <Text style={[styles.buttonText, styles.editingButtonText]}>Save & Exit</Text>
                        </Pressable>
                    }
                    {/* Enter scorecard button  */}
                    <Pressable
                        style={[styles.button, isEditing && styles.editingActionButton]}
                        onPress={handleStartFight}
                    >
                        <Text style={[styles.buttonText, isEditing && styles.editingButtonText]} onPress={handleStartFight}>{buttonText}</Text>
                    </Pressable>
                </View>
            :
                <View style={isEditing ? styles.landscapeEditButtonContainer: styles.landscapeButtonContainer}>
                    {/* save and exit button  */}
                    {isEditing && 
                        <Pressable
                            style={[styles.editButton, styles.editingActionButton]}
                            onPress={handleSaveChangesAndExit}
                        >
                            <Text style={[styles.buttonText, styles.editingButtonText]}>Save & Exit</Text>
                        </Pressable>
                    }
                    {/* Cancel button  */}
                    <Pressable
                        style={[styles.cancelButton, isEditing && styles.editingActionButton]}
                        onPress={() => router.dismissTo('/')}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>

                    {/* Enter scorecard button  */}
                    <Pressable
                        style={[styles.landscapeButton, isEditing && styles.editingActionButton]}
                        onPress={handleStartFight}
                    >
                        <Text style={[styles.buttonText, isEditing && styles.editingButtonText]} onPress={handleStartFight}>
                            {buttonText}
                        </Text>
                    </Pressable>
                </View>
            }
            {/* <Image source={tIcon} style={styles.icon} resizeMode="contain" /> */}
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
        paddingHorizontal: '1%',
        paddingVertical: '2%',
        borderRadius: 12,
        // marginTop: 25,
        width: '48%',
        height: '18%',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '2px 4px 6px rgba(0, 0, 0, 0.3)',
        borderWidth: 1,
        borderColor: '#B6C6D1'
    },
    editButton: {
        backgroundColor: '#fff',
        paddingHorizontal: '1%',
        paddingVertical: '2%',
        borderRadius: 12,
        // marginTop: 25,
        width: '24%',
        height: '18%',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '2px 4px 6px rgba(0, 0, 0, 0.3)',
        borderWidth: 1,
        borderColor: '#B6C6D1'
    },
    buttonContainer: {
        flexDirection: 'row',
        top: '2.5%',
        height: '25%',
        justifyContent: 'space-between',
        width: '100%'
    },
    buttonText: {
        color: '#307Fb6',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center'
    },
    editingActionButton: {
        width: '31%',
        paddingHorizontal: '1%',
    },
    editingButtonText: {
        fontSize: 14,
    },
    cancelButton: {
        backgroundColor: '#de2f2f',
        paddingHorizontal: 24,
        // paddingVertical: '2%',
        borderRadius: 12,
        // marginTop: 25,
        width: '48%',
        height: '18%',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '2px 4px 6px rgba(0, 0, 0, 0.3)',
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
        // backgroundColor: 'pink',
        height: '100%',
        width: '33%',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5.5,

                // gap: 1,

    },
    weightColumnCenter: {
        // backgroundColor: 'orange',
        height: '100%',
        width: '33%',
        flexDirection: 'column',
        alignItems: 'center',
        // gap: 1,
        gap: 5.5,

    },
    weightColumnRight: {
        // backgroundColor: 'orange',
        height: '100%',
        width: '33%',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5.5,

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
        marginBottom: 10,
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
        marginBottom: 10,
        marginLeft: 0,
        alignSelf: 'flex-start'
    },
    redNameLabel: {
        color: '#D32f2f',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 10,
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
            color: '#B6C6D1',
            marginLeft: 5
        },
        maleTextSelected: {
            color: 'white',
            marginLeft: 5

        },
        femaleText: {
            color: '#B6C6D1',
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
        width: '10%',
        paddingVertical: 7,
        borderRadius: 8,
        marginRight: '2.5%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    roundButtonSelected: {
        backgroundColor: '#307fb6',
        borderColor: "#fff"
    },
    roundButtonText: {
        color: '#b6c6d1',
        fontSize: 14,
        fontWeight: '500',
    },
    roundButtonTextSelected: {
        color: '#fff',
    },
    roundsContainer: {
        flexDirection: 'row',
        marginBottom: '9%',
        alignSelf: 'center',
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginTop: '12%'
    },
    titleContainer: {
        backgroundColor: '#307fb6',
        height: '12%',
        width: '115%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 15,
        marginBottom: '7%',
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
        top: '88%'
    },

    landscapeEditButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '87%',
        position: 'absolute',
        top: '88%'
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
    fighter1Box: {

    },
    fighter2Box: {

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
