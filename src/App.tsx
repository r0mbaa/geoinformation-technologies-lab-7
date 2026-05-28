import React from 'react';
import { MapglContextProvider } from './MapglContext';
import Mapgl from './Mapgl';

function App() {
  return (
    <MapglContextProvider>
      <Mapgl />
    </MapglContextProvider>
  );
}

export default App;
