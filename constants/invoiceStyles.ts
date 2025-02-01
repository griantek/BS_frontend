export const invoiceStyles = {
  body: {
    fontFamily: "'Roboto', 'Segoe UI', sans-serif",
    margin: 0,
    padding: 0,
    backgroundColor: '#f8f9fa',
    color: '#2c3e50',
    lineHeight: 1.6
  },
  invoiceContainer: {
    maxWidth: '700px', // Further reduced from 800px
    margin: '15px auto', // Further reduced
    padding: '20px', // Further reduced
    backgroundColor: '#fff',
    boxShadow: '0 1px 10px rgba(0, 0, 0, 0.05)',
    borderRadius: '6px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  invoiceTitle: {
    color: '#1a73e8',
    margin: 0,
    fontSize: '20px', // Further reduced from 24px
    fontWeight: 500,
    letterSpacing: '0.3px'
  },
  invoiceInfo: {
    textAlign: 'right' as const,
    fontSize: '11px', // Further reduced from 13px
    color: '#2c3e50', // Darker color (was #546e7a)
    lineHeight: '1.4'
  },
  detailsSection: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
    gap: '20px'
  },
  companyDetails: {
    backgroundColor: '#f8fafb',
    padding: '15px', // Reduced from 30px
    width: '45%',
    borderRadius: '6px',
    border: '1px solid #e0e4e7',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    fontSize: '11px' // Base font size for company details
  },
  detailsHeading: {
    color: '#1a73e8',
    fontSize: '14px', // Further reduced from 16px
    marginBottom: '10px',
    fontWeight: 500,
    borderBottom: '2px solid #e0e4e7',
    paddingBottom: '6px'
  },
  detailsParagraph: {
    margin: '6px 0', // Reduced from 12px
    lineHeight: '1.4', // Reduced from 1.8
    fontSize: '11px', // Reduced from 15px
    color: '#2c3e50' // Added explicit dark color
  },
  addressLine: {
    display: 'block',
    marginTop: '6px', // Reduced from 15px
    color: '#2c3e50', // Darker color (was #546e7a)
    fontSize: '11px' // Added font size
  },
  supplyDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '40px'
  },
  supplyBox: {
    backgroundColor: '#e6ffe6',
    padding: '10px', // Reduced from 20px
    width: '48%',
    borderRadius: '4px', // Reduced from 8px
    fontSize: '11px', // Reduced from 14px
    color: '#2c3e50', // Darker text color
    fontWeight: 500, // Make text bolder
    textAlign: 'left' as const
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: '20px', // Reduced from 40px
    borderRadius: '6px',
    overflow: 'hidden',
    border: '1px solid #e0e4e7',
    fontSize: '11px' // Added base font size
  },
  tableHeader: {
    backgroundColor: '#1a73e8',
    color: 'white',
    fontWeight: 500,
    padding: '8px', // Reduced from 15px
    fontSize: '11px', // Reduced from 15px
    textAlign: 'left' as const
  },
  tableCell: {
    padding: '8px', // Reduced from 15px
    borderBottom: '1px solid #e0e4e7',
    color: '#2c3e50', // Darker color (was #546e7a)
    fontSize: '11px' // Reduced from 14px
  },
  twoColumnLayout: {
    display: 'grid',
    gridTemplateColumns: '60% 40%',
    gap: '20px', // Reduced from 40px
    marginTop: '20px' // Reduced from 40px
  },
  boxContent: {
    backgroundColor: '#f8fafb',
    padding: '12px', // Reduced from 25px
    borderRadius: '6px',
    border: '1px solid #e0e4e7',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    marginBottom: '12px', // Reduced from 20px
    fontSize: '11px' // Added base font size
  },
  boxHeading: {
    color: '#1a73e8',
    fontSize: '12px', // Reduced from 18px
    marginBottom: '8px', // Reduced from 15px
    fontWeight: 500
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0', // Reduced from 12px
    borderBottom: '1px solid #ccc',
    color: '#2c3e50', // Darker color (was #546e7a)
    fontSize: '11px' // Reduced from 15px
  },
  totalRow: {
    fontWeight: 500,
    fontSize: '14px', // Reduced from 20px
    color: '#1a73e8',
    borderTop: '2px solid #1a73e8',
    marginTop: '10px', // Reduced from 15px
    paddingTop: '10px' // Reduced from 20px
  },
  amountWords: {
    fontStyle: 'italic',
    fontSize: '10px', // Reduced from 14px
    color: '#2c3e50', // Darker color (was #78909c)
    marginTop: '12px', // Reduced from 20px
    paddingTop: '12px', // Reduced from 20px
    borderTop: '1px dashed #e0e4e7'
  },
  text: {
    normal: '#2c3e50',
    muted: '#34495e',
    heading: '#1a73e8'
  }
};
