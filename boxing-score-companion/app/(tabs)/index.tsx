import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SavedCard from '../components/savedCard';
import LandscapeSavedCard from '../components/landscapeSavedCard';
import { StatusBar } from 'expo-status-bar';
import { useResponsiveLayout } from '../../hooks/use-responsive-layout';
import type { MatchDescription, MatchRating } from '../../types/matchNotes';
import CollapsibleBannerAd from '../components/collapsibleBannerAd';
import StableCenteredModalFrame from '../components/stableCenteredModalFrame';
import BlueScrollView from '../../components/blue-scroll-view';
import BlueTextInput from '../../components/blue-text-input';
import mobileAds, {
  AdEventType,
  BannerAd,
  BannerAdSize,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import {usePremium} from '../../contexts/PremiumContext';

const tIcon = require('../../assets/images/flatwhitet.png');

const SAVED_CARDS_KEY = 'savedScorecards';
const FREE_SCORECARD_LIMIT = 25;
const FEEDBACK_ENDPOINT = process.env.EXPO_PUBLIC_FEEDBACK_ENDPOINT ?? '';
const FEEDBACK_RECIPIENT = 'syrus@consonant.software';''

const ABOUT_SOCIAL_ACCOUNTS = [
  { label: 'Boxing Score Companion', instagram: 'boxingscoreapp', twitter: 'boxingscoreapp' },
  { label: 'Consonant Software', instagram: 'consonantsoftware', twitter: 'consonantsoft' },
  { label: 'Personal', instagram: 'oh.syrus', twitter: 'oh_syrus' },
];

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', baseUrl: 'https://www.instagram.com/' },
  { key: 'twitter', label: 'X', baseUrl: 'https://x.com/' },
] as const;

const SPECIAL_THANKS: {
  name: string;
  twitter?: string;
  youtube?: string;
  instagram?: string;
  facebook?: { page: string; url: string };
  spotify?: { artist: string; url: string };
}[] = [
  { name: 'My father, for introducing me to boxing' },
  { name: 'Carmine Martinez' },
  { name: 'Carmine Delarosa and his beautiful family' },
  {
    name: 'Jaz Hannah-Melvin',
    spotify: { artist: 'Jaz Perignon', url: 'https://open.spotify.com/artist/2Rw3EZH710W7FLlxDowVS2' },
  },
  {
    name: 'Aasin Baker aka Ace of Billionaire Boxing TV',
    twitter: 'billionboxingtv',
    youtube: 'BILLIONAIREBOXINGTV',
    instagram: 'billionaireboxingtv',
    facebook: {
      page: 'Billionaire Boxing TV',
      url: 'https://www.facebook.com/profile.php?id=61579439153265',
    },
    spotify: { artist: 'PAYACE', url: 'https://open.spotify.com/artist/1saahqRZpyOgNhCdULBXiv' },
  },
  { name: 'Rome', twitter: 'Rome_Network' },
  { name: 'Doom', twitter: 'SamuraiiDoom' },
  { name: 'Rude', twitter: 'RudeChildV' },
  { name: 'Monsoor', twitter: 'Monsoor_9' },
  { name: 'Jay', twitter: 'DTBJay3x' },
  { name: 'Alexia of Beauty in Boxing Media', twitter: 'AlexiaApples' },
  { name: 'Peace', twitter: 'ohhpeace_boxing' },
  { name: 'Joe Leary', twitter: 'Finesse2286' },
  { name: 'Ron', twitter: 'MakerClimbAxe' },
  { name: 'Blunts and Boxing', twitter: 'BluntsAndBoxing' },
  { name: 'Flossy', twitter: 'InEdWeTrust_98' },
  { name: 'Fatpops', twitter: 'fatpopps' },
];

const THANKS_SOCIAL_PLATFORMS = [
  SOCIAL_PLATFORMS[1],
  { key: 'youtube', label: 'YouTube', icon: 'logo-youtube', baseUrl: 'https://www.youtube.com/@' },
  SOCIAL_PLATFORMS[0],
] as const;

async function openSocialProfile(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open link', 'Please try again.');
  }
}

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
  gender?: "idk" | "mens" | "womens";
  weight?: number | "200+";
  fightDate?: string;
  savedScores?: string;
  rating?: MatchRating;
  description?: MatchDescription;
};

