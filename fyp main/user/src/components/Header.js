import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../assets/logo.png';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { i18n, t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className="header"
      style={{
        background: '#ffffff',
        boxShadow: scrolled
          ? '0 4px 20px rgba(0, 0, 0, 0.1)'
          : '0 2px 10px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s ease',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderBottom: scrolled ? '2px solid #1a4d3a' : '1px solid #e0e0e0'
      }}
    >
      {/* Animated accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, #1a4d3a, #4a9b5c, #7fb069, #4a9b5c, #1a4d3a)',
        animation: 'slideAccent 3s ease-in-out infinite'
      }}></div>

      <div className="header-content" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '1rem 50px',
        position: 'relative',
        zIndex: 1
      }}>
        <Link
          to="/"
          className="logo"
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
            padding: '8px 12px',
            borderRadius: '12px',
            background: 'rgba(26, 77, 58, 0.05)',
            border: '2px solid rgba(26, 77, 58, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
            e.currentTarget.style.background = 'rgba(26, 77, 58, 0.1)';
            e.currentTarget.style.borderColor = '#1a4d3a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.background = 'rgba(26, 77, 58, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(26, 77, 58, 0.1)';
          }}
        >
          <img
            src={logo}
            alt="iVotePK"
            style={{
              height: '50px',
              width: 'auto',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}
          />
        </Link>

        <nav className="nav" style={{
          display: 'flex',
          listStyle: 'none',
          gap: '0.5rem',
          alignItems: 'center',
          margin: 0,
          padding: '8px',
          background: 'rgba(26, 77, 58, 0.05)',
          borderRadius: '20px',
          border: '1px solid rgba(26, 77, 58, 0.1)'
        }}>
          {[
            { to: '/', label: t('home') },
            { to: '/about', label: t('about_us') },
            { to: '/help', label: t('help_faqs') },
            { to: '/how-it-works', label: t('how_it_works') },
            { to: '/contact', label: t('contact_us') }
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                color: location.pathname === item.to ? '#ffffff' : '#2c3e50',
                textDecoration: 'none',
                fontWeight: location.pathname === item.to ? '600' : '500',
                fontSize: '0.9rem',
                padding: '12px 20px',
                borderRadius: '14px',
                transition: 'all 0.3s ease',
                background: location.pathname === item.to
                  ? 'linear-gradient(135deg, #1a4d3a 0%, #2d6a4f 100%)'
                  : 'transparent',
                textTransform: 'uppercase',
                fontFamily: '"Poppins", sans-serif'
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== item.to) {
                  e.currentTarget.style.color = '#1a4d3a';
                  e.currentTarget.style.background = 'rgba(26, 77, 58, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== item.to) {
                  e.currentTarget.style.color = '#2c3e50';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Language Selector */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          background: 'rgba(26, 77, 58, 0.05)',
          borderRadius: '12px',
          padding: '4px',
          border: '1px solid rgba(26, 77, 58, 0.1)'
        }}>
          <button
            onClick={() => {
              i18n.changeLanguage('en');
              localStorage.setItem('language', 'en');
            }}
            style={{
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontWeight: i18n.language === 'en' ? '600' : '500',
              background: i18n.language === 'en' 
                ? 'linear-gradient(135deg, #1a4d3a 0%, #2d6a4f 100%)' 
                : 'transparent',
              color: i18n.language === 'en' ? '#ffffff' : '#2c3e50',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: '"Poppins", sans-serif'
            }}
            onMouseEnter={(e) => {
              if (i18n.language !== 'en') {
                e.currentTarget.style.background = 'rgba(26, 77, 58, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (i18n.language !== 'en') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            🇬🇧 EN
          </button>
          <button
            onClick={() => {
              i18n.changeLanguage('ur');
              localStorage.setItem('language', 'ur');
            }}
            style={{
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontWeight: i18n.language === 'ur' ? '600' : '500',
              background: i18n.language === 'ur' 
                ? 'linear-gradient(135deg, #1a4d3a 0%, #2d6a4f 100%)' 
                : 'transparent',
              color: i18n.language === 'ur' ? '#ffffff' : '#2c3e50',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: '"Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", sans-serif'
            }}
            onMouseEnter={(e) => {
              if (i18n.language !== 'ur') {
                e.currentTarget.style.background = 'rgba(26, 77, 58, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (i18n.language !== 'ur') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            🇵🇰 اردو
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideAccent {
          0%, 100% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </header>
  );
};

export default Header;
