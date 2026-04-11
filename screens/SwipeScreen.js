import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Swiper from 'react-native-deck-swiper';
import RestaurantCard from '../components/RestaurantCard';
import MouthQuestLogo from '../components/MouthQuestLogo';
import { fetchNearbyRestaurants } from '../services/placesApi';
import { addRejected } from '../services/rejectedHistory';


export default function SwipeScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { query, coords = null, nextPageToken: initialPageToken, filters = null } = route.params;
  const [restaurants, setRestaurants] = useState(() => {
    const initial = route.params.restaurants;
    [0, 1, 2].forEach((i) => { if (initial[i]?.photo) Image.prefetch(initial[i].photo); });
    return initial;
  });
  const [swiperHeight, setSwiperHeight] = useState(0);
  const [deckKey, setDeckKey] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [finished, setFinished] = useState(false);
  const [empty, setEmpty] = useState(() => route.params.restaurants.length === 0);
  const [loadError, setLoadError] = useState(null);
  const [resetBanner, setResetBanner] = useState(false);
  const nextPageTokenRef = useRef(initialPageToken);
  const retryCountRef = useRef(0);

  // Reset deck when returning from FilterScreen with fresh results
  useEffect(() => {
    if (!route.params.resetKey) return;
    const next = route.params.restaurants;
    [0, 1, 2].forEach((i) => { if (next[i]?.photo) Image.prefetch(next[i].photo); });
    nextPageTokenRef.current = route.params.nextPageToken ?? null;
    if (next.length === 0) {
      setEmpty(true);
      return;
    }
    setEmpty(false);
    setRestaurants(next);
    setCardIndex(0);
    setDeckKey((k) => k + 1);
    setFinished(false);
    setLoadingMore(false);
  }, [route.params.resetKey]);
  const swiperRef = useRef(null);

  const openInMaps = useCallback((restaurant) => {
    const q = encodeURIComponent(restaurant.name + ' ' + restaurant.address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=${restaurant.placeId}`).catch(() => {});
  }, []);

  const handleSwipedRight = useCallback((index) => {
    openInMaps(restaurants[index]);
  }, [restaurants, openInMaps]);

  const handleSwipedLeft = useCallback((index) => {
    addRejected(coords || query, restaurants[index].placeId);
  }, [restaurants, coords, query]);

  const handleSwiped = useCallback((index) => {
    setCardIndex(index + 1);
    const next = restaurants[index + 3];
    if (next?.photo) Image.prefetch(next.photo);
  }, [restaurants]);

  const handleAllSwiped = useCallback(async () => {
    setLoadError(null);
    setLoadingMore(true);
    try {
      const { restaurants: more, nextPageToken, wasReset } = await fetchNearbyRestaurants(coords || query, nextPageTokenRef.current, filters);
      nextPageTokenRef.current = nextPageToken;
      retryCountRef.current = 0;
      if (more.length === 0) {
        setEmpty(true);
        return;
      }
      if (wasReset) setResetBanner(true);
      setRestaurants(more);
      setCardIndex(0);
      setDeckKey((k) => k + 1);
    } catch (e) {
      retryCountRef.current += 1;
      if (retryCountRef.current >= 2) {
        setFinished(true);
      } else {
        setLoadError("Couldn't load more restaurants. Tap to retry.");
      }
    } finally {
      setLoadingMore(false);
    }
  }, [coords, query]);

  if (empty) return (
    <LinearGradient colors={['#1a0505', '#0f0f0f']} style={styles.center}>
      <Text style={styles.emptyTitle}>No restaurants found</Text>
      <Text style={styles.emptySubtitle}>Try adjusting your filters to see more options.</Text>
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.adjustFiltersWrapper}
        onPress={() => navigation.navigate('Filter', { query, coords, filters, fromSwipe: true })}
      >
        <LinearGradient
          colors={['#FF4458', '#FF8C42']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.adjustFiltersButton}
        >
          <Text style={styles.adjustFiltersText}>Adjust Filters</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );

  if (loadingMore) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#FF4458" /><Text style={styles.loadingText}>Finding more...</Text></View>
  );

  if (finished) return (
    <View style={styles.center}>
      <Text style={{ fontSize: 64 }}>🎉</Text>
      <Text style={styles.doneTitle}>You've seen it all!</Text>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Search New Location</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <View style={styles.headerLogoRow}>
          <MouthQuestLogo size={32} />
          <Text style={styles.headerTitle}>MouthQuest</Text>
        </View>
        <TouchableOpacity style={styles.filterPill} onPress={() => navigation.navigate('Filter', { query, coords, filters, fromSwipe: true })}>
          <Text style={styles.filterPillText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {resetBanner ? (
        <TouchableOpacity style={styles.resetBanner} onPress={() => setResetBanner(false)} activeOpacity={0.8}>
          <Text style={styles.resetBannerText}>You've seen everything nearby — showing restaurants again from the start!</Text>
        </TouchableOpacity>
      ) : null}

      {loadError ? (
        <TouchableOpacity style={styles.errorBanner} onPress={handleAllSwiped} activeOpacity={0.8}>
          <Text style={styles.errorBannerText}>{loadError}</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.swiperContainer} onLayout={(e) => setSwiperHeight(e.nativeEvent.layout.height)}>
        {swiperHeight > 0 && <Swiper
          key={deckKey}
          ref={swiperRef}
          cards={restaurants}
          cardIndex={cardIndex}
          renderCard={(r) => r ? <RestaurantCard restaurant={r} /> : null}
          onSwipedRight={handleSwipedRight}
          onSwipedLeft={handleSwipedLeft}
          onSwiped={handleSwiped}
          onSwipedAll={handleAllSwiped}
          backgroundColor="transparent"
          stackSize={3}
          stackSeparation={14}
          stackScale={4}
          animateCardOpacity
          disableTopSwipe
          disableBottomSwipe
          cardHorizontalMargin={20}
          cardStyle={{ height: swiperHeight - 16 }}
          overlayLabels={{
            left: { title: 'NOPE', style: { label: { borderColor: '#FF4458', color: '#FF4458', borderWidth: 3, fontSize: 22, fontWeight: '900', borderRadius: 8, padding: 8 }, wrapper: { flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', marginTop: 30, marginLeft: -20 } } },
            right: { title: "LET'S GO", style: { label: { borderColor: '#4CDA64', color: '#4CDA64', borderWidth: 3, fontSize: 22, fontWeight: '900', borderRadius: 8, padding: 8 }, wrapper: { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', marginTop: 30, marginLeft: 20 } } },
          }}
        />}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.nopeBtn]} onPress={() => swiperRef.current?.swipeLeft()}>
            <Text style={{ fontSize: 24 }}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.goBtn]} onPress={() => swiperRef.current?.swipeRight()}>
            <Text style={{ fontSize: 24 }}>📍</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>Swipe right for directions • Swipe left to skip</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  back: { color: '#fff', fontSize: 24, width: 40 },
  headerLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  filterPill: { backgroundColor: '#FF4458', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  filterPillText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  swiperContainer: { flex: 1, zIndex: 1, overflow: 'hidden' },
  bottom: { zIndex: 0, height: 160 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 40, paddingVertical: 16 },
  actionBtn: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  nopeBtn: { backgroundColor: '#1e1e1e', borderWidth: 2, borderColor: '#FF4458' },
  goBtn: { backgroundColor: '#4CDA64' },
  hint: { color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', paddingBottom: 4 },
  emptyTitle: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  emptySubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  adjustFiltersWrapper: { borderRadius: 30, marginTop: 0 },
  adjustFiltersButton: { height: 52, paddingHorizontal: 40, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  adjustFiltersText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resetBanner: { backgroundColor: '#FF8C42', paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center' },
  resetBannerText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  errorBanner: { backgroundColor: '#FF4458', paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center' },
  errorBannerText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  loadingText: { color: 'rgba(255,255,255,0.5)', marginTop: 16, fontSize: 15 },
  doneTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 24 },
  backButton: { backgroundColor: '#FF4458', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 14 },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
