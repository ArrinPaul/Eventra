import { ImageResponse } from 'next/og';

/**
 * Twitter Image Generator
 * Generates dynamic Twitter card images
 */

export const runtime = 'edge';
export const alt = 'Eventra - Event Management Platform';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        }}
      >
        {/* Gradient accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '6px',
            background: 'linear-gradient(90deg, #8b5cf6, #06b6d4, #10b981)',
          }}
        />
        
        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '25px',
              background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '50px',
              marginBottom: '24px',
            }}
          >
            📅
          </div>
          
          {/* Title */}
          <h1
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 12px 0',
            }}
          >
            Eventra
          </h1>
          
          {/* Tagline */}
          <p
            style={{
              fontSize: '24px',
              color: '#94a3b8',
              margin: 0,
            }}
          >
            Modern Event Management Platform
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
