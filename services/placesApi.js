import { mockRestaurants } from '../data/mockRestaurants';

const GOOGLE_PLACES_API_KEY = 'YOUR_API_KEY_HERE';
const USE_MOCK = true; // Flip to false once you have a real API key

export async function fetchNearbyRestaurants(cityOrZip, pageToken = null) {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 800));
    return { restaurants: mockRestaurants, nextPageToken: null };
  }

  // Step 1: Geocode the city/zip to lat/lng
  const geoRes = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cityOrZip)}&key=${GOOGLE_PLACES_API_KEY}`
  );
  const geoData = await geoRes.json();
  const location = geoData.results[0]?.geometry?.location;
  if (!location) throw new Error('Location not found');

  // Step 2: Nearby restaurant search
  let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=2000&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`;
  if (pageToken) url += `&pagetoken=${pageToken}`;

  const placesRes = await fetch(url);
  const placesData = await placesRes.json();

  const restaurants = placesData.results.map((place) => ({
    id: place.place_id,
    name: place.name,
    cuisine: place.types?.find((t) => !['restaurant','food','point_of_interest','establishment'].includes(t)) || 'Restaurant',
    rating: place.rating,
    reviewCount: place.user_ratings_total,
    priceLevel: '$'.repeat(place.price_level || 2),
    distance: '',
    address: place.vicinity,
    photo: place.photos?.[0]
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
      : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
    placeId: place.place_id,
  }));

  return { restaurants, nextPageToken: placesData.next_page_token || null };
}
