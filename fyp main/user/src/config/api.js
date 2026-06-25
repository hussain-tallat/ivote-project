/**
 * Backend base URL for fetch calls.
 * Set REACT_APP_API_URL in `.env` if API is not on localhost:5000 (e.g. LAN IP).
 */
export const API_BASE =
  (typeof process !== 'undefined' && process.env.REACT_APP_API_URL) ||
  'http://localhost:5000';
