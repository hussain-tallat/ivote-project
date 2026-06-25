import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const HelpFAQsPage = () => {
  const { t } = useTranslation();
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqs = [
    {
      id: 1,
      question: t('How do I reset my password?'),
      answer: t('To reset your password, go to Settings, click Reset Password, and follow the instructions.')
    },
    {
      id: 2,
      question: t('How can I contact support?'),
      answer: t('You can contact support via the contact form or start a live chat.')
    },
    {
      id: 3,
      question: t('Where can I see my order history?'),
      answer: t("Your order history is in 'My Account'.")
    },
    {
      id: 4,
      question: t('Can I change my registered email?'),
      answer: t('Yes, go to Account Settings and update your email.')
    },
    {
      id: 5,
      question: t('How do I enable notifications?'),
      subQuestion: t('For mobile and desktop devices:'),
      answer: t('Go to Settings → Notifications and toggle the options you want.')
    }
  ];

  const toggleFAQ = (id) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ color: 'var(--primary-green)', fontSize: '2.5rem', marginBottom: '1rem' }}>
            {t('Help & FAQs')}
          </h1>
          <p style={{ color: 'var(--dark-grey)', fontSize: '1.1rem', fontWeight: '600' }}>
            {t('Find answers to common questions below.')}
          </p>
        </div>

        {/* FAQ Accordion */}
        <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          {faqs.map((faq) => (
            <div key={faq.id} className="card" style={{ marginBottom: '1rem', cursor: 'pointer', transition: 'all 0.3s ease' }}
              onClick={() => toggleFAQ(faq.id)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0' }}>
                <h3 style={{ color: 'var(--primary-green)', fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--primary-green)', fontSize: '1.5rem' }}>
                    {openFAQ === faq.id ? '-' : '+'}
                  </span>
                  {faq.question}
                </h3>
              </div>

              {openFAQ === faq.id && (
                <div style={{ paddingTop: '1rem', borderTop: '1px solid #e9ecef', animation: 'fadeIn 0.3s ease-in' }}>
                  {faq.subQuestion && (
                    <h4 style={{ color: 'var(--dark-grey)', fontSize: '1rem', marginBottom: '0.5rem', fontWeight: '500' }}>
                      {faq.subQuestion}
                    </h4>
                  )}
                  <p style={{ color: 'var(--dark-grey)', fontSize: '1rem', lineHeight: '1.6', margin: 0 }}>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still Need Help / Contact Support */}
        <div className="card" style={{ marginTop: '3rem', textAlign: 'center', backgroundColor: 'var(--primary-green)', color: 'white', padding: '2rem', borderRadius: '10px' }}>
          <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>
            {t('Still need help?')}
          </h3>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9 }}>
            {t('Our support team is ready to assist you.')}
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/contact"
              className="btn"
              style={{
                padding: '12px 24px',
                fontSize: '1rem',
                backgroundColor: 'white',
                color: 'var(--primary-green)',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '500'
              }}
            >
              {t('Contact Support')}
            </Link>
            <Link
              to="/support"
              className="btn"
              style={{
                padding: '12px 24px',
                fontSize: '1rem',
                backgroundColor: 'transparent',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                border: '2px solid white',
                fontWeight: '500'
              }}
            >
              {t('Live Chat')}
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ marginTop: '3rem' }}>
          <h3 style={{ color: 'var(--primary-green)', fontSize: '1.8rem', textAlign: 'center', marginBottom: '2rem' }}>
            {t('Quick Links')}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <Link to="/how-it-works" className="card" style={{ textDecoration: 'none', transition: 'transform 0.3s ease', cursor: 'pointer', textAlign: 'center' }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
              <i className="fa-solid fa-circle-question" style={{ fontSize: 40, color: 'var(--primary-green)', marginBottom: '1rem' }}></i>
              <h4 style={{ color: 'var(--primary-green)', marginBottom: '0.5rem' }}>{t('How It Works')}</h4>
              <p style={{ color: 'var(--dark-grey)', margin: 0, fontSize: '0.9rem' }}>{t('Learn how to use our platform step by step.')}</p>
            </Link>

            <Link to="/register" className="card" style={{ textDecoration: 'none', transition: 'transform 0.3s ease', cursor: 'pointer', textAlign: 'center' }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
              <i className="fa-solid fa-id-card" style={{ fontSize: 40, color: 'var(--accent-green)', marginBottom: '1rem' }}></i>
              <h4 style={{ color: 'var(--accent-green)', marginBottom: '0.5rem' }}>{t('Registration Guide')}</h4>
              <p style={{ color: 'var(--dark-grey)', margin: 0, fontSize: '0.9rem' }}>{t('Step-by-step instructions to register an account.')}</p>
            </Link>

            <Link to="/privacy" className="card" style={{ textDecoration: 'none', transition: 'transform 0.3s ease', cursor: 'pointer', textAlign: 'center' }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
              <i className="fa-solid fa-file-shield" style={{ fontSize: 40, color: 'var(--blue)', marginBottom: '1rem' }}></i>
              <h4 style={{ color: 'var(--blue)', marginBottom: '0.5rem' }}>{t('Privacy Policy')}</h4>
              <p style={{ color: 'var(--dark-grey)', margin: 0, fontSize: '0.9rem' }}>{t('Read our privacy policy to understand how we protect your data.')}</p>
            </Link>

            <Link to="/terms" className="card" style={{ textDecoration: 'none', transition: 'transform 0.3s ease', cursor: 'pointer', textAlign: 'center' }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
              <i className="fa-solid fa-file-contract" style={{ fontSize: 40, color: 'var(--orange)', marginBottom: '1rem' }}></i>
              <h4 style={{ color: 'var(--orange)', marginBottom: '0.5rem' }}>{t('Terms & Conditions')}</h4>
              <p style={{ color: 'var(--dark-grey)', margin: 0, fontSize: '0.9rem' }}>{t('Review the rules and guidelines for using our platform.')}</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpFAQsPage;
