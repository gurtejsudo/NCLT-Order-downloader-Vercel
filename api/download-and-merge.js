const axios = require('axios');
const { PDFDocument } = require('pdf-lib');
const { ORDER_VIEW_URL, BROWSER_HEADERS } = require('./_session');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
        const { orders, caseInfo, session_cookie } = req.body;
        if (!orders || orders.length === 0 || !session_cookie) {
            return res.status(400).json({ success: false, error: 'No orders to download or missing session.' });
        }

        const mergedPdf = await PDFDocument.create();
        const downloadedFiles = [];
        const errors = [];

        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            try {
                if (!order.encPath) {
                    throw new Error('No encPath provided for this order');
                }
                
                const params = new URLSearchParams({ path: order.encPath });
                
                const response = await axios.get(`${ORDER_VIEW_URL}?${params.toString()}`, {
                    headers: { 
                        ...BROWSER_HEADERS, 
                        'Cookie': session_cookie,
                        'Accept': 'application/pdf,*/*' 
                    },
                    responseType: 'arraybuffer',
                    timeout: 60000,
                });
                
                const pdfBytes = response.data;
                
                // Merge into combined PDF
                try {
                    const existingPdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
                    const pages = await mergedPdf.copyPages(existingPdf, existingPdf.getPageIndices());
                    pages.forEach(page => mergedPdf.addPage(page));
                    
                    downloadedFiles.push({
                        date: order.order_date,
                        pages: pages.length,
                        size: pdfBytes.byteLength || pdfBytes.length,
                        type: 'pdf',
                    });
                } catch (pdfError) {
                    errors.push({ index: order.seq_no, date: order.order_date, error: `Could not merge: ${pdfError.message}` });
                    downloadedFiles.push({
                        date: order.order_date,
                        pages: 0,
                        size: 0,
                        type: 'pdf',
                        mergeError: true,
                    });
                }
                
                // Polite delay
                if (i < orders.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
            } catch (downloadError) {
                errors.push({ index: order.seq_no, date: order.order_date, error: downloadError.message });
            }
        }

        const mergedPdfBytes = await mergedPdf.save();
        const base64 = Buffer.from(mergedPdfBytes).toString('base64');
        const dataUrl = `data:application/pdf;base64,${base64}`;

        res.json({
            success: true,
            mergedFile: dataUrl,
            mergedPages: mergedPdf.getPageCount(),
            mergedSize: mergedPdfBytes.byteLength,
            downloadedFiles,
            errors,
            totalDownloaded: downloadedFiles.length,
            totalFailed: errors.length,
        });

    } catch (error) {
        console.error('Error during download and merge:', error.message);
        res.status(500).json({ success: false, error: `Failed to download and merge: ${error.message}` });
    }
}
