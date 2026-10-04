import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import CollapsibleBannerAd from '../app/components/collapsibleBannerAd';
import StableCenteredModalFrame from '../app/components/stableCenteredModalFrame';
import { usePremium } from '../contexts/PremiumContext';
import { useResponsiveLayout } from '../hooks/use-responsive-layout';
import type { ExportImageFormat } from '../utils/export-image';
import BlueScrollView from './blue-scroll-view';

type ExportAction = 'share' | 'save';
type Props = {
  action: ExportAction | null;
  onClose: () => void;
  onSelect: (format: ExportImageFormat, action: ExportAction) => void;
};

const FORMATS = [
  { value: 'original', label: "I'm not sharing to Instagram", ratio: '', icon: 'thumbs-up' },
  { value: 'instagram-reels', label: 'Instagram Reels & Stories', ratio: '9:16', icon: 'film-outline' },
  { value: 'instagram-feed', label: 'Instagram Post', ratio: '4:5', icon: 'grid-outline' },
] as const;

export default function ExportFormatModal({ action, onClose, onSelect }: Props) {
  const { isPremium } = usePremium();
  const { contentWidth, contentHeight } = useResponsiveLayout();
  const pendingSelection = useRef<{ format: ExportImageFormat; action: ExportAction } | null>(null);

  const finishSelection = () => {
    const selection = pendingSelection.current;
    pendingSelection.current = null;
    if (selection) onSelect(selection.format, selection.action);
  };

  const chooseFormat = (format: ExportImageFormat) => {
    if (!action || pendingSelection.current) return;
    pendingSelection.current = { format, action };
    onClose();
    // The iOS share sheet can open after the format modal finishes dismissing.
    if (Platform.OS !== 'ios') finishSelection();
  };

  const cancel = () => {
    pendingSelection.current = null;
    onClose();
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={action !== null}
      supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
      onRequestClose={cancel}
      onDismiss={finishSelection}
    >
      <View style={styles.overlay}>
        <StableCenteredModalFrame key={`${contentWidth}-${contentHeight}`}>
          <View style={[styles.card, { maxHeight: Math.max(0, contentHeight - 48) }]}>
            <Text style={styles.title}>Export scorecard</Text>
            <Text style={styles.description}>If sharing to IG, choose the appropriate format.</Text>
            <BlueScrollView style={styles.options} contentContainerStyle={styles.optionsContent}>
              {FORMATS.map((format) => (
                <React.Fragment key={format.value}>
                  {format.value === 'instagram-reels' && <View style={styles.formatDivider} />}
                <Pressable
                  onPress={() => chooseFormat(format.value)}
                  style={({ pressed }) => [
                    styles.option,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${format.label}${format.ratio ? `, ${format.ratio} aspect ratio` : ''}`}
                >
                  {format.value === 'original' ? (
                    <MaterialIcons name="thumb-up" size={22} color="#fff" />
                  ) : (
                    <Ionicons name={format.icon} size={20} color="#fff" />
                  )}
                  <Text style={styles.optionLabel}>{format.label}</Text>
                  {!!format.ratio && <Text style={styles.ratio}>{format.ratio}</Text>}
                </Pressable>
                </React.Fragment>
              ))}
            </BlueScrollView>
            <Pressable
              onPress={cancel}
              style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Ionicons name="close" size={18} color="#fff" />
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            {action !== null && !isPremium && (
              <CollapsibleBannerAd
                containerStyle={styles.adPositioner}
                failureMessage="Export format banner ad failed:"
              />
            )}
          </View>
        </StableCenteredModalFrame>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
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
  title: {
    color: '#333A3F',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    color: '#6E7C85',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  options: {
    flexGrow: 0,
    flexShrink: 1,
  },
  optionsContent: {
    gap: 10,
  },
  option: {
    alignItems: 'center',
    backgroundColor: '#307FB6',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  formatDivider: {
    backgroundColor: '#B6C6D1',
    height: 1,
  },
  optionLabel: {
    color: '#fff',
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  ratio: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  cancel: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
    borderRadius: 10,
    borderWidth: 1,
    elevation: 4,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 44,
    width: 104,
    shadowColor: '#11334b',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
  },
  cancelText: {
    color: '#fff',
    fontWeight: '700',
  },
  adPositioner: {
    alignItems: 'center',
    marginTop: 18,
    width: '100%',
  },
  pressed: {
    opacity: 0.7,
  },
});
