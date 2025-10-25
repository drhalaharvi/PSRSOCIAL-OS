
import { useState, useEffect } from 'react';

interface GeolocationState {
  loading: boolean;
  error: GeolocationPositionError | Error | null;
  data: {
    latitude: number;
    longitude: number;
  } | null;
}

const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    loading: true,
    error: null,
    data: null,
  });

  useEffect(() => {
    const fetchLocation = () => {
      if (!navigator.geolocation) {
        setState({
          loading: false,
          error: new Error('Geolocation is not supported by your browser.'),
          data: null,
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({
            loading: false,
            error: null,
            data: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          });
        },
        (error) => {
          setState({
            loading: false,
            error: error,
            data: null,
          });
        }
      );
    };

    fetchLocation();
  }, []);

  return state;
};

export default useGeolocation;
