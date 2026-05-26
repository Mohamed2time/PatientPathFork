import React, { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

interface Props {
  careLevel: string;
  category?: string;
  condition: string;
  zipCode: string;
}

interface ClinicResult {
  name: string;
  address: string;
  rating?: number;
  openNow?: boolean;
  placeId: string;
  lat: number;
  lng: number;
}

const MAX_RESULTS = 5;

const SKIN_CATEGORIES = new Set([
  'Acne / Rosacea',
  'Eczema / Dermatitis',
  'Psoriasis',
  'Fungal Infection',
  'Warts / Viral Skin Growths',
  'Hives / Allergic Reaction',
  'Skin Infection',
  'Suspicious Mole / Growth',
]);

const SKIN_CONDITION_KEYWORDS = ['rash', 'mole', 'dry', 'discoloration', 'pigmentation', 'skin', 'growth'];

function getSearchLabel(
  careLevel: string,
  category?: string,
  condition?: string,
): { searchTerm: string; label: string } {
  const cl = careLevel.toLowerCase();
  const cat = (category ?? '').toLowerCase();
  const cond = (condition ?? '').toLowerCase();

  if (cl.includes('emergency')) {
    return { searchTerm: 'emergency room', label: 'Emergency Room' };
  }
  if (cl.includes('urgent')) {
    return { searchTerm: 'urgent care', label: 'Urgent Care' };
  }
  if (cl.includes('dermatologist')) {
    return { searchTerm: 'dermatologist', label: 'Dermatologist' };
  }
  if (cat.includes('eye') || cond.includes('eye')) {
    return { searchTerm: 'ophthalmologist', label: 'Eye Doctor' };
  }
  if (cat.includes('wound') && (cl.includes('primary') || cl.includes('self'))) {
    return { searchTerm: 'wound care clinic', label: 'Wound Care' };
  }
  if (
    SKIN_CATEGORIES.has(category ?? '') ||
    SKIN_CONDITION_KEYWORDS.some((kw) => cond.includes(kw))
  ) {
    return { searchTerm: 'dermatologist', label: 'Dermatologist' };
  }
  return { searchTerm: 'primary care doctor', label: 'Primary Care Doctor' };
}

const CareFinderSection: React.FC<Props> = ({ careLevel, category, condition, zipCode }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [clinics, setClinics] = useState<ClinicResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { searchTerm, label } = getSearchLabel(careLevel, category, condition);

  useEffect(() => {
    if (!zipCode) {
      setError('No zip code provided.');
      setLoading(false);
      return;
    }

    const apiKey = import.meta.env.VITE_MAPS_KEY;
    if (!apiKey) {
      setLoading(false);
      return; // Renders the no-key fallback below
    }

    const run = async () => {
      try {
        setOptions({ key: apiKey! });

        const { Map } = await importLibrary('maps') as google.maps.MapsLibrary;
        const { PlacesService, PlacesServiceStatus } = await importLibrary('places') as google.maps.PlacesLibrary;
        const { Marker } = await importLibrary('marker') as google.maps.MarkerLibrary;

        if (!mapRef.current) return;

        const query = `${searchTerm} near ${zipCode}`;

        const tempDiv = document.createElement('div');
        const tempMap = new Map(tempDiv, { center: { lat: 0, lng: 0 }, zoom: 1 });
        const service = new PlacesService(tempMap);

        service.textSearch(
          { query },
          (results: google.maps.places.PlaceResult[] | null, status: string) => {
            if (status === PlacesServiceStatus.OK && results && results.length > 0) {
              const top = results.slice(0, MAX_RESULTS);
              const parsed: ClinicResult[] = top.map((p) => ({
                name: p.name ?? 'Unknown',
                address: p.formatted_address ?? p.vicinity ?? '',
                rating: p.rating,
                openNow: p.opening_hours?.isOpen(),
                placeId: p.place_id ?? '',
                lat: p.geometry?.location?.lat() ?? 0,
                lng: p.geometry?.location?.lng() ?? 0,
              }));
              setClinics(parsed);

              const center = { lat: parsed[0].lat, lng: parsed[0].lng };
              const map = new Map(mapRef.current!, {
                center,
                zoom: 13,
                disableDefaultUI: true,
                zoomControl: true,
              });

              parsed.forEach((c) => {
                new Marker({
                  position: { lat: c.lat, lng: c.lng },
                  map,
                  title: c.name,
                });
              });
            } else {
              setError('No results found for this zip code.');
            }
            setLoading(false);
          },
        );
      } catch {
        setError('Could not load map.');
        setLoading(false);
      }
    };

    run();
  }, [zipCode, searchTerm]);

  if (!zipCode) {
    return null;
  }

  // No Maps API key — render a clean search link fallback instead of an error
  const apiKey = import.meta.env.VITE_MAPS_KEY;
  if (!apiKey) {
    const mapsQuery = encodeURIComponent(`${searchTerm} near ${zipCode}`);
    return (
      <div className="space-y-3">
        <h4 className="text-base font-bold text-slate-800">Find {label} Near You</h4>
        <a
          href={`https://www.google.com/maps/search/${mapsQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full p-4 bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-2xl transition-all group"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📍</span>
            <div>
              <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700">
                Search for {label}
              </p>
              <p className="text-xs text-slate-500">Opens Google Maps near {zipCode}</p>
            </div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400 group-hover:text-emerald-500">
            <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-base font-bold text-slate-800">
        Find {label} Near You
      </h4>

      {loading && (
        <div className="flex items-center justify-center h-[220px] bg-slate-50 rounded-2xl border border-slate-100">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
            <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center justify-center h-[100px] bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      )}

      <div
        ref={mapRef}
        className={`w-full rounded-2xl overflow-hidden border border-slate-100 ${loading ? 'hidden' : 'block'}`}
        style={{ height: 220 }}
      />

      {!loading && clinics.length > 0 && (
        <div className="space-y-3">
          {clinics.map((c) => (
            <div
              key={c.placeId}
              className="flex items-start justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100"
            >
              <div className="flex-1 min-w-0 pr-3">
                <p className="font-bold text-slate-800 text-sm leading-snug truncate">{c.name}</p>
                <p className="text-slate-500 text-xs mt-0.5 truncate">{c.address}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {c.rating !== undefined && (
                    <span className="text-xs font-semibold text-amber-600">
                      ★ {c.rating.toFixed(1)}
                    </span>
                  )}
                  {c.openNow !== undefined && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        c.openNow
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {c.openNow ? 'Open now' : 'Closed'}
                    </span>
                  )}
                </div>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.name + ' ' + c.address)}&destination_place_id=${c.placeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition-colors"
              >
                Directions
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CareFinderSection;
