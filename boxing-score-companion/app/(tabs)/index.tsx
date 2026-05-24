import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Image, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SavedCard from '../components/savedCard';
const tIcon = require('../../assets/images/flatwhitet.png');

const SAVED_CARDS_KEY = 'savedScorecards';

type Scorecard = {
  id: number;
  fighter1: string;
  fighter2: string;
  fighter1Score: number;
  fighter2Score: number;
  fighter1KD: number;
  fighter2KD: number;
  fighter1Pen: number;
  fighter2Pen: number;
  rounds: number;
};

export default function HomeScreen() {
  const router = useRouter();
  const { savedScorecard } = useLocalSearchParams();
  const lastSavedScorecard = useRef<string | null>(null);
  const [savedCards, setSavedCards] = useState<Scorecard[]>([]);
  const [hasLoadedSavedCards, setHasLoadedSavedCards] = useState(false);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  useEffect(() => {
    const loadSavedCards = async () => {
      try {
        const storedCards = await AsyncStorage.getItem(SAVED_CARDS_KEY);

        if (storedCards) {
          setSavedCards(JSON.parse(storedCards) as Scorecard[]);
        }
      } finally {
        setHasLoadedSavedCards(true);
      }
    };

    void loadSavedCards();
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedCards) return;

    const scorecardParam = Array.isArray(savedScorecard) ? savedScorecard[0] : savedScorecard;

    if (!scorecardParam || scorecardParam === lastSavedScorecard.current) return;

    try {
      const scorecard = JSON.parse(scorecardParam) as Scorecard;
      lastSavedScorecard.current = scorecardParam;
      setSavedCards((currentCards) => {
        if (currentCards.some((card) => card.id === scorecard.id)) {
          return currentCards;
        }

        const nextCards = [scorecard, ...currentCards];
        void AsyncStorage.setItem(SAVED_CARDS_KEY, JSON.stringify(nextCards));
        return nextCards;
      });
    } catch {
      lastSavedScorecard.current = scorecardParam;
    }
  }, [hasLoadedSavedCards, savedScorecard]);

  const handleStartFight = () => {
    router.push({
      pathname: '/createMatch',
    });
  };

  return (
    <View style={isLandscape ? styles.landscapeContainer : styles.container}>
      <View style={styles.titleBigContainer}>
        <View style={styles.titleRight}>
          <Text style={styles.title}>Boxing</Text> 
          <View style={styles.title2Container}>
            <Text style={styles.title2}>
              Score
            </Text>
          </View>
          <Text style={styles.title3}> Companion</Text>
        </View>
        <Image source={tIcon} style={styles.icon} resizeMode="contain" />
      </View>
      <View style={styles.searchBox}>
        {/* <Text style={styles.search}> Search Cards</Text> */}
        <View style={styles.searchInputBox}>
          <Ionicons name="search" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput} 
            placeholderTextColor="rgba(255, 255, 255, 0.5)" 
            placeholder="Search Cards" 
          />
        </View>
      </View>
      <View style={styles.savedCardContainer}>
        {savedCards.map((card) => (
          <SavedCard
            key={card.id}
            fighter1={card.fighter1}
            fighter2={card.fighter2}
            fighter1Score={card.fighter1Score}
            fighter2Score={card.fighter2Score}
            fighter1KD={card.fighter1KD}
            fighter2KD={card.fighter2KD}
            fighter1Pen={card.fighter1Pen}
            fighter2Pen={card.fighter2Pen}
            rounds={card.rounds}
          />
        ))}
      </View>
      <Pressable 
        style={isLandscape ? styles.landscapeButton : styles.button}
        onPress={handleStartFight}
      >
        <Text style={styles.buttonText}>+ New Scorecard</Text>
      </Pressable>
      
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    color: "#fff",
    fontWeight: 700,
    left: -5
  },
  searchInput: {
    width: '100%',
    height: 20,
    color: 'white'
  },
  searchIcon: {
    color: "#fff",
    top: 4,
    marginRight: 5
  },
  searchInputBox: {
    marginTop: 10,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'white'

  },
  searchBox: {
    // borderBottomWidth: 1,
    // borderBottomColor: '#fff',
    width: '45%',
    color: 'pink',
    height: 50,
    top: 230,
    left: -85
  },
  savedCardContainer: {
    top: 140,
    
  },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 50,
    bottom: 50,
    position: 'absolute'
  },
  landscapeButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 25,
  },
  buttonText: {
    color: '#111',
    fontSize: 18,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: '#307Fb6',
    alignItems: 'center',
    // justifyContent: 'center',
    // padding: 24,
  },
  landscapeContainer: {
    flex: 1,
    backgroundColor: '#307Fb6',
    alignItems: 'center',
    padding: 24,
    paddingTop: 25,
  },
  icon: {
    width: 120,
    height: 120,
    marginBottom: 36,
    marginLeft: -5
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 3,
    marginLeft: 7
  },
  title2: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  title2Container: {
    backgroundColor: '#D32F2F',
    width: 155,
    paddingHorizontal: 0,
    paddingVertical: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
    opacity: 1,
    borderWidth: 0,
    paddingLeft: 5,
    marginLeft: 2,
  },
  title3: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 50,
  },
  titleBigContainer: {
    position: 'absolute',
    top: 95,
    left: 12,
    right: 0,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  titleRight: {
    marginLeft: 0,
  },
  
  // landscapeTitle: {
  //   color: '#fff',
  //   fontSize: 28,
  //   fontWeight: '700',
  //   marginBottom: 50,
  //   marginTop: -75
  // },
});
