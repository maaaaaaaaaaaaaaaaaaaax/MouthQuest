import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchNearbyRestaurants } from '../services/placesApi';

const VIBES = [
  {
    emoji: '🕯️',
    title: 'Date night',
    subtitle: 'Cute, chic, romantic — just like you',
    filters: { priceLevels: [2, 3, 4], minRating: 4.0, keyword: 'romantic', radiusMiles: 2 },
  },
  {
    emoji: '🍻',
    title: 'Group hang',
    subtitle: 'Lively, good drinks, shareable food',
    filters: { priceLevels: [1, 2, 3], keyword: 'bar group dining', openNow: true, radiusMiles: 2 },
  },
  {
    emoji: '💎',
    title: 'Hidden gem',
    subtitle: 'Under ~200 reviews, 4.0+ rating',
    filters: { maxReviews: 200, minRating: 4.0, radiusMiles: 1 },
  },
  {
    emoji: '⚡',
    title: 'Quick and cheap',
    subtitle: 'Fast, affordable, close by',
    filters: { priceLevels: [1, 2], openNow: true, radiusMiles: 0.5 },
  },
  {
    emoji: '🎲',
    title: "I'm up for anything",
    subtitle: 'Choose your own adventure, let Jesus take the wheel',
    filters: { radiusMiles: 2 },
  },
];

export default function MoodScreen({ route, navigation }) {
  const { query, coords } = route.params;
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleFind() {
    if (selected === null || loading) return;
    setLoading(true);
    try {
      const filters = VIBES[selected].filters;
      const { restaurants, nextPageToken } = await fetchNearbyRestaurants(coords || query, null, filters);
      navigation.navigate('Swipe', { query, coords, restaurants, nextPageToken, filters });
    } catch {
      navigation.navigate('Swipe', { query, coords, restaurants: [], nextPageToken: null, filters: VIBES[selected].filters });
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#1a0505', '#0f0f0f']} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <Text style={styles.header}>What's the vibe?</Text>
        <Text style={styles.subheader}>We'll handle the filters. You just need a feeling.</Text>

        <View style={styles.cards}>
          {VIBES.map((vibe, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.85}
              style={[styles.card, selected === i && styles.cardSelected]}
              onPress={() => setSelected(i)}
            >
              <Text style={styles.cardEmoji}>{vibe.emoji}</Text>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{vibe.title}</Text>
                <Text style={styles.cardSubtitle}>{vibe.subtitle}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        {selected !== null ? (
          <TouchableOpacity activeOpacity={0.85} onPress={handleFind} disabled={loading}>
            <LinearGradient
              colors={['#FF4458', '#FF8C42']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaActive}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.ctaActiveText}>Find me a spot →</Text>}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.ctaDisabled}>
            <Text style={styles.ctaDisabledText}>Pick a vibe first</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  backBtn: { marginBottom: 24 },
  backArrow: { color: '#fff', fontSize: 24 },
  header: { color: '#fff', fontSize: 32, fontWeight: '900', marginBottom: 8 },
  subheader: { color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 22, marginBottom: 32 },
  cards: { gap: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: { borderColor: '#FF4458' },
  cardEmoji: { fontSize: 32, marginRight: 14 },
  cardText: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 2 },
  cardSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 18 },
  chevron: { color: 'rgba(255,255,255,0.4)', fontSize: 22, marginLeft: 8 },
  ctaActive: { borderRadius: 30, paddingVertical: 18, alignItems: 'center', marginTop: 16 },
  ctaActiveText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  ctaDisabled: {
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: 16,
  },
  ctaDisabledText: { color: 'rgba(255,255,255,0.3)', fontSize: 17, fontWeight: '700' },
});
