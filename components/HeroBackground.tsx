import React from 'react';

const HeroBackground = () => {
  return (
    <div className="absolute inset-0 z-[-1]">
      <div className="encrypted-neon-pattern">
        <span className="data-stream-overlay" />
        <svg className="texture-filter" style={{ position: 'absolute', width: 0, height: 0 }}>
          <filter id="neon-texture">
            <feTurbulence result="noise" numOctaves={2} baseFrequency="0.6" type="fractalNoise" />
            <feSpecularLighting result="specular" lightingColor="#00f0ff" specularExponent={25} specularConstant="0.9" surfaceScale={2} in="noise">
              <fePointLight z={90} y={100} x={100} />
            </feSpecularLighting>
            <feComposite result="litNoise" operator="over" in2="SourceGraphic" in="specular" />
            <feBlend mode="screen" in2="litNoise" in="SourceGraphic" />
          </filter>
        </svg>
      </div>
    </div>
  );
}

export default HeroBackground;