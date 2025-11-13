/**
 * Geolocation Service for Location-Based News
 * 
 * This service handles user location permissions and provides
 * location-based news personalization.
 */

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserLocation {
  latitude: number;
  longitude: number;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  timezone: string;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.LocationPermissionResponse['status'];
}

export class GeolocationService {
  private static readonly LOCATION_STORAGE_KEY = 'user_location';
  private static readonly LOCATION_PERMISSION_KEY = 'location_permission_granted';

  /**
   * Request location permission from user
   */
  static async requestLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      // Check if we already have permission
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === 'granted') {
        return {
          granted: true,
          canAskAgain: true,
          status: existingStatus
        };
      }

      // Request permission
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      const result = {
        granted: status === 'granted',
        canAskAgain,
        status
      };

      // Store permission status
      await AsyncStorage.setItem(
        this.LOCATION_PERMISSION_KEY, 
        JSON.stringify(result)
      );

      return result;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied' as Location.LocationPermissionResponse['status']
      };
    }
  }

  /**
   * Get current user location
   */
  static async getCurrentLocation(): Promise<UserLocation | null> {
    try {
      // Check if we have permission
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 100,
      });

      // Reverse geocode to get address information
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const firstAddress = address[0];
      if (!firstAddress) {
        throw new Error('Could not determine address');
      }

      const userLocation: UserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        country: firstAddress.country || 'Unknown',
        countryCode: firstAddress.isoCountryCode || 'US',
        region: firstAddress.region || 'Unknown',
        city: firstAddress.city || firstAddress.district || 'Unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      // Store location for future use
      await AsyncStorage.setItem(
        this.LOCATION_STORAGE_KEY,
        JSON.stringify(userLocation)
      );

      return userLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Get stored location
   */
  static async getStoredLocation(): Promise<UserLocation | null> {
    try {
      const storedLocation = await AsyncStorage.getItem(this.LOCATION_STORAGE_KEY);
      if (storedLocation) {
        return JSON.parse(storedLocation);
      }
      return null;
    } catch (error) {
      console.error('Error getting stored location:', error);
      return null;
    }
  }

  /**
   * Check if location permission is granted
   */
  static async hasLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking location permission:', error);
      return false;
    }
  }

  /**
   * Get location-based country code for news API
   */
  static async getCountryCodeForNews(): Promise<string> {
    try {
      // Try to get current location first
      const currentLocation = await this.getCurrentLocation();
      if (currentLocation) {
        return currentLocation.countryCode.toLowerCase();
      }

      // Fallback to stored location
      const storedLocation = await this.getStoredLocation();
      if (storedLocation) {
        return storedLocation.countryCode.toLowerCase();
      }

      // Default to US if no location available
      return 'us';
    } catch (error) {
      console.error('Error getting country code:', error);
      return 'us';
    }
  }

  /**
   * Get location-based region name for display
   */
  static async getLocationDisplayName(): Promise<string> {
    try {
      const currentLocation = await this.getCurrentLocation();
      if (currentLocation) {
        return `${currentLocation.city}, ${currentLocation.region}`;
      }

      const storedLocation = await this.getStoredLocation();
      if (storedLocation) {
        return `${storedLocation.city}, ${storedLocation.region}`;
      }

      return 'Unknown Location';
    } catch (error) {
      console.error('Error getting location display name:', error);
      return 'Unknown Location';
    }
  }

  /**
   * Clear stored location data
   */
  static async clearLocationData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.LOCATION_STORAGE_KEY);
      await AsyncStorage.removeItem(this.LOCATION_PERMISSION_KEY);
    } catch (error) {
      console.error('Error clearing location data:', error);
    }
  }

  /**
   * Get regional trending topics based on location
   */
  static async getRegionalTrendingTopics(countryCode: string): Promise<string[]> {
    // This would typically call a regional trending topics API
    // For now, we'll return location-specific topics based on country
    const regionalTopics: { [key: string]: string[] } = {
      'us': ['US Politics', 'American Economy', 'US Technology', 'Hollywood', 'US Sports'],
      'gb': ['UK Politics', 'Brexit', 'British Economy', 'Premier League', 'UK Technology'],
      'ca': ['Canadian Politics', 'Canadian Economy', 'NHL', 'Canadian Technology', 'Climate Change'],
      'au': ['Australian Politics', 'Australian Economy', 'AFL', 'Australian Technology', 'Wildlife'],
      'de': ['German Politics', 'German Economy', 'Bundesliga', 'German Technology', 'EU News'],
      'fr': ['French Politics', 'French Economy', 'Ligue 1', 'French Technology', 'EU News'],
      'jp': ['Japanese Politics', 'Japanese Economy', 'J-League', 'Japanese Technology', 'Anime'],
      'kr': ['Korean Politics', 'Korean Economy', 'K-Pop', 'Korean Technology', 'K-Drama'],
      'in': ['Indian Politics', 'Indian Economy', 'Cricket', 'Indian Technology', 'Bollywood'],
      'br': ['Brazilian Politics', 'Brazilian Economy', 'Football', 'Brazilian Technology', 'Carnival'],
      'mx': ['Mexican Politics', 'Mexican Economy', 'Mexican Football', 'Mexican Technology', 'Culture'],
      'cn': ['Chinese Politics', 'Chinese Economy', 'Chinese Technology', 'Chinese Culture', 'Manufacturing'],
    };

    return regionalTopics[countryCode.toLowerCase()] || [
      'Local Politics', 'Regional Economy', 'Local Sports', 'Regional Technology', 'Local Culture'
    ];
  }

  /**
   * Get location-based news sources
   */
  static async getRegionalNewsSources(countryCode: string): Promise<string[]> {
    const regionalSources: { [key: string]: string[] } = {
      'us': ['cnn', 'fox-news', 'abc-news', 'cbs-news', 'nbc-news'],
      'gb': ['bbc-news', 'independent', 'telegraph', 'guardian', 'daily-mail'],
      'ca': ['cbc-news', 'ctv-news', 'global-news', 'national-post'],
      'au': ['abc-news-au', 'news-com-au', 'smh', 'the-australian'],
      'de': ['der-tagesspiegel', 'die-zeit', 'spiegel-online', 'focus'],
      'fr': ['le-monde', 'le-figaro', 'liberation', 'france-24'],
      'jp': ['nhk', 'asahi', 'mainichi', 'yomiuri'],
      'kr': ['korea-herald', 'korea-times', 'chosun', 'joongang'],
      'in': ['the-times-of-india', 'hindustan-times', 'indian-express', 'the-hindu'],
      'br': ['globo', 'folha', 'estadao', 'g1'],
      'mx': ['el-universal', 'milenio', 'reforma', 'excelsior'],
      'cn': ['xinhua', 'people-daily', 'china-daily', 'global-times'],
    };

    return regionalSources[countryCode.toLowerCase()] || ['bbc-news', 'reuters', 'associated-press'];
  }
}

export default GeolocationService;
