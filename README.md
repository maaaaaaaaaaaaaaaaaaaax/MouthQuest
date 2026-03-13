# DishSwipe

A Tinder-style restaurant discovery app built with React Native and Expo. Swipe right to open Google Maps directions, swipe left to skip.

---

## Screenshots

> _Coming soon_

---

## Features

- Swipe right on a restaurant to instantly open Google Maps directions
- Swipe left to skip and see the next option
- Tap the ✕ / 📍 buttons if you prefer not to swipe
- Auto-loads a fresh batch of restaurants when you've seen them all
- Dark theme throughout
- Mock data mode for development — no API key required to run locally

---

## Tech Stack

- [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/)
- [react-native-deck-swiper](https://github.com/alexbrillant/react-native-deck-swiper) — card swiping
- [React Navigation](https://reactnavigation.org/) — screen navigation
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service) — restaurant data (mocked by default)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Expo Go](https://expo.dev/client) installed on your phone

### Install

```bash
git clone https://github.com/maaaaaaaaaaaaaaaaaaaax/DishSwipe.git
cd DishSwipe
npm install
```

### Run

```bash
npx expo start
```

Scan the QR code with Expo Go (Android) or your Camera app (iOS). The app will load on your phone.

---

## Going Live with Real Restaurant Data

By default the app runs in mock mode with 8 hardcoded restaurants. To use real data:

1. Get a [Google Places API key](https://developers.google.com/maps/documentation/places/web-service/get-api-key) with the following APIs enabled:
   - Places API
   - Geocoding API

2. Open `services/placesApi.js` and make two changes:

```js
const GOOGLE_PLACES_API_KEY = 'YOUR_KEY_HERE'; // paste your key
const USE_MOCK = false;                          // flip to false
```

That's it. The app will now fetch real restaurants near whatever city or zip code the user enters.

---

## Project Structure

```
DishSwipe/
├── App.js                      # Entry point, navigation setup
├── data/
│   └── mockRestaurants.js      # Hardcoded restaurant data for dev/testing
├── services/
│   └── placesApi.js            # Fetches restaurants (mock or real API)
├── screens/
│   ├── SearchScreen.js         # City/zip search input
│   └── SwipeScreen.js          # Swipeable deck of restaurant cards
└── components/
    └── RestaurantCard.js       # Individual restaurant card UI
```

---

## License

MIT
