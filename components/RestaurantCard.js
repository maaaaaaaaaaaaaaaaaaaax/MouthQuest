import React from 'react';
import { View, Text, ImageBackground, StyleSheet } from 'react-native';

export default function RestaurantCard({ restaurant }) {
  return (
    <ImageBackground
      source={{ uri: restaurant.photo }}
      style={styles.card}
      imageStyle={styles.image}
      resizeMode="cover"
    >
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.cuisine}>{restaurant.cuisine.toUpperCase()}</Text>
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
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden', justifyContent: 'flex-end' },
  image: { borderRadius: 20 },
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
