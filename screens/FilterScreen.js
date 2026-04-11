import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { fetchNearbyRestaurants } from '../services/placesApi';
import MouthQuestLogo from '../components/MouthQuestLogo';

const PRICES = ['$', '$$', '$$$', '$$$$'];
const RADII = ['0.5mi', '1mi', '2mi', '5mi'];
const RATINGS = ['Any', '3+', '4+', '4.5+'];

function Chip({ label, active, onPress }) {
  if (active) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.chipActiveWrapper}>
        <LinearGradient
          colors={['#FF4458', '#FF8C42']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.chipActiveGradient}
        >
          <Text style={styles.chipTextActive}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity style={styles.chip} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.chipText}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function FilterScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { query, coords, filters: initialFilters, fromSwipe = false } = route.params;

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
  const [showRetry, setShowRetry] = useState(false);
  const lastFiltersRef = useRef(null);

  function togglePrice(p) {
    setPrices((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }

  async function runSearch(filters) {
    setError('');
    setShowRetry(false);
    setLoading(true);
    lastFiltersRef.current = filters;
    try {
      const net = await NetInfo.fetch();
      if (!net.isConnected) {
        setError('No internet connection. Please check your network and try again.');
        return;
      }
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
    } catch (e) {
      if (e.message === 'REQUEST_DENIED' || e.message === 'OVER_QUERY_LIMIT') {
        setError('Service temporarily unavailable. Please try again later.');
      } else {
        setError('Something went wrong. Please try again.');
        setShowRetry(true);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleFind() {
    runSearch({
      priceLevels: prices,
      radiusMiles: parseFloat(radius),
      minRating: minRating === 'Any' ? 0 : parseFloat(minRating),
      openNow,
    });
  }

  return (
    <LinearGradient colors={['#1a0505', '#0f0f0f']} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerLogoRow}>
          <MouthQuestLogo size={32} />
          <Text style={styles.headerTitle}>Filters</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Open now only</Text>
          <Switch
            value={openNow}
            onValueChange={setOpenNow}
            trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#FF4458' }}
            thumbColor="#fff"
          />
        </View>

        <Text style={styles.sectionLabel}>PRICE</Text>
        <View style={styles.chipRow}>
          {PRICES.map((p) => (
            <Chip key={p} label={p} active={prices.includes(p)} onPress={() => togglePrice(p)} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>DISTANCE</Text>
        <View style={styles.chipRow}>
          {RADII.map((r) => (
            <Chip key={r} label={r} active={radius === r} onPress={() => setRadius(r)} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>MINIMUM RATING</Text>
        <View style={styles.chipRow}>
          {RATINGS.map((r) => (
            <Chip key={r} label={r} active={minRating === r} onPress={() => setMinRating(r)} />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {showRetry ? (
          <TouchableOpacity onPress={() => runSearch(lastFiltersRef.current)} activeOpacity={0.75} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          onPress={handleFind}
          disabled={loading}
          activeOpacity={0.85}
          style={[styles.findButtonWrapper, loading && styles.findButtonDisabled]}
        >
          <LinearGradient
            colors={['#FF4458', '#FF8C42']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.findButton}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.findButtonText}>Find Restaurants</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.jesusTakeTheWheel, loading && styles.findButtonDisabled]}
          onPress={() => runSearch({ priceLevels: [], radiusMiles: 2, minRating: 0, openNow: false })}
          disabled={loading}
          activeOpacity={0.75}
        >
          <Text style={styles.jesusTakeTheWheelText}>🙏 Skip filters, let Jesus take the wheel</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  back: { color: '#fff', fontSize: 24, width: 40 },
  headerLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  sectionLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginTop: 28, marginBottom: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28 },
  toggleLabel: { color: '#fff', fontSize: 15, fontWeight: '500' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  chipText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  chipActiveWrapper: { borderRadius: 30, shadowColor: '#FF4458', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  chipActiveGradient: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 30 },
  chipTextActive: { color: '#fff', fontSize: 14, fontWeight: '700' },
  error: { color: '#FF4458', fontSize: 13, marginTop: 24, textAlign: 'center' },
  retryButton: { marginTop: 10, alignItems: 'center' },
  retryText: { color: '#FF8C42', fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  footer: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  findButtonWrapper: { borderRadius: 30, shadowColor: '#FF4458', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  findButtonDisabled: { opacity: 0.6 },
  findButton: { height: 58, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  findButtonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  jesusTakeTheWheel: { height: 52, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginTop: 12, borderWidth: 1.5, borderColor: '#FF8C42' },
  jesusTakeTheWheelText: { color: '#FF8C42', fontSize: 14, fontWeight: '700' },
});
