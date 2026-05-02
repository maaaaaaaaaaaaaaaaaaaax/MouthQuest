// MouthQuest — Places API Service
//
// ROADMAP CONTEXT
// Phase 1 (complete): Google Places API, match animation
//
// Phase 2 (current — must complete before launch):
//   - GPS location ✅
//   - Filters (cuisine, price, distance, rating) ✅
//   - Open-now filter toggle
//   - Favorites list (local storage)
//   - UI consistency pass (cards, filter screen, search screen)
//   - Error states: no internet, API returns nothing, location denied
//   - Empty state when no restaurants match filters
//   - App icon + splash screen (replace Expo defaults)
//
// Phase 3 (post-launch improvements):
//   - City name support and international zip codes: currently restricted to US 5-digit zip codes only.
//     Expanding to city names or non-US formats requires geocoding or a different Places API query strategy.
//   - Replace static cuisine chips with free text 'What are you in the mood for?' input (also replaces vibe filter)
//   - Max review count filter: let users filter for restaurants with fewer than X reviews to surface hidden gems
//     and avoid tourist traps. Implementable client-side using the existing reviewCount field on each restaurant
//     object — no API changes needed. Add a slider or chip row to FilterScreen (e.g. 'Under 50', 'Under 200',
//     'Under 500', 'Any'). Consider pairing with a minimum rating filter so low-review results are still quality.
//   - Hidden Gems toggle: filter client-side for restaurants with user_ratings_total < 500 AND rating >= 4.0.
//     Surfaces lesser-known quality spots without exposing a raw review count filter. Add as a toggle in
//     FilterScreen alongside the existing price/distance/rating filters.
//   - Guided mood-based search path: on the search screen, offer two entry points — 'I know what I want'
//     (current filter flow) and 'Pick my vibe' (guided path). The guided path presents curated preset cards
//     the user taps to select, each mapping to a specific combination of Places API parameters and
//     client-side filters. Presets to define later but initial ideas include: 'Date night somewhere cute'
//     (high rating, upscale price, prominence sort), 'Big group, big drinks' (bars, high capacity keywords),
//     'Hidden gem' (under 500 reviews, rating 4.0+), 'Quick and cheap' ($ price, open now, distance 0.5mi).
//     Each preset bypasses the filter screen entirely and goes straight to the swipe deck. Add as a new
//     screen screens/MoodScreen.js inserted between SearchScreen and FilterScreen.
//   - Wait time filter: explore Places API busyness data. Validate coverage before building UI
//   - Food photo filtering: request multiple photos per restaurant, use food-classified image. Evaluate Google Cloud Vision API if needed
//   - Filtering for menu/food items using Google Places photo category metadata
//   - Restaurant detail screen: tapping a card opens a profile view showing additional photos
//     from the Places API (up to 10 available), full address, opening hours, price level,
//     rating, and a 'Take me there' button that opens Google Maps. Reuses the existing
//     placeId already stored on each restaurant object to fetch additional details via the
//     Places Details API endpoint
//
// Phase 4 (launch):
//   - EAS Build (production .ipa and .aab binaries)
//   - App Store + Google Play submission
//
// Caching note: fetchNearbyRestaurants uses a simple in-memory Map with a 5-minute TTL.
//   If the app scales beyond ~1000 DAU, evaluate React Query for cache management,
//   background refetch, and stale-while-revalidate behaviour.

import { mockRestaurants } from '../data/mockRestaurants';
import { getRejected, clearRejected } from './rejectedHistory';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const USE_MOCK = false; // Flip to true to use mock data
const DEBUG = true; // Set to false before App Store submission

