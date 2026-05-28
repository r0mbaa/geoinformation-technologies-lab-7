import React from 'react';

export const MapWrapper = React.memo(
  () => <div id="map-container" style={{ width: '100%', height: '100vh' }} />,
  () => true,
);
