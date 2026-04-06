import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useApp } from '../contexts/AppContext';
import { colors, spacing, borderRadius } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export default function QRScannerScreen({ navigation }: any) {
  const { isDarkMode } = useApp();
  const theme = isDarkMode ? colors.dark : colors.light;
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    
    console.log('Scanned QR code:', data);
    
    if (data.startsWith('0x')) {
      navigation.navigate('Send', { recipient: data });
    } else if (data.includes('@')) {
      navigation.navigate('Send', { recipient: data });
    } else if (data.startsWith('http')) {
      Linking.openURL(data).catch(() => {
        Alert.alert('Error', 'Could not open URL');
      });
    } else {
      Alert.alert(
        'Scanned Data',
        data,
        [
          { text: 'Use as Recipient', onPress: () => navigation.navigate('Send', { recipient: data }) },
          { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
        ]
      );
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.textSecondary }]}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.permissionCard, { backgroundColor: theme.surface }]}>
          <Ionicons name="camera-outline" size={48} color={theme.primary} />
          <Text style={[styles.permissionTitle, { color: theme.text }]}>Camera Access Required</Text>
          <Text style={[styles.permissionText, { color: theme.textSecondary }]}>
            We need camera access to scan QR codes for wallet addresses and payment links.
          </Text>
          <TouchableOpacity 
            style={[styles.permissionBtn, { backgroundColor: theme.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backBtnText, { color: theme.textSecondary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Scan QR Code</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft, { borderColor: theme.primary }]} />
              <View style={[styles.corner, styles.topRight, { borderColor: theme.primary }]} />
              <View style={[styles.corner, styles.bottomLeft, { borderColor: theme.primary }]} />
              <View style={[styles.corner, styles.bottomRight, { borderColor: theme.primary }]} />
            </View>
          </View>
        </CameraView>
      </View>

      <View style={[styles.instructions, { backgroundColor: theme.surface }]}>
        <Ionicons name="qr-code-outline" size={24} color={theme.primary} />
        <Text style={[styles.instructionTitle, { color: theme.text }]}>Scan QR Code</Text>
        <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
          Point your camera at a QR code containing a wallet address, email, or payment link
        </Text>
      </View>

      {scanned && (
        <TouchableOpacity 
          style={[styles.rescanBtn, { backgroundColor: theme.primary }]}
          onPress={() => setScanned(false)}
        >
          <Ionicons name="refresh-outline" size={20} color="#FFF" />
          <Text style={styles.rescanBtnText}>Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 60 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 3,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  instructions: { padding: spacing.lg, alignItems: 'center', marginHorizontal: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.xl },
  instructionTitle: { fontSize: 16, fontWeight: '600', marginTop: spacing.md },
  instructionText: { fontSize: 14, textAlign: 'center', marginTop: spacing.sm },
  rescanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, marginHorizontal: spacing.lg, marginBottom: spacing.xl, borderRadius: borderRadius.md },
  rescanBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginLeft: spacing.sm },
  permissionCard: { margin: spacing.lg, padding: spacing.xl, borderRadius: borderRadius.lg, alignItems: 'center' },
  permissionTitle: { fontSize: 20, fontWeight: '600', marginTop: spacing.lg },
  permissionText: { fontSize: 14, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  permissionBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.xl },
  permissionBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  backBtn: { marginTop: spacing.lg },
  backBtnText: { fontSize: 16 },
  title: { fontSize: 18, textAlign: 'center', marginTop: 100 },
});