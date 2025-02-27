
import React from 'react';

export const OgImage = () => {
  return (
    <div style={{
      width: '1200px',
      height: '630px',
      background: 'linear-gradient(to right, rgba(244,63,94,0.1), rgba(139,92,246,0.1), rgba(20,184,166,0.1))',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, sans-serif',
      color: '#111',
      padding: '60px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '90%',
        height: '80%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px'
      }}>
        <h1 style={{
          fontSize: '64px',
          fontWeight: 'bold',
          marginBottom: '24px',
          background: 'linear-gradient(to right, #f43f5e, #8b5cf6, #14b8a6)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          textAlign: 'center'
        }}>
          AI Requirements Engineer
        </h1>
        <p style={{
          fontSize: '32px',
          color: '#4b5563',
          textAlign: 'center',
          maxWidth: '80%',
          marginBottom: '40px'
        }}>
          Generate detailed software project breakdowns and estimations using AI
        </p>
        <div style={{
          display: 'flex',
          gap: '24px'
        }}>
          <div style={{
            padding: '16px 24px',
            background: 'rgba(139,92,246,0.1)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ width: '32px', height: '32px', background: '#8b5cf6', borderRadius: '8px' }}></div>
            <span style={{ fontWeight: 'bold', color: '#8b5cf6' }}>User Stories</span>
          </div>
          <div style={{
            padding: '16px 24px',
            background: 'rgba(244,63,94,0.1)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ width: '32px', height: '32px', background: '#f43f5e', borderRadius: '8px' }}></div>
            <span style={{ fontWeight: 'bold', color: '#f43f5e' }}>Time Estimation</span>
          </div>
          <div style={{
            padding: '16px 24px',
            background: 'rgba(20,184,166,0.1)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ width: '32px', height: '32px', background: '#14b8a6', borderRadius: '8px' }}></div>
            <span style={{ fontWeight: 'bold', color: '#14b8a6' }}>Cost Analysis</span>
          </div>
        </div>
      </div>
    </div>
  );
};