const CACHE_TTL = 300000; // 5 minutes in ms
const resultsCache = new Map(); // key → { result, timestamp }

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

  // Cache lookup — skip for pageToken requests (tokens are ephemeral and single-use)
  const cacheKey = pageToken ? null : JSON.stringify({ location: cityOrZipOrCoords, filters });
  if (cacheKey) {
    const cached = resultsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      if (DEBUG) console.log('[Cache] HIT', cacheKey);
      return cached.result;
    }
  }

  // Resolve location (needed for haversineDistance and URL building).
  // Skip for pageToken requests — the token encodes the original search.
  let location = null;
  if (!pageToken) {
    if (cityOrZipOrCoords && typeof cityOrZipOrCoords === 'object') {
      location = { lat: cityOrZipOrCoords.lat, lng: cityOrZipOrCoords.lng };
    } else {
      const geoRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cityOrZipOrCoords)}&key=${GOOGLE_PLACES_API_KEY}`
      );
      const geoData = await geoRes.json();
      location = geoData.results[0]?.geometry?.location;
      if (!location) throw new Error('Location not found');
    }
  }

  // Build Places Nearby Search URL
  let url;
  if (pageToken) {
    // Google requires ~2s before a freshly-issued pageToken becomes valid;
    // using it immediately returns INVALID_REQUEST.
    console.log('[Places] Fetching page 2 with token:', pageToken);
    await new Promise((res) => setTimeout(res, 2000));
    url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${pageToken}&key=${GOOGLE_PLACES_API_KEY}`;
  } else if (filters) {
    const { cuisines = [], priceLevels = [], radiusMiles = 2, openNow = false } = filters;
    const radiusMeters = Math.round(radiusMiles * 1609.34);
    url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radiusMeters}&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`;
    if (cuisines.length > 0) url += `&keyword=${encodeURIComponent(cuisines.join(' '))}`;
    if (priceLevels.length > 0) {
      const levels = priceLevels.map((p) => PRICE_LEVEL_MAP[p]);
      url += `&minprice=${Math.min(...levels)}&maxprice=${Math.max(...levels)}`;
    }
    if (openNow) url += `&opennow=true`;
  } else {
    url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&rankby=prominence&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`;
  }

  let placesData;
  try {
    const placesRes = await fetch(url);
    placesData = await placesRes.json();
  } catch (e) {
    console.log('[Places] Fetch/parse failed (' + (pageToken ? 'page 2+' : 'page 1') + '):', e.message, e.stack);
    throw e;
  }

  console.log('[Places] Raw response (' + (pageToken ? 'page 2+' : 'page 1') + ') — status:', placesData.status, '| results:', placesData.results?.length ?? 0, '| nextPageToken:', placesData.next_page_token ? 'YES' : 'NO', '| error_message:', placesData.error_message ?? 'none');

  if (!placesData.results) throw new Error(placesData.status || 'No results from Places API');

  const restaurants = placesData.results.map((place) => {
    const dist = location
      ? haversineDistance(location.lat, location.lng, place.geometry.location.lat, place.geometry.location.lng)
      : null;
    return {
      id: place.place_id,
      name: place.name,
      cuisine: (place.types?.find((t) => !['restaurant', 'food', 'point_of_interest', 'establishment'].includes(t)) || 'restaurant')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      priceLevel: '$'.repeat(place.price_level ?? 2),
      distance: dist != null ? `${dist.toFixed(1)} mi` : null,
      distanceMiles: dist,
      address: place.vicinity,
      photo: place.photos?.[0]
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
        : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
      placeId: place.place_id,
    };
  });

  // Client-side filters: rating (Places API has no native rating filter)
  // and distance (enforces exact radius, since API radius is approximate)
  let filtered = restaurants;
  if (filters && location) {
    // Client-side distance filter only applies when we have the original center.
    // pageToken results skip this — the original search already enforced the radius.
    const { minRating = 0, radiusMiles = 2 } = filters;
    if (minRating > 0) filtered = filtered.filter((r) => (r.rating || 0) >= minRating);
    filtered = filtered.filter((r) => r.distanceMiles <= radiusMiles);
  } else if (filters && !location) {
    const { minRating = 0 } = filters;
    if (minRating > 0) filtered = filtered.filter((r) => (r.rating || 0) >= minRating);
  }

  // Filter out restaurants the user has previously rejected at this location.
  // Note: cached results are already rejection-filtered at write time, so rejected
  // restaurants may reappear within the 5-minute cache TTL — acceptable tradeoff.
  const rejected = await getRejected(cityOrZipOrCoords);
  let derejected = rejected.size > 0
    ? filtered.filter((r) => !rejected.has(r.placeId))
    : filtered;

  let wasReset = false;
  if (derejected.length === 0 && filtered.length > 0) {
    // User has rejected every result — reset history and show everything again.
    await clearRejected(cityOrZipOrCoords);
    derejected = filtered;
    wasReset = true;
  }

  const total = derejected.length;
  const withPhoto = derejected.filter((r) => r.photo && !r.photo.includes('unsplash')).length;
  const fallback = total - withPhoto;
  if (DEBUG) console.log(`[Photo Coverage] ${withPhoto}/${total} have photos (${total > 0 ? Math.round((withPhoto / total) * 100) : 0}%), ${fallback} will use fallback`);

  const result = { restaurants: derejected, nextPageToken: placesData.next_page_token || null, wasReset };
  if (cacheKey) {
    resultsCache.set(cacheKey, { result, timestamp: Date.now() });
    if (DEBUG) console.log('[Cache] SET', cacheKey);
  }
  return result;
}
