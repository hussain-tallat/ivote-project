
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Contact form submitted:', formData);
      alert('Thank you for your message! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ 
            color: 'var(--primary-green)', 
            fontSize: '2.5rem', 
            marginBottom: '1rem' 
          }}>
            Contact Us
          </h1>
          <p style={{ 
            color: 'var(--dark-grey)', 
            fontSize: '1.1rem',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Get in touch with our support team. We're here to help with any questions or concerns.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '3rem' 
        }}>
          {/* Contact Form */}
          <div className="card">
            <h2 style={{ 
              color: 'var(--primary-green)', 
              fontSize: '1.8rem', 
              marginBottom: '1.5rem' 
            }}>
              Send us a Message
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="technical">Technical Support</option>
                  <option value="voting">Voting Issues</option>
                  <option value="account">Account Problems</option>
                  <option value="security">Security Concerns</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Describe your issue or question in detail"
                  className="form-input"
                  rows="5"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="btn btn-primary"
                style={{ 
                  width: '100%',
                  padding: '14px',
                  fontSize: '1.1rem'
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner" style={{ width: '20px', height: '20px', marginRight: '10px' }}></div>
                    Sending...
                  </div>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div>
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                color: 'var(--primary-green)', 
                fontSize: '1.8rem', 
                marginBottom: '1.5rem' 
              }}>
                Get in Touch
              </h2>
              
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '1.5rem' 
                }}>
                  <div style={{ 
                    fontSize: '2rem', 
                    color: 'var(--primary-green)', 
                    marginRight: '1rem' 
                  }}>
                    <i className="bi bi-telephone"></i>
                  </div>
                  <div>
                    <h3 style={{ 
                      color: 'var(--primary-green)', 
                      marginBottom: '0.25rem' 
                    }}>
                      Phone Support
                    </h3>
                    <p style={{ 
                      color: 'var(--dark-grey)', 
                      margin: 0,
                      fontSize: '1.1rem',
                      fontWeight: '500'
                    }}>
                      +92 308 443 3843
                    </p>
                    <p style={{ 
                      color: 'var(--dark-grey)', 
                      margin: '0.25rem 0 0 0',
                      fontSize: '0.9rem'
                    }}>
                      Available 24/7 for urgent issues
                    </p>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '1.5rem' 
                }}>
                  <div style={{ 
                    fontSize: '2rem', 
                    color: 'var(--accent-green)', 
                    marginRight: '1rem' 
                  }}>
                    <i className="bi bi-envelope"></i>
                  </div>
                  <div>
                    <h3 style={{ 
                      color: 'var(--accent-green)', 
                      marginBottom: '0.25rem' 
                    }}>
                      Email Support
                    </h3>
                    <p style={{ 
                      color: 'var(--dark-grey)', 
                      margin: 0,
                      fontSize: '1.1rem',
                      fontWeight: '500'
                    }}>
                      support@ivotepk.com
                    </p>
                    <p style={{ 
                      color: 'var(--dark-grey)', 
                      margin: '0.25rem 0 0 0',
                      fontSize: '0.9rem'
                    }}>
                      Response within 24 hours
                    </p>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '1.5rem' 
                }}>
                  <div style={{ 
                    fontSize: '2rem', 
                    color: 'var(--blue)', 
                    marginRight: '1rem' 
                  }}>
                    <i className="bi bi-chat-dots"></i>
                  </div>
                  <div>
                    <h3 style={{ 
                      color: 'var(--blue)', 
                      marginBottom: '0.25rem' 
                    }}>
                      Live Chat
                    </h3>
                    <p style={{ 
                      color: 'var(--dark-grey)', 
                      margin: 0,
                      fontSize: '1.1rem',
                      fontWeight: '500'
                    }}>
                      Available on website
                    </p>
                    <p style={{ 
                      color: 'var(--dark-grey)', 
                      margin: '0.25rem 0 0 0',
                      fontSize: '0.9rem'
                    }}>
                      Instant support during business hours
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="card">
              <h3 style={{ 
                color: 'var(--primary-green)', 
                marginBottom: '1.5rem' 
              }}>
                Quick Links
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Link 
                  to="/help" 
                  style={{ 
                    color: 'var(--dark-grey)', 
                    textDecoration: 'none',
                    padding: '0.75rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--primary-green)';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                    e.target.style.color = 'var(--dark-grey)';
                  }}
                >
                  📚 Help & FAQs
                </Link>
                
                <Link 
                  to="/support" 
                  style={{ 
                    color: 'var(--dark-grey)', 
                    textDecoration: 'none',
                    padding: '0.75rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--primary-green)';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                    e.target.style.color = 'var(--dark-grey)';
                  }}
                >
                  🤖 Live Chat Support
                </Link>
                
                <Link 
                  to="/how-it-works" 
                  style={{ 
                    color: 'var(--dark-grey)', 
                    textDecoration: 'none',
                    padding: '0.75rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--primary-green)';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                    e.target.style.color = 'var(--dark-grey)';
                  }}
                >
                  📋 How It Works
                </Link>
                
                <Link 
                  to="/privacy" 
                  style={{ 
                    color: 'var(--dark-grey)', 
                    textDecoration: 'none',
                    padding: '0.75rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--primary-green)';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                    e.target.style.color = 'var(--dark-grey)';
                  }}
                >
                  🔒 Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="card" style={{ 
          marginTop: '3rem',
          textAlign: 'center',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7'
        }}>
          <h3 style={{ 
            color: 'var(--dark-grey)', 
            fontSize: '1.5rem', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            🚨 Emergency Support
          </h3>
          <p style={{ 
            color: 'var(--dark-grey)', 
            fontSize: '1rem', 
            marginBottom: '1rem' 
          }}>
            For urgent voting issues during election hours, call our emergency hotline
          </p>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold',
            color: 'var(--primary-green)',
            marginBottom: '1rem'
          }}>
            +92 308 443 3843
          </div>
          <p style={{ 
            color: 'var(--dark-grey)', 
            fontSize: '0.9rem',
            margin: 0
          }}>
            Available 24/7 during active election periods
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
