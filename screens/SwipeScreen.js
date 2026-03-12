import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, Dimensions } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import RestaurantCard from '../components/RestaurantCard';
import { fetchNearbyRestaurants } from '../services/placesApi';

const { height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.68;

export default function SwipeScreen({ route, navigation }) {
  const { query, nextPageToken: initialPageToken } = route.params;
  const [restaurants, setRestaurants] = useState(route.params.restaurants);
  const [cardIndex, setCardIndex] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [finished, setFinished] = useState(false);
  const nextPageTokenRef = useRef(initialPageToken);
  const swiperRef = useRef(null);

  const openInMaps = useCallback((restaurant) => {
    const q = encodeURIComponent(restaurant.name + ' ' + restaurant.address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=${restaurant.placeId}`);
  }, []);

  const handleSwipedRight = useCallback((index) => { openInMaps(restaurants[index]); }, [restaurants, openInMaps]);
  const handleSwiped = useCallback((index) => { setCardIndex(index + 1); }, []);

  const handleAllSwiped = useCallback(async () => {
    setLoadingMore(true);
    try {
      const { restaurants: more, nextPageToken } = await fetchNearbyRestaurants(query, nextPageTokenRef.current);
      nextPageTokenRef.current = nextPageToken;
      setRestaurants(more);
      setCardIndex(0);
    } catch {
      setFinished(true);
    } finally {
      setLoadingMore(false);
    }
  }, [query]);

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
        <Text style={styles.headerTitle}>🍽️ DishSwipe</Text>
        <View style={{ width: 40 }} />
      </View>

      <Swiper
        ref={swiperRef}
        cards={restaurants}
        cardIndex={cardIndex}
        renderCard={(r) => r ? <RestaurantCard restaurant={r} /> : null}
        onSwipedRight={handleSwipedRight}
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
        cardStyle={{ height: CARD_HEIGHT }}
        overlayLabels={{
          left: { title: 'NOPE', style: { label: { borderColor: '#FF4458', color: '#FF4458', borderWidth: 3, fontSize: 22, fontWeight: '900', borderRadius: 8, padding: 8 }, wrapper: { flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', marginTop: 30, marginLeft: -20 } } },
          right: { title: "LET'S GO", style: { label: { borderColor: '#4CDA64', color: '#4CDA64', borderWidth: 3, fontSize: 22, fontWeight: '900', borderRadius: 8, padding: 8 }, wrapper: { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', marginTop: 30, marginLeft: 20 } } },
        }}
      />

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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  center: { flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', alignItems: 'center', padding: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  back: { color: '#fff', fontSize: 24, width: 40 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 40, paddingVertical: 20 },
  actionBtn: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  nopeBtn: { backgroundColor: '#1e1e1e', borderWidth: 2, borderColor: '#FF4458' },
  goBtn: { backgroundColor: '#4CDA64' },
  hint: { color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', paddingBottom: 24 },
  loadingText: { color: 'rgba(255,255,255,0.5)', marginTop: 16, fontSize: 15 },
  doneTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 24 },
  backButton: { backgroundColor: '#FF4458', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 14 },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
