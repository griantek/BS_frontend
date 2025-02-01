import React from 'react';
import { format } from 'date-fns';
import { SERVICES, BANKS } from '@/constants/quotation';
import { invoiceStyles } from '@/constants/invoiceStyles';
import type { QuotationFormData } from '@/types/quotation';
import Image from 'next/image';
import type { BankAccount } from '@/services/api';
import api from '@/services/api';

interface PDFTemplateProps {
  id: string;
  prospectData: any;
  quotationData: QuotationFormData;
}

const PDFTemplate: React.FC<PDFTemplateProps> = ({ id, prospectData, quotationData }) => {
  const [bankDetails, setBankDetails] = React.useState<BankAccount | null>(null);

  React.useEffect(() => {
    const fetchBankDetails = async () => {
      if (quotationData.selectedBank) {
        try {
          const response = await api.getBankAccountById(quotationData.selectedBank);
          setBankDetails(response.data);
        } catch (error) {
          console.error('Error fetching bank details:', error);
        }
      }
    };

    fetchBankDetails();
  }, [quotationData.selectedBank]);

  // Add default values for amounts
  const {
    initialAmount = 0,
    acceptanceAmount = 0,
    totalAmount = 0,
    discountAmount = 0,
    selectedServicesData = []
  } = quotationData;

  const selectedServices = selectedServicesData || [];
  const selectedBank = BANKS.find(b => b.id === quotationData.selectedBank);
  const invoiceNumber = `INV${prospectData.reg_id}`;
  const currentDate = format(new Date(), 'MMM dd, yyyy').toUpperCase();
  const dueDate = format(new Date(new Date().setDate(new Date().getDate() + 15)), 'MMM dd, yyyy').toUpperCase();

  const supplyStyle = {
    backgroundColor: '#e6ffe6',
    padding: '20px',
    width: '48%',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#2c3e50', // Darker text color
    fontWeight: 500 // Make text bolder
  };

  return (
    <div id={id} style={invoiceStyles.invoiceContainer}>
      <header style={invoiceStyles.header}>
        <Image src="/logo.png" alt="Logo" width={100} height={100} className="logo" />
        <h1 style={invoiceStyles.invoiceTitle}>INVOICE</h1>
        <div style={invoiceStyles.invoiceInfo}>
          <p><strong>Invoice No:</strong> {invoiceNumber}</p>
          <p><strong>Invoice Date:</strong> {currentDate}</p>
          <p><strong>Due Date:</strong> {dueDate}</p>
        </div>
      </header>

      <section style={invoiceStyles.detailsSection}>
        <div style={invoiceStyles.companyDetails}>
          <h3 style={invoiceStyles.detailsHeading}>Billed by</h3>
          <p style={invoiceStyles.detailsParagraph}><strong>Company:</strong> Graintek Solutions</p>
          <span style={invoiceStyles.addressLine}>46, Raghuvirngham Society,</span>
          <span style={invoiceStyles.addressLine}>Bengaluru, Karnataka,</span>
          <span style={invoiceStyles.addressLine}>India - 560054</span>
        </div>
        <div style={invoiceStyles.companyDetails}>
          <h3 style={invoiceStyles.detailsHeading}>Billed to</h3>
          <p style={invoiceStyles.detailsParagraph}><strong>Name:</strong> {prospectData.client_name}</p>
          <p style={invoiceStyles.detailsParagraph}><strong>Email:</strong> {prospectData.email}</p>
          <p style={invoiceStyles.detailsParagraph}><strong>Department:</strong> {prospectData.department}</p>
          <span style={invoiceStyles.addressLine}>{prospectData.state}, India</span>
        </div>
      </section>

      <section style={invoiceStyles.supplyDetails}>
        <div style={supplyStyle}>
          <p style={{ margin: 0 }}><strong>Place of Supply:</strong> {prospectData.state || 'N/A'}</p>
        </div>
        <div style={supplyStyle}>
          <p style={{ margin: 0 }}><strong>Country of Supply:</strong> India</p>
        </div>
      </section>

      <section className="items-table">
        <table style={invoiceStyles.table}>
          <thead>
            <tr>
              <th style={invoiceStyles.tableHeader}>Item Description</th>
              <th style={invoiceStyles.tableHeader}>Period</th>
              <th style={invoiceStyles.tableHeader}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {selectedServices.map((service) => (
              <tr key={service.id}>
                <td style={invoiceStyles.tableCell}>{service.name}</td>
                <td style={invoiceStyles.tableCell}>
                  {quotationData.acceptancePeriod} {quotationData.acceptancePeriodUnit}
                </td>
                <td style={invoiceStyles.tableCell}>
                  ₹ {(quotationData.totalAmount / selectedServices.length).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div style={invoiceStyles.twoColumnLayout}>
        <div className="left-column">
          <div style={invoiceStyles.boxContent}>
            <h3 style={invoiceStyles.boxHeading}>Bank & Payment Details</h3>
            {bankDetails && (
              <>
                <p style={invoiceStyles.detailsParagraph}>Bank: {bankDetails.bank}</p>
                <p style={invoiceStyles.detailsParagraph}>Account Name: {bankDetails.account_name}</p>
                <p style={invoiceStyles.detailsParagraph}>Account Holder: {bankDetails.account_holder_name}</p>
                <p style={invoiceStyles.detailsParagraph}>Account Number: {bankDetails.account_number}</p>
                <p style={invoiceStyles.detailsParagraph}>IFSC Code: {bankDetails.ifsc_code}</p>
                {bankDetails.upi_id && (
                  <p style={invoiceStyles.detailsParagraph}>UPI: {bankDetails.upi_id}</p>
                )}
              </>
            )}
          </div>
          <div style={invoiceStyles.boxContent}>
            <h3 style={invoiceStyles.boxHeading}>Terms and Conditions</h3>
            <ol style={{ paddingLeft: '20px', color: invoiceStyles.text.normal }}>
              <li>Please pay within 15 days from the date of invoice, overdue interest @ 14% will be charged on delayed payments.</li>
              <li>Please quote invoice number when remitting funds.</li>
            </ol>
          </div>
          <div style={invoiceStyles.boxContent}>
            <h3 style={invoiceStyles.boxHeading}>Additional Notes</h3>
            <p style={{ color: invoiceStyles.text.normal }}>Timeline starts after receiving initial payment. Please ensure timely payments for uninterrupted service.</p>
          </div>
        </div>
        
        <div className="right-column">
          <div style={invoiceStyles.boxContent}>
            <div style={invoiceStyles.summaryRow}>
              <span>Initial Amount</span>
              <span>₹ {initialAmount.toLocaleString()}</span>
            </div>
            {/* <div style={invoiceStyles.summaryRow}>
              <span>Writing Amount</span>
              <span>₹ {writingAmount.toLocaleString()}</span>
            </div> */}
            <div style={invoiceStyles.summaryRow}>
              <span>Acceptance Amount</span>
              <span>₹ {acceptanceAmount.toLocaleString()}</span>
            </div>
            <div style={{ ...invoiceStyles.summaryRow, ...invoiceStyles.totalRow }}>
              <span>Total Amount</span>
              <span>₹ {totalAmount.toLocaleString()}</span>
            </div>
            <div style={{ ...invoiceStyles.summaryRow, ...invoiceStyles.amountWords }}>
              <span>Amount in words:</span>
              <span>{/* Add number to words conversion here */}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFTemplate;
