const axios = require('axios');
const { DETAILS_API, BROWSER_HEADERS } = require('./_session');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
        const { filing_no, session_cookie } = req.body;
        if (!filing_no || !session_cookie) {
            return res.status(400).json({ success: false, error: 'filing_no and session_cookie are required' });
        }

        const params = new URLSearchParams({
            filing_no: filing_no,
            flagIA: 'false'
        });

        const response = await axios.get(`${DETAILS_API}?${params.toString()}`, {
            headers: {
                ...BROWSER_HEADERS,
                'Cookie': session_cookie
            },
            timeout: 15000
        });

        const data = response.data;
        if (!data.allproceedingdtls || data.allproceedingdtls.length === 0) {
            return res.json({ success: false, error: "No proceedings found" });
        }

        const orders = [];
        let index = 1;
        for (const proc of data.allproceedingdtls) {
            if (proc.encPath || proc.path) {
                const order_date = proc.order_upload_date || '';
                const listing_date = proc.listing_date || '';
                const sort_date = order_date ? order_date : listing_date;

                orders.push({
                    index: index++,
                    order_date,
                    listing_date,
                    description: proc.path_descr || 'Order',
                    encPath: proc.encPath || '',
                    path: proc.path || '',
                    court_no: proc.court_no || '',
                    sort_date
                });
            }
        }

        // Sort by date (oldest first)
        function parseDate(d) {
            if (!d) return 0;
            // Assumes DD-MM-YYYY format
            const parts = d.split(' ')[0].split('-');
            if (parts.length === 3) {
                return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
            }
            return 0;
        }

        orders.sort((a, b) => parseDate(a.sort_date) - parseDate(b.sort_date));

        // Re-assign seq_no
        orders.forEach((o, i) => { o.seq_no = i + 1; });

        res.json({ success: true, orders, total: orders.length });

    } catch (error) {
        console.error('Error getting case orders:', error.message);
        res.status(500).json({ success: false, error: `Failed to get case orders: ${error.message}` });
    }
}
