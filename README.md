# NCLT Order Downloader

An interactive web tool to download all orders for any NCLT (National Company Law Tribunal) case and merge them into a single sequential PDF.

## Features

- Search cases by Bench, Case Type, Case Number, and Year
- View all orders with dates and descriptions
- Select/deselect specific orders to download
- Download all selected orders and merge into a single PDF
- Orders arranged sequentially by date (oldest first)
- Captcha forwarding support (for future compatibility)

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation

1. Extract the tool to a folder
2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Start the tool:
```bash
python start.py
```

This will start a local web server and open your browser automatically.

Or manually:
```bash
python app.py
```
Then open http://127.0.0.1:5000/ in your browser.

### Steps to download orders:

1. **Select Zonal Bench** - Choose the NCLT bench where your case is filed
2. **Select Case Type** - Choose the case type (CP, CA, IA, etc.)
3. **Enter Case Number** - Input the numeric case number (e.g., `123`)
4. **Select Case Year** - Choose the case year
5. Click **Search Case**
6. Click on the case from search results to view all orders
7. Select/deselect orders as needed (all are selected by default)
8. Click **Download All Selected Orders**
9. The tool will download and merge all orders into a single PDF
10. Click **Download Merged PDF** to save the file

## Case Number Format

The NCLT case number format is typically: `CASE_TYPE/CASE_NUMBER/BENCH/YEAR`

For example: `C.P. (IB)/100/MB/2024`
- Case Type: Company Petition IB (IBC)
- Case Number: 100
- Bench: Mumbai
- Year: 2024

You only need to enter:
- **Bench**: Mumbai
- **Case Type**: Company Petition IB (IBC)
- **Case Number**: 100
- **Case Year**: 2024

## Supported Benches

- Ahmedabad, Allahabad, Amaravati, Bengaluru, Chandigarh
- Chennai, Cuttack, Guwahati, Hyderabad, Indore
- Jaipur, Kochi, Kolkata, Mumbai, Principal Bench (New Delhi)

## Supported Case Types

All major NCLT case types including:
- Company Petition (Company Act / IBC)
- Company Appeal (Company Act / IBC)
- Interlocutory Application (Company Act / IBC)
- Review Application, Restoration Application
- Transfer Petition, Cross Application
- Contempt Petition, Miscellaneous Application
- CA(A) Merger & Amalgamation, CP(AA) Merger & Amalgamation
- Insolvency & Bankruptcy (Pre-Packaged)
- And more...

## Notes

- The tool uses the NCLT e-filing portal (efiling.nclt.gov.in)
- All downloads happen server-side; no data is stored permanently
- Merged PDFs are saved temporarily and cleaned up on restart
- The tool requires an active internet connection to access NCLT servers
- If you encounter captcha on any page, the tool will display it for manual entry

## Troubleshooting

**"Failed to connect to NCLT server"**
- Check your internet connection
- NCLT servers may be down for maintenance; try again later

**"No cases found"**
- Verify the case number, bench, type, and year
- Ensure the case exists on the NCLT e-filing portal

**"No orders found"**
- Some cases may not have uploaded orders yet
- Try checking the case status on the NCLT website directly

## Files

- `app.py` - Flask backend with NCLT API integration
- `templates/index.html` - Web interface
- `start.py` - Easy startup script
- `requirements.txt` - Python dependencies

## License

This tool is for educational and professional use. Respect NCLT's terms of service.
