declare interface Window {
  google: {
    maps: {
      places: {
        Autocomplete: new (
          inputElement: HTMLInputElement, 
          options?: { types?: string[] }
        ) => {
          addListener: (event: string, callback: () => void) => void;
          getPlace: () => {
            name?: string;
            formatted_address?: string;
            geometry?: {
              location: {
                lat: () => number;
                lng: () => number;
              };
            };
          };
        };
      };
    };
  };
}

// Type definitions for Google Maps Places Autocomplete API
declare namespace google.maps.places {
  interface AutocompletePrediction {
    description: string;
    matched_substrings: Array<{
      length: number;
      offset: number;
    }>;
    place_id: string;
    reference: string;
    structured_formatting: {
      main_text: string;
      main_text_matched_substrings: Array<{
        length: number;
        offset: number;
      }>;
      secondary_text: string;
    };
    terms: Array<{
      offset: number;
      value: string;
    }>;
    types: string[];
  }

  interface AutocompleteService {
    getPlacePredictions(
      request: {
        input: string;
        types?: string[];
        componentRestrictions?: {
          country: string | string[];
        };
      },
      callback: (
        predictions: AutocompletePrediction[] | null,
        status: google.maps.places.PlacesServiceStatus
      ) => void
    ): void;
  }

  interface AutocompleteOptions {
    bounds?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
    componentRestrictions?: {
      country: string | string[];
    };
    fields?: string[];
    strictBounds?: boolean;
    types?: string[];
  }

  interface Autocomplete {
    addListener(eventName: string, handler: () => void): void;
    getPlace(): PlaceResult;
    setBounds(bounds: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral): void;
    setComponentRestrictions(restrictions: {
      country: string | string[];
    }): void;
    setFields(fields: string[]): void;
    setOptions(options: AutocompleteOptions): void;
    setTypes(types: string[]): void;
  }

  interface PlaceResult {
    address_components?: google.maps.GeocoderAddressComponent[];
    formatted_address?: string;
    geometry?: {
      location: google.maps.LatLng;
      viewport: google.maps.LatLngBounds;
    };
    icon?: string;
    name?: string;
    place_id?: string;
    plus_code?: {
      compound_code: string;
      global_code: string;
    };
    types?: string[];
  }

  const enum PlacesServiceStatus {
    OK = 'OK',
    ZERO_RESULTS = 'ZERO_RESULTS',
    OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
    REQUEST_DENIED = 'REQUEST_DENIED',
    INVALID_REQUEST = 'INVALID_REQUEST',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    NOT_FOUND = 'NOT_FOUND'
  }
} 