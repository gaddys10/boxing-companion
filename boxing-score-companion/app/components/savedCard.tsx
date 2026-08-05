import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

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
  scrollY?: number;
  viewportHeight?: number;
  weight?: number | string;
  gender?: string;
}

export default function SavedCard({id, fighter1, fighter2, fighter1Score, fighter2Score, fighter1KD, fighter2KD, fighter1Pen, fighter2Pen, rounds, savedScores, weight, gender, onDelete, scrollY = 0, viewportHeight = 0}: SavedCardProps) {
  const router = useRouter();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [cardLayout, setCardLayout] = useState<{ y: number; height: number } | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleEditCard = () => {
      router.push({
        pathname: '/createMatch',
        params: {
          id: String(id),
          title: 'Edit Scorecard Details',
          backText: 'Menu',
          buttonText: "Continue",
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
          gender,
          weight
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

  useEffect(() => {
    const viewportStart = scrollY;
    const viewportEnd = viewportStart + viewportHeight;
    const cardTop = cardLayout?.y ?? 0;
    const cardHeight = cardLayout?.height ?? 0;
    const cardBottom = cardTop + cardHeight;
    const fadeDistance = 70;

    let nextOpacity = 1;

    if (!cardHeight || !viewportHeight) {
      nextOpacity = 1;
    } else if (cardBottom <= viewportStart || cardTop >= viewportEnd) {
      nextOpacity = 0;
    } else if (cardTop < viewportStart) {
      const progress = Math.min(1, (viewportStart - cardTop) / fadeDistance);
      nextOpacity = 1 - progress;
    } else if (cardBottom > viewportEnd) {
      const progress = Math.min(1, (cardBottom - viewportEnd) / fadeDistance);
      nextOpacity = 1 - progress;
    }

    Animated.timing(fadeAnim, {
      toValue: nextOpacity,
      duration: 30,
      useNativeDriver: true,
    }).start();
  }, [cardLayout, fadeAnim, scrollY, viewportHeight]);

  return (
    <>
    
      <Animated.View
        onLayout={(event) => {
          setCardLayout({
            y: event.nativeEvent.layout.y,
            height: event.nativeEvent.layout.height,
          });
        }}
        style={{ opacity: fadeAnim }}
      >
        <Pressable style={styles.savedCard}>
          <View style={styles.savedCardInfoRows}>
            <View style={styles.savedCardInfoRow}>
              <View style={styles.f1NameBox}>
                <Text style={styles.fighter1}>{fighter1}</Text>
              </View>
              <View style={styles.scoreBox1}>
                <Text style={styles.f1Score}>{fighter1Score}</Text>
              </View>
              <View style={styles.eventBox1}>
                <Text style={styles.knockdowns1}>KD: {fighter1KD}</Text>
                <Text style={styles.deductions1}>PD: {fighter1Pen}</Text>
              </View>
            </View>

            <View style={styles.savedCardInfoRow}>
              <View style={styles.f2NameBox}>
                <Text style={styles.fighter2}>{fighter2}</Text>
              </View>
              <View style={styles.scoreBox2}>
                <Text style={styles.f2Score}>{fighter2Score}</Text>
              </View>
              <View style={styles.eventBox2}>
                <Text style={styles.knockdowns2}>KD: {fighter2KD}</Text>
                <Text style={styles.deductions2}>PD: {fighter2Pen}</Text>
              </View>
            </View>
          </View>
          <View style={styles.roundBoxes}>
            <View style={styles.roundBox}>
              <View style={styles.rdPill}>
                <Text style={styles.rdPillText}>RD</Text>
              </View>
              <Text style={[styles.roundText]}>{scoredRoundsCount}/{rounds}</Text>
            </View>
            <View style={styles.roundBox}>
              
                <View style={[
                  normalizedGender === "mens" && styles.malePill, 
                  normalizedGender === "womens" && styles.femalePill, 
                  isUnknownGender && styles.idkPill]}>
                  {normalizedGender === 'mens' || normalizedGender === 'womens' ? (
                    <Ionicons
                      name={normalizedGender === "mens" ? "male-outline" : "female-outline"}
                      size={13}
                      color="#fff"
                    />
                  ) : 
                    <Text style={{color: '#fff', fontSize: 10}}>?</Text>
                  }
                </View>

              <Text style={styles.roundText}>
                {weight ? `${weight} lbs` : "? lbs"}
              </Text>
            </View>
          </View>

          <View style={styles.actionsBox}>
            <Pressable style={styles.actionButtonTop} onPress={handleEditCard}>
              {/* <Ionicons name="pencil" size={16} color="#333A3F" style={styles.editButtonIcon} /> */}
              {/* <MaterialCommunityIcons name="pencil" size={16} color="#333A3F" style={styles.editButtonIcon}/> */}
              <View style={styles.eventTextBoxTop}>
                <Text style={styles.actionButtonText}>Edit</Text>
              </View>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={() => setDeleteModalVisible(true)}>
              {/* <Ionicons name="close" size={20} color="#d32f2f" /> */}
              <View style={styles.eventTextBox}>
                <Text style={[styles.actionButtonText, styles.deleteActionText]}>Delete</Text>
              </View>
            </Pressable>
          </View>
      </Pressable>
      </Animated.View>

      <Modal
        animationType="fade"
        transparent
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.modalTitle}>Delete scorecard?</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete {fighter1} vs {fighter2}?
            </Text>
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
  editButtonIcon: {
    marginRight: 3,
  },
  eventTextBoxTop: {
    paddingBottom:1,
    borderBottomWidth: .5,
    borderBottomColor: 'black',
  },
  eventTextBox: {
    paddingBottom:1,
    borderBottomWidth: .5,
    borderBottomColor: '#d32f2f',
  },
  savedCard: {
    width: '90%',
    height: 90,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    boxShadow: '4',
    shadowColor: '#11334b',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#B6C6D1',
    borderBottomWidth: 0

  },
  
  f1NameBox: {
    height: '100.5%',
    backgroundColor: '#D32F2F',
    width: '50%',
    paddingLeft: '5%',
    paddingRight: '4%',
    borderTopLeftRadius: 15,
    justifyContent: 'center',
  },
  f2NameBox: {
    height: '100.5%',
    backgroundColor: '#307Fb6',
    width: '50%',
    paddingLeft: '5%',
    paddingRight: '4%',
    borderBottomLeftRadius: 15,
    justifyContent: 'center',
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
    fontSize: 28,
    fontWeight: 700
  },
  f2Score: {
    color: '#307Fb6',
    fontSize: 28,
    fontWeight: 700
  },
  // pillColumn: {
  //   flexDirection:
  // },
  savedCardInfoRows: {
    width: '66%',
    height: '100%',
  },

  savedCardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: '50%',
  },
  scoreBox1: {
    height: '100%',
    width: '30%',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
    borderBottomColor: '#8c8c8c',
    borderBottomWidth: .5,
  },
  scoreBox2: {
    height: '100%',
    width: '30%',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
  },

  eventBox1: {
    height: '100%',
    width: '18%',
    borderBottomWidth: .5,
    borderBottomColor: '#8c8c8c',
  },
  eventBox2: {
    height: '100%',
    width: '18%',
  },
  knockdowns1: {
    color: '#D32f2f',
    position: 'absolute',
        fontSize: 12,

    left: 3,
    top: 7,
  },
  deductions1: {
    color: '#d32f2f',
    position: 'absolute',
        fontSize: 12,

    left: 3,
    top: 24,
  },
  knockdowns2: {
    color: '#307Fb6',
    position: 'absolute',
    left: 3,
    top: 7,
        fontSize: 12,

  },
  deductions2: {
    color: '#307Fb6',
    position: 'absolute',
    left: 3,
    top: 24,
        fontSize: 12,

  },
  malePill: {
    backgroundColor: '#307Fb6',
    width: '59%',
    height: '39%',
    color: '#fff',
    borderRadius: 15,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  femalePill: {
    backgroundColor: '#d32fba',
    width: '59%',
    height: '39%',
    color: '#fff',
    borderRadius: 15,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  idkPill: {
    backgroundColor: '#878787',
    width: '59%',
    height: '39%',
    color: '#fff',
    borderRadius: 15,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  rdPill: {
    backgroundColor: '#000',
    width: '59%',
    height: '38%',
    color: '#fff',
    borderRadius: 15,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  rdPillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: '700', 
  },
  roundBoxes: {
    width: '17.5%',
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -7,
    marginRight: 0,
  },
  roundBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '50%',
  },
  roundText: {
    fontWeight: '500',
    color: "#333A3F",
    fontSize: 12,
    textAlign: 'center',
  },
  actionsBox: {
    backgroundColor: '#fff',
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    paddingRight: '4%',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    flex: 1,
    width: '100%',
  },
  actionButtonTop: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    flex: 1,
    width: '100%',
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
