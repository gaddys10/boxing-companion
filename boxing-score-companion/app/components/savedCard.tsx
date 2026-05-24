import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';

type SavedCardProps = {
  fighter1: string;
  fighter2: string;
  fighter1Score: number;
  fighter2Score: number;
  fighter1KD: number;
  fighter2KD: number;
  fighter1Pen: number;
  fighter2Pen: number;
  rounds: number;
}

export default function SavedCard({fighter1, fighter2, fighter1Score, fighter2Score, fighter1KD, fighter2KD, fighter1Pen, fighter2Pen, rounds}: SavedCardProps) {
  const router = useRouter();

  const handleEditCard = () => {
      router.push({
        pathname: '/createMatch',
        params: {
          title: 'Edit Scorecard Details',
          backText: 'Menu',
          buttonText: "Edit Scores",
          fighter1,
          fighter2,
          fighter1Score,
          fighter2Score,
          fighter1KD,
          fighter2KD,
          fighter1Pen,
          fighter2Pen,
          rounds,
      }
    });
  };

  return (
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
            <Text style={styles.knockdowns1}>KD:&nbsp;&nbsp;&nbsp;{fighter1KD}</Text>
            <Text style={styles.deductions1}>PEN: {fighter1Pen}</Text>
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
            <Text style={styles.knockdowns2}>KD:&nbsp;&nbsp; {fighter2KD}</Text>
            <Text style={styles.deductions2}>PEN: {fighter2Pen}</Text>
          </View>
        </View>
      </View>

      <View style={styles.roundBox}>
        <Text style={styles.roundText}>{rounds} RD</Text>
      </View>

      <View style={styles.actionsBox}>
        <Pressable style={styles.actionButton} onPress={handleEditCard}>
          <Ionicons name="pencil" size={22} color="#333A3F" />
          <Text 
            style={styles.actionButtonText}
          >Edit</Text>
        </Pressable>
        <Pressable style={styles.actionButton}>
          <Ionicons name="close" size={24} color="#d32f2f" />
          <Text style={[styles.actionButtonText, styles.deleteActionText]}>Delete</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  savedCard: {
    width: '90%',
    height: 90,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    top: 100,
    borderRadius: 15,
    boxShadow: '2',
    shadowColor: '#11334b',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.7,
    shadowRadius: 3,
    marginBottom: 17,
  },
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
  f1NameBox: {
    height: '100.5%',
    backgroundColor: '#D32F2F',
    width: '40%',
    paddingTop: '2.5%',
    paddingLeft: '4%',
    paddingRight: '4%',
    borderTopLeftRadius: 15,
  },
  f2NameBox: {
    height: '100.5%',
    backgroundColor: '#322fd3',
    width: '40%',
    paddingTop: '2.5%',
    paddingLeft: '4%',
    paddingRight: '4%',

    borderBottomLeftRadius: 15,
  },
  fighter1: {
    color: '#fff',
    fontSize: 14,
  },
  fighter2: {
    color: '#fff',
    fontSize: 14,
  },
  scoreBox1: {
    height: '100%',
    width: '37%',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
    borderBottomColor: '#8c8c8c',
    borderBottomWidth: 1,
  },
    scoreBox2: {
    height: '100%',
    width: '37%',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
  },
  f1Score: {
    color: '#D32f2f',
    fontSize: 24,
  },
  f2Score: {
    color: '#322fd3',
    fontSize: 24,
  },
  eventBox1: {
    height: '100%',
    width: '23%',
    borderBottomWidth: 1,
    borderBottomColor: '#8c8c8c',
  },
  eventBox2: {
    height: '100%',
    width: '23%',
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
    color: '#322fd3',
    position: 'absolute',
    left: 3,
    top: 7,
        fontSize: 12,

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
    width: '16%',
    height: '100%',
    marginRight: -5,
    marginLeft: 5
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
    paddingRight: 3,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
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
});
