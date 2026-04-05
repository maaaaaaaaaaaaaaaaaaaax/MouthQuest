// MouthQuest — Places API Service
//
// Roadmap context:
// Phase 1: Real Google Places API + match animation (complete)
// Phase 2: Filters (cuisine, price, distance, rating), GPS location (complete)
// Phase 3: App Store polish — icons, error handling, accessibility.
//   - Food photo filtering: some cards show exterior/street photos instead of food.
//     Option A (validate first): request up to 10 photos per place and select the
//     highest-ranked candidate. Option B (if A is insufficient): use Google Cloud
//     Vision API to classify photos as food vs non-food before displaying.
// Phase 4: EAS build + App Store submission
//
// Service layer notes for future phases:
// - fetchNearbyRestaurants accepts lat/lng directly (no geocoding) to support GPS
// - filters param is extensible: add open-now, cuisine expand, etc. in Phase 2+
// - restaurant objects are plain serializable data (AsyncStorage-ready for favorites)

import { mockRestaurants } from '../data/mockRestaurants';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const USE_MOCK = false; // Flip to true to use mock data
const DEBUG = true; // Set to false before App Store submission

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// filters shape: { cuisines: string[], priceLevels: string[], radiusMiles: number, minRating: number }
// priceLevels uses $ symbols ('$','$$','$$$','$$$$') mapped to Places API 1-4 scale
// minRating is a number (0 = any, 3 = 3+, 4 = 4+, 4.5 = 4.5+)
const PRICE_LEVEL_MAP = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 };

export async function fetchNearbyRestaurants(cityOrZipOrCoords, pageToken = null, filters = null) {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 800));
    return { restaurants: mockRestaurants, nextPageToken: null };
  }

  let location;
  if (cityOrZipOrCoords && typeof cityOrZipOrCoords === 'object') {
    // Already have lat/lng — skip geocoding
    location = { lat: cityOrZipOrCoords.lat, lng: cityOrZipOrCoords.lng };
  } else {
    // Geocode the city/zip to lat/lng
    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cityOrZipOrCoords)}&key=${GOOGLE_PLACES_API_KEY}`
    );
    const geoData = await geoRes.json();
    location = geoData.results[0]?.geometry?.location;
    if (!location) throw new Error('Location not found');
  }

  // Build Places Nearby Search URL
  let url;
  if (pageToken) {
    // pageToken encodes the original search — other params are ignored by the API
    url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${pageToken}&key=${GOOGLE_PLACES_API_KEY}`;
  } else if (filters) {
    const { cuisines = [], priceLevels = [], radiusMiles = 2, openNow = false } = filters;
    const radiusMeters = Math.round(radiusMiles * 1609.34);
    // radius requires rankby=prominence (default); rankby=distance cannot be used with radius
    url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radiusMeters}&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`;
    // Join all selected cuisines as a single keyword string
    if (cuisines.length > 0) url += `&keyword=${encodeURIComponent(cuisines.join(' '))}`;
    if (priceLevels.length > 0) {
      const levels = priceLevels.map((p) => PRICE_LEVEL_MAP[p]);
      url += `&minprice=${Math.min(...levels)}&maxprice=${Math.max(...levels)}`;
    }
    if (openNow) url += `&opennow=true`;
  } else {
    // No filters — rank by distance (closest first)
    url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&rankby=distance&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`;
  }

  const placesRes = await fetch(url);
  const placesData = await placesRes.json();

  if (!placesData.results) throw new Error(placesData.status || 'No results from Places API');

  const restaurants = placesData.results.map((place) => {
    const dist = haversineDistance(
      location.lat, location.lng,
      place.geometry.location.lat, place.geometry.location.lng
    );
    return {
      id: place.place_id,
      name: place.name,
      cuisine: (place.types?.find((t) => !['restaurant', 'food', 'point_of_interest', 'establishment'].includes(t)) || 'restaurant')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      priceLevel: '$'.repeat(place.price_level ?? 2),
      distance: `${dist.toFixed(1)} mi`,
      distanceMiles: dist,
      address: place.vicinity,
      photo: place.photos?.[0]
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
        : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
      placeId: place.place_id,
    };
  });

  // Client-side filters: rating (Places API has no native rating filter)
  // and distance (enforces exact radius, since API radius is approximate)
  let filtered = restaurants;
  if (filters) {
    const { minRating = 0, radiusMiles = 2 } = filters;
    if (minRating > 0) filtered = filtered.filter((r) => (r.rating || 0) >= minRating);
    filtered = filtered.filter((r) => r.distanceMiles <= radiusMiles);
  }

  const total = filtered.length;
  const withPhoto = filtered.filter((r) => r.photo && !r.photo.includes('unsplash')).length;
  const fallback = total - withPhoto;
  if (DEBUG) console.log(`[Photo Coverage] ${withPhoto}/${total} have photos (${total > 0 ? Math.round((withPhoto / total) * 100) : 0}%), ${fallback} will use fallback`);

  return { restaurants: filtered, nextPageToken: placesData.next_page_token || null };
}
