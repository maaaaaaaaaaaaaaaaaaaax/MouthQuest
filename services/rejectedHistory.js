import AsyncStorage from '@react-native-async-storage/async-storage';

// Round coords to 2 decimal places (~1km precision) so nearby GPS fixes
// map to the same key even if the device reports slightly different coords.
export function getLocationKey(location) {
  if (location && typeof location === 'object') {
    const lat = location.lat.toFixed(2);
    const lng = location.lng.toFixed(2);
    return `rejected:${lat},${lng}`;
  }
  return `rejected:${location}`;
}

export async function getRejected(location) {
  try {
    const raw = await AsyncStorage.getItem(getLocationKey(location));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export async function addRejected(location, placeId) {
  try {
    const key = getLocationKey(location);
    const raw = await AsyncStorage.getItem(key);
    const ids = raw ? JSON.parse(raw) : [];
    if (!ids.includes(placeId)) {
      ids.push(placeId);
      await AsyncStorage.setItem(key, JSON.stringify(ids));
    }
  } catch {
    // Silently fail — rejection history is best-effort
  }
}

export async function clearRejected(location) {
  try {
    await AsyncStorage.removeItem(getLocationKey(location));
  } catch {
    // Silently fail
  }
}
