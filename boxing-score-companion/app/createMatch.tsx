import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CreateMatch() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const title = String(params.title || 'Create Match');
    const backText = String(params.backText || "")
    const fighter1 = String(params.fighter1 || '');
    const fighter2 = String(params.fighter2 || '');
    const roundAmount = Number(params.rounds || params.roundAmount || 3);
    const [fighter1Name, setFighter1Name] = useState(fighter1);
    const [fighter2Name, setFighter2Name] = useState(fighter2);
    const [selectedRounds, setSelectedRounds] = useState(roundAmount);
    const [buttonText, setButtonText] = useState(params.buttonText || "Start Match")
    const rounds = [3, 4, 5, 6, 8, 10, 12];
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

    return (
        <View style={isLandscape ? styles.landscapeContainer : styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <Pressable style={styles.backBox} onPress={() => router.dismissTo('/')}>
                <Ionicons style={styles.backIcon} name='caret-back' size={24} color={'#fff'} />
                <Text style={styles.backText}>Back to Menu</Text>
            </Pressable>
            <Text style={isLandscape ? styles.landscapeTitle : styles.title}>{title}</Text>
            <Text style={isLandscape ? styles.landscapeNameLabel : styles.nameLabel}>Fighter 1 name:</Text>
            <TextInput 
                placeholder="Enter name.." 
                value={fighter1Name}
                placeholderTextColor="#D32f2f" 
                onChangeText={setFighter1Name}
                style={isLandscape ? styles.landscapeFighter1Input : styles.fighter1input} 
            />
            <Text style={isLandscape ? styles.landscapeNameLabel : styles.nameLabel}>Fighter 2 name:</Text>
            <TextInput 
                placeholder="Enter name.." 
                placeholderTextColor="#322fd3" 
                value={fighter2Name}
                onChangeText={setFighter2Name}
                style={isLandscape ? styles.landscapeFighter2Input : styles.fighter2Input} 
            />
            <Text style={isLandscape ? styles.landscapeNameLabel : styles.nameLabel}>Number of rounds:</Text>
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
            <Pressable 
                style={isLandscape ? styles.landscapeButton : styles.button}
                onPress={handleStartFight}
            >
                <Text style={styles.buttonText}>{buttonText}</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#307Fb6',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    backBox: {
        flexDirection: 'row',
        position: 'absolute',
        left: 15,
        top: 75,
    },
    backIcon:{
        top: 2,
        marginRight: 2
    },
    backText: {
        top: 5,
        fontSize: 14,
        color: '#fff',
        fontWeight: 500
    },
    landscapeContainer: {
        flex: 1,
        backgroundColor: '#307Fb6',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        paddingTop: 25
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
    landscapeFighter1Input: {
        backgroundColor: '#fff', 
        color: "#fff",
        width: '50%', 
        padding: 12, 
        borderRadius: 8, 
        marginBottom: 24
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
    landscapeFighter2Input: {
        backgroundColor: '#fff', 
        width: '50%', 
        padding: 12, 
        borderRadius: 8, 
        marginBottom: 24
    },
    title: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 50,
        marginTop: -75
    },
    landscapeTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 50,
        marginTop: -75
    },
    nameLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 12,
        marginLeft: 0,
        alignSelf: 'flex-start'
    },
    landscapeNameLabel: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 12,
        marginLeft: '25%',
        alignSelf: 'flex-start'
    },
    roundsContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        alignSelf: 'flex-start',
    },
    landscapeRoundsContainer: {
        flexDirection: 'row',
        marginBottom: 0,
        //center rounds container in landscape
        justifyContent: 'center',
        // alignSelf: 'flex-start',
    },
    roundButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 8,
        marginRight: 9.5,
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
    button: {
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 50
    },
    landscapeButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 25
    },
    buttonText: {
        color: '#111',
        fontSize: 18,
        fontWeight: '700',
    },
});
