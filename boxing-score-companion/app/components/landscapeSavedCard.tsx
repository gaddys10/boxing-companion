import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';


type SavedCardProps = {
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
    gender?: string;
    weight?: number | string;
    savedScores?: string;
    onDelete: (id: number) => void;
}

export default function LandscapeSavedCard({id, fighter1, fighter2, fighter1Score, fighter2Score, fighter1KD, fighter2KD, fighter1Pen, fighter2Pen, rounds, gender, weight, savedScores, onDelete}: SavedCardProps) {
    const router = useRouter();
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    const { width } = useWindowDimensions();

    const handleEditCard = () => {
        router.push({
            pathname: '/createMatch',
            params: {
            id: String(id),
            title: 'Edit Scorecard Details',
            backText: 'Menu',
            buttonText: "Edit Scores",
            isEdit: "true",
            fighter1,
            fighter2,
            fighter1Score,
            fighter2Score,
            fighter1KD,
            fighter2KD,
            fighter1Pen,
            fighter2Pen,
            rounds,
            gender,
            weight,
            savedScores,
        }
        });
    };

    const handleConfirmDelete = () => {
        setDeleteModalVisible(false);
        onDelete(id);
    };

    const scoredRoundsCount = (() => {
    if (!savedScores) return 0;

    try {
        const parsedScores = JSON.parse(savedScores);
        if (parsedScores && typeof parsedScores === 'object' && !Array.isArray(parsedScores)) {
            return Object.keys(parsedScores).length;
        }
    } catch {
        return 0;
    }

        return 0;
    })();

    const normalizedGender = typeof gender === 'string' ? gender.trim().toLowerCase() : '';
    const isUnknownGender = !normalizedGender || normalizedGender === 'idk' || normalizedGender === 'null' || normalizedGender === 'undefined';

    return (
        <>
            <View style={[styles.savedCardShadow, { width: width * 0.201 }]}>
                <Pressable style={styles.savedCard}>
                    <View style={styles.savedCardInfoRows}>
                    {/* Fighter name row -- Row 1  */}
                    <View style={styles.savedCardNameRow}>
                        <View style={styles.f1NameBox}>
                            <Text numberOfLines={2} style={styles.fighter1}>{fighter1}</Text>
                        </View>
                        <View style={styles.f2NameBox}>
                            <Text numberOfLines={2} style={styles.fighter2}>{fighter2}</Text>
                        </View>
                    </View>

                    {/* Score row -- Row 3  */}
                    <View style={styles.savedCardScoreRow}>
                        <View style={styles.scoreBox1}>
                            <Text style={styles.f1Score}>{fighter1Score}</Text>
                        </View>
                        
                        <View style={styles.scoreBox2}>
                            <Text style={styles.f2Score}>{fighter2Score}</Text>
                        </View>
                    </View>

                    {/* Event Row -- Row 3  */}
                    <View style={styles.savedCardEventRow}>
                        <View style={styles.eventBox1}>
                            <Text style={styles.knockdowns1}>KD: {fighter1KD}{"\n"}PD: {fighter1Pen}</Text>
                            {/* <Text style={styles.deductions1}>PEN: {fighter1Pen}</Text> */}
                        </View>
                        <View style={styles.eventBox2}>
                            <Text style={styles.knockdowns2}>KD: {fighter2KD}{"\n"}PD: {fighter2Pen}</Text>
                            {/* <Text style={styles.deductions2}>PEN: {fighter2Pen}</Text> */}
                        </View>
                    </View>

                    {/* Round row -- Row 2 */}
                    <View style={styles.gwSavedCardRoundRow}>
                        <View style={styles.roundBox}>
                            <View style={styles.roundPill}>
                                <Text style={styles.roundText}>RD {scoredRoundsCount}/{rounds}</Text>
                            </View>
                        </View>
                        <View style={styles.genderWeightBox}>
                            {(normalizedGender === 'mens' || normalizedGender === 'womens') && (
                                <View style={[
                                    styles.genderIcon,
                                    normalizedGender === 'mens' && styles.maleIcon,
                                    normalizedGender === 'womens' && styles.femaleIcon,
                                ]}>
                                    <Ionicons
                                        name={normalizedGender === 'womens' ? 'female-outline' : 'male-outline'}
                                        size={14}
                                        color='#fff'
                                    />
                                </View>
                            )}
                            {isUnknownGender && (
                                <View style={styles.genderIcon}>
                                    <Text style={styles.unknownGenderText}>?</Text>
                                </View>
                            )}
                            <Text style={styles.weightClass}>{weight ? `${weight}lbs` : '? lbs'}</Text>
                        </View>
                    </View>

                    {/* Action Row -- Row 5  */}
                    <View style={styles.savedCardActionRow}>
                        <Pressable style={styles.actionButton} onPress={handleEditCard}>
                            {/* <Ionicons name="pencil" size={17} color="#333A3F" /> */}
                            <Text style={styles.actionButtonText}>Edit</Text>
                        </Pressable>
                        <Pressable style={[styles.actionButton, styles.deleteActionButton]} onPress={() => setDeleteModalVisible(true)}>
                            {/* <Ionicons name="close" size={20} color="#d32f2f" /> */}
                            <Text style={[styles.actionButtonText, styles.deleteActionText]}>Delete</Text>
                        </Pressable>
                    </View>
                    </View>
                </Pressable>
            </View>

            <Modal
                animationType="fade"
                transparent
                visible={deleteModalVisible}
                supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.deleteModal}>
                        <Text style={styles.modalTitle}>Delete scorecard?</Text>
                        <Text style={styles.modalText}>Are you sure you want to delete {fighter1} vs {fighter2}?</Text>
                        <View style={styles.modalActions}>
                            <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={() => setDeleteModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable style={[styles.modalButton, styles.confirmDeleteButton]} onPress={handleConfirmDelete}>
                                <Text style={styles.confirmDeleteText}>Delete</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    actionsBox: {
        backgroundColor: '#fff',
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopRightRadius: 15,
        borderBottomRightRadius: 15,
        borderBottomLeftRadius: 15,
        paddingRight: 3,
        flexDirection: 'row'
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        height: '100%',
        minWidth: 0,
        paddingVertical: 0,
    },
    actionButtonText: {
        color: '#333A3F',
        fontSize: 12,
        // textDecorationLine: 'underline',
        borderBottomWidth: 1
    },
    deductions1: {
        color: '#d32f2f',
        position: 'absolute',
        fontSize: 12,
        left: 3,
        top: 24,
    },
    deductions2: {
        color: '#307Fb6',
        position: 'absolute',
        left: 3,
        top: 24,
        fontSize: 12,
    },
    deleteActionButton: {
        borderBottomColor: '#d32f2f'
    },
    deleteActionText: {
        color: '#d32f2f',
        borderBottomColor: '#d32f2f'
    },
    deleteModal: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    eventBox1: {
        height: '100%',
        width: '50.5%',
        // borderBottomWidth: 1,
        // borderBottomColor: '#8c8c8c',
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderColor: '#767676'
    },
    eventBox2: {
        height: '100%',
        width: '50%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    f1NameBox: {
        height: '100%',
        backgroundColor: '#D32F2F',
        width: '50.5%',
        top: 0,
        paddingHorizontal: '4%',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopLeftRadius: 14,
        borderRightWidth: 1,
        borderRightColor: '#767676'
    },
    f1Score: {
        color: '#D32f2f',
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 32,
        textAlign: 'center',
        marginTop: 5
    },
    f2NameBox: {
        height: '100%',
        backgroundColor: '#307Fb6',
        width: '49.5%',
        top: 0,
        paddingHorizontal: '4%',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopRightRadius: 14,
    },
    f2Score: {
        color: '#307Fb6',
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 32,
        textAlign: 'center',
        marginTop: 5

    },
    fighter1: {
        color: '#fff',
        fontSize: 13,
        textAlign: 'center',
    },
    fighter2: {
        color: '#fff',
        fontSize: 13,
        textAlign: 'center',
    },
    knockdowns1: {
        color: '#D32f2f',
        fontSize: 12,
        textAlign: 'center',
    },
    knockdowns2: {
        color: '#307Fb6',
        fontSize: 12,
        textAlign: 'center',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalButton: {
        minWidth: 88,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginLeft: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },   
    modalText: {
        color: '#333A3F',
        fontSize: 15,
        lineHeight: 21,
        marginBottom: 20,
    }, 
    modalTitle: {
        color: '#333A3F',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    genderIcon: {
        backgroundColor: '#878787',
        alignItems: 'center',
        justifyContent: 'center',
        width: '30%',
        height: '60%',
        borderRadius: 25
    },
    maleIcon: {
        backgroundColor: '#307Fb6',
        alignItems: 'center',
        justifyContent: 'center',
        width: '30%',
        height: '60%',
        borderRadius: 25
    },
    femaleIcon: {
        backgroundColor: '#d32fba',
        alignItems: 'center',
        justifyContent: 'center',
        width: '30%',
        height: '60%',
        borderRadius: 25
    },
    unknownGenderText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    genderWeightBox: {
        width: '50%',
        height: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5
    },
    weightClass: {
        
    },
    roundBox: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '50%',
        height: '100%',
        textAlign: 'center',
    },
    roundPill: {
        backgroundColor: '#000',
        height: '60%',
        borderRadius: 15,
        justifyContent: 'center',
        alignContent: 'center',
        paddingHorizontal: 8,
    },
    roundText: {
        fontWeight: '700',
        color: '#fff',
        fontSize: 12,
        textAlign: 'center',
    },
    savedCardShadow: {
        height: '100%',
        top: '0%',
        backgroundColor: 'white',
        borderRadius: 15,
        marginBottom: 17,
        marginRight: 0,
        shadowColor: '#11334b',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 1,
        elevation: 6,
    },
    savedCard: {
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#B6C6D1',
        borderRightWidth: 0
    },
    savedCardActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '8%',
        // paddingVertical: 2,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
    },
    savedCardEventRow: {
        flexDirection: 'row',
        width: '100%',
        height: '22%',
        marginTop: -7,
        borderBottomWidth: 1,
        borderColor: '#767676'
    },
    savedCardNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: '24.5%',
    },
    savedCardScoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: '22%',
        // paddingTop: '3%',
        marginBottom: 0
    },
    savedCardRoundRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        height: '17%',
        alignSelf: 'flex-start',
        // backgroundColor: '#767676'
    },
    
    gwSavedCardRoundRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        height: '22%',
        alignSelf: 'flex-start',
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },

    savedCardInfoRows: {
        width: '100%',
        height: '100%',
    },
    scoreBox1: {
        height: '100%',
        width: '50.5%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 2,
        borderRightWidth: 1,
        borderColor: '#767676',
    },
    scoreBox2: {
        height: '100%',
        width: '50%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 2,
    },

    cancelButton: {
        backgroundColor: '#EEF1F3',
    },
    confirmDeleteButton: {
        backgroundColor: '#d32f2f',
    },
    cancelButtonText: {
        color: '#333A3F',
        fontWeight: '700',
    },
    confirmDeleteText: {
        color: '#fff',
        fontWeight: '700',
    },
});
