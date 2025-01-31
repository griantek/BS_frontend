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
    maxWidth: '1000px',
    margin: '40px auto',
    padding: '50px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 15px rgba(0, 0, 0, 0.08)',
    borderRadius: '12px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '50px'
  },
  invoiceTitle: {
    color: '#1a73e8',
    margin: 0,
    fontSize: '32px',
    fontWeight: 500,
    letterSpacing: '0.5px'
  },
  invoiceInfo: {
    textAlign: 'right' as const,
    fontSize: '15px',
    color: '#2c3e50' // Darker color (was #546e7a)
  },
  detailsSection: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '40px',
    gap: '60px'
  },
  companyDetails: {
    backgroundColor: '#f8fafb',
    padding: '30px',
    width: '45%',
    borderRadius: '10px',
    border: '1px solid #e0e4e7',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  },
  detailsHeading: {
    color: '#1a73e8',
    fontSize: '20px',
    marginBottom: '20px',
    fontWeight: 500,
    borderBottom: '2px solid #e0e4e7',
    paddingBottom: '10px'
  },
  detailsParagraph: {
    margin: '12px 0',
    lineHeight: 1.8,
    fontSize: '15px',
    color: '#2c3e50' // Added explicit dark color
  },
  addressLine: {
    display: 'block',
    marginTop: '15px',
    color: '#2c3e50' // Darker color (was #546e7a)
  },
  supplyDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '40px'
  },
  supplyBox: {
    backgroundColor: '#e6ffe6',
    padding: '20px',
    width: '48%',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#2c3e50', // Darker text color
    fontWeight: 500, // Make text bolder
    textAlign: 'left' as const
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: '40px',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid #e0e4e7'
  },
  tableHeader: {
    backgroundColor: '#1a73e8',
    color: 'white',
    fontWeight: 500,
    padding: '15px',
    fontSize: '15px',
    textAlign: 'left' as const
  },
  tableCell: {
    padding: '15px',
    borderBottom: '1px solid #e0e4e7',
    color: '#2c3e50', // Darker color (was #546e7a)
    fontSize: '14px'
  },
  twoColumnLayout: {
    display: 'grid',
    gridTemplateColumns: '60% 40%',
    gap: '40px',
    marginTop: '40px'
  },
  boxContent: {
    backgroundColor: '#f8fafb',
    padding: '25px',
    borderRadius: '10px',
    border: '1px solid #e0e4e7',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    marginBottom: '20px'
  },
  boxHeading: {
    color: '#1a73e8',
    fontSize: '18px',
    marginBottom: '15px',
    fontWeight: 500
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #ccc',
    color: '#2c3e50', // Darker color (was #546e7a)
    fontSize: '15px'
  },
  totalRow: {
    fontWeight: 500,
    fontSize: '20px',
    color: '#1a73e8',
    borderTop: '2px solid #1a73e8',
    marginTop: '15px',
    paddingTop: '20px'
  },
  amountWords: {
    fontStyle: 'italic',
    fontSize: '14px',
    color: '#2c3e50', // Darker color (was #78909c)
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px dashed #e0e4e7'
  },
  text: {
    normal: '#2c3e50',
    muted: '#34495e',
    heading: '#1a73e8'
  }
};
