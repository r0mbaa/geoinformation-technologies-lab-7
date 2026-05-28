import React from 'react';

export type LayerMode = 'points' | 'heatmap';

interface ControlPanelProps {
  layerMode: LayerMode;
  onLayerModeChange: (mode: LayerMode) => void;
  trafficEnabled: boolean;
  onToggleTraffic: () => void;
  globeEnabled: boolean;
  onToggleGlobe: () => void;
  immersiveRoadsEnabled: boolean;
  onToggleImmersiveRoads: () => void;
  skyEnabled: boolean;
  onToggleSky: () => void;
  lightingEnabled: boolean;
  onToggleLighting: () => void;
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  left: 16,
  zIndex: 10,
  background: 'rgba(255, 255, 255, 0.95)',
  padding: '14px 16px',
  borderRadius: 8,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  fontFamily: 'inherit',
  fontSize: 13,
  color: '#222',
  maxWidth: 280,
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: 14,
  fontWeight: 600,
};

const sectionStyle: React.CSSProperties = {
  marginTop: 10,
  paddingTop: 10,
  borderTop: '1px solid #eee',
};

const buttonStyle: React.CSSProperties = {
  border: '1px solid #d0d0d0',
  background: '#fff',
  borderRadius: 6,
  padding: '6px 10px',
  cursor: 'pointer',
  marginRight: 6,
  marginTop: 4,
  fontSize: 12,
};

const buttonActiveStyle: React.CSSProperties = {
  ...buttonStyle,
  background: '#0098ea',
  color: '#fff',
  borderColor: '#0098ea',
};

export function ControlPanel(props: ControlPanelProps) {
  return (
    <div style={panelStyle}>
      <h3 style={titleStyle}>Карта ДТП — Ростов-на-Дону</h3>
      <div>
        <strong>Слой данных:</strong>
        <div>
          <button
            style={props.layerMode === 'points' ? buttonActiveStyle : buttonStyle}
            onClick={() => props.onLayerModeChange('points')}
          >
            Точки
          </button>
          <button
            style={props.layerMode === 'heatmap' ? buttonActiveStyle : buttonStyle}
            onClick={() => props.onLayerModeChange('heatmap')}
          >
            Тепловая карта
          </button>
        </div>
      </div>

      <div style={sectionStyle}>
        <strong>Вариант 3 — иммерсивные эффекты:</strong>
        <div>
          <button
            style={props.skyEnabled ? buttonActiveStyle : buttonStyle}
            onClick={props.onToggleSky}
          >
            Небо и туман
          </button>
          <button
            style={props.lightingEnabled ? buttonActiveStyle : buttonStyle}
            onClick={props.onToggleLighting}
          >
            Освещение
          </button>
          <button
            style={props.globeEnabled ? buttonActiveStyle : buttonStyle}
            onClick={props.onToggleGlobe}
          >
            Глобус
          </button>
          <button
            style={props.trafficEnabled ? buttonActiveStyle : buttonStyle}
            onClick={props.onToggleTraffic}
          >
            Пробки
          </button>
          <button
            style={props.immersiveRoadsEnabled ? buttonActiveStyle : buttonStyle}
            onClick={props.onToggleImmersiveRoads}
          >
            Иммерс. дороги
          </button>
        </div>
      </div>
    </div>
  );
}
