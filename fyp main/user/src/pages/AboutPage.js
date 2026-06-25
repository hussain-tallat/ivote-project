import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AboutPage = () => {
  const { t } = useTranslation();
  const teamMembers = [
    { name: 'Hussain Tallat' },
    { name: 'Noor ul Eman' },
    { name: 'Abbas Altaf' },
    { name: 'Abu Bakar' }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, var(--primary-green) 0%, var(--accent-green) 100%)',
        color: 'white',
        padding: '4rem 0',
        textAlign: 'center'
      }}>
        <div className="container">
          <h1 style={{ 
            fontSize: '3.5rem', 
            fontWeight: '700', 
            marginBottom: '1rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            {t('about_title')}
          </h1>
          <p style={{ 
            fontSize: '1.3rem', 
            marginBottom: '2rem',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
            maxWidth: '800px',
            margin: '0 auto 2rem'
          }}>
            {t('about_subtitle')}
          </p>
        </div>
      </section>

      {/* Who We Are Section */}
      <section style={{ padding: '4rem 0', backgroundColor: 'white' }}>
        <div className="container">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '3rem',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ 
                height: '300px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #dee2e6'
              }}>
                <div style={{ textAlign: 'center', color: 'var(--dark-grey)' }}>
                  <i className="fa-solid fa-check-to-slot" style={{ fontSize: 64, color: '#0066cc' }}></i>
                  <p style={{ margin: 0, fontWeight: '500' }}>Voting Illustration</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                    Two people standing next to a large voting box with a checkmark
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h2 style={{ 
                color: 'var(--primary-green)', 
                fontSize: '2.5rem', 
                marginBottom: '1.5rem' 
              }}>
                {t('who_we_are')}
              </h2>
              <p style={{ 
                fontSize: '1.1rem', 
                lineHeight: '1.8',
                color: 'var(--dark-grey)',
                marginBottom: '1.5rem'
              }}>
                {t('who_we_are_desc')}
              </p>
              <p style={{ 
                fontSize: '1.1rem', 
                lineHeight: '1.8',
                color: 'var(--dark-grey)'
              }}>
                {t('who_we_are_desc2')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section style={{ 
        padding: '4rem 0', 
        backgroundColor: 'var(--primary-green)', 
        color: 'white' 
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ 
              fontSize: '2.5rem', 
              marginBottom: '1.5rem' 
            }}>
              {t('our_mission')}
            </h2>
            <p style={{ 
              fontSize: '1.2rem', 
              maxWidth: '800px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              {t('our_mission_desc')}
            </p>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '2rem' 
          }}>
            <div style={{ textAlign: 'center' }}>
              <i className="fa-solid fa-shield-halved" style={{ fontSize: 48, color: '#198754', marginBottom: '1rem' }}></i>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>
                Security
              </h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                Voter Verification
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <i className="fa-solid fa-eye" style={{ fontSize: 48, color: '#1abc9c', marginBottom: '1rem' }}></i>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>
                Transparency
              </h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                Real-time Alerts
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <i className="fa-solid fa-universal-access" style={{ fontSize: 48, color: '#f39c12', marginBottom: '1rem' }}></i>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>
                Accessibility
              </h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                Secure Access
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <i className="fa-solid fa-shield-halved" style={{ fontSize: 48, color: '#ffc107', marginBottom: '1rem' }}></i>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>
                Awareness
              </h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                Fraud Prevention
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Vision Section (WORLD MAP REMOVED ONLY) */}
      <section style={{ padding: '4rem 0', backgroundColor: 'white' }}>
        <div className="container">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '3rem',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{ 
                color: 'var(--primary-green)', 
                fontSize: '2.5rem', 
                marginBottom: '1.5rem' 
              }}>
                {t('our_vision')}
              </h2>
              <p style={{ 
                fontSize: '1.1rem', 
                lineHeight: '1.8',
                color: 'var(--dark-grey)',
                marginBottom: '2rem'
              }}>
                {t('our_vision_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How We Help Section */}
      <section style={{ padding: '4rem 0', backgroundColor: '#f8f9fa' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ 
              color: 'var(--primary-green)', 
              fontSize: '2.5rem', 
              marginBottom: '1rem' 
            }}>
              How We Help
            </h2>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '2rem' 
          }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <i className="fa-solid fa-graduation-cap" style={{ fontSize: 48, color: 'var(--primary-green)', marginBottom: '1rem' }}></i>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary-green)', fontSize: '1.3rem' }}>
                Voter Education
              </h3>
              <p style={{ color: 'var(--dark-grey)', lineHeight: '1.6' }}>
                Providing information on election processes and rights
              </p>
            </div>
            
            <div className="card" style={{ textAlign: 'center' }}>
              <i className="fa-solid fa-bell" style={{ fontSize: 48, color: 'var(--accent-green)', marginBottom: '1rem' }}></i>
              <h3 style={{ marginBottom: '1rem', color: 'var(--accent-green)', fontSize: '1.3rem' }}>
                Real-time Alerts
              </h3>
              <p style={{ color: 'var(--dark-grey)', lineHeight: '1.6' }}>
                Sending notifications about upcoming elections
              </p>
            </div>
            
            <div className="card" style={{ textAlign: 'center' }}>
              <i className="fa-solid fa-lock" style={{ fontSize: 48, color: 'var(--blue)', marginBottom: '1rem' }}></i>
              <h3 style={{ marginBottom: '1rem', color: 'var(--blue)', fontSize: '1.3rem' }}>
                Secure Access
              </h3>
              <p style={{ color: 'var(--dark-grey)', lineHeight: '1.6' }}>
                Ensuring safe and reliable voting procedures
              </p>
            </div>
            
            <div className="card" style={{ textAlign: 'center' }}>
              <i className="fa-solid fa-user-shield" style={{ fontSize: 48, color: 'var(--orange)', marginBottom: '1rem' }}></i>
              <h3 style={{ marginBottom: '1rem', color: 'var(--orange)', fontSize: '1.3rem' }}>
                Fraud Prevention
              </h3>
              <p style={{ color: 'var(--dark-grey)', lineHeight: '1.6' }}>
                Identifying and reporting potential fraud
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Expert Team Section */}
      <section style={{ padding: '4rem 0', backgroundColor: 'white' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ color: 'var(--dark-grey)', fontSize: '1rem', marginBottom: '0.5rem' }}>
              {t('expert_team')}
            </p>
            <h2 style={{ color: 'var(--primary-green)', fontSize: '2.5rem', marginBottom: '1rem' }}>
              {t('teamwork_makes_the_dream_work')}
            </h2>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            {teamMembers.map((member, index) => (
              <div key={index} className="card" style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '120px', 
                  height: '120px', 
                  backgroundColor: 'var(--primary-green)', 
                  borderRadius: '50%', 
                  margin: '0 auto 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '2rem',
                  fontWeight: 'bold'
                }}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 style={{ color: 'var(--primary-green)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>
                  {member.name}
                </h3>
              </div>
            ))}
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.2rem', color: 'var(--dark-grey)', marginBottom: '2rem', fontStyle: 'italic' }}>
              {t('together lets make voting secure and accessible for every pakistani')}
            </p>
            
            <Link 
              to="/register" 
              className="btn btn-primary"
              style={{ padding: '16px 32px', fontSize: '1.1rem' }}
            >
              {t('join_us')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
