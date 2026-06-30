/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CommunityReport, Category, Severity } from '../types';
import { MapPin, Navigation, Eye, PlusCircle, Layers } from 'lucide-react';

interface MapScreenProps {
  reports: CommunityReport[];
  onSelectReport: (id: string) => void;
  onInitiateReport: (lat: number, lng: number, locationName: string) => void;
}

// Major Municipal Viewports
const CITIES = [
  { name: 'Delhi', coords: [28.6139, 77.2090] as [number, number], zoom: 12 },
  { name: 'Mumbai', coords: [19.0760, 72.8777] as [number, number], zoom: 12 },
  { name: 'Bengaluru', coords: [12.9716, 77.5946] as [number, number], zoom: 12 },
  { name: 'Kolkata', coords: [22.5726, 88.3639] as [number, number], zoom: 12 },
  { name: 'Chennai', coords: [13.0827, 80.2707] as [number, number], zoom: 12 },
];

const CATEGORY_EMOJIS: Record<Category, string> = {
  Roads: '🕳️',
  Waste: '🗑️',
  Lighting: '💡',
  Water: '🚰',
  Other: '⚠️',
};

const SEVERITY_COLORS: Record<Severity, { bg: string; text: string; border: string; pulse: string }> = {
  Critical: { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-600', pulse: 'animate-ping bg-red-400' },
  High: { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-600', pulse: 'animate-pulse bg-orange-400' },
  Medium: { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-600', pulse: 'bg-yellow-400' },
  Low: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-600', pulse: 'bg-emerald-400' },
};

export default function MapScreen({ reports, onSelectReport, onInitiateReport }: MapScreenProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const selectedPinLayerRef = useRef<L.Marker | null>(null);

  const [activeTile, setActiveTile] = useState<'light' | 'satellite' | 'streets'>('light');
  const [selectedCity, setSelectedCity] = useState<string>('Delhi');
  const [droppedPin, setDroppedPin] = useState<{ lat: number; lng: number } | null>(null);
  const [droppedAddress, setDroppedAddress] = useState<string>('');

  // Tile Layer Refs
  const tileLayers = useRef<Record<string, L.TileLayer>>({});

  // Reverse Geocoding Simulation for Indian Hubs
  const getSimulatedAddress = (lat: number, lng: number): string => {
    // Find closest city
    let closestCity = CITIES[0];
    let minDistance = Infinity;
    CITIES.forEach(city => {
      const d = Math.pow(city.coords[0] - lat, 2) + Math.pow(city.coords[1] - lng, 2);
      if (d < minDistance) {
        minDistance = d;
        closestCity = city;
      }
    });

    const sectors = ['Sector 4', 'Inner ring', 'Ganesh Nagar', 'Vikas Marg', 'Anna Salai Road', 'Salt Lake Block A', 'Koramangala 4th Block', 'Colaba Causeway'];
    const sector = sectors[Math.floor((lat + lng) * 100) % sectors.length];
    return `${sector}, near Main Chowk, ${closestCity.name}`;
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create Map
    const initialCity = CITIES[0]; // Delhi
    const map = L.map(mapContainerRef.current, {
      center: initialCity.coords,
      zoom: initialCity.zoom,
      zoomControl: false,
    });
    mapRef.current = map;

    // Add Zoom Control to Bottom Right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Instantiate Tile Layers
    tileLayers.current = {
      streets: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }),
      light: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB',
      }),
      satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri, Maxar, Earthstar Geographics',
      }),
    };

    // Set Default Base Layer
    tileLayers.current.light.addTo(map);

    // Add Markers Layer Group
    markersLayerRef.current = L.layerGroup().addTo(map);

    // Event Listener for Map Tap / Click to drop custom pin (📍)
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      handleMapClick(lat, lng);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Basemaps on toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove active layers
    Object.values(tileLayers.current).forEach(layer => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    // Add selected layer
    tileLayers.current[activeTile].addTo(map);
  }, [activeTile]);

  // Update Issue Pins on Map when reports list or active tiles change
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Clear existing markers
    markersLayer.clearLayers();

    reports.forEach((report) => {
      const emoji = CATEGORY_EMOJIS[report.category] || '⚠️';
      const severity = SEVERITY_COLORS[report.severity] || SEVERITY_COLORS.Medium;
      
      // Determine status indicator color
      const statusColor = report.status === 'Resolved' ? 'bg-emerald-500' : 
                          report.status === 'In Progress' ? 'bg-sky-500' :
                          report.status === 'Under Investigation' ? 'bg-yellow-500' : 'bg-red-500';

      // Custom DivIcon with Pulse and high visibility styling
      const iconHtml = `
        <div class="relative flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white ${severity.border} shadow hover:scale-110 transition-transform duration-200">
          <span class="text-lg relative z-10 select-none">${emoji}</span>
          <div class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full ${statusColor} border-2 border-white shadow"></div>
          ${report.severity === 'Critical' || report.severity === 'High' ? `
            <div class="absolute -inset-1 rounded-full ${severity.pulse} opacity-30 -z-10"></div>
          ` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-map-pin',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
      });

      const marker = L.marker(report.coordinates, { icon: customIcon });

      // Interactive Popup
      const popupContent = document.createElement('div');
      popupContent.className = 'p-3 max-w-[240px] text-slate-800 bg-white rounded-lg text-sm border border-slate-200 shadow-lg';
      popupContent.innerHTML = `
        <div class="flex items-center gap-1.5 mb-1.5">
          <span class="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${
            report.severity === 'Critical' ? 'bg-red-50 text-red-600 border border-red-100' :
            report.severity === 'High' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
            'bg-slate-100 text-slate-600 border border-slate-200'
          }">${report.severity}</span>
          <span class="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-600 border border-slate-200">${report.category}</span>
        </div>
        <h4 class="font-bold text-slate-800 line-clamp-1 mb-1">${report.title}</h4>
        <p class="text-xs text-slate-500 mb-2 line-clamp-2">${report.description}</p>
        <div class="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
          <span>👍 ${report.upvotes} backing</span>
          <span class="font-bold text-blue-600">${report.status}</span>
        </div>
        <button id="view-details-btn-${report.id}" class="mt-2.5 w-full flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded-lg text-xs transition duration-150 cursor-pointer shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lucide lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 20.376 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-20.376 0z"/><circle cx="12" cy="12" r="3"/></svg>
          Inspect Details
        </button>
      `;

      // Bind actions when popup is opened
      marker.bindPopup(popupContent, {
        closeButton: false,
        maxWidth: 260,
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-details-btn-${report.id}`);
        if (btn) {
          btn.onclick = (event) => {
            event.stopPropagation();
            onSelectReport(report.id);
          };
        }
      });

      markersLayer.addLayer(marker);
    });
  }, [reports, activeTile]);

  // Handle dropping a manual pin (📍)
  const handleMapClick = (lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous dropped pin marker
    if (selectedPinLayerRef.current) {
      map.removeLayer(selectedPinLayerRef.current);
    }

    const address = getSimulatedAddress(lat, lng);
    setDroppedPin({ lat, lng });
    setDroppedAddress(address);

    const customPinIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center w-11 h-11">
          <span class="text-3xl animate-bounce">📍</span>
          <div class="absolute -bottom-1 w-2.5 h-1 bg-black/60 rounded-full blur-[2px]"></div>
        </div>
      `,
      className: 'custom-dropped-pin',
      iconSize: [44, 44],
      iconAnchor: [22, 44],
    });

    const newMarker = L.marker([lat, lng], { icon: customPinIcon }).addTo(map);
    selectedPinLayerRef.current = newMarker;

    // Pan slightly to center dropped pin
    map.panTo([lat - 0.002, lng], { animate: true });
  };

  // Jump Viewport to Municipal Cities
  const panToCity = (city: typeof CITIES[0]) => {
    const map = mapRef.current;
    if (!map) return;
    setSelectedCity(city.name);
    map.setView(city.coords, city.zoom, { animate: true, duration: 1.5 });

    // Simulate clicking in center of city to guide user
    handleMapClick(city.coords[0], city.coords[1]);
  };

  return (
    <div id="map-screen-wrapper" className="relative w-full h-[calc(100vh-140px)] md:h-[650px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm flex flex-col">
      {/* Top Controls Bar */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap gap-2 max-w-[90%] pointer-events-auto">
        {/* City Selectors */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-md overflow-x-auto max-w-full">
          <span className="text-xs font-bold text-slate-400 px-2 flex items-center gap-1 uppercase tracking-wider">
            <Navigation className="w-3.5 h-3.5 text-blue-600 animate-pulse" /> Hubs:
          </span>
          {CITIES.map((city) => (
            <button
              id={`city-viewport-btn-${city.name}`}
              key={city.name}
              onClick={() => panToCity(city)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer whitespace-nowrap ${
                selectedCity === city.name
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {city.name}
            </button>
          ))}
        </div>

        {/* Tile Layer Toggles */}
        <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg p-1 shadow-md">
          <button
            id="map-tile-light"
            onClick={() => setActiveTile('light')}
            className={`p-1.5 rounded-md transition cursor-pointer ${
              activeTile === 'light' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
            title="Light Map"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            id="map-tile-satellite"
            onClick={() => setActiveTile('satellite')}
            className={`p-1.5 rounded-md transition cursor-pointer ${
              activeTile === 'satellite' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
            title="Satellite Imagery"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Leaflet Map Target Container */}
      <div id="leaflet-map-element" ref={mapContainerRef} className="w-full flex-grow z-10" />

      {/* Bottom Floating Instruction Panel or Pin locked Panel */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none flex justify-center">
        {!droppedPin ? (
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-md max-w-md text-center pointer-events-auto">
            <p className="text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              Tip: Tap anywhere on the map to drop a coordinate pin (📍) and report a new civic issue!
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-lg max-w-md w-full pointer-events-auto flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Coordinate Pin Dropped</span>
                <p className="text-xs font-bold text-slate-800 line-clamp-1">{droppedAddress}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Lat: {droppedPin.lat.toFixed(5)}, Lng: {droppedPin.lng.toFixed(5)}
                </p>
              </div>
              <button
                id="report-issue-btn-from-map"
                onClick={() => onInitiateReport(droppedPin.lat, droppedPin.lng, droppedAddress)}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Report Here
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
