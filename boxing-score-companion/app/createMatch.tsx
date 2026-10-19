import { BUTTON_SHADOW } from '../constants/button-shadow';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';
import { normalizeMatchRating, parseMatchDescription, serializeMatchDescription } from '../types/matchNotes';
import CollapsibleBannerAd from './components/collapsibleBannerAd';
import StableCenteredModalFrame from './components/stableCenteredModalFrame';
import { ModalTitleHeader } from './components/modalCloseButton';
import { usePremium } from '../contexts/PremiumContext';
import { useScorecardDraft } from '../hooks/use-scorecard-draft';

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
    const { isPremium } = usePremium();
    const params = useLocalSearchParams();
    const detailsMode = Array.isArray(params.detailsMode) ? params.detailsMode[0] : params.detailsMode;
    const isReviewBeforeShare = detailsMode === 'review-before-share';
    const title = isReviewBeforeShare ? 'Review Scorecard Details' : String(params.title || 'New Scorecard');
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

    const initialFightDate = Array.isArray(params.fightDate)
    ? params.fightDate[0]
    : params.fightDate;

    const [showDatePicker, setShowDatePicker] = useState(false);

    const [fightDate, setFightDate] = useState<Date | null>(() => {
        if (!initialFightDate) return null;

        const parsedDate = new Date(`${initialFightDate}T12:00:00`);

            return Number.isNaN(parsedDate.getTime())
                ? null
                : parsedDate;
    });
    

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

    const fightDateParam = fightDate
    ? `${fightDate.getFullYear()}-${String(fightDate.getMonth() + 1).padStart(2, '0')}-${String(fightDate.getDate()).padStart(2, '0')}`
    : '';

    const fightDateDisplay = fightDate
        ? fightDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        })
        : 'Select fight date';
    const landscapeFightDateDisplay = fightDate
        ? fightDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
        : 'Select date';


    const buttonText = isReviewBeforeShare ? 'Continue' : String(params.buttonText || "Create Scorecard");
    const rounds = [1, 3, 4, 6, 8, 10, 12, 15];
    const { height, fontScale, contentWidth, isLandscape, insets, sx, sy, scale, horizontalGutter } = useResponsiveLayout();
    const smallLandscape = isLandscape && contentWidth < 740;
    const [formViewportHeight, setFormViewportHeight] = useState(0);
    const id = params.id ? String(params.id) : undefined;
    useScorecardDraft('/createMatch', {
        ...params,
        fighter1: fighter1Name,
        fighter2: fighter2Name,
        rounds: selectedRounds,
        gender: selectedGender,
        weight: selectedWeight,
        fightDate: fightDateParam,
    });

    const landscapeDensity = isLandscape && formViewportHeight > 0
        ? Math.min(1, formViewportHeight / 300)
        : 1;
    const landscapeInputHeight = Math.max(
        36,
        20 * fontScale + 12,
        Math.min(40, height * 0.05 * landscapeDensity),
    );
    const landscapeHeaderHeight = Math.max(30, Math.min(38, 36 * sy * landscapeDensity));
    const landscapePillHeight = Math.max(
        28,
        Math.min(40, 36 * sy * landscapeDensity),
        20 * fontScale + 12,
    );
    const pillHeight = isLandscape
        ? landscapePillHeight
        : Math.max(36, Math.min(40, 36 * sy), 20 * fontScale + 16);
    const roundButtonSize = Math.max(pillHeight, 24 * fontScale + 12);
    const landscapeRoundButtonWidth = smallLandscape ? Math.max(32, roundButtonSize - 4) : roundButtonSize;
    const landscapeRoundButtonHeight = smallLandscape ? Math.max(32, pillHeight - 4) : pillHeight;
    const formInnerWidth = Math.max(0, contentWidth - 2 * horizontalGutter);
    // Budget space for Women's, the icon, padding and borders before using columns.
    const portraitGenderWidth = ((formInnerWidth - 18) / 2) * 0.75;
    const landscapeGenderWidth = (((formInnerWidth - 12) / 3.15) * (smallLandscape ? 0.96 : 0.9) - 4) / 2;
    const stackPortraitSelectors = !isLandscape
        && (portraitGenderWidth < 56 * fontScale + 41 || fontScale > 1.3);
    const stackLandscapeSelectors = isLandscape
        && (landscapeGenderWidth < 56 * fontScale + 25 || fontScale > 1.3);
    const weightColumns = isLandscape
        ? Math.min(9, Math.max(1, Math.floor(formInnerWidth / Math.max(64, (34 * fontScale + 10) / 0.7))))
        : Math.min(3, Math.max(1,
            Math.floor(formInnerWidth / Math.max(80, (50 * fontScale + 16) / 0.85))
        ));
    const weights: (number | string)[] = [
        102, 105, isLandscape ? 110 : 108, 112, 115, 118,
        122, 126, 130, 135, 140, 147, 154, 160, 168, 175, 200, '200+',
    ];
    const [portraitFormBaseBottom, setPortraitFormBaseBottom] = useState(0);
    const [portraitActionsHeight, setPortraitActionsHeight] = useState(0);
    // The action bar includes 8px of top padding; reserve another 10px so
    // the visible buttons have the same 18px base gap as the form sections.
    const portraitBaseBottomPadding = portraitActionsHeight
        ? portraitActionsHeight + 10
        : Math.max(insets.bottom, 12) + 60;
    // Share surplus across three section gaps and the gap above the buttons.
    const portraitExtraGap = !isLandscape && portraitFormBaseBottom > 0
        ? Math.max(0, (formViewportHeight - portraitBaseBottomPadding - portraitFormBaseBottom) / 4)
        : 0;
    const portraitBottomPadding = portraitBaseBottomPadding + portraitExtraGap;
    const portraitSectionSpacing = { marginTop: portraitExtraGap };
    const weightRowCount = Math.ceil(weights.length / weightColumns);
    const weightBlockHeight = pillHeight * weightRowCount + 4 * (weightRowCount - 1);


    const handleStartFight = () => {
        if (isReviewBeforeShare) {
            router.push({
                pathname: '/matchNotes',
                params: {
                    id,
                    notesMode: 'review-before-share',
                    isEdit: 'true',
                    fighter1: fighter1Name || 'Fighter 1',
                    fighter2: fighter2Name || 'Fighter 2',
                    rounds: selectedRounds,
                    savedScores: params.savedScores,
                    gender: selectedGender,
                    weight: selectedWeight,
                    fightDate: fightDateParam,
                    rating: normalizeMatchRating(params.rating),
                    description: serializeMatchDescription(parseMatchDescription(params.description)),
                },
            });
            return;
        }

        router.replace({
            pathname: '/matchInfo',
            params: {
                id,
                fighter1: fighter1Name || 'Fighter 1',
                fighter2: fighter2Name || 'Fighter 2',
                rounds: selectedRounds,
                savedScores: params.savedScores,
                gender: selectedGender,
                weight: selectedWeight,
                fightDate: fightDateParam,
                rating: normalizeMatchRating(params.rating),
                description: serializeMatchDescription(parseMatchDescription(params.description)),
            },
        });
    };

    const handleCancel = () => {
        if (isReviewBeforeShare) {
            router.back();
            return;
        }

        setDiscardModalVisible(true);
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
                    fightDate: fightDateParam,
                    ...getSavedCardTotals(savedScores),
                    rating: normalizeMatchRating(params.rating),
                    description: parseMatchDescription(params.description),
                }),
            },
        });
    };

    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS !== 'ios') {
            setShowDatePicker(false);
        }

        if (event.type === 'set' && selectedDate) {
            setFightDate(selectedDate);
        }
    };

    const handleDatePickerDone = () => {
        if (!fightDate) {
            setFightDate(new Date());
        }
        setShowDatePicker(false);
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
                            isLandscape
                                ? { height: landscapeRoundButtonHeight, width: landscapeRoundButtonWidth }
                                : { height: roundButtonSize, width: roundButtonSize },
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
            <View style={[styles.genderPills, isLandscape && styles.landscapeGenderPills, smallLandscape && styles.smallLandscapeGenderPills, { minHeight: pillHeight }]}>
                <Pressable
                    style={[
                        styles.malePill,
                        isLandscape && styles.landscapeGenderPill,
                        { height: pillHeight },
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
                    isLandscape && styles.landscapeGenderPill,
                    { height: pillHeight },
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
        <View style={styles.screen}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />
            <View
                style={{
                    height: insets.top,
                    backgroundColor: '#307fb6',
                }}
            />
            <ScrollView
                style={styles.formScroll}
                onLayout={(event) => setFormViewportHeight(event.nativeEvent.layout.height)}
                contentContainerStyle={[
                    isLandscape ? styles.landscapeContainer : styles.container,
                    !isLandscape && {
                        minHeight: formViewportHeight,
                        height: portraitFormBaseBottom > 0
                            ? Math.max(formViewportHeight, portraitFormBaseBottom + portraitBaseBottomPadding + portraitExtraGap * 4)
                            : undefined,
                        paddingTop: 0,
                        paddingBottom: portraitBottomPadding,
                        paddingLeft: Math.max(insets.left, horizontalGutter),
                        paddingRight: Math.max(insets.right, horizontalGutter),
                    },
                    isLandscape && {
                        paddingLeft: Math.max(insets.left, 16 * sx),
                        paddingRight: Math.max(insets.right, 16 * sx),
                        paddingBottom: 0,
                        minHeight: formViewportHeight,
                    },
                ]}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={!isLandscape}
                bounces={false}
                alwaysBounceVertical={false}
                overScrollMode="never"
                showsVerticalScrollIndicator={false}
            >

            {/* Page title -- Create Scorecard  */}
            <View style={isLandscape
                ? [styles.landscapeTitleContainer, { minHeight: landscapeHeaderHeight }]
                : styles.titleContainer}
            >
                <Text style={isLandscape ? styles.landscapeTitle : styles.title}>{title}</Text>
            </View>
            {isLandscape && <View style={styles.landscapeSectionSpacer} />}

            {/* Text Input Container  */}
            <View style={isLandscape ? styles.landscapeInputContainer : styles.inputContainer}>

                {/* Red corner title and input  */}
                <View style ={isLandscape ? styles.landscapeFighter1Box : styles.fighter1Box}>
                    <Text style={isLandscape ? styles.landscapeNameLabel : styles.redNameLabel}>Red corner name:</Text>
                    <TextInput
                        key={isLandscape ? 'landscape-red-name' : 'portrait-red-name'}
                        placeholder="Enter red corner's name.."
                        value={fighter1Name}
                        placeholderTextColor="#D32f2f"
                        onChangeText={setFighter1Name}
                        textAlignVertical={isLandscape ? 'center' : undefined}
                        style={isLandscape ? [styles.landscapeFighter1Input, { height: landscapeInputHeight }] : [styles.fighter1input, { minHeight: Math.max(38, 38 * scale) }]}
                    />
                </View>

                {/* Blue corner title and input  */}
                <View style={ isLandscape ? styles.landscapeFighter2Box : styles.fighter2Box}>
                    <Text style={isLandscape ? styles.landscapeNameLabel : styles.blueNameLabel}>Blue corner name:</Text>
                    <TextInput
                        key={isLandscape ? 'landscape-blue-name' : 'portrait-blue-name'}
                        placeholder="Enter blue corner's name.."
                        placeholderTextColor="#307Fb6"
                        value={fighter2Name}
                        onChangeText={setFighter2Name}
                        textAlignVertical={isLandscape ? 'center' : undefined}
                        style={isLandscape ? [styles.landscapeFighter2Input, { height: landscapeInputHeight }] : [styles.fighter2Input, { minHeight: Math.max(38, 38 * scale), marginBottom: 18 }]}
                    />
                </View>
            </View>
            {isLandscape && <View style={styles.landscapeSectionSpacer} />}
            {isLandscape ? (
                <View style={[styles.landscapeRoundGenderRow, stackLandscapeSelectors && styles.stackedSelectors]}>
                    <View style={[styles.landscapeRoundContainer, smallLandscape && styles.smallLandscapeRoundContainer, stackLandscapeSelectors && styles.fullWidthSelector]}>
                        {roundSelector}
                    </View>

                    <View style={[styles.landscapeGenderContainer, stackLandscapeSelectors && styles.fullWidthSelector]}>
                        {genderSelector}
                    </View>

                    <View style={[styles.landscapeDateContainer, smallLandscape && styles.smallLandscapeDateContainer, stackLandscapeSelectors && styles.fullWidthSelector]}>
                        <Text style={styles.landscapeRoundLabel}>
                            Select Date: <Text style={styles.optionalLabel}>(optional)</Text>
                        </Text>

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Select fight date"
                            style={({ pressed }) => [
                                styles.datePickerButton,
                                styles.landscapeDatePickerButton,
                                pressed && styles.datePickerButtonPressed,
                            ]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={17} color="#307Fb6" />

                            <Text
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.85}
                                style={[
                                    styles.datePickerText,
                                    !fightDate && styles.datePickerPlaceholder,
                                ]}
                            >
                                {landscapeFightDateDisplay}
                            </Text>

                            <Ionicons name="chevron-down" size={16} color="#307Fb6" />
                        </Pressable>
                    </View>
                </View>
            ) : (
                <View style={[styles.roundGenderRow, portraitSectionSpacing, stackPortraitSelectors && styles.stackedSelectors]}>
                    {/* Rounds */}
                    <View style={[styles.roundGenderColumn, stackPortraitSelectors && styles.fullWidthSelector]}>
                        <Text style={styles.compactSectionLabel}>
                            Select rounds:
                        </Text>

                        <View style={styles.portraitRoundsGrid}>
                            {[rounds.slice(0, 4), rounds.slice(4)].map((row, rowIndex) => (
                                <View key={rowIndex} style={styles.portraitRoundsRow}>
                                    {row.map((round) => (
                                        <Pressable
                                            key={round}
                                            style={[
                                                styles.portraitRoundButton,
                                                { height: pillHeight },
                                                selectedRounds === round && styles.roundButtonSelected,
                                            ]}
                                            onPress={() => setSelectedRounds(round)}
                                        >
                                            <Text
                                                style={[
                                                    styles.roundButtonText,
                                                    selectedRounds === round && styles.roundButtonTextSelected,
                                                ]}
                                            >
                                                {round}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Gender */}
                    <View style={[styles.roundGenderColumn, stackPortraitSelectors && styles.fullWidthSelector]}>
                        <Text style={styles.compactSectionLabel}>
                            Select gender:{' '}
                            <Text style={styles.optionalLabel}>(optional)</Text>
                        </Text>

                        <View style={styles.portraitGenderStack}>
                            <Pressable
                                style={[
                                    styles.portraitGenderPill,
                                    stackPortraitSelectors && { width: '100%' },
                                    { height: pillHeight },
                                    selectedGender === 'mens' && styles.malePillSelected,
                                ]}
                                onPress={() =>
                                    selectedGender === 'mens'
                                        ? setSelectedGender('idk')
                                        : setSelectedGender('mens')
                                }
                            >
                                <Ionicons
                                    name="male-outline"
                                    size={18}
                                    color={selectedGender === 'mens' ? '#fff' : '#000'}
                                />
                                <Text
                                    style={[
                                        styles.maleText,
                                        selectedGender === 'mens' && styles.maleTextSelected,
                                    ]}
                                >
                                    Men's
                                </Text>
                            </Pressable>

                            <Pressable
                                style={[
                                    styles.portraitGenderPill,
                                    stackPortraitSelectors && { width: '100%' },
                                    { height: pillHeight },
                                    selectedGender === 'womens' && styles.femalePillSelected,
                                ]}
                                onPress={() =>
                                    selectedGender === 'womens'
                                        ? setSelectedGender('idk')
                                        : setSelectedGender('womens')
                                }
                            >
                                <Ionicons
                                    name="female-outline"
                                    size={18}
                                    color={selectedGender === 'womens' ? '#fff' : '#000'}
                                />
                                <Text
                                    style={[
                                        styles.femaleText,
                                        selectedGender === 'womens' && styles.femaleTextSelected,
                                    ]}
                                >
                                    Women's
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            )}
            {isLandscape && <View style={styles.landscapeSectionSpacer} />}

            {!isLandscape && (
                <>
                    <Text style={[styles.blackNameLabel, portraitSectionSpacing]}>
                        Select Date: <Text style={styles.optionalLabel}>(optional)</Text>
                    </Text>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Select fight date"
                        style={({ pressed }) => [
                            styles.datePickerButton,
                            pressed && styles.datePickerButtonPressed,
                        ]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={18} color="#307Fb6" />
                        <Text style={[styles.datePickerText, !fightDate && styles.datePickerPlaceholder]}>
                            {fightDateDisplay}
                        </Text>
                        <Ionicons name="chevron-down" size={17} color="#307Fb6" />
                    </Pressable>
                </>
            )}

            {showDatePicker && Platform.OS !== 'ios' && (
                <DateTimePicker
                    value={fightDate ?? new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}

            {Platform.OS === 'ios' && (
                <Modal
                    animationType="fade"
                    transparent
                    presentationStyle="overFullScreen"
                    supportedOrientations={
                        isLandscape
                            ? ['landscape', 'landscape-left', 'landscape-right']
                            : ['portrait']
                    }
                    visible={showDatePicker}
                    onRequestClose={() => setShowDatePicker(false)}
                >
                    <Pressable style={styles.datePickerOverlay} onPress={() => setShowDatePicker(false)}>
                        <Pressable style={styles.datePickerModal} onPress={(event) => event.stopPropagation()}>
                            <ModalTitleHeader
                                title="Select Date"
                                titleStyle={styles.datePickerModalTitle}
                                accessibilityLabel="Close date picker"
                                onClose={() => setShowDatePicker(false)}
                                isLandscape={isLandscape}
                            />
                            <DateTimePicker
                                value={fightDate ?? new Date()}
                                mode="date"
                                display="spinner"
                                themeVariant="light"
                                textColor="#000000"
                                onChange={handleDateChange}
                                style={styles.datePickerSpinner}
                            />
                            <View style={styles.datePickerActions}>
                                <Pressable
                                    style={styles.datePickerClearButton}
                                    onPress={() => {
                                        setFightDate(null);
                                        setShowDatePicker(false);
                                    }}
                                >
                                    <Text style={styles.datePickerClearText}>Clear Date</Text>
                                </Pressable>
                                <Pressable style={styles.datePickerDoneButton} onPress={handleDatePickerDone}>
                                    <Text style={styles.datePickerDoneText}>Done</Text>
                                </Pressable>
                            </View>
                        </Pressable>
                    </Pressable>
                </Modal>
            )}

            <Text style={isLandscape ? styles.landscapeWeightLabel : [styles.blackNameLabel, portraitSectionSpacing]}>
                Select weight class: <Text style={styles.optionalLabel}>(optional)</Text>
            </Text>

            <View
                style={[
                    styles.weightClassContainer,
                    { height: weightBlockHeight },
                    isLandscape && styles.landscapeWeightGrid,
                ]}
                onLayout={!isLandscape ? (event) => {
                    const { y, height: blockHeight } = event.nativeEvent.layout;
                    const baseBottom = y + blockHeight - portraitExtraGap * 3;
                    setPortraitFormBaseBottom((previous) =>
                        Math.abs(previous - baseBottom) > 1 ? baseBottom : previous
                    );
                } : undefined}
            >
                {weights.map((weight) => (
                    <View key={weight} style={[styles.weightCell, { width: `${100 / weightColumns}%` }]}>
                        <Pressable
                            style={[
                                isLandscape ? styles.landscapeWeightPill : styles.weightPill,
                                isLandscape && smallLandscape && styles.smallLandscapeWeightPill,
                                { height: pillHeight },
                                selectedWeight === weight && styles.weightPillSelected,
                            ]}
                            onPress={() => setSelectedWeight(selectedWeight === weight ? 0 : weight)}
                        >
                            <Text style={selectedWeight === weight ? styles.weightPillTextSelected : styles.weightPillText}>
                                {weight}lbs
                            </Text>
                        </Pressable>
                    </View>
                ))}
            </View>
            {isLandscape && <View style={styles.landscapeSectionSpacer} />}


            {/* <Image source={tIcon} style={styles.icon} resizeMode="contain" /> */}
            </ScrollView>
            {isLandscape && (
                <View
                    style={[
                        styles.landscapeFooter,
                        {
                            paddingLeft: Math.max(insets.left, 16 * sx),
                            paddingRight: Math.max(insets.right, 16 * sx),
                            paddingBottom: Math.max(insets.bottom, 8) + 8,
                        },
                    ]}
                >
                    <View
                        style={[
                            isEditing ? styles.landscapeEditButtonContainer : styles.landscapeButtonContainer,
                            styles.landscapeFooterActionRow,
                        ]}
                    >

                        {/* Cancel button  */}
                        <Pressable
                            style={[
                                isEditing ? styles.landscapeEditCancelButton : styles.landscapeCancelButton,
                                styles.buttonWithIcon,
                                styles.actionButtonShadow,
                                !isEditing && styles.initialLandscapeCancelButton,
                                isReviewBeforeShare && styles.reviewActionButton,
                            ]}
                            onPress={handleCancel}
                        >
                            <Ionicons name={isReviewBeforeShare ? 'chevron-back' : 'trash-outline'} size={18} color="#fff" />
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>


                        {/* save and exit button  */}
                        {isEditing && !isReviewBeforeShare &&
                            <Pressable
                                style={[styles.landscapeEditSaveButton, styles.landscapeActionButton, styles.actionButtonShadow]}
                                onPress={handleSaveChangesAndExit}
                            >
                                <Text style={[styles.buttonText, styles.saveExitButtonText]}>Save & Exit</Text>
                            </Pressable>
                        }


                        {/* Enter scorecard button  */}
                        <Pressable
                            style={[
                                isEditing? styles.landscapeEditContinueButton : styles.landscapeButton,
                                styles.buttonWithIcon,
                                styles.actionButtonShadow,
                                !isEditing && styles.initialLandscapeCreateButton,
                                isReviewBeforeShare && styles.reviewActionButton,
                            ]}
                            onPress={handleStartFight}
                        >
                            {!isEditing && <FontAwesome6 name="plus" size={16} color="#fff" />}
                            <Text style={[styles.buttonText, isEditing && styles.editingButtonText]} onPress={handleStartFight}>
                                {buttonText}
                            </Text>
                            {isEditing && <Ionicons name="chevron-forward" size={18} color="#fff" />}
                        </Pressable>
                    </View>
                </View>
            )}
            {!isLandscape && (
                <View
                    style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}
                    onLayout={(event) => setPortraitActionsHeight(event.nativeEvent.layout.height)}
                >
                    <Pressable
                        style={[
                            styles.cancelButton,
                            styles.buttonWithIcon,
                            styles.actionButtonShadow,
                            !isEditing && styles.initialCancelButton,
                            isReviewBeforeShare && styles.reviewActionButton,
                        ]}
                        onPress={handleCancel}
                    >
                        <Ionicons name={isReviewBeforeShare ? 'chevron-back' : 'trash-outline'} size={18} color="#fff" />
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                    {isEditing && !isReviewBeforeShare && (
                        <Pressable
                            style={[styles.editButton, styles.editingActionButton, styles.actionButtonShadow]}
                            onPress={handleSaveChangesAndExit}
                        >
                            <Text style={[styles.buttonText, styles.saveExitButtonText]}>Save & Exit</Text>
                        </Pressable>
                    )}
                    <Pressable
                        style={[
                            styles.createButton,
                            styles.buttonWithIcon,
                            styles.actionButtonShadow,
                            isEditing ? styles.editingActionButton : styles.initialCreateButton,
                            isReviewBeforeShare && styles.reviewActionButton,
                        ]}
                        onPress={handleStartFight}
                    >
                        {!isEditing && <FontAwesome6 name="plus" size={16} color="#fff" />}

                        <Text style={[styles.buttonText, isEditing && styles.editingButtonText]}>{buttonText}</Text>

                        {isEditing && <Ionicons name="chevron-forward" size={16} color="#fff" />}
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
                    <StableCenteredModalFrame>
                    <View style={styles.discardModalCard}>
                        <ModalTitleHeader
                            title={isEditing ? 'Discard changes?' : 'Discard scorecard?'}
                            titleStyle={styles.discardModalTitle}
                            accessibilityLabel="Close discard confirmation"
                            onClose={() => setDiscardModalVisible(false)}
                            isLandscape={isLandscape}
                        />
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
                        {discardModalVisible && !isPremium && (
                            <CollapsibleBannerAd
                                containerStyle={styles.discardAdPositioner}
                                failureMessage="Discard scorecard banner failed:"
                            />
                        )}
                    </View>
                    </StableCenteredModalFrame>
                </View>
            </Modal>
        </View>
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
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 10,
        paddingHorizontal: 24,
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
    discardAdPositioner: {
        alignItems: 'center',
        marginTop: 18,
        width: '100%',
    },
    discardModalButton: {
        ...BUTTON_SHADOW,
        alignItems: 'center',
        borderColor: 'rgba(200, 200, 200, 0.7)',
        borderRadius: 10,
        borderWidth: 1,
        flex: 1,
        justifyContent: 'center',
        minHeight: 44,
        paddingHorizontal: 12,
    },
    keepEditingButton: {
        backgroundColor: '#fff',
    },
    keepEditingButtonText: {
        color: '#307Fb6',
        fontWeight: '700',
    },
    fullWidthSelector: {
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: 'auto',
        width: '100%',
    },
    stackedSelectors: {
        flexDirection: 'column',
    },
    roundGenderRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 18,
    marginBottom: 18,
},

roundGenderColumn: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 0,
},

compactSectionLabel: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
},

portraitRoundsGrid: {
    gap: 7,
},

portraitRoundsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    columnGap: 6,
},

portraitRoundButton: {
    backgroundColor: '#fff',
    flex: 1,
    minWidth: 0,
    height: 32,
    borderWidth: 1,
    borderColor: '#B6C6D1',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
},

portraitGenderStack: {
    gap: 7,
    justifyContent: 'center',
    alignItems: 'center'
},

portraitGenderPill: {
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    width: '75%',
    height: 32,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#B6C6D1',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
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
        width: '100%',
        alignItems: 'flex-start',
        marginBottom: 4,
        gap: 6,
    },
    landscapeRoundContainer: {
        flex: 1.4,
        minWidth: 0,
    },
    smallLandscapeRoundContainer: {
        flex: 1.45,
    },
    landscapeGenderContainer: {
        flex: 1,
        minWidth: 0,
    },
    landscapeDateContainer: {
        flex: 0.75,
        minWidth: 0,
    },
    smallLandscapeDateContainer: {
        flex: 0.7,
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
        backgroundColor: '#307Fb6',
        paddingHorizontal: '3%',
        paddingVertical: '2.5%',
        borderRadius: 12,
        // marginTop: 25,
        minWidth: '25%',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#B6C6D1',
        minHeight: 42,
    },
    createButton: {
        backgroundColor: '#307Fb6',
        paddingHorizontal: '3%',
        paddingVertical: '2.5%',
        borderRadius: 12,
        // marginTop: 25,
        minWidth: '25%',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0,
        borderBottomWidth: 0,
        minHeight: 42,
    },
    editButton: {
        backgroundColor: '#fff',
                minWidth: '25%',
        borderRadius: 12,
        // marginTop: 25,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#B6C6D1',
        paddingHorizontal: '6%',
        paddingVertical: '2.5%',
        minHeight: 42,
    },

    
    editingActionButton: {
        width: '31%',
        paddingHorizontal: '1%',
    },

    reviewActionButton: {
        flex: 1,
        width: 'auto',
        minWidth: 0,
        maxWidth: undefined,
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
        alignItems: 'center',
        width: '80%',
        gap: 12,
        paddingBottom: 12,
        minHeight: 54,
    },
    landscapeFooter: {
        backgroundColor: '#f1f5f8',
        alignItems: 'center',
        flexShrink: 0,
        paddingTop: 8,
    },
    landscapeFooterActionRow: {
        paddingBottom: 0,
        minHeight: 42,
    },

    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center'
    },
    buttonWithIcon: {
        flexDirection: 'row',
        gap: 6,
    },
    actionButtonShadow: {
        ...BUTTON_SHADOW,
    },
    initialCancelButton: {
        flex: 0.9,
        minWidth: 0,
    },
    initialCreateButton: {
        flex: 1.1,
        minWidth: 0,
    },
    initialLandscapeCancelButton: {
        flex: 0.9,
        maxWidth: 180,
        minWidth: 0,
    },
    initialLandscapeCreateButton: {
        flex: 1.1,
        maxWidth: 200,
        minWidth: 0,
    },

    editingCancelButton: {
        width: '31%',
        paddingHorizontal: '1%',
                minWidth: '25%',

    },
    editingButtonText: {
        fontSize: 14,
        color: '#fff',
        marginLeft: 5,
        marginRight: -3,
    },
    saveExitButtonText: {
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
        minHeight: 42,
        borderWidth: 0,
    },
    landscapeCancelButton: {
        backgroundColor: '#de2f2f',
        paddingHorizontal: 24,
        borderRadius: 12,
        height: 42,
        flex: 1,
        maxWidth: 200,
        minWidth: 0,
        borderWidth: 0,
        borderColor: '#B6C6D1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    landscapeEditCancelButton: {
        backgroundColor: '#de2f2f',
        paddingHorizontal: 24,
        borderRadius: 12,
        height: 42,
        borderWidth: 0,
        width: '31%',
        minWidth: 0,
        borderColor: '#B6C6D1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    landscapeEditButton: {
        backgroundColor: '#fff',
        paddingHorizontal: '1%',
        borderRadius: 12,
        width: 200,
        height: '39%',
        alignItems: 'center',
        justifyContent: 'center',
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
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#B6C6D1',
        color: '#307Fb6',
    },
    landscapeButton: {
        backgroundColor: '#307Fb6',
        paddingHorizontal: 24,
        borderRadius: 12,
        flex: 1,
        maxWidth: 200,
        minWidth: 0,
        height: 42,
        borderWidth: 0,
        borderColor: '#B6C6D1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    landscapeEditContinueButton: {
        backgroundColor: '#307Fb6',
        paddingHorizontal: 24,
        borderRadius: 12,
        flex: 1,
        maxWidth: 200,
        minWidth: 0,
        height: 42,
        borderWidth: 0,
        borderColor: '#B6C6D1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    landscapeActionButton: {
        flex: 1,
        width: 'auto',
        maxWidth: 240,
    },


    

    cancelButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center'
    },
    weightClassContainer: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: 4,
        flexShrink: 0,
    },
    weightCell: {
        alignItems: 'center',
    },
    landscapeWeightGrid: {
        marginBottom: 0,
    },
    landscapeWeightPill: {
        backgroundColor: '#fff',
        height: '27%',
        width:  '70%',
        borderColor: '#B6C6D1',
        borderWidth: 1,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center'
    },
    smallLandscapeWeightPill: {
        width: '78%',
    },
    weightPill: {
        backgroundColor: '#fff',
        height: '14.5%',
        width: '85%',
        borderColor: '#B6C6D1',
        borderWidth: 1,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center'
    },
    weightPillSelected: {
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
        marginBottom: '6%',
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
        fontSize: 11,
        fontWeight: '400'
    },
    datePickerButton: {
        width: '100%',
        minHeight: 40,
        marginBottom: 18,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#B6C6D1',
        borderRadius: 12,
    },
    datePickerButtonPressed: {
        backgroundColor: '#E7EEF3',
    },
    datePickerText: {
        flex: 1,
        color: '#000',
        fontSize: 14,
    },
    datePickerPlaceholder: {
        color: '#667681',
    },
    datePickerOverlay: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
    datePickerModal: {
        width: '100%',
        maxWidth: 420,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        alignItems: 'center',
    },
    datePickerModalTitle: {
        alignSelf: 'stretch',
        color: '#000',
        fontSize: 14,
        fontWeight: '700',
        paddingHorizontal: 32,
        textAlign: 'center',
    },
    datePickerSpinner: {
        width: '100%',
    },
    datePickerActions: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
        width: '100%',
    },
    datePickerClearButton: {
        minHeight: 42,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#B6C6D1',
        borderRadius: 12,
        borderWidth: 1,
        flex: 1,
    },
    datePickerClearText: {
        color: '#D32F2F',
        fontSize: 14,
        fontWeight: '700',
    },
    datePickerDoneButton: {
        minWidth: 120,
        minHeight: 42,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#307Fb6',
        borderRadius: 12,
    },
    datePickerDoneText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
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
        justifyContent: 'flex-start',
        height: '5%',
        width: '100%',
        paddingHorizontal: '8%',
        paddingRight: '10%',
        marginBottom: '6%'
    },
        malePill: {
            backgroundColor: '#fff',
            flexDirection: 'row',
            borderWidth: 1,
            borderColor: '#B6C6D1',
            color: 'red',
            marginRight: '5%',
            width: '40%',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 25,
            height: '75%'

        },
        malePillSelected: {
            backgroundColor: '#307Fb6',
            borderWidth: 0
        },

        femalePill: {
            backgroundColor: '#fff',
            flexDirection: 'row',
            borderWidth: 1,
            borderColor: '#B6C6D1',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#B6c6d1',
            height: '75%',
            width: '40%',
            borderRadius: 25

        },
        femalePillSelected: {
            borderWidth: 0,
            backgroundColor: '#d32fba',
        },
        maleText: {
            flexShrink: 1,
            color: '#000',
            marginLeft: 5
        },
        maleTextSelected: {
            color: 'white',
            marginLeft: 5

        },
        femaleText: {
            flexShrink: 1,
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
        backgroundColor: '#fff',
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
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#B6C6D1',
        width: 34,
        height: '100%',
        borderRadius: 8,
        marginHorizontal: 1,
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
        lineHeight: 14,
        textAlign: 'center',
        includeFontPadding: false,
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
        minHeight: 36,
        paddingBottom: 8,
        width: '115%',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        marginBottom: '5%',
    },

    // LANDSCAPE STYLES
    landscapeTitleContainer: {
        backgroundColor: '#307fb6',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        marginBottom: 4,
    },
    landscapeDatePickerButton: {
        width: '100%',
        minHeight: 36,
        marginBottom: 0,
        paddingHorizontal: 10,
        gap: 6,
    },


    landscapeGenderPills: {
        height: 'auto',
        width: '90%',
        alignSelf: 'flex-start',
        paddingHorizontal: 0,
        paddingRight: 0,
        marginBottom: 0,
        gap: 4,
    },
    smallLandscapeGenderPills: {
        width: '96%',
    },
    landscapeGenderPill: {
        flex: 1,
        minWidth: 0,
        marginRight: 0,
        width: 'auto',
    },


    landscapeEditButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        gap: 12,
        paddingBottom: 12,
        minHeight: 54,
    },
    landscapeContainer: {
        flexGrow: 1,
        backgroundColor: '#f1f5f8',
        alignItems: 'center',
        // paddingHorizontal: 5,
        // paddingTop: 10,
    },
    landscapeSectionSpacer: {
        flexBasis: 0,
        flexGrow: 1,
        minHeight: 0,
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
        paddingVertical: 0,
        borderRadius: 8,
        marginBottom: 8,
        textAlign: 'left',
        fontSize: 14,
        fontWeight: 600,
        borderWidth: 1,
        borderColor: '#B6C6D1',
    },
    landscapeFighter2Input: {
        backgroundColor: '#fff',
        color: "#307Fb6",
        width: '100%',
        height: 31,
        paddingHorizontal: 12,
        paddingVertical: 0,
        borderRadius: 8,
        marginBottom: 8,
        textAlign: 'left',
        fontSize: 14,
        fontWeight: 600,
        borderWidth: 1,
        borderColor: '#B6C6D1',
    },
    landscapeNameLabel: {
        color: '#333A3F',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 3,
    },
    landscapeRoundLabel: {
        color: '#333A3F',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 3,
        alignSelf: 'flex-start',
    },

    landscapeWeightLabel: {
        color: '#333A3F',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 3,
        alignSelf: 'flex-start',
    },
    landscapeInputContainer: {
        width: '100%',
        flexDirection: 'row',
        gap: 14,
        marginBottom: 0,
    },
    landscapeRoundsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: 4,
        justifyContent: 'flex-start',
        width: '100%',
    },

    landscapeTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        // marginBottom: 25,
        // marginTop: -25,
        // position: 'absolute',
        // top: 25
    },
});
