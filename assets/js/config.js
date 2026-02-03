/**
 * Flow Hydration - API Configuration
 * 
 * Central configuration for all API endpoints.
 * Change the PRODUCTION_API_URL below to update all frontend pages.
 */

// ============================================
// CHANGE THIS URL TO UPDATE ALL API ENDPOINTS
// ============================================
const PRODUCTION_API_URL = 'https://api.flowhydration.in';

// ============================================
// DO NOT MODIFY BELOW THIS LINE
// ============================================
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = IS_LOCAL ? '' : PRODUCTION_API_URL;
const API_BASE_URL = IS_LOCAL ? '' : PRODUCTION_API_URL;

// Helper function to get API URL with path
function getApiUrl(path) {
    return `${API_BASE}${path}`;
}
