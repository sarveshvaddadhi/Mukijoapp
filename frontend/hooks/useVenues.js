import { useState, useEffect } from 'react';

export const useVenues = (sportId, lat, lng, radiusKm = 20) => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVenues = async () => {
      if (!sportId || !lat || !lng) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const queryParams = new URLSearchParams({
          sport_id: sportId,
          lat: lat.toString(),
          lng: lng.toString(),
          radius_km: radiusKm.toString()
        });
        
        const res = await fetch(`/api/venues?${queryParams}`);
        if (!res.ok) {
          throw new Error('Failed to fetch venues');
        }
        
        const data = await res.json();
        setVenues(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, [sportId, lat, lng, radiusKm]);

  return { venues, loading, error };
};
