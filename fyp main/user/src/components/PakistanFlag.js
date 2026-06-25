import React from 'react';

const PakistanFlag = () => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      width: '60px',
      height: '40px',
      background: 'linear-gradient(to right, #01411C 0%, #01411C 30%, white 30%, white 100%)',
      borderRadius: '4px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: 'perspective(1000px) rotateY(-15deg) rotateX(5deg)',
      transition: 'transform 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.target.style.transform = 'perspective(1000px) rotateY(-5deg) rotateX(2deg) scale(1.1)';
    }}
    onMouseLeave={(e) => {
      e.target.style.transform = 'perspective(1000px) rotateY(-15deg) rotateX(5deg)';
    }}>
      <div style={{
        width: '15px',
        height: '15px',
        background: 'white',
        borderRadius: '50%',
        position: 'relative',
        left: '5px'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          background: 'white',
          borderRadius: '50%',
          position: 'absolute',
          top: '3.5px',
          left: '3.5px'
        }}></div>
      </div>
      <div style={{
        position: 'absolute',
        right: '2px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '0',
        height: '0',
        borderLeft: '8px solid white',
        borderTop: '6px solid transparent',
        borderBottom: '6px solid transparent'
      }}></div>
    </div>
  );
};

export default PakistanFlag;
