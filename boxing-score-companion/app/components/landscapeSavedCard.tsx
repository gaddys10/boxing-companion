import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';

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
    savedScores?: string;
    onDelete: (id: number) => void;
}

export default function LandscapeSavedCard({id, fighter1, fighter2, fighter1Score, fighter2Score, fighter1KD, fighter2KD, fighter1Pen, fighter2Pen, rounds, savedScores, onDelete}: SavedCardProps) {
    const router = useRouter();
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

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
            savedScores,
        }
        });
    };

    const handleConfirmDelete = () => {
        setDeleteModalVisible(false);
        onDelete(id);
    };

    return (
        <>
            <Pressable style={styles.savedCard}>
                <View style={styles.savedCardInfoRows}>


                    {/* Fighter name row -- Row 1  */}
                    <View style={styles.savedCardInfoRow}>
                        <View style={styles.f1NameBox}>
                            <Text style={styles.fighter1}>{fighter1}</Text>
                        </View>
                        <View style={styles.f2NameBox}>
                            <Text style={styles.fighter2}>{fighter2}</Text>
                        </View>
                    </View>

                    {/* Score row -- Row 2  */}
                    <View style={styles.savedCardInfoRow2}>
                        <View style={styles.scoreBox1}>
                            <Text style={styles.f1Score}>{fighter1Score}</Text>
                        </View>
                        
                        <View style={styles.scoreBox2}>
                            <Text style={styles.f2Score}>{fighter2Score}</Text>
                        </View>
                    </View>

                    {/* Event Row -- Row 3  */}
                    <View style={styles.savedCardInfoRow3}>
                        <View style={styles.eventBox1}>
                            <Text style={styles.knockdowns1}>KD: {fighter1KD}&nbsp;&nbsp;&nbsp;PEN: {fighter1Pen}</Text>
                            {/* <Text style={styles.deductions1}>PEN: {fighter1Pen}</Text> */}
                        </View>
                        <View style={styles.eventBox2}>
                            <Text style={styles.knockdowns2}>KD: {fighter2KD}&nbsp;&nbsp;&nbsp;PEN: {fighter2Pen}</Text>
                            {/* <Text style={styles.deductions2}>PEN: {fighter2Pen}</Text> */}
                        </View>
                    </View>

                    {/* Round row -- Row 4 */}
                    <View style={styles.savedCardInfoRow4}>
                        <View style={styles.roundBox}>
                            <Text style={styles.roundText}>{rounds} RD</Text>
                        </View>
                    </View>

                    {/* Action Row -- Row 5  */}
                    <View style={styles.savedCardInfoRow5}>
                        <Pressable style={styles.actionButton} onPress={handleEditCard}>
                            <Ionicons name="pencil" size={18} color="#333A3F" />
                            <Text style={styles.actionButtonText}>Edit</Text>
                        </Pressable>
                        <Pressable style={styles.actionButton} onPress={() => setDeleteModalVisible(true)}>
                            <Ionicons name="close" size={20} color="#d32f2f" />
                            <Text style={[styles.actionButtonText, styles.deleteActionText]}>Delete</Text>
                        </Pressable>
                    </View>
                </View>
            </Pressable>

            <Modal
                animationType="fade"
                transparent
                visible={deleteModalVisible}
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
    savedCard: {
        width: '24%',
        height: '75%',
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        top: 100,
        borderRadius: 15,
        overflow: 'hidden',
        boxShadow: '2',
        shadowColor: '#11334b',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.7,
        shadowRadius: 3,
        marginBottom: 17,
        paddingBottom: 10,
        marginRight: 15
    },
    
    f1NameBox: {
        height: '100.5%',
        backgroundColor: '#D32F2F',
        width: '50.5%',
        paddingTop: '2.5%',
        paddingLeft: '4%',
        paddingRight: '4%',
        borderTopLeftRadius: 15,
        
    },
    f2NameBox: {
        height: '100.5%',
        backgroundColor: '#322fd3',
        width: '50%',
        paddingTop: '2.5%',
        paddingLeft: '4%',
        paddingRight: '4%',
        borderTopRightRadius: 15,
    },
    fighter1: {
        color: '#fff',
        fontSize: 14,
    },
    fighter2: {
        color: '#fff',
        fontSize: 14,
    },
    f1Score: {
        color: '#D32f2f',
        fontSize: 24,
        

    },
    f2Score: {
        color: '#322fd3',
        fontSize: 24,
    },
    savedCardInfoRows: {
        width: '100%',
        height: '100%',
    },
    savedCardInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: '24%',
    },
    savedCardInfoRow2: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: '25%',
    },
    savedCardInfoRow3: {
        flexDirection: 'row',
        width: '100%',
        height: '14%',
    },
    savedCardInfoRow4: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: '17%',
    },
    savedCardInfoRow5: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '20%',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
    },
    scoreBox1: {
        height: '100%',
        width: '50.5%',
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 0,
        // borderBottomColor: '#8c8c8c',
        // borderBottomWidth: 1,
        borderRightWidth: 1,
        borderColor: '#333'
    },
    scoreBox2: {
        height: '50%',
        width: '50%',
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 0,
    },

    eventBox1: {
        height: '100%',
        width: '50.5%',
        // borderBottomWidth: 1,
        // borderBottomColor: '#8c8c8c',
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderColor: '#333'
    },
    eventBox2: {
        height: '100%',
        width: '50%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    knockdowns1: {
        color: '#D32f2f',
        fontSize: 12,
        textAlign: 'center',
    },
    deductions1: {
        color: '#d32f2f',
        position: 'absolute',
            fontSize: 12,

        left: 3,
        top: 24,
    },
    knockdowns2: {
        color: '#322fd3',
        fontSize: 12,
        textAlign: 'center',
    },
    deductions2: {
        color: '#322fd3',
        position: 'absolute',
        left: 3,
        top: 24,
            fontSize: 12,

    },
    roundBox: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        marginRight: -5,
        marginLeft: 5,
        textAlign: 'center'
    },
    roundText: {
        fontWeight: '700',
        color: "#333A3F"
    },
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
    },
    actionButtonText: {
        color: '#333A3F',
        fontSize: 12,
    },
    deleteActionText: {
        color: '#d32f2f',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
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
    modalTitle: {
        color: '#333A3F',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    modalText: {
        color: '#333A3F',
        fontSize: 15,
        lineHeight: 21,
        marginBottom: 20,
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
