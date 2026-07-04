const axios = require('axios');
const { SEARCH_API, BROWSER_HEADERS, getSessionCookies } = require('./_session');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
        const { bench_id, case_type, case_no, case_year } = req.body;
        if (!bench_id || !case_type || !case_no || !case_year) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }

        // Get fresh session cookies
        const cookies = await getSessionCookies();

        const payload = {
            wayofselection: "casenumber",
            i_bench_id_case_no: bench_id,
            i_case_type_caseno: case_type,
            case_no: case_no,
            i_case_year_caseno: case_year
        };

        const response = await axios.post(SEARCH_API, payload, {
            headers: {
                ...BROWSER_HEADERS,
                'Cookie': cookies,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        const data = response.data;
        if (data.errormsg) {
            return res.json({ success: false, error: data.errormsg });
        }
        if (!data.mainpanellist || data.mainpanellist.length === 0) {
            return res.json({ success: false, error: "No cases found" });
        }

        const cases = data.mainpanellist.map(c => ({
            filing_no: c.filing_no || '',
            case_no: c.case_no || '',
            case_title1: (c.case_title1 || '').trim(),
            case_title2: (c.case_title2 || '').trim(),
            bench: c.bench_location_name || '',
            court_no: c.court_no || '',
            case_type: c.case_type_desc_cis || '',
            status: c.status || '',
            date_of_filing: c.date_of_filing || '',
            regis_date: c.regis_date || '',
            disposal_date: c.disposal_date || '',
            next_list_date: c.next_list_date || '',
            all_hearings: c.allhearing || '0',
            effective_hearings: c.effhearing || '0'
        }));

        // Return the cookie to the client so it can be passed to subsequent requests
        res.json({
            success: true,
            cases: cases,
            header: data.caseHheader || '',
            session_cookie: cookies
        });

    } catch (error) {
        console.error('Error searching case:', error.message);
        res.status(500).json({ success: false, error: `Failed to search case: ${error.message}` });
    }
}
