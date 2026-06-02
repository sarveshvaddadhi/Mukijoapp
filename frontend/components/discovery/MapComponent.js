"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon issue in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapComponent({ venues, selectedVenue, center, onSelect }) {
  // Use user location or default to a central point if not available
  const defaultCenter = center || [51.505, -0.09]; 

  return (
    <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      {venues.map((v) => (
        v.lat && v.lng && (
          <Marker 
            key={v.id} 
            position={[v.lat, v.lng]}
            eventHandlers={{
              click: () => onSelect(v)
            }}
          >
            <Popup>
              <div style={{ padding: '4px' }}>
                <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 'bold' }}>{v.name}</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{v.address}</p>
              </div>
            </Popup>
          </Marker>
        )
      ))}
    </MapContainer>
  );
}
