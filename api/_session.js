const axios = require('axios');

const NCLT_BASE_URL = "https://efiling.nclt.gov.in";
const CASE_HISTORY_PAGE = `${NCLT_BASE_URL}/casehistorybeforeloginmenutrue.drt`;
const SEARCH_API = `${NCLT_BASE_URL}/caseHistoryoptional.drt`;
const DETAILS_API = `${NCLT_BASE_URL}/caseHistoryalldetails.drt`;
const ORDER_VIEW_URL = `${NCLT_BASE_URL}/ordersview.drt`;

const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'en-US,en;q=0.9',
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': NCLT_BASE_URL,
    'Referer': CASE_HISTORY_PAGE
};

async function getSessionCookies() {
    try {
        const resp = await axios.get(CASE_HISTORY_PAGE, {
            headers: BROWSER_HEADERS,
            timeout: 15000,
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 400
        });
        
        const setCookie = resp.headers['set-cookie'];
        if (setCookie) {
            // Join cookies into a single string for subsequent requests
            return setCookie.map(c => c.split(';')[0]).join('; ');
        }
        return '';
    } catch (error) {
        console.error("Error getting session cookies:", error.message);
        throw error;
    }
}

module.exports = {
    NCLT_BASE_URL,
    CASE_HISTORY_PAGE,
    SEARCH_API,
    DETAILS_API,
    ORDER_VIEW_URL,
    BROWSER_HEADERS,
    getSessionCookies
};
