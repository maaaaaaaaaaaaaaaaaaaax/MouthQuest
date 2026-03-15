import React, { useState } from 'react';
import { View, Text, ImageBackground, StyleSheet, Animated } from 'react-native';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600';

export default function RestaurantCard({ restaurant, glowAnim }) {
  const [photoUri, setPhotoUri] = useState(restaurant.photo || FALLBACK_IMAGE);
  const borderColor = glowAnim
    ? glowAnim.interpolate({ inputRange: [0, 1], outputRange: ['transparent', '#4CDA64'] })
    : 'transparent';

  const shadowOpacity = glowAnim
    ? glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.9] })
    : 0;

  const elevation = glowAnim
    ? glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 18] })
    : 0;

  return (
    <Animated.View style={[
      styles.glowWrapper,
      {
        borderColor,
        shadowOpacity,
        elevation,
        shadowColor: '#4CDA64',
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 0 },
      },
    ]}>
      <ImageBackground
        source={{ uri: photoUri }}
        style={styles.card}
        imageStyle={styles.image}
        resizeMode="cover"
        onError={() => setPhotoUri(FALLBACK_IMAGE)}
      >
        <View style={styles.info}>
          <View style={styles.topRow}>
            <Text style={styles.cuisine}>{restaurant.cuisine?.toUpperCase()}</Text>
            <Text style={styles.price}>{restaurant.priceLevel}</Text>
          </View>
          <Text style={styles.name}>{restaurant.name}</Text>
          <View style={styles.bottomRow}>
            <Text style={styles.ratingText}>⭐ {restaurant.rating}</Text>
            <Text style={styles.reviewText}>({restaurant.reviewCount?.toLocaleString()})</Text>
            {restaurant.distance ? <Text style={styles.distance}>📍 {restaurant.distance}</Text> : null}
          </View>
          <Text style={styles.address}>{restaurant.address}</Text>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glowWrapper: { width: '100%', height: '100%', borderRadius: 20, borderWidth: 3 },
  card: { width: '100%', height: '100%', borderRadius: 18, overflow: 'hidden', justifyContent: 'flex-end' },
  image: { borderRadius: 18 },
  info: { padding: 24, paddingBottom: 28, backgroundColor: 'rgba(0,0,0,0.45)' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cuisine: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  price: { color: '#4CAF50', fontSize: 14, fontWeight: '700' },
  name: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 10 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  ratingText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  reviewText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  distance: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' },
  address: { color: 'rgba(255,255,255,0.55)', fontSize: 12 },
});
