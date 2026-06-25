import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/PakistanHistory.css';

const PakistanHistoryPage = () => {
  return (
    <div className="pakistan-history-container">
      {/* Hero Section with Image */}
      <div className="history-hero">
        <img src="/assets/history.png" alt="Pakistan History" className="history-hero-image" />
        <div className="history-hero-overlay">
          <h1>History of Pakistan</h1>
          <p>From Independence to Modern Times (1947 - 2026)</p>
        </div>
      </div>

      {/* Back to Home Button */}
      <div className="history-nav">
        <Link to="/" className="btn-back-home">
          ← Back to Home
        </Link>
      </div>

      {/* Main Content */}
      <div className="history-content">
        {/* Era 1 */}
        <section className="history-era">
          <div className="era-header">
            <h2>The Foundation & First Era (1947 – 1958)</h2>
            <span className="era-year">1947 - 1958</span>
          </div>
          <div className="era-content">
            <ul className="timeline-list">
              <li><strong>1947:</strong> Pakistan is created on August 14 as a sovereign nation. Muhammad Ali Jinnah becomes the first Governor-General.</li>
              <li><strong>1948:</strong> The first war with India over Kashmir begins. Jinnah passes away in September.</li>
              <li><strong>1951:</strong> First Prime Minister Liaquat Ali Khan is assassinated in Rawalpindi.</li>
              <li><strong>1956:</strong> The first Constitution is adopted, officially making Pakistan the Islamic Republic of Pakistan.</li>
            </ul>
          </div>
        </section>

        {/* Era 2 */}
        <section className="history-era">
          <div className="era-header">
            <h2>Military Rule & Separation (1958 – 1971)</h2>
            <span className="era-year">1958 - 1971</span>
          </div>
          <div className="era-content">
            <ul className="timeline-list">
              <li><strong>1958:</strong> General Ayub Khan declares the first Martial Law.</li>
              <li><strong>1965:</strong> Second war with India over Kashmir occurs in September.</li>
              <li><strong>1971:</strong> A civil war and war with India lead to the secession of East Pakistan, which becomes Bangladesh.</li>
            </ul>
          </div>
        </section>

        {/* Era 3 */}
        <section className="history-era">
          <div className="era-header">
            <h2>Constitutional Growth & Nuclear Power (1973 – 1999)</h2>
            <span className="era-year">1973 - 1999</span>
          </div>
          <div className="era-content">
            <ul className="timeline-list">
              <li><strong>1973:</strong> A new democratic Constitution is enacted under Zulfikar Ali Bhutto.</li>
              <li><strong>1977:</strong> General Zia-ul-Haq overthrows Bhutto and begins an "Islamization" period.</li>
              <li><strong>1988:</strong> Restoration of democracy; Benazir Bhutto becomes the first female PM of a Muslim nation.</li>
              <li><strong>1998:</strong> Pakistan successfully conducts nuclear tests in Balochistan, becoming a global nuclear power.</li>
            </ul>
          </div>
        </section>

        {/* Era 4 */}
        <section className="history-era">
          <div className="era-header">
            <h2>The War on Terror & Democratic Transition (2001 – 2018)</h2>
            <span className="era-year">2001 - 2018</span>
          </div>
          <div className="era-content">
            <ul className="timeline-list">
              <li><strong>2001:</strong> Pakistan becomes a key ally in the global "War on Terror" following the 9/11 attacks.</li>
              <li><strong>2008:</strong> General Musharraf resigns; the PPP returns to power.</li>
              <li><strong>2013:</strong> First-ever peaceful transition from one civilian government to another (PPP to PML-N).</li>
              <li><strong>2018:</strong> Imran Khan (PTI) wins the general election, promising a "Naya (New) Pakistan."</li>
            </ul>
          </div>
        </section>

        {/* Era 5 */}
        <section className="history-era">
          <div className="era-header">
            <h2>Modern Turmoil & Recovery (2022 – 2026)</h2>
            <span className="era-year">2022 - 2026</span>
          </div>
          <div className="era-content">
            <ul className="timeline-list">
              <li><strong>2022:</strong> Imran Khan is ousted via a no-confidence motion. Shehbaz Sharif takes over as PM during a period of severe economic crisis and devastating floods.</li>
              <li><strong>2024:</strong> General elections are held in February. Despite political deadlock and delays, Shehbaz Sharif begins his second term as Prime Minister.</li>
              <li><strong>2025:</strong> Economic stabilization begins. The country sees a significant drop in inflation (reaching single digits by late 2024/early 2025) and reports its first fiscal surplus in decades.</li>
              <li><strong>2026 (Current):</strong> Economy is showing steady recovery with GDP growth projected between 3.75% and 4.75%. Focus remains on structural reforms and digital governance to prevent future defaults. Pakistan's national cricket teams are active in international tours.</li>
            </ul>
          </div>
        </section>

        {/* Prime Ministers Table */}
        <section className="history-pm-section">
          <h2>Prime Ministers of Pakistan (1947 – Present)</h2>
          <div className="pm-table-wrapper">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Tenure</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>1</td><td>Liaquat Ali Khan</td><td>1947 – 1951</td></tr>
                <tr><td>2</td><td>Sir Khawaja Nazimuddin</td><td>1951 – 1953</td></tr>
                <tr><td>3</td><td>Mohammad Ali Bogra</td><td>1953 – 1955</td></tr>
                <tr><td>4</td><td>Chaudhry Muhammad Ali</td><td>1955 – 1956</td></tr>
                <tr><td>5</td><td>Huseyn Shaheed Suhrawardy</td><td>1956 – 1957</td></tr>
                <tr><td>6</td><td>Ibrahim Ismail Chundrigar</td><td>1957 – 1957</td></tr>
                <tr><td>7</td><td>Sir Feroze Khan Noon</td><td>1957 – 1958</td></tr>
                <tr><td>8</td><td>Nurul Amin</td><td>1971 – 1971</td></tr>
                <tr><td>9</td><td>Zulfikar Ali Bhutto</td><td>1973 – 1977</td></tr>
                <tr><td>10</td><td>Muhammad Khan Junejo</td><td>1985 – 1988</td></tr>
                <tr><td>11</td><td>Benazir Bhutto (1st Term)</td><td>1988 – 1990</td></tr>
                <tr><td>12</td><td>Nawaz Sharif (1st Term)</td><td>1990 – 1993</td></tr>
                <tr><td>13</td><td>Benazir Bhutto (2nd Term)</td><td>1993 – 1996</td></tr>
                <tr><td>14</td><td>Nawaz Sharif (2nd Term)</td><td>1997 – 1999</td></tr>
                <tr><td>15</td><td>Mir Zafarullah Khan Jamali</td><td>2002 – 2004</td></tr>
                <tr><td>16</td><td>Chaudhry Shujaat Hussain</td><td>2004 – 2004</td></tr>
                <tr><td>17</td><td>Shaukat Aziz</td><td>2004 – 2007</td></tr>
                <tr><td>18</td><td>Yousaf Raza Gillani</td><td>2008 – 2012</td></tr>
                <tr><td>19</td><td>Raja Pervaiz Ashraf</td><td>2012 – 2013</td></tr>
                <tr><td>20</td><td>Nawaz Sharif (3rd Term)</td><td>2013 – 2017</td></tr>
                <tr><td>21</td><td>Shahid Khaqan Abbasi</td><td>2017 – 2018</td></tr>
                <tr><td>22</td><td>Imran Khan</td><td>2018 – 2022</td></tr>
                <tr><td>23</td><td>Shehbaz Sharif (1st Term)</td><td>2022 – 2023</td></tr>
                <tr className="current-pm"><td>24</td><td>Shehbaz Sharif (2nd Term)</td><td>2024 – Present</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Footer with Back Button */}
      <div className="history-footer">
        <Link to="/" className="btn-back-home-footer">
          ← Return to Home Page
        </Link>
      </div>
    </div>
  );
};

export default PakistanHistoryPage;
