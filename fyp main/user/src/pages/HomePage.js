import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import background from '../assets/background.png';

const HomePage = () => {
  const { t } = useTranslation();

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero" style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#1a1a2e',
        minHeight: 'calc(100vw * 0.95)',
        height: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'white',
        position: 'relative',
        width: '100%',
        paddingTop: '140px',
        paddingBottom: '100px'
      }}>
        <div className="hero-content" style={{ maxWidth: '800px', padding: '0 20px' }}>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: '700',
            marginBottom: '1.5rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}>
            {t('secure_voting')}
          </h1>
          <p style={{
            fontSize: '1.2rem',
            marginBottom: '2.5rem',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            lineHeight: '1.6'
          }}>
            {t('hero_description')}
          </p>

          <div style={{
            display: 'flex',
            gap: '2rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Link
              to="/register"
              className="btn btn-primary"
              style={{
                padding: '16px 32px',
                fontSize: '1.1rem',
                minWidth: '150px'
              }}
            >
              {t('user')}
            </Link>
            <Link
              to="/admin/auth"
              className="btn btn-primary"
              style={{
                padding: '16px 32px',
                fontSize: '1.1rem',
                minWidth: '150px'
              }}
            >
              {t('admin')}
            </Link>
            <Link
              to="/history"
              className="btn btn-primary"
              style={{
                padding: '16px 32px',
                fontSize: '1.1rem',
                minWidth: '150px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)'
              }}
            >
              History
            </Link>
          </div>

          {/* User Guide Downloads */}
          <div style={{
            marginTop: '2.5rem',
            display: 'flex',
            gap: '1.5rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <a
              href="/user-guide-en.pdf"
              download="iVotePK_User_Guide_English.pdf"
              style={{
                padding: '12px 28px',
                fontSize: '1rem',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #1a4d3a 0%, #2d6a4f 100%)',
                color: '#ffffff',
                border: '2px solid #ffffff',
                borderRadius: '12px',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                fontFamily: '"Poppins", sans-serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #0f3d2a 0%, #1a4d3a 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #1a4d3a 0%, #2d6a4f 100%)';
              }}
            >
              <i className="bi bi-file-earmark-pdf-fill" style={{ fontSize: '1.3rem' }}></i>
              {t('download_guide_en')}
            </a>

            <a
              href="/user-guide-ur.pdf"
              download="iVotePK_User_Guide_Urdu.pdf"
              style={{
                padding: '12px 28px',
                fontSize: '1rem',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #1a4d3a 0%, #2d6a4f 100%)',
                color: '#ffffff',
                border: '2px solid #ffffff',
                borderRadius: '12px',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                fontFamily: '"Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", sans-serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #0f3d2a 0%, #1a4d3a 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #1a4d3a 0%, #2d6a4f 100%)';
              }}
            >
              <i className="bi bi-file-earmark-pdf-fill" style={{ fontSize: '1.3rem' }}></i>
              {t('download_guide_ur')}
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '4rem 0', backgroundColor: '#f8f9fa' }}>
        <div className="container">
          <h2 style={{
            textAlign: 'center',
            fontSize: '2.5rem',
            marginBottom: '3rem',
            color: 'var(--primary-green)'
          }}>
            {t('why_choose')}
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '3rem',
                color: 'var(--primary-green)',
                marginBottom: '1rem'
              }}>
                <i className="bi bi-shield-check"></i>
              </div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary-green)' }}>
                {t('secure_verification')}
              </h3>
              <p>
                {t('secure_verification_desc')}
              </p>
            </div>

            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '3rem',
                color: 'var(--primary-green)',
                marginBottom: '1rem'
              }}>
                <i className="bi bi-graph-up"></i>
              </div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary-green)' }}>
                {t('real_time_transparency')}
              </h3>
              <p>
                {t('real_time_transparency_desc')}
              </p>
            </div>

            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '3rem',
                color: 'var(--primary-green)',
                marginBottom: '1rem'
              }}>
                <i className="bi bi-person-check"></i>
              </div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary-green)' }}>
                {t('accessible_voting')}
              </h3>
              <p>
                {t('accessible_voting_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '4rem 0',
        backgroundColor: '#f8f9fa',
        textAlign: 'center'
      }}>
        <div className="container">
          <h2 style={{
            fontSize: '2.5rem',
            marginBottom: '1.5rem',
            color: 'var(--primary-green)'
          }}>
            {t('ready_to_vote')}
          </h2>
          <p style={{
            fontSize: '1.2rem',
            marginBottom: '2rem',
            color: 'var(--dark-grey)'
          }}>
            {t('join_thousands')}
          </p>
          <Link
            to="/register"
            className="btn btn-primary"
            style={{
              padding: '16px 32px',
              fontSize: '1.1rem'
            }}
          >
            {t('register_to_vote')}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
