import { useCallback, useEffect, useRef, useState } from 'react';
import { load } from '@2gis/mapgl';
import type { Map as MapglMap } from '@2gis/mapgl/types';
import { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import { useMapglContext } from './MapglContext';
import { MapWrapper } from './MapWrapper';
import { ControlPanel, LayerMode } from './ControlPanel';
import geoData from './data/data.json';

export const MAP_CENTER: [number, number] = [39.701505, 47.235713];

const API_KEY = '497195fb-a7c6-4f33-894b-2597bcc11846';
// STYLE_ID можно подставить из Редактора стилей 2ГИС, если есть свой.
// Без него используется встроенный стиль с поддержкой иммерсивных эффектов
// (небо, туман, освещение, иммерсивные дороги, глобус).
const STYLE_ID: string | undefined = undefined;

const POINT_LAYER_ID = 'dtp-data-layer';
const HEATMAP_LAYER_ID = 'dtp-heatmap-layer';

const SHIELD_BLUE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">' +
      '<circle cx="14" cy="14" r="10" fill="#0098ea" stroke="#ffffff" stroke-width="2.5"/>' +
      '<circle cx="14" cy="14" r="3.5" fill="#ffffff"/>' +
      '</svg>',
  );

const SHIELD_RED =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">' +
      '<circle cx="14" cy="14" r="10" fill="#ef476f" stroke="#ffffff" stroke-width="2.5"/>' +
      '<circle cx="14" cy="14" r="3.5" fill="#ffffff"/>' +
      '</svg>',
  );

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makePointLayer(): any {
  return {
    id: POINT_LAYER_ID,
    filter: [
      'match',
      ['sourceAttr', 'visible'],
      [true],
      true,
      false,
    ],
    type: 'point',
    style: {
      iconImage: [
        'match',
        ['get', 'severity'],
        ['Тяжёлый'],
        'shield_red',
        'shield',
      ],
      iconWidth: 18,
      textField: ['get', 'category'],
      textFont: ['Noto_Sans'],
      textColor: '#ffd166',
      textHaloColor: '#1b1b2f',
      textHaloWidth: 1.2,
      textOffset: [0, 1.4],
      textSize: 11,
      iconPriority: 100,
      textPriority: 100,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeHeatmapLayer(): any {
  return {
    id: HEATMAP_LAYER_ID,
    filter: [
      'match',
      ['sourceAttr', 'visible'],
      [true],
      true,
      false,
    ],
    type: 'heatmap',
    style: {
      // Стопы прижаты к нижнему краю density, иначе на 20 разрежённых
      // точках density едва превышает 0.2 и вся карта получается одного
      // цвета. Так одиночные точки = синий→бирюзовый, скопления = красный.
      color: [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,    'rgba(0, 0, 0, 0)',
        0.05, 'rgba(35, 70, 180, 0.7)',
        0.15, 'rgba(0, 152, 234, 0.85)',
        0.3,  'rgba(80, 220, 150, 0.9)',
        0.5,  'rgba(255, 209, 102, 0.95)',
        0.75, 'rgba(255, 130, 40, 1)',
        1.0,  'rgba(239, 71, 111, 1)',
      ],
      radius: 55,
      intensity: 2,
      opacity: 0.9,
      weight: 1,
      downscale: 1,
    },
  };
}

export default function Mapgl() {
  const { setMapglContext } = useMapglContext();
  const mapRef = useRef<MapglMap | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapglRef = useRef<any>(undefined);
  const styleLoadedRef = useRef(false);

  const [layerMode, setLayerMode] = useState<LayerMode>('points');
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const [globeEnabled, setGlobeEnabled] = useState(false);
  const [immersiveRoadsEnabled, setImmersiveRoadsEnabled] = useState(false);
  const [skyEnabled, setSkyEnabled] = useState(true);
  const [lightingEnabled, setLightingEnabled] = useState(true);
  // graphicsPreset нельзя менять у живой карты (см. docs.2gis.com — setOption
  // позволяет менять только disableDragging/loopWorld/…). Поэтому при смене
  // skyEnabled / lightingEnabled мы пересоздаём экземпляр карты целиком.
  const [mapEpoch, setMapEpoch] = useState(0);

  const applyCurrentLayer = useCallback(
    (map: MapglMap, mode: LayerMode) => {
      try {
        map.removeLayer(POINT_LAYER_ID);
      } catch {
        /* нет слоя — норм */
      }
      try {
        map.removeLayer(HEATMAP_LAYER_ID);
      } catch {
        /* нет слоя — норм */
      }
      map.addLayer(mode === 'points' ? makePointLayer() : makeHeatmapLayer());
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    let map: MapglMap | undefined;
    styleLoadedRef.current = false;

    const wantImmersive = skyEnabled || lightingEnabled;
    const graphicsPreset: 'immersive' | 'light' = wantImmersive
      ? 'immersive'
      : 'light';

    load().then((mapgl) => {
      if (cancelled) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const options: any = {
        center: MAP_CENTER,
        zoom: globeEnabled ? 2.5 : 13,
        pitch: globeEnabled ? 0 : 55,
        rotation: 0,
        key: API_KEY,
        zoomControl: 'topRight',
        graphicsPreset,
        // Начальное состояние стиля — задаём в конструкторе, чтобы
        // не моргать после styleload.
        styleState: {
          trafficOn: trafficEnabled,
          immersiveRoadsOn: immersiveRoadsEnabled,
          globeEnabled,
        },
      };
      if (STYLE_ID) options.style = STYLE_ID;

      map = new mapgl.Map('map-container', options);

      mapRef.current = map;
      mapglRef.current = mapgl;

      // Пробки через документированный API.
      if (trafficEnabled) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (map as any).showTraffic?.();
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (map as any).hideTraffic?.();
      }

      const data: FeatureCollection<Geometry, GeoJsonProperties> =
        geoData as FeatureCollection<Geometry, GeoJsonProperties>;

      new mapgl.GeoJsonSource(map, {
        data,
        attributes: { visible: true },
      });

      map.on('styleload', () => {
        if (!map || cancelled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = map as any;
        Promise.all([
          m.addIcon('shield', { url: SHIELD_BLUE, width: 28, height: 28 }),
          m.addIcon('shield_red', { url: SHIELD_RED, width: 28, height: 28 }),
        ])
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.warn('[MapGL] addIcon failed:', err);
          })
          .finally(() => {
            if (!map || cancelled) return;
            styleLoadedRef.current = true;
            applyCurrentLayer(map, layerMode);
          });
      });

      setMapglContext({ mapglInstance: map, mapgl });
    });

    return () => {
      cancelled = true;
      styleLoadedRef.current = false;
      map?.destroy();
      mapRef.current = undefined;
      mapglRef.current = undefined;
      setMapglContext({ mapglInstance: undefined, mapgl: undefined });
    };
    // mapEpoch — единственный «разрешённый» триггер пересоздания карты.
    // skyEnabled / lightingEnabled читаются актуальными, но не триггерят
    // эффект сами по себе — это делает обработчик их кнопок через setMapEpoch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapEpoch, setMapglContext, applyCurrentLayer]);

  // Переключение «Точки» <-> «Тепловая карта» — без пересоздания карты.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoadedRef.current) return;
    applyCurrentLayer(map, layerMode);
  }, [layerMode, applyCurrentLayer]);

  // Пробки — корректный API showTraffic / hideTraffic.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = map as any;
    if (trafficEnabled) m.showTraffic?.();
    else m.hideTraffic?.();
  }, [trafficEnabled]);

  // Иммерсивные дороги — patchStyleState, чтобы не сбросить остальные ключи.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = map as any;
    (m.patchStyleState ?? m.setStyleState).call(m, {
      immersiveRoadsOn: immersiveRoadsEnabled,
    });
  }, [immersiveRoadsEnabled]);

  // Глобус — patchStyleState({ globeEnabled }) + смена камеры.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = map as any;
    (m.patchStyleState ?? m.setStyleState).call(m, {
      globeEnabled,
    });
    if (globeEnabled) {
      map.setZoom(2.5);
      map.setPitch(0);
    } else {
      map.setZoom(13);
      map.setPitch(55);
      map.setCenter(MAP_CENTER);
    }
  }, [globeEnabled]);

  // Небо/туман и освещение — graphicsPreset, поэтому нужна перезагрузка карты.
  const toggleSky = useCallback(() => {
    setSkyEnabled((v) => !v);
    setMapEpoch((e) => e + 1);
  }, []);
  const toggleLighting = useCallback(() => {
    setLightingEnabled((v) => !v);
    setMapEpoch((e) => e + 1);
  }, []);

  return (
    <>
      <MapWrapper />
      <ControlPanel
        layerMode={layerMode}
        onLayerModeChange={setLayerMode}
        trafficEnabled={trafficEnabled}
        onToggleTraffic={() => setTrafficEnabled((v) => !v)}
        globeEnabled={globeEnabled}
        onToggleGlobe={() => setGlobeEnabled((v) => !v)}
        immersiveRoadsEnabled={immersiveRoadsEnabled}
        onToggleImmersiveRoads={() => setImmersiveRoadsEnabled((v) => !v)}
        skyEnabled={skyEnabled}
        onToggleSky={toggleSky}
        lightingEnabled={lightingEnabled}
        onToggleLighting={toggleLighting}
      />
    </>
  );
}
