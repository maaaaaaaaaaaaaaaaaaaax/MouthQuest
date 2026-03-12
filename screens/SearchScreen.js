import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { fetchNearbyRestaurants } from '../services/placesApi';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch() {
    if (!query.trim()) { setError('Enter a city or zip code to get started'); return; }
    setError('');
    setLoading(true);
    try {
      const { restaurants, nextPageToken } = await fetchNearbyRestaurants(query.trim());
      navigation.navigate('Swipe', { restaurants, query: query.trim(), nextPageToken });
    } catch {
      setError('Could not find restaurants. Try a different location.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🍽️</Text>
        <Text style={styles.title}>DishSwipe</Text>
        <Text style={styles.subtitle}>Swipe right to get directions.{'\n'}Swipe left to keep exploring.</Text>
        <TextInput style={styles.input} placeholder="City or zip code" placeholderTextColor="#999" value={query} onChangeText={setQuery} onSubmitEditing={handleSearch} returnKeyType="search" autoCapitalize="words" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSearch} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Find Restaurants</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: -1, marginBottom: 12 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 24, marginBottom: 48 },
  input: { width: '100%', backgroundColor: '#1e1e1e', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 16, fontSize: 16, color: '#fff', borderWidth: 1, borderColor: '#2e2e2e', marginBottom: 12 },
  error: { color: '#ff6b6b', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  button: { width: '100%', backgroundColor: '#FF4458', borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