function IndexBannerAd({ landscape = false }: { landscape?: boolean }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <View
      pointerEvents={isLoaded ? 'auto' : 'none'}
      style={
        isLoaded
          ? landscape
            ? styles.landscapeBannerAdContainer
            : styles.bannerAdContainer
          : styles.unloadedBannerAdContainer
      }
    >
      <BannerAd
        unitId={TestIds.BANNER}
        size={BannerAdSize.BANNER}
        onAdLoaded={() => setIsLoaded(true)}
        onAdFailedToLoad={(error) => {
          setIsLoaded(false);
          console.warn('Banner ad failed:', error);
        }}
      />
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { savedScorecard } = useLocalSearchParams();
  const lastSavedScorecard = useRef<string | null>(null);
  const [savedCards, setSavedCards] = useState<Scorecard[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [hasLoadedSavedCards, setHasLoadedSavedCards] = useState(false);
  const { isLandscape, insets, contentWidth, contentHeight, sy, scale } = useResponsiveLayout();
  const [adsReady, setAdsReady] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [settingsModalPage, setSettingsModalPage] = useState<'menu' | 'feedback' | 'about' | 'thanks'>('menu');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [scorecardLimitModalVisible, setScorecardLimitModalVisible] = useState(false);
  const [isRewardedAdLoading, setIsRewardedAdLoading] = useState(false);
  const rewardedAdCleanupRef = useRef<(() => void) | null>(null);
  const {isPremium, purchasePremium, restorePurchases} = usePremium();
  const isScrollableSettingsPage = settingsModalPage === 'about' || settingsModalPage === 'thanks';

  useEffect(() => {
    let mounted = true;

    mobileAds()
      .initialize()
      .then(() => {
        if (mounted) setAdsReady(true);
      })
      .catch((error) => {
        console.warn('AdMob initialization failed:', error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => () => rewardedAdCleanupRef.current?.(), []);

  const portraitTitleTop = 61 * sy;
  const portraitTitleHeight = 105 * sy;
  const portraitCardsTop = 224 * sy;
  const searchBoxHeight = Math.max(44, 50 * scale);
  const portraitSearchTop = portraitTitleTop
    + portraitTitleHeight
    + (portraitCardsTop - portraitTitleTop - portraitTitleHeight - searchBoxHeight) / 2;

  const landscapeHeaderHeight = contentHeight * 0.23;
  const landscapeCardsTop = contentHeight * 0.45;
  const landscapeSearchTop = 6
    + landscapeHeaderHeight
    + (landscapeCardsTop - 10 - landscapeHeaderHeight - searchBoxHeight) / 2;

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
          // nextCards[existingCardIndex] = scorecard;
          nextCards[existingCardIndex] = {
            ...currentCards[existingCardIndex],
            ...scorecard,
          };
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
    if (!hasLoadedSavedCards) return;

    if (!isPremium && savedCards.length >= FREE_SCORECARD_LIMIT) {
      setScorecardLimitModalVisible(true);
      return;
    }

    router.push({
      pathname: '/createMatch',
    });
  };

  const openNewScorecard = () => {
    setScorecardLimitModalVisible(false);
    router.push({ pathname: '/createMatch' });
  };

  const handleWatchAd = async () => {
    if (isRewardedAdLoading) return;

    setIsRewardedAdLoading(true);

    try {
      await mobileAds().initialize();

      const rewardedAd = RewardedAd.createForAdRequest(TestIds.REWARDED);
      let rewardEarned = false;
      const unsubscribers: (() => void)[] = [];

      const cleanup = () => {
        unsubscribers.forEach((unsubscribe) => unsubscribe());
        rewardedAdCleanupRef.current = null;
      };

      rewardedAdCleanupRef.current?.();
      rewardedAdCleanupRef.current = cleanup;

      unsubscribers.push(
        rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
          void rewardedAd.show().catch((error) => {
            cleanup();
            setIsRewardedAdLoading(false);
            console.warn('Rewarded scorecard ad failed to show:', error);
            Alert.alert('Ad unavailable', 'The ad could not be shown. Please try again.');
          });
        }),
        rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          rewardEarned = true;
        }),
        rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
          cleanup();
          setIsRewardedAdLoading(false);

          if (rewardEarned) {
            openNewScorecard();
          }
        }),
        rewardedAd.addAdEventListener(AdEventType.ERROR, (error) => {
          cleanup();
          setIsRewardedAdLoading(false);
          console.warn('Rewarded scorecard ad failed to load:', error);
          Alert.alert('Ad unavailable', 'An ad is not available right now. Please try again later.');
        }),
      );

      rewardedAd.load();
    } catch (error) {
      rewardedAdCleanupRef.current?.();
      setIsRewardedAdLoading(false);
      console.warn('Rewarded scorecard ad could not start:', error);
      Alert.alert('Ad unavailable', 'An ad is not available right now. Please try again later.');
    }
  };

  const handlePurchasePremium = async () => {
    const purchased = await purchasePremium();

    if (purchased) {
      Alert.alert('Premium unlocked', 'Thank you for supporting Boxing Score Companion!');
    } else {
      Alert.alert('Purchase unsuccessful', 'Premium could not be activated.');
    }
  };

  const handleOpenSettings = () => {
    setSettingsModalPage('menu');
    setSettingsModalVisible(true);
  };

  const handleSendFeedback = async () => {
    const message = feedbackMessage.trim();

    if (!message) {
      Alert.alert('Write a message', 'Please enter your feedback before sending.');
      return;
    }

    if (!FEEDBACK_ENDPOINT) {
      Alert.alert(
        'Feedback unavailable',
        'The secure feedback service has not been configured yet.',
      );
      return;
    }

    setIsSendingFeedback(true);

    try {
      const response = await fetch(FEEDBACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          recipient: FEEDBACK_RECIPIENT,
          source: 'Boxing Score Companion',
          version: '0.1',
        }),
      });

      if (!response.ok) {
        throw new Error(`Feedback request failed with status ${response.status}`);
      }

      setFeedbackMessage('');
      setSettingsModalPage('menu');
      Alert.alert('Feedback sent', 'Thank you for your feedback.');
    } catch (error) {
      console.warn('Feedback submission failed:', error);
      Alert.alert('Could not send feedback', 'Please check your connection and try again.');
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const handleRestorePurchase = async () => {
    const restored = await restorePurchases();

    if (restored) {
      Alert.alert('Purchase restored', 'Premium has been restored.');
    } else {
      Alert.alert('Nothing to restore', 'No active Premium purchase was found.');
    }
  };
  const handleAbout = () => {
    setSettingsModalPage('about');
  };

  const handleSpecialThanks = () => {
    setSettingsModalPage('thanks');
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

  return (
    <>
      <StatusBar style="dark" />
      <View style={[
        isLandscape ? styles.landscapeContainer : styles.container,
        !isLandscape && {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        isLandscape && {
          paddingLeft: Math.max(insets.left, 8),
          paddingRight: Math.max(insets.right, 8),
        },
      ]}>
        {isLandscape ? (
          <View style={[styles.landscapeHeader, { height: landscapeHeaderHeight }]}>
            <View style={styles.landscapeTitleBigContainer}>
              <View style={styles.landscapeTitleRight}>
                <Text style={styles.landscapeTitle}>Boxing</Text>
                <View style={styles.title2Container}><Text style={styles.landscapeTitle2}>Score</Text></View>
                <Text style={styles.landscapeTitle3}>Companion</Text>
              </View>
              <Image source={tIcon} style={styles.landscapeIcon} resizeMode="contain" />
              <Text style={styles.versionText}>v0.1</Text>
            </View>
            <View style={[styles.landscapeSearchBox, { top: landscapeSearchTop, height: searchBoxHeight }]}>
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
            <View style={[styles.landscapeSettingsPositioner, { top: landscapeSearchTop, height: searchBoxHeight }]}>
              <Pressable
                style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsButtonPressed]}
                onPress={handleOpenSettings}
                accessibilityRole="button"
                accessibilityLabel="Open settings"
              >
                <Ionicons name="settings-sharp" size={20} color="#fff" />
              </Pressable>
            </View>
            <Pressable style={styles.landscapeButton} onPress={handleStartFight}>
              <FontAwesome6 name="plus" size={14} color="#fff" />
              <Text numberOfLines={1} style={styles.buttonText}>New Scorecard</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.titleBigContainer, { top: portraitTitleTop, height: portraitTitleHeight }]}>
              <View style={styles.titleRight}>
                <Image source={tIcon} style={styles.icon} resizeMode="contain" />
                <Text style={styles.title}>Boxing</Text>
                <View style={styles.title2Container}><Text style={styles.title2}>Score</Text></View>
                <Text style={styles.title3}>Companion</Text>
              </View>
              <Text style={styles.versionText}>v0.1</Text>

            </View>
            <View style={[styles.searchBox, {
              top: portraitSearchTop,
              height: searchBoxHeight,
            }]}>
              <View style={styles.searchInputBox}>
                <Ionicons name="search" style={styles.searchIcon} />
                <TextInput style={styles.searchInput} placeholderTextColor="rgba(0, 0, 0, 0.5)" placeholder="Search Scorecards" value={searchInput} onChangeText={setSearchInput} autoCapitalize="none" autoCorrect={false} clearButtonMode="while-editing" />
              </View>
            </View>
            <View style={[styles.settingsPositioner, {
              top: portraitSearchTop,
              height: searchBoxHeight,
            }]}>
              <Pressable
                style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsButtonPressed]}
                onPress={handleOpenSettings}
                accessibilityRole="button"
                accessibilityLabel="Open settings"
              >
                <Ionicons name="settings-sharp" size={20} color="#fff" />
              </Pressable>
            </View>
          </>
        )}
        {isLandscape && 
          <ScrollView
            style={[styles.landscapeSavedCardContainer, { top: landscapeCardsTop, left: Math.max(insets.left, 8) }]}
            contentContainerStyle={styles.landscapeSavedCardContent}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {filteredCards.map((card, index) => (
              <React.Fragment key={card.id}>
              <LandscapeSavedCard
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
                fightDate={card.fightDate}
                savedScores={card.savedScores}
                rating={card.rating}
                description={card.description}
                onDelete={handleDeleteCard}
              />
              {adsReady && !isPremium &&  filteredCards.length >= 5 && (index + 1) % 5 === 0 && (
                <IndexBannerAd landscape />
              )}
              </React.Fragment>
            ))}
            {adsReady && !isPremium &&  filteredCards.length <= 4 && (
              <IndexBannerAd landscape />
            )}
          </ScrollView>
        }
        {!isLandscape &&
          <BlueScrollView
            style={[styles.savedCardContainer, { top: portraitCardsTop, bottom: Math.max(90 * sy, insets.bottom + 56) }]}
            contentContainerStyle={styles.savedCardContent}
            showsVerticalScrollIndicator={true}
            bounces={false}
            alwaysBounceVertical={false}
          >
            {filteredCards.map((card, index) => (
              <React.Fragment key={card.id}>
              <SavedCard
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
                fightDate={card.fightDate}
                savedScores={card.savedScores}
                rating={card.rating}
                description={card.description}
                onDelete={handleDeleteCard}
              />
              {adsReady && !isPremium &&  filteredCards.length >= 5 && (index + 1) % 5 === 0 && (
                <IndexBannerAd />
              )}
              </React.Fragment>
            ))}
            {adsReady && !isPremium &&  filteredCards.length <= 4 && (
              <IndexBannerAd />
            )}
          </BlueScrollView>
        }

        {!isLandscape && (
          <Pressable style={[styles.button, { bottom: Math.max(34 * sy, insets.bottom), minHeight: 44 }]} onPress={handleStartFight}>
            <FontAwesome6 name="plus" size={18} color="#fff" />
            <Text style={styles.buttonText}>New Scorecard</Text>
          </Pressable>
        )}

      </View>
      <Modal
        animationType="fade"
        transparent
        visible={settingsModalVisible}
        supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
        onRequestClose={() => {
          if (isSendingFeedback) return;
          if (settingsModalPage === 'feedback') {
            setSettingsModalPage('menu');
          } else {
            setSettingsModalVisible(false);
          }
        }}
      >
        <KeyboardAvoidingView
          style={styles.limitModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <StableCenteredModalFrame key={isScrollableSettingsPage ? `${settingsModalPage}-${contentWidth}-${contentHeight}` : settingsModalPage}>
            <View style={[styles.limitModalCard, isScrollableSettingsPage && { maxHeight: Math.max(0, contentHeight - 48) }]}>
              {settingsModalPage === 'menu' ? (
                <>
                  <Text style={styles.limitModalTitle}>Settings</Text>
                  <View style={styles.settingsModalActions}>
                    <Pressable
                      style={[styles.limitModalButton, styles.limitPremiumButton, isPremium && styles.premiumActiveButton]}
                      onPress={isPremium ? undefined : handlePurchasePremium}
                      disabled={isPremium}
                    >
                      <Ionicons name="star" size={19} color="#fff" style={styles.settingsButtonIcon} />
                      <Text style={styles.limitPrimaryButtonText}>{isPremium ? 'Premium Active!' : 'Purchase Premium: $2.99'}</Text>
                    </Pressable>
                    <View style={styles.premiumChecklist}>
                      <View style={styles.premiumChecklistItem}>
                        <Ionicons name="checkmark-circle" size={18} color="#D99B28" />
                        <Text style={styles.premiumChecklistText}>Remove ads</Text>
                      </View>
                      <View style={styles.premiumChecklistItem}>
                        <Ionicons name="checkmark-circle" size={18} color="#D99B28" />
                        <Text style={styles.premiumChecklistText}>Unlimited free saved scorecards</Text>
                      </View>
                      <View style={styles.premiumChecklistItem}>
                        <Ionicons name="checkmark-circle" size={18} color="#D99B28" />
                        <Text style={styles.premiumChecklistText}>Access to ALL future premium features</Text>
                      </View>
                    </View>
                    <Pressable
                      style={[styles.limitModalButton, styles.settingsOptionButton]}
                      onPress={handleRestorePurchase}
                    >
                      <Ionicons name="refresh-outline" size={19} color="#fff" style={styles.settingsButtonIcon} />
                      <Text style={styles.settingsOptionButtonText}>Restore Purchase</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.limitModalButton, styles.settingsOptionButton]}
                      onPress={() => setSettingsModalPage('feedback')}
                    >
                      <Ionicons name="chatbox-ellipses-outline" size={19} color="#fff" style={styles.settingsButtonIcon} />
                      <Text style={styles.settingsOptionButtonText}>Send Feedback</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.limitModalButton, styles.settingsOptionButton]}
                      onPress={handleAbout}
                    >
                      <Ionicons name="information-circle-outline" size={19} color="#fff" style={styles.settingsButtonIcon} />
                      <Text style={styles.settingsOptionButtonText}>About</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.limitModalButton, styles.settingsOptionButton]}
                      onPress={handleSpecialThanks}
                    >
                      <Ionicons name="heart-outline" size={19} color="#fff" style={styles.settingsButtonIcon} />
                      <Text style={styles.settingsOptionButtonText}>Special Thanks</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.limitModalButton, styles.settingsCloseButton]}
                      onPress={() => setSettingsModalVisible(false)}
                    >
                      <Ionicons name="close" size={19} color="#fff" />
                      <Text style={styles.limitPrimaryButtonText}>Close</Text>
                    </Pressable>
                  </View>
                  {settingsModalVisible && adsReady && !isPremium &&  (
                    <CollapsibleBannerAd
                      containerStyle={styles.settingsAdPositioner}
                      failureMessage="Settings banner ad failed:"
                    />
                  )}
                </>
              ) : settingsModalPage === 'feedback' ?(
                <>
                  <Text style={styles.limitModalTitle}>Send Feedback</Text>
                  <Text style={styles.feedbackInstructions}>
                    Write a message below. It will be sent directly to {FEEDBACK_RECIPIENT}.
                  </Text>
                  <BlueTextInput
                    style={styles.feedbackInput}
                    value={feedbackMessage}
                    onChangeText={setFeedbackMessage}
                    placeholder="How can we improve Boxing Score Companion?"
                    placeholderTextColor="#7B8992"
                    multiline
                    maxLength={2000}
                    editable={!isSendingFeedback}
                    textAlignVertical="top"
                    accessibilityLabel="Feedback message"
                  />
                  <Text style={styles.feedbackCharacterCount}>{feedbackMessage.length}/2000</Text>
                  <View style={styles.feedbackActions}>
                    <Pressable
                      style={[styles.limitModalButton, styles.limitRowButton, styles.limitBackButton]}
                      onPress={() => setSettingsModalPage('menu')}
                      disabled={isSendingFeedback}
                    >
                      <Ionicons name="chevron-back" size={18} color="#307FB6" />
                      <Text style={styles.limitBackButtonText}>Back</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.limitModalButton, styles.limitRowButton, styles.feedbackSendButton]}
                      onPress={() => void handleSendFeedback()}
                      disabled={isSendingFeedback}
                    >
                      {isSendingFeedback ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="send" size={18} color="#fff" />
                      )}
                      <Text style={styles.limitPrimaryButtonText}>
                        {isSendingFeedback ? 'Sending…' : 'Send'}
                      </Text>
                    </Pressable>
                  </View>
                </>
              ) : settingsModalPage === 'about' ? (
                <>
                  <Text style={styles.limitModalTitle}>About</Text>

                  <BlueScrollView
                    style={styles.settingsPageContent}
                    contentContainerStyle={styles.settingsPageContentContainer}
                  >
                    <View style={styles.aboutBrand}>
                      <Image source={tIcon} style={styles.aboutBrandIcon} resizeMode="contain" />
                      <View>
                        <Text style={styles.title}>Boxing</Text>
                        <View style={styles.title2Container}><Text style={styles.title2}>Score</Text></View>
                        <Text style={styles.title3}>Companion</Text>
                      </View>
                    </View>

                    <Text style={styles.aboutAppName}>Boxing Scoring Companion</Text>
                    <Text style={styles.aboutVersion}>Version 0.1</Text>

                    <Text style={styles.aboutText}>
                      Boxing Score Companion is built for boxing fans who want a better way to score,
                      save, review, and share fights.
                    </Text>

                    <Text style={styles.aboutText}>
                      Score rounds using Quick Scoring or Full Scoring, track knockdowns and point
                      deductions, save complete scorecards, and export or share your results.
                    </Text>

                    <Text style={styles.aboutText}>
                      Owned and developed by Consonant Software, a Gaddico company.
                    </Text>

                    {ABOUT_SOCIAL_ACCOUNTS.map((account) => (
                      <View key={account.label} style={styles.aboutSocialGroup}>
                        <Text style={styles.aboutSocialHeading}>{account.label}</Text>
                        {SOCIAL_PLATFORMS.map((social) => (
                          <Pressable
                            key={social.key}
                            style={({ pressed }) => [styles.aboutSocialLink, pressed && styles.aboutSocialLinkPressed]}
                            onPress={() => void openSocialProfile(`${social.baseUrl}${account[social.key]}`)}
                            accessibilityRole="link"
                            accessibilityLabel={`${account.label} on ${social.label}: @${account[social.key]}`}
                          >
                            {social.key === 'twitter' ? (
                              <FontAwesome6 name="x-twitter" size={18} color="#307FB6" />
                            ) : (
                              <Ionicons name={social.icon} size={18} color="#307FB6" />
                            )}
                            <Text style={styles.aboutSocialLinkText}>{social.label}: @{account[social.key]}</Text>
                          </Pressable>
                        ))}
                      </View>
                    ))}
                  </BlueScrollView>

                  <Pressable
                    style={[styles.limitModalButton, styles.limitBackButton]}
                    onPress={() => setSettingsModalPage('menu')}
                  >
                    <Ionicons name="chevron-back" size={18} color="#307FB6" />
                    <Text style={styles.limitBackButtonText}>Back</Text>
                  </Pressable>
                </>
              ) : settingsModalPage === 'thanks' ? (
                <>
                  <Text style={styles.limitModalTitle}>Special Thanks</Text>
                  <Text style={styles.limitModalText}>
                    Thank you to everyone who helped make Boxing Score Companion possible.
                  </Text>
                  <BlueScrollView
                    style={[styles.settingsPageContent, styles.thanksContent]}
                    contentContainerStyle={[styles.settingsPageContentContainer, styles.thanksContentContainer]}
                  >
                    {SPECIAL_THANKS.map((person) => (
                      <View key={person.name} style={styles.thanksPerson}>
                        <Text style={styles.thanksPersonName}>{person.name}</Text>
                        {THANKS_SOCIAL_PLATFORMS.map((social) => {
                          const handle = person[social.key];
                          if (!handle) return null;

                          return (
                            <Pressable
                              key={social.key}
                              style={({ pressed }) => [styles.aboutSocialLink, pressed && styles.aboutSocialLinkPressed]}
                              onPress={() => void openSocialProfile(`${social.baseUrl}${handle}`)}
                              accessibilityRole="link"
                              accessibilityLabel={`${person.name} on ${social.label}: @${handle}`}
                            >
                              {social.key === 'twitter' ? (
                                <FontAwesome6 name="x-twitter" size={18} color="#307FB6" />
                              ) : (
                                <Ionicons name={social.icon} size={18} color="#307FB6" />
                              )}
                              <Text style={styles.aboutSocialLinkText}>{social.label}: @{handle}</Text>
                            </Pressable>
                          );
                        })}
                        {person.facebook && (
                          <Pressable
                            style={({ pressed }) => [styles.aboutSocialLink, pressed && styles.aboutSocialLinkPressed]}
                            onPress={() => void openSocialProfile(person.facebook!.url)}
                            accessibilityRole="link"
                            accessibilityLabel={`${person.name} on Facebook: ${person.facebook.page}`}
                          >
                            <Ionicons name="logo-facebook" size={18} color="#307FB6" />
                            <Text style={styles.aboutSocialLinkText}>Facebook: {person.facebook.page}</Text>
                          </Pressable>
                        )}
                        {person.spotify && (
                          <Pressable
                            style={({ pressed }) => [styles.aboutSocialLink, pressed && styles.aboutSocialLinkPressed]}
                            onPress={() => void openSocialProfile(person.spotify!.url)}
                            accessibilityRole="link"
                            accessibilityLabel={`${person.name} on Spotify as ${person.spotify.artist}`}
                          >
                            <FontAwesome6 name="spotify" size={18} color="#307FB6" />
                            <Text style={styles.aboutSocialLinkText}>Spotify: {person.spotify.artist}</Text>
                          </Pressable>
                        )}
                      </View>
                    ))}
                  </BlueScrollView>
                  <Pressable
                    style={[styles.limitModalButton, styles.limitBackButton]}
                    onPress={() => setSettingsModalPage('menu')}
                  >
                    <Ionicons name="chevron-back" size={18} color="#307FB6" />
                    <Text style={styles.limitBackButtonText}>Back</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          </StableCenteredModalFrame>
        </KeyboardAvoidingView>
      </Modal>
      <Modal
        animationType="fade"
        transparent
        visible={scorecardLimitModalVisible}
        supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
        onRequestClose={() => {
          if (!isRewardedAdLoading) setScorecardLimitModalVisible(false);
        }}
      >
        <View style={styles.limitModalOverlay}>
          <StableCenteredModalFrame>
            <View style={styles.limitModalCard}>
              <Text style={styles.limitModalTitle}>Free scorecard limit reached</Text>
              <Text style={styles.limitModalText}>
                You’ve reached the limit of 25 free saved scorecards. {'\n'}{'\n'} 
                Delete a saved card, purchase Premium, or watch an ad to create another scorecard.
              </Text>
              <View style={styles.limitModalActions}>
                <Pressable
                  style={[styles.limitModalButton, styles.limitPremiumButton]}
                  onPress={handlePurchasePremium}
                  disabled={isRewardedAdLoading}
                >
                  <Ionicons name="star-outline" size={18} color="#fff" />
                  <Text style={styles.limitPrimaryButtonText}>Purchase Premium: $2.99</Text>
                </Pressable>
                <Text style={styles.limitModalSubText}>
                Premium removes ads, unlocks unlimited free saved cards, and includes all future premium features!
              </Text>
                <View style={styles.limitSecondaryActions}>
                  <Pressable
                    style={[styles.limitModalButton, styles.limitRowButton, styles.limitBackButton]}
                    onPress={() => setScorecardLimitModalVisible(false)}
                    disabled={isRewardedAdLoading}
                  >
                    <Ionicons name="chevron-back" size={18} color="#307FB6" />
                    <Text style={styles.limitBackButtonText}>Back</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.limitModalButton, styles.limitRowButton, styles.limitWatchAdButton]}
                    onPress={() => void handleWatchAd()}
                    disabled={isRewardedAdLoading}
                  >
                    {isRewardedAdLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="play-circle-outline" size={19} color="#fff" />
                    )}
                    <Text style={styles.limitPrimaryButtonText}>
                      {isRewardedAdLoading ? 'Loading Ad…' : 'Watch an Ad'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </StableCenteredModalFrame>
        </View>
      </Modal>
      </>
    // </LinearGradient>
  );
}

