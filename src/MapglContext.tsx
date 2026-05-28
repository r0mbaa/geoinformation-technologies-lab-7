import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Map as MapglMap } from '@2gis/mapgl/types';

interface MapglContextState {
  mapglInstance?: MapglMap;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapgl?: any;
}

interface MapglContextValue {
  mapglContext: MapglContextState;
  setMapglContext: (state: MapglContextState) => void;
}

const MapglContext = createContext<MapglContextValue>({
  mapglContext: {},
  setMapglContext: () => {},
});

export const MapglContextProvider = ({ children }: { children: ReactNode }) => {
  const [mapglContext, setMapglContext] = useState<MapglContextState>({});
  return (
    <MapglContext.Provider value={{ mapglContext, setMapglContext }}>
      {children}
    </MapglContext.Provider>
  );
};

export const useMapglContext = () => useContext(MapglContext);
