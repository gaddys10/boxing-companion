import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Image, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SavedCard from '../components/savedCard';
import LandscapeSavedCard from '../components/landscapeSavedCard';
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
  savedScores?: string;
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
        const existingCardIndex = currentCards.findIndex((card) => card.id === scorecard.id);

        if (existingCardIndex !== -1) {
          const nextCards = [...currentCards];
          nextCards[existingCardIndex] = scorecard;
          void AsyncStorage.setItem(SAVED_CARDS_KEY, JSON.stringify(nextCards));
          return nextCards;
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

  const handleDeleteCard = (cardId: number) => {
    setSavedCards((currentCards) => {
      const nextCards = currentCards.filter((card) => card.id !== cardId);
      void AsyncStorage.setItem(SAVED_CARDS_KEY, JSON.stringify(nextCards));
      return nextCards;
    });
  };

  return (
    <View style={isLandscape ? styles.landscapeContainer : styles.container}>
      <View style={isLandscape? styles.landscapeTitleBigContainer : styles.titleBigContainer}>
        <View style={styles.titleRight}>
          <Text style={isLandscape ? styles.landscapeTitle : styles.title}>Boxing</Text> 
          <View style={styles.title2Container}>
            <Text style={isLandscape? styles.landscapeTitle2 : styles.title2}>
              Score
            </Text>
          </View>
          <Text style={isLandscape ? styles.landscapeTitle3 : styles.title3}> Companion</Text>
        </View>
        <Image source={tIcon} style={isLandscape ? styles.landscapeIcon : styles.icon} resizeMode="contain" />
      </View>

      <View style={isLandscape ? styles.landscapeSearchBox : styles.searchBox }>
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
      {isLandscape && 
        <View style={isLandscape ? styles.landscapeSavedCardContainer : styles.savedCardContainer}>
          
          {savedCards.map((card) => (
            <LandscapeSavedCard
              key={card.id}
              id={card.id}
              fighter1={card.fighter1}
              fighter2={card.fighter2}
              fighter1Score={card.fighter1Score}
              fighter2Score={card.fighter2Score}
              fighter1KD={card.fighter1KD}
              fighter2KD={card.fighter2KD}
              fighter1Pen={card.fighter1Pen}
              fighter2Pen={card.fighter2Pen}
              rounds={card.rounds}
              savedScores={card.savedScores}
              onDelete={handleDeleteCard}
            />
          ))}

        </View>
      }
      {!isLandscape &&
        <View style={isLandscape ? styles.landscapeSavedCardContainer : styles.savedCardContainer}>
            
            {savedCards.map((card) => (
              <SavedCard
                key={card.id}
                id={card.id}
                fighter1={card.fighter1}
                fighter2={card.fighter2}
                fighter1Score={card.fighter1Score}
                fighter2Score={card.fighter2Score}
                fighter1KD={card.fighter1KD}
                fighter2KD={card.fighter2KD}
                fighter1Pen={card.fighter1Pen}
                fighter2Pen={card.fighter2Pen}
                rounds={card.rounds}
                savedScores={card.savedScores}
                onDelete={handleDeleteCard}
              />
            ))}

        </View>
      }

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
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 50,
    bottom: 35,
    position: 'absolute'
  },
  container: {
    flex: 1,
    backgroundColor: '#307Fb6',
    alignItems: 'center'
  },
  buttonText: {
    color: '#111',
    fontSize: 14,
    fontWeight: '700',
  },
  icon: {
    width: 110,
    height: 110,
    marginBottom: 36,
    marginLeft: -5
  },
  savedCardContainer: {
    top: 130,
  },
  search: {
    color: "#fff",
    fontWeight: 700,
    left: -5
  },
  searchBox: {
    width: '45%',
    height: 50,
    top: 215,
    left: -85
  },
  searchIcon: {
    color: "#fff",
    top: 4,
    marginRight: 5
  },
  searchInput: {
    width: '100%',
    height: 20,
    color: 'white'
  },
  searchInputBox: {
    marginTop: 10,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'white'
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 3,
    marginLeft: 7
  },
  title2: {
    color: '#fff',
    fontSize: 26,
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
    fontSize: 26,
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

  //Landscape styles

  landscapeButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    // marginTop: 25,
    top: '6.5%',
    right: '8%',
    position: 'absolute'
  },
  landscapeContainer: {
    flex: 1,
    backgroundColor: '#307Fb6',
    alignItems: 'center',
    padding: 24,
    paddingTop: 25,
  },
  landscapeIcon: {
    width: 60,
    height: 60,
    marginBottom: 45,
    marginLeft: -5
  },
  landscapeSavedCardContainer: {
    top: '-6%',
    width: '91.5%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  landscapeSearchBox: {
    width: '35%',
    height: 50,
    top: '18%',
    left: '-28.25%',
  },
  landscapeTitleBigContainer: {
    top: '4%',
    position: 'absolute',
    left: 50,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  landscapeTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
    marginLeft: 7
  },
  landscapeTitle2: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  landscapeTitle3: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 50,
    marginLeft: 3
  },
  
  landscapeButtonText: {},
  landscapeSearch: {},
  
  landscapeTitleContainer: {},
});