const styles = StyleSheet.create({
  settingsPageContent: {
    flexGrow: 0,
    flexShrink: 1,
    marginBottom: 14,
    width: '100%',
  },
  settingsPageContentContainer: {
    paddingBottom: 4,
  },
  thanksContent: {
    marginRight: -14,
    width: 'auto',
  },
  thanksContentContainer: {
    paddingRight: 14,
  },
  thanksPerson: {
    borderBottomColor: '#E1EAF0',
    borderBottomWidth: 1,
    gap: 6,
    marginBottom: 12,
    paddingBottom: 12,
  },
  thanksPersonName: {
    color: '#333A3F',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  aboutSocialGroup: {
    gap: 6,
    marginBottom: 12,
  },
  aboutSocialHeading: {
    color: '#333A3F',
    fontSize: 14,
    fontWeight: '700',
  },
  aboutSocialLink: {
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderColor: '#B6C6D1',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  aboutSocialLinkPressed: {
    backgroundColor: '#E1EAF0',
  },
  aboutSocialLinkText: {
    color: '#307FB6',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  aboutBrand: {
    alignItems: 'center',
    backgroundColor: '#307FB6',
    borderRadius: 15,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  aboutBrandIcon: {
    width: 70,
    height: 70,
  },

  aboutAppName: {
    color: '#307FB6',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  aboutVersion: {
    color: '#6E7C85',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 18,
  },

  aboutText: {
    color: '#333A3F',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
    textAlign: 'center',
  },
  limitModalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  limitModalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 6,
    maxWidth: 360,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    width: '100%',
  },
  limitModalTitle: {
    color: '#333A3F',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  limitModalText: {
    color: '#333A3F',
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 20,
    textAlign: 'center',
  },
  limitModalSubText: {
    color: '#333A3F',
    fontSize: 10,
    lineHeight: 21,
    marginBottom: 20,
    textAlign: 'center',
  },
  limitModalActions: {
    gap: 10,
  },
  limitSecondaryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  limitModalButton: {
    alignItems: 'center',
    borderRadius: 10,
    elevation: 4,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    shadowColor: '#11334b',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
  },
  limitBackButton: {
    backgroundColor: '#fff',
    borderColor: '#B6C6D1',
    borderWidth: 1,
  },
  limitRowButton: {
    flex: 1,
    minWidth: 0,
  },
  limitWatchAdButton: {
    backgroundColor: '#307FB6',
  },
  limitPremiumButton: {
    backgroundColor: '#D99B28',
  },
  premiumActiveButton: {
    elevation: 0,
    shadowOpacity: 0,
  },
  limitBackButtonText: {
    color: '#307FB6',
    fontWeight: '700',
  },
  limitPrimaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  settingsModalActions: {
    gap: 10,
  },
  settingsOptionButton: {
    backgroundColor: '#307FB6',
  },
  settingsOptionButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  settingsButtonIcon: {
    left: 16,
    position: 'absolute',
  },
  premiumChecklist: {
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  premiumChecklistItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  premiumChecklistText: {
    color: '#333A3F',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  settingsCloseButton: {
    alignSelf: 'center',
    backgroundColor: '#D32F2F',
    marginTop: 14,
  },
  settingsAdPositioner: {
    alignItems: 'center',
    marginTop: 18,
    width: '100%',
  },
  feedbackInstructions: {
    color: '#333A3F',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
    textAlign: 'center',
  },
  feedbackInput: {
    backgroundColor: '#F7FAFC',
    borderColor: '#B6C6D1',
    borderRadius: 10,
    borderWidth: 1,
    color: '#333A3F',
    fontSize: 15,
    height: 160,
    lineHeight: 21,
    padding: 12,
    width: '100%',
  },
  feedbackCharacterCount: {
    color: '#6E7C85',
    fontSize: 11,
    marginBottom: 14,
    marginTop: 5,
    textAlign: 'right',
  },
  feedbackActions: {
    flexDirection: 'row',
    gap: 10,
  },
  feedbackSendButton: {
    backgroundColor: '#307FB6',
  },
  neonPageBorder: {
    flex: 1,
    padding: 4,
    paddingVertical: 5,
  },
  button: {
    backgroundColor: '#307Fb6',
    flexDirection: 'row',
    gap: 5,
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
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    flex: 1,
    backgroundColor: '#f1f5f8',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  icon: {
    position: 'absolute',
    right: '95%',
    top: '13%',
    width: 86,
    height: '77%',
  },

  savedCardContainer: {
    position: 'absolute',
    top: '26.25%',
    bottom: 90,
    width: '100%',
    // borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    overflow: 'hidden',
  },
  savedCardContent: {
    alignItems: 'center',
    gap: 0
  },
  bannerAdContainer: {
    alignSelf: 'center',
    marginTop: 0,
    marginBottom: 15,
  },
  unloadedBannerAdContainer: {
    height: 50,
    opacity: 0,
    overflow: 'hidden',
    position: 'absolute',
    width: 320,
  },
  search: {
    color: "#fff",
    fontWeight: 700,
    left: -5
  },
  searchBox: {
    position: 'absolute',
    width: '45%',
    left: '5.5%',
    justifyContent: 'center',
  },
  settingsPositioner: {
    position: 'absolute',
    right: '5.5%',
    justifyContent: 'center',
  },
  settingsButton: {
    alignItems: 'center',
    backgroundColor: '#307FB6',
    borderRadius: 12,
    elevation: 4,
    height: 35,
    justifyContent: 'center',
    shadowColor: '#11334b',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 1,
    width: 44,
  },
  settingsButtonPressed: {
    opacity: 0.82,
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
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'left',
    marginBottom: '1.5%',
    marginLeft: 5,
  },
  title2: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'left',
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
    marginLeft: 0,
  },
  title3: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'left',
    marginLeft: 5,
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
  versionText: {
    position: 'absolute',
    right: 15,
    bottom: 15,
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },

  //Landscape styles

  landscapeButton: {
    backgroundColor: '#307Fb6',
    flexDirection: 'row',
    gap: 5,
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
    borderWidth: 0,
  },
  landscapeContainer: {
    flex: 1,
    backgroundColor: '#f1f5f8',
    // borderRadius: 40,
    padding: 8,
    gap: 8,
  },
  landscapeIcon: {
    width: 50,
    height: 50,
    marginLeft: -5,
    alignSelf: 'center',
  },
  landscapeSavedCardContainer: {
    position: 'absolute',
    top: '45%',
    bottom: 0,
    width: '100%',
    height: '55%',
    backgroundColor: '#f1f5f8',
    overflow: 'visible',
    elevation: 0,
    zIndex: 1,

  },
  landscapeSavedCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 0,
    gap: 13,
    paddingRight: 12,
    paddingBottom: 12,
  },
  landscapeBannerAdContainer: {
    width: 320,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  landscapeSearchBox: {
    position: 'absolute',
    left: '.25%',
    width: '33%',
    justifyContent: 'center',
    zIndex: 11,
  },
  landscapeSettingsPositioner: {
    position: 'absolute',
    right: '1.25%',
    justifyContent: 'center',
    zIndex: 11,
  },
  landscapeHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
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
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
    marginLeft: 5,
  },
  landscapeTitle2: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  landscapeTitle3: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 0,
    marginLeft: 5,
  },
  landscapeTitleRight: {
    height: '100%',
    justifyContent: 'center'
  },
  
  landscapeButtonText: {},
  landscapeSearch: {},
  
  landscapeTitleContainer: {},
});
