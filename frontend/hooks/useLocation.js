import { useState } from 'react';

export const useLocation = () => {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => { 
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); 
        setLoading(false); 
      },
      (err) => { 
        setError(err.message); 
        setLoading(false); 
      }
    );
  };

  return { coords, error, loading, requestLocation };
};
