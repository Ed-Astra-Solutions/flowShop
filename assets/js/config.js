/**
 * Flow Hydration - API Configuration
 */

const PRODUCTION_API_URL = 'https://api.flowhydration.in';

// Always use the production API (static frontend has no local proxy)
const API_BASE = PRODUCTION_API_URL;
const API_BASE_URL = PRODUCTION_API_URL;

function getApiUrl(path) {
    return `${API_BASE}${path}`;
}
