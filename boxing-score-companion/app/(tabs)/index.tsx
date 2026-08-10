import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Image, useWindowDimensions, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SavedCard from '../components/savedCard';
import LandscapeSavedCard from '../components/landscapeSavedCard';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const tIcon = require('../../assets/images/flatwhitet.png');

const SAVED_CARDS_KEY = 'savedScorecards';

type Scorecard = {
  id: number;
  fighter1: string;
  fighter2: string;
  fighter1Score: number | string;
  fighter2Score: number | string;
  fighter1KD: number;
  fighter2KD: number;
  fighter1Pen: number;
  fighter2Pen: number;
  rounds: number;
  gender?: string;
  weight?: string;
  savedScores?: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const { savedScorecard } = useLocalSearchParams();
  const lastSavedScorecard = useRef<string | null>(null);
  const [savedCards, setSavedCards] = useState<Scorecard[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [hasLoadedSavedCards, setHasLoadedSavedCards] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const insets = useSafeAreaInsets();

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

  const filteredCards = useMemo(() => {
    const searchTerm = searchInput.trim().toLocaleLowerCase();

    if (!searchTerm) return savedCards;

    return savedCards.filter(
      (card) =>
        card.fighter1.toLocaleLowerCase().includes(searchTerm) ||
        card.fighter2.toLocaleLowerCase().includes(searchTerm),
    );
  }, [savedCards, searchInput]);

  const borderFadeColor = isLandscape ? '#307FB6' : '#F1F5F8';

  return (
    <>
      <StatusBar style="dark" />
      <View style={[
        isLandscape ? styles.landscapeContainer : styles.container,
        isLandscape && {
          paddingLeft: Math.max(insets.left, 8),
          paddingRight: Math.max(insets.right, 8),
        },
      ]}>
        {isLandscape ? (
          <View style={styles.landscapeHeader}>
            <View style={styles.landscapeTitleBigContainer}>
              <View style={styles.landscapeTitleRight}>
                <Text style={styles.landscapeTitle}>Boxing</Text>
                <View style={styles.title2Container}><Text style={styles.landscapeTitle2}>Score</Text></View>
                <Text style={styles.landscapeTitle3}> Companion</Text>
              </View>
              <Image source={tIcon} style={styles.landscapeIcon} resizeMode="contain" />
            </View>
            <View style={styles.landscapeSearchBox}>
              <View style={styles.searchInputBox}>
                <Ionicons name="search" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholderTextColor="rgba(0, 0, 0, 0.5)"
                  placeholder="Search Scorecards"
                  value={searchInput}
                  onChangeText={setSearchInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                />
              </View>
            </View>
            <Pressable style={styles.landscapeButton} onPress={handleStartFight}>
              <Text numberOfLines={1} style={styles.buttonText}>+ New Scorecard</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.titleBigContainer}>
              <View style={styles.titleRight}>
                <Text style={styles.title}>Boxing</Text>
                <View style={styles.title2Container}><Text style={styles.title2}>Score</Text></View>
                <Text style={styles.title3}> Companion</Text>
              </View>
              <Image source={tIcon} style={styles.icon} resizeMode="contain" />
            </View>
            <View style={styles.searchBox}>
              <View style={styles.searchInputBox}>
                <Ionicons name="search" style={styles.searchIcon} />
                <TextInput style={styles.searchInput} placeholderTextColor="rgba(0, 0, 0, 0.5)" placeholder="Search Scorecards" value={searchInput} onChangeText={setSearchInput} autoCapitalize="none" autoCorrect={false} clearButtonMode="while-editing" />
              </View>
            </View>
          </>
        )}
        {isLandscape && 
          <ScrollView
            style={styles.landscapeSavedCardContainer}
            contentContainerStyle={styles.landscapeSavedCardContent}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {filteredCards.map((card) => (
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
                gender={card.gender}
                weight={card.weight}
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
            {filteredCards.map((card) => (
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
                gender={card.gender}
                weight={card.weight}
                savedScores={card.savedScores}
                onDelete={handleDeleteCard}
                scrollY={scrollY}
                viewportHeight={scrollViewportHeight}
              />
            ))}
          </ScrollView>
        }

        {!isLandscape && (
          <Pressable style={styles.button} onPress={handleStartFight}>
            <Text style={styles.buttonText}>+ New Scorecard</Text>
          </Pressable>
        )}
        
      </View>
      </>
    // </LinearGradient>
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
    bottom: '4%',
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
    bottom: 90,
    width: '100%',
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    overflow: 'hidden',
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
    paddingHorizontal: 14,
    minHeight: 44,
    position: 'absolute',
    top: '10%',
    right: '1.25%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    // borderRadius: 40,
    padding: 8,
    gap: 8,
  },
  landscapeIcon: {
    width: 60,
    height: 60,
    marginLeft: -5,
    alignSelf: 'center',
  },
  landscapeSavedCardContainer: {
    position: 'absolute',
    top: '45%',
    bottom: 0,
    left: '8%',
    width: '100%',
    height: '55%',
    backgroundColor: '#f1f5f8',
    overflow: 'hidden',
    elevation: 2,

  },
  landscapeSavedCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 0,
    gap: 13,
    paddingRight: 5,
    paddingBottom: 8,
  },
  landscapeSearchBox: {
    position: 'absolute',
    top: '128%',
    left: '.25%',
    width: '33%',
    height: '25%',
  },
  landscapeHeader: {
    width: '100%',
    height: '23%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  landscapeTitleBigContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderRadius: 15,
    position: 'absolute',
    top: 10,
    left: -2,
    
    backgroundColor: '#307Fb6',
    width: '33.5%',
    // aspectRatio: 5.2,
    height: '100%'
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
    marginBottom: 0,
    marginLeft: 3
  },
  landscapeTitleRight: {
    height: '100%',
    justifyContent: 'center'
  },
  
  landscapeButtonText: {},
  landscapeSearch: {},
  
  landscapeTitleContainer: {},
});
