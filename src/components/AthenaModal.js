import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { colors, spacing, radius } from '../theme';

/**
 * AthenaModal — Tüm Alert.alert çağrılarının yerine geçer
 *
 * Kullanım:
 * <AthenaModal
 *   visible={modal.visible}
 *   title={modal.title}
 *   message={modal.message}
 *   buttons={[
 *     { text: 'İptal', style: 'cancel', onPress: () => setModal({visible:false}) },
 *     { text: 'Evet', style: 'confirm', onPress: handleConfirm },
 *     { text: 'Sil', style: 'danger', onPress: handleDelete },
 *   ]}
 * />
 */
export default function AthenaModal({ visible, title, message, icon, buttons = [] }) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={[styles.btnRow, buttons.length === 1 && { justifyContent: 'center' }]}>
            {buttons.map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.btn,
                  btn.style === 'cancel' && styles.cancelBtn,
                  btn.style === 'confirm' && styles.confirmBtn,
                  btn.style === 'danger' && styles.dangerBtn,
                  btn.style === 'primary' && styles.primaryBtn,
                  buttons.length === 1 && { flex: 0, minWidth: 120 },
                ]}
                onPress={btn.onPress}
              >
                <Text style={[
                  styles.btnText,
                  btn.style === 'cancel' && styles.cancelText,
                  btn.style === 'confirm' && styles.confirmText,
                  btn.style === 'danger' && styles.dangerText,
                  btn.style === 'primary' && styles.primaryText,
                ]}>
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  icon: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dangerBtn: {
    backgroundColor: colors.redDim,
    borderColor: colors.red,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  cancelText: { color: colors.textSecondary },
  confirmText: { color: colors.black },
  primaryText: { color: colors.black },
  dangerText: { color: colors.red },
});