import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Animated, Linking } from 'react-native';
import * as Location from 'expo-location';
import MouthQuestLogo from '../components/MouthQuestLogo';

const TAGLINES = [
  "It's like a quest, but for your mouth",
  "Swipe right to eat. Swipe left to find something to fill the void.",
  "Your next meal is one swipe away",
  "No more 'I don't know, what do you want?'",
  "Don't call her, instead find a new restaurant.",
];

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorAction, setErrorAction] = useState(null); // { label, onPress } | null
  const [taglineIndex, setTaglineIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const zipInputRef = useRef(null);

  function clearError() {
    setError('');
    setErrorAction(null);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]).start(() => {
        setTaglineIndex((i) => (i + 1) % TAGLINES.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  function handleSearch() {
    const zip = query.trim();
    if (!/^\d{5}$/.test(zip)) { setError('Please enter a valid 5-digit zip code'); return; }
    clearError();
    navigation.navigate('Filter', { query: zip, coords: null });
  }

  async function handleUseLocation() {
    clearError();
    setLocationLoading(true);
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!canAskAgain) {
          setError('Location access is disabled. Enable it in your phone Settings to use this feature.');
          setErrorAction({ label: 'Open Settings', onPress: () => Linking.openSettings() });
        } else {
          setError('Location access was denied. Please enter your zip code instead.');
          zipInputRef.current?.focus();
        }
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        timeout: 10000,
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      navigation.navigate('Filter', { query: null, coords });
    } catch {
      setError("Couldn't get your location. Please enter your zip code instead.");
      zipInputRef.current?.focus();
    } finally {
      setLocationLoading(false);
    }
  }

  const busy = locationLoading;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <MouthQuestLogo size={80} />
        <Text style={styles.title}>MouthQuest</Text>
        <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>
          {TAGLINES[taglineIndex]}
        </Animated.Text>

        <TouchableOpacity style={[styles.locationButton, busy && styles.buttonDisabled]} onPress={handleUseLocation} disabled={busy} activeOpacity={0.85}>
          <Text style={styles.locationButtonText}>{locationLoading ? 'Getting location...' : '📍 Use my location'}</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          ref={zipInputRef}
          style={styles.input}
          placeholder="Enter zip code (e.g. 10001)"
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          keyboardType="numeric"
          maxLength={5}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {errorAction ? (
          <TouchableOpacity onPress={errorAction.onPress} activeOpacity={0.75}>
            <Text style={styles.errorActionLink}>{errorAction.label}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  title: { fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: -1, marginBottom: 12, marginTop: 16 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 24, marginBottom: 48 },
  locationButton: { width: '100%', backgroundColor: '#FF4458', borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  locationButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginHorizontal: 12 },
  input: { width: '100%', backgroundColor: '#1e1e1e', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 16, fontSize: 16, color: '#fff', borderWidth: 1, borderColor: '#2e2e2e' },
  error: { color: '#FF4458', fontSize: 13, marginTop: 12, textAlign: 'center' },
  errorActionLink: { color: '#FF8C42', fontSize: 13, marginTop: 8, textAlign: 'center', textDecorationLine: 'underline', fontWeight: '600' },
});
