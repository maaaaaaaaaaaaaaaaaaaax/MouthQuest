import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchNearbyRestaurants } from '../services/placesApi';

const CUISINES = ['Italian', 'Japanese', 'Mexican', 'Chinese', 'Indian', 'Thai', 'American', 'Mediterranean', 'Korean', 'French'];
const PRICES = ['$', '$$', '$$$', '$$$$'];
const RADII = ['0.5mi', '1mi', '2mi', '5mi'];
const RATINGS = ['Any', '3+', '4+', '4.5+'];

export default function FilterScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { query, coords, filters: initialFilters, fromSwipe = false } = route.params;

  const [cuisines, setCuisines] = useState(initialFilters?.cuisines ?? []);
  const [prices, setPrices] = useState(initialFilters?.priceLevels ?? []);
  const [radius, setRadius] = useState(
    initialFilters?.radiusMiles != null ? `${initialFilters.radiusMiles}mi` : '2mi'
  );
  const [minRating, setMinRating] = useState(
    initialFilters?.minRating ? `${initialFilters.minRating}+` : 'Any'
  );
  const [openNow, setOpenNow] = useState(initialFilters?.openNow ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggleCuisine(c) {
    setCuisines((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

  function togglePrice(p) {
    setPrices((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }

  async function handleFind() {
    setError('');
    setLoading(true);
    const filters = {
      cuisines,
      priceLevels: prices,
      radiusMiles: parseFloat(radius),
      minRating: minRating === 'Any' ? 0 : parseFloat(minRating),
      openNow,
    };
    try {
      const location = coords || query;
      const { restaurants, nextPageToken } = await fetchNearbyRestaurants(location, null, filters);
      if (restaurants.length === 0) {
        setError('No restaurants match these filters. Try broadening your search.');
        return;
      }
      const swipeParams = { restaurants, query: coords ? 'Current Location' : query, coords, nextPageToken, filters };
      if (fromSwipe) {
        navigation.navigate('Swipe', { ...swipeParams, resetKey: Date.now() });
      } else {
        navigation.navigate('Swipe', swipeParams);
      }
    } catch {
      setError('Could not find restaurants. Try different filters.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filters</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionLabel}>CUISINE</Text>
        <View style={styles.chipRow}>
          {CUISINES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, cuisines.includes(c) && styles.chipActive]}
              onPress={() => toggleCuisine(c)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, cuisines.includes(c) && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Open now only</Text>
          <Switch
            value={openNow}
            onValueChange={setOpenNow}
            trackColor={{ false: '#2e2e2e', true: '#FF4458' }}
            thumbColor="#fff"
          />
        </View>

        <Text style={styles.sectionLabel}>PRICE</Text>
        <View style={styles.chipRow}>
          {PRICES.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.chip, prices.includes(p) && styles.chipActive]}
              onPress={() => togglePrice(p)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, prices.includes(p) && styles.chipTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>DISTANCE</Text>
        <View style={styles.chipRow}>
          {RADII.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.chip, radius === r && styles.chipActive]}
              onPress={() => setRadius(r)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, radius === r && styles.chipTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>MINIMUM RATING</Text>
        <View style={styles.chipRow}>
          {RATINGS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.chip, minRating === r && styles.chipActive]}
              onPress={() => setMinRating(r)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, minRating === r && styles.chipTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.findButton, loading && styles.findButtonDisabled]}
          onPress={handleFind}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.findButtonText}>Find Restaurants</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.jesusTakeTheWheel}
          onPress={() => {
            const defaultFilters = { cuisines: [], priceLevels: [], radiusMiles: 2, minRating: 0 };
            const location = coords || query;
            fetchNearbyRestaurants(location, null, defaultFilters).then(({ restaurants, nextPageToken }) => {
              if (restaurants.length === 0) { setError('No restaurants found nearby. Try a different location.'); return; }
              const swipeParams = { restaurants, query: coords ? 'Current Location' : query, coords, nextPageToken, filters: defaultFilters };
              fromSwipe
                ? navigation.navigate('Swipe', { ...swipeParams, resetKey: Date.now() })
                : navigation.navigate('Swipe', swipeParams);
            }).catch(() => setError('Could not find restaurants. Try again.'));
          }}
          disabled={loading}
          activeOpacity={0.75}
        >
          <Text style={styles.jesusTakeTheWheelText}>🙏 Skip filters, let Jesus take the wheel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  back: { color: '#fff', fontSize: 24, width: 40 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  sectionLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginTop: 28, marginBottom: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28 },
  toggleLabel: { color: '#fff', fontSize: 14, fontWeight: '500' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#2e2e2e' },
  chipActive: { backgroundColor: '#FF4458', borderColor: '#FF4458' },
  chipText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  error: { color: '#ff6b6b', fontSize: 13, marginTop: 24, textAlign: 'center' },
  footer: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1e1e1e' },
  findButton: { backgroundColor: '#FF4458', borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  findButtonDisabled: { opacity: 0.6 },
  findButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  jesusTakeTheWheel: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  jesusTakeTheWheelText: { color: '#fff', fontSize: 14, fontWeight: '500' },
});
