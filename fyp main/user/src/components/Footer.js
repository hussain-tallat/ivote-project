
import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

const Footer = () => {
  return (
    <footer className="footer" style={{ backgroundColor: '#232323' }}>
      <div className="footer-content">
        <div className="footer-section">
          <div className="logo">
            <img 
              src={logo} 
              alt="iVotePK" 
              style={{ 
                height: '30px', 
                marginRight: '10px' 
              }} 
            />
            
          </div>
          <p style={{ margin: '1rem 0', color: '#bdc3c7' }}>
            Empowering Every Vote - Securing Every Voice
          </p>
        </div>
        
        <div className="footer-section">
          <h3>WHO WE ARE</h3>
          <ul>
            <li><Link to="/about">About us</Link></li>
            <li><Link to="/how-it-works">How it works</Link></li>
            <li><Link to="/help">Help / FAQs</Link></li>
            <li><Link to="/terms">Terms & Conditions</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>GET IN TOUCH</h3>
          <ul>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/contact">Email Us</Link></li>
            <li><Link to="/support">ChatBot</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>Copyright 2025 © All Rights Reserved | Design by iVotePK</p>
      </div>
    </footer>
  );
};

export default Footer;
