import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Place {
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance?: number;
  types?: string[];
}

interface NearbyLabsMapProps {
  apiKey?: string;
  radius?: number;
  className?: string;
}

// Global script loading state
let mapsScriptLoaded = false;
let mapsScriptLoading = false;
const mapsLoadCallbacks: Array<() => void> = [];

export function NearbyLabsMap({
  apiKey,
  radius = 5000,
  className = "",
}: NearbyLabsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const initializedRef = useRef(false);
  const placesLoadedRef = useRef(false);

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported");
      setLoading(false);
      setMapLoading(false);
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 60000,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setError("Unable to get your location. Please enable location services.");
        setLoading(false);
        setMapLoading(false);
      },
      options
    );
  }, []);

  // Load Maps script
  const loadMapsScript = useCallback((apiKey: string, callback: () => void) => {
    if (mapsScriptLoaded && window.google?.maps) {
      callback();
      return;
    }

    if (mapsScriptLoading) {
      mapsLoadCallbacks.push(callback);
      return;
    }

    mapsScriptLoading = true;
    const callbackName = `initGoogleMaps_${Date.now()}`;
    let executed = false;

    (window as any)[callbackName] = () => {
      if (executed) return;
      executed = true;
      mapsScriptLoaded = true;
      mapsScriptLoading = false;
      callback();
      mapsLoadCallbacks.forEach((cb) => cb());
      mapsLoadCallbacks.length = 0;
      delete (window as any)[callbackName];
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}&loading=async`;
    script.async = true;
    script.defer = true;
    
    const timeout = setTimeout(() => {
      if (window.google?.maps && !executed) {
        executed = true;
        mapsScriptLoaded = true;
        mapsScriptLoading = false;
        callback();
        mapsLoadCallbacks.forEach((cb) => cb());
        mapsLoadCallbacks.length = 0;
        delete (window as any)[callbackName];
      }
    }, 3000);

    script.onload = () => {
      clearTimeout(timeout);
      setTimeout(() => {
        if (window.google?.maps && !executed) {
          executed = true;
          mapsScriptLoaded = true;
          mapsScriptLoading = false;
          callback();
          mapsLoadCallbacks.forEach((cb) => cb());
          mapsLoadCallbacks.length = 0;
          delete (window as any)[callbackName];
        }
      }, 500);
    };

    script.onerror = () => {
      clearTimeout(timeout);
      mapsScriptLoading = false;
      setError("Failed to load Google Maps");
      setLoading(false);
      setMapLoading(false);
      delete (window as any)[callbackName];
    };

    document.head.appendChild(script);
  }, []);

  // Initialize map
  useEffect(() => {
    const apiKeyFromEnv = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKeyFromEnv || !userLocation || initializedRef.current) return;
    if (!mapContainerRef.current) return;

    initializedRef.current = true;
    let mounted = true;

    loadMapsScript(apiKeyFromEnv, () => {
      if (!mounted || !mapContainerRef.current || !userLocation) return;
      if (!window.google?.maps) {
        setError("Google Maps failed to load");
        setMapLoading(false);
        return;
      }

      try {
        // Create inner div for map (prevents React cleanup conflicts)
        const mapDiv = document.createElement("div");
        mapDiv.style.width = "100%";
        mapDiv.style.height = "100%";
        mapContainerRef.current.appendChild(mapDiv);

        const map = new window.google.maps.Map(mapDiv, {
          center: userLocation,
          zoom: 14,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: true,
        });

        mapInstanceRef.current = map;
        if (mounted) setMapLoading(false);

        // User location marker
        try {
          new window.google.maps.Marker({
            position: userLocation,
            map,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#3b82f6",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
            title: "Your Location",
          });
        } catch (e) {
          // Ignore marker warnings
        }

        // Search places - delay slightly to ensure map is ready
        if (mounted && !placesLoadedRef.current) {
          placesLoadedRef.current = true;
          setTimeout(() => {
            if (mounted && mapContainerRef.current) {
              searchPlaces(map, mapContainerRef.current, userLocation);
            }
          }, 500);
        }
      } catch (err) {
        console.error("Map init error:", err);
        if (mounted) {
          setError("Failed to initialize map");
          setMapLoading(false);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      // Cleanup markers
      markersRef.current.forEach((m) => {
        try {
          m.setMap(null);
        } catch (e) {
          // Ignore
        }
      });
      markersRef.current = [];
    };
  }, [apiKey, userLocation, loadMapsScript]);

  const searchPlaces = (map: google.maps.Map, container: HTMLElement, location: { lat: number; lng: number }) => {
    if (!window.google?.maps?.places) {
      setLoading(false);
      return;
    }

    try {
      // PlacesService can use the map or a div - using map is fine
      const service = new window.google.maps.places.PlacesService(map);

      // Search for hospitals
      const hospitalRequest: google.maps.places.PlaceSearchRequest = {
        location: new window.google.maps.LatLng(location.lat, location.lng),
        radius: radius,
        type: ["hospital"],
      };

      let allPlaces: google.maps.places.PlaceResult[] = [];
      let searchCount = 0;
      const totalSearches = 2; // Hospitals + Labs

      const processResults = () => {
        searchCount++;
        if (searchCount < totalSearches) return; // Wait for both searches
        
        setLoading(false);
        
        if (allPlaces.length === 0) {
          return;
        }
        
        // Filter to show ONLY hospitals and labs
        const filtered = allPlaces
          .filter((p) => {
            const types = p.types || [];
            const name = (p.name?.toLowerCase() || "").trim();
            
            // Always include hospitals
            if (types.includes("hospital")) return true;
            
            // Include if name has lab-related keywords
            const labKeywords = [
              "lab", "laboratory", "diagnostic", "pathology", 
              "testing", "medical", "health center", "clinic"
            ];
            const hasLabKeyword = labKeywords.some(keyword => name.includes(keyword));
            
            // Exclude obvious non-medical places
            const excludeTypes = [
              "pharmacy", "drugstore", "store", "restaurant", "cafe", 
              "gas_station", "bank", "atm", "beauty_salon", "gym", 
              "school", "university", "shopping_mall"
            ];
            const hasExcludedType = types.some(t => excludeTypes.includes(t));
            
            const excludeKeywords = [
              "pharmacy", "drug store", "restaurant", "cafe", "bank", 
              "atm", "school", "university", "mall"
            ];
            const hasExcludedKeyword = excludeKeywords.some(keyword => name.includes(keyword));
            
            return hasLabKeyword && !hasExcludedType && !hasExcludedKeyword;
          })
          .slice(0, 20);
        
        // If no labs found, at least show hospitals
        const hospitals = allPlaces.filter((p) => p.types?.includes("hospital"));
        const finalResults = filtered.length > 0 ? filtered : hospitals.slice(0, 20);
        
        if (finalResults.length === 0) {
          return;
        }

        const placesData: Place[] = finalResults.map((p) => {
              const loc = p.geometry?.location;
              const dist = loc
                ? calculateDistance(location.lat, location.lng, loc.lat(), loc.lng())
                : undefined;
              return {
                name: p.name || "Unknown",
                address: p.vicinity || p.formatted_address || "",
                lat: loc?.lat() || 0,
                lng: loc?.lng() || 0,
                distance: dist,
                types: p.types,
              };
            });

            placesData.sort((a, b) => (a.distance || 0) - (b.distance || 0));
            setPlaces(placesData);

            // Add markers
            placesData.forEach((place) => {
              try {
                const marker = new window.google.maps.Marker({
                  position: { lat: place.lat, lng: place.lng },
                  map,
                  title: place.name,
                  icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 6,
                    fillColor: "#ef4444",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                  },
                });

                const infoWindow = new window.google.maps.InfoWindow({
                  content: `
                    <div style="padding: 8px; min-width: 200px;">
                      <h3 style="margin: 0 0 4px 0; font-weight: 600; font-size: 14px;">${place.name}</h3>
                      <p style="margin: 0; color: #666; font-size: 12px;">${place.address}</p>
                      ${place.distance ? `<p style="margin: 4px 0 0 0; color: #3b82f6; font-size: 11px;">${place.distance.toFixed(1)} km away</p>` : ""}
                    </div>
                  `,
                });

                marker.addListener("click", () => {
                  infoWindow.open(map, marker);
                });

                markersRef.current.push(marker);
              } catch (e) {
                // Ignore marker errors
              }
            });
      };

      // Search for hospitals
      service.nearbySearch(hospitalRequest, (results, status) => {
        try {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            results.forEach((place) => {
              const exists = allPlaces.some((p) => p.place_id === place.place_id);
              if (!exists) {
                allPlaces.push(place);
              }
            });
          }
          processResults();
        } catch (err) {
          console.error("Hospital search error:", err);
          processResults();
        }
      });

      // Also search for labs/diagnostic centers
      const labRequest: google.maps.places.PlaceSearchRequest = {
        location: new window.google.maps.LatLng(location.lat, location.lng),
        radius: radius,
        keyword: "laboratory lab diagnostic testing pathology medical center",
      };

      service.nearbySearch(labRequest, (results, status) => {
        try {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            results.forEach((place) => {
              const exists = allPlaces.some((p) => p.place_id === place.place_id);
              if (!exists) {
                allPlaces.push(place);
              }
            });
          }
          processResults();
        } catch (err) {
          console.error("Lab search error:", err);
          processResults();
        }
      });
      
      // Fallback: clear loading if searches don't complete
      setTimeout(() => {
        if (searchCount < totalSearches) {
          searchCount = totalSearches;
          processResults();
        }
      }, 5000);
    } catch (err) {
      console.error("Places search error:", err);
      setLoading(false);
    } finally {
      // Always clear loading state
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleGetDirections = (place: Place) => {
    if (!userLocation) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${place.lat},${place.lng}`;
    window.open(url, "_blank");
  };

  const apiKeyFromEnv = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKeyFromEnv) {
    return (
      <div className={`rounded-xl border border-border bg-card p-4 ${className}`}>
        <div className="text-center py-8">
          <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">Google Maps API key not configured</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Add VITE_GOOGLE_MAPS_API_KEY to your .env file
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-card p-3 md:p-4 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary" />
        <h2 className="font-display text-base md:text-lg font-semibold text-foreground">
          Nearby Labs & Hospitals
        </h2>
      </div>

      {error && (
        <div className="text-center py-8">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Map container - stable ref */}
      <div
        ref={mapContainerRef}
        className={`w-full h-64 md:h-80 rounded-lg overflow-hidden border border-border mb-4 ${mapLoading ? 'bg-gray-100 flex items-center justify-center' : ''}`}
        style={{ minHeight: "256px" }}
      >
        {mapLoading && (
          <div className="flex flex-col items-center absolute">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground mt-2">Loading map...</span>
          </div>
        )}
      </div>

      {!mapLoading && !error && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Finding nearby places...</span>
            </div>
          ) : places.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {places.map((place, index) => (
                <div
                  key={`${place.lat}-${place.lng}-${index}`}
                  className="flex items-start gap-3 rounded-lg border border-border bg-gradient-to-r from-card to-muted/30 p-3 hover:shadow-sm transition-all"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500 text-white">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground text-sm">{place.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {place.address}
                    </p>
                    {place.distance && (
                      <p className="text-xs text-primary mt-1 font-medium">
                        {place.distance.toFixed(1)} km away
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => handleGetDirections(place)}
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Directions
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No nearby labs or hospitals found</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Type declarations
declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options?: google.maps.MapOptions) => google.maps.Map;
        Marker: new (options?: google.maps.MarkerOptions) => google.maps.Marker;
        InfoWindow: new (options?: google.maps.InfoWindowOptions) => google.maps.InfoWindow;
        LatLng: new (lat: number, lng: number) => google.maps.LatLng;
        places: {
          PlacesService: new (map: google.maps.Map) => google.maps.places.PlacesService;
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
            ERROR: string;
          };
        };
        SymbolPath: {
          CIRCLE: google.maps.SymbolPath;
        };
      };
    };
  }
}

declare namespace google {
  namespace maps {
    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeControl?: boolean;
      fullscreenControl?: boolean;
      streetViewControl?: boolean;
      zoomControl?: boolean;
      styles?: MapTypeStyle[];
    }
    interface LatLng {
      lat(): number;
      lng(): number;
    }
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }
    interface Marker {
      setMap(map: Map | null): void;
      addListener(event: string, handler: () => void): void;
    }
    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: MarkerIcon;
    }
    interface MarkerIcon {
      path?: SymbolPath;
      scale?: number;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeWeight?: number;
    }
    interface InfoWindow {
      open(map: Map, marker: Marker): void;
    }
    interface InfoWindowOptions {
      content?: string;
    }
    interface MapTypeStyle {
      featureType?: string;
      elementType?: string;
      stylers?: Array<{ [key: string]: any }>;
    }
    type SymbolPath = any;
    namespace places {
      interface PlacesService {
        nearbySearch(
          request: PlaceSearchRequest,
          callback: (results: PlaceResult[] | null, status: PlacesServiceStatus) => void
        ): void;
      }
      interface PlaceSearchRequest {
        location?: LatLng;
        radius?: number;
        type?: string[];
        keyword?: string;
      }
      interface PlaceResult {
        name?: string;
        vicinity?: string;
        formatted_address?: string;
        geometry?: { location?: LatLng };
        types?: string[];
      }
      type PlacesServiceStatus = string;
    }
  }
}
