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

export async function fetchNearbyRestaurants(cityOrZipOrCoords, pageToken = null) {
  if (USE_MOCK) {
    await new Promise((res) => setTimeout(res, 800));
    return { restaurants: mockRestaurants, nextPageToken: null };
  }

  let location;
  if (cityOrZipOrCoords && typeof cityOrZipOrCoords === 'object') {
    // Already have lat/lng — skip geocoding
    location = { lat: cityOrZipOrCoords.lat, lng: cityOrZipOrCoords.lng };
  } else {
    // Step 1: Geocode the city/zip to lat/lng
    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cityOrZipOrCoords)}&key=${GOOGLE_PLACES_API_KEY}`
    );
    const geoData = await geoRes.json();
    location = geoData.results[0]?.geometry?.location;
    if (!location) throw new Error('Location not found');
  }

  // Step 2: Nearby restaurant search, sorted by distance
  let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&rankby=distance&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`;
  if (pageToken) url += `&pagetoken=${pageToken}`;

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
      address: place.vicinity,
      photo: place.photos?.[0]
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
        : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
      placeId: place.place_id,
    };
  });

  const total = restaurants.length;
  const withPhoto = restaurants.filter((r) => r.photo && !r.photo.includes('unsplash')).length;
  const fallback = total - withPhoto;
  if (DEBUG) console.log(`[Photo Coverage] ${withPhoto}/${total} have photos (${Math.round((withPhoto / total) * 100)}%), ${fallback} will use fallback`);

  return { restaurants, nextPageToken: placesData.next_page_token || null };
}
