import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Image, useWindowDimensions, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SavedCard from '../components/savedCard';
import LandscapeSavedCard from '../components/landscapeSavedCard';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
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
  const [scrollY, setScrollY] = useState(0);
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0);
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

  const borderFadeColor = isLandscape ? '#307FB6' : '#F1F5F8';

  return (
    <LinearGradient
      colors={[
        'rgba(211, 47, 47, 0.9)',
        borderFadeColor,
        borderFadeColor,
        'rgba(48, 127, 182, 0.9)',
      ]}
      locations={[0, 0.32, 0.68, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.neonPageBorder, isLandscape && styles.landscapeNeonPageBorder]}
    >
      <StatusBar style="dark" />
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
          <View style={styles.searchInputBox}>
            <Ionicons name="search" style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput} 
              placeholderTextColor="rgba(0, 0, 0, 0.5)" 
              placeholder="Search Cards" 
            />
          </View>
        </View>
        {isLandscape && 
          <ScrollView
            style={styles.landscapeSavedCardContainer}
            contentContainerStyle={styles.landscapeSavedCardContent}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
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
          </ScrollView>
        }
        {!isLandscape &&
          <ScrollView
            style={styles.savedCardContainer}
            contentContainerStyle={styles.savedCardContent}
            showsVerticalScrollIndicator={true}
            onScroll={(event) => setScrollY(event.nativeEvent.contentOffset.y)}
            onLayout={(event) => setScrollViewportHeight(event.nativeEvent.layout.height)}
            bounces={false}
            alwaysBounceVertical={false}
          >
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
                scrollY={scrollY}
                viewportHeight={scrollViewportHeight}
              />
            ))}
          </ScrollView>
        }

        <Pressable 
          style={isLandscape ? styles.landscapeButton : styles.button}
          onPress={handleStartFight}
        >
          <Text style={styles.buttonText}>+ New Scorecard</Text>
        </Pressable>
        
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  neonPageBorder: {
    flex: 1,
    padding: 4,
    paddingVertical: 5,
  },
  landscapeNeonPageBorder: {
    padding: 6,
    paddingVertical: 6,
    borderRadius: 10
  },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: '5%',
    paddingVertical: '3%',
    borderRadius: 12,
    marginTop: 50,
    bottom: '3.5%',
    position: 'absolute',
    boxShadow: '4',
    shadowColor: '#11334b',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
    borderWidth: 1,
    borderColor: '#B6C6D1',
  },
  container: {
    flex: 1,
    backgroundColor: '#f1f5f8',
    alignItems: 'center',
    borderRadius: 40
  },
  buttonText: {
    color: '#111',
    fontSize: 14,
    fontWeight: '700',
  },
  icon: {
    width: '35%',
    height: '85%',
    marginLeft: '-2%',
    alignSelf: 'center',
  },

  savedCardContainer: {
    position: 'absolute',
    top: '26.25%',
    bottom: 91,
    width: '100%',
    borderRadius: 25,
  },
  savedCardContent: {
    alignItems: 'center',
    gap: 0
  },
  search: {
    color: "#fff",
    fontWeight: 700,
    left: -5
  },
  searchBox: {
    width: '45%',
    height: 50,
    top: '20.5%',
    alignSelf: 'flex-start',
    marginLeft: '5.5%',
  },
  searchIcon: {
    color: "#000",
    top: 0,
    marginRight: 5
  },
  searchInput: {
    width: '100%',
    height: 20,
    color: 'black'
  },
  searchInputBox: {
    flexDirection: 'row',
    backgroundColor: '#E1EAF0',
    borderWidth: 1,
    borderColor: '#B6C6D1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 35,
    marginLeft: -3,
    alignItems: 'center',
  },
  swipeContainer: {
    flexDirection: 'row',
    width: '25%'
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: '1.5%',
    marginLeft: '4.5%'
  },
  title2: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
  },
  title2Container: {
    backgroundColor: '#D32F2F',
    width: '100%',
    paddingHorizontal: 0,
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
  },
  titleBigContainer: {
    position: 'absolute',
    top: '6%',
    left: '5%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    boxShadow: '2px 4px 6px rgba(0, 0, 0, 0.1)',
    width: '90%',
    borderRadius: 15,
    backgroundColor: '#307Fb6',
    height: '13%',
    paddingVertical: 0,
  },
  titleRight: {
    height: '100%',
    justifyContent: 'center',
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
    position: 'absolute',
    boxShadow: '4',
    shadowColor: '#11334b',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
    borderWidth: 1,
    borderColor: '#B6C6D1'
  },
  landscapeContainer: {
    flex: 1,
    backgroundColor: '#f1f5f8',
    alignItems: 'center',
    borderRadius: 40

  },
  landscapeIcon: {
    width: 60,
    height: 60,
    marginLeft: -5,
    alignSelf: 'center',
  },
  landscapeSavedCardContainer: {
    position: 'absolute',
    top: 60,
    bottom: '0%',
    left: '4.5%',
    width: '100%',
  },
  landscapeSavedCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 0,
    paddingRight: 16,
    paddingBottom: 20,
  },
  landscapeSearchBox: {
    width: '35%',
    height: 50,
    top: '26%',
    alignSelf: 'flex-start',
    marginLeft: '4.5%',
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
