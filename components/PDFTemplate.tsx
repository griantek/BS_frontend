import React from 'react';
import { format } from 'date-fns';
import { BANKS } from '@/constants/quotation';
import { invoiceStyles } from '@/constants/invoiceStyles';
import type { QuotationFormData } from '@/types/quotation';
import Image from 'next/image';
import type { BankAccount } from '@/services/api';
import api from '@/services/api';
import { convertAmountToWords } from '@/utils/numberToWords';

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
    discountPercentage = 0, // Add this to destructure discountPercentage
    acceptancePeriod = 0,
    acceptancePeriodUnit = 'days',
    publicationPeriod = 0,
    publicationPeriodUnit = 'days',
    selectedServicesData = []
  } = quotationData;

  const selectedServices = selectedServicesData || [];
  const selectedBank = BANKS.find(b => b.id === quotationData.selectedBank);
  const invoiceNumber = `INV${prospectData.reg_id}`;
  const currentDate = format(new Date(), 'MMM dd, yyyy').toUpperCase();
  const dueDate = format(new Date(new Date().setDate(new Date().getDate() + 15)), 'MMM dd, yyyy').toUpperCase();

  // Add helper functions for period calculations
  const convertToDays = (duration: string): number => {
    const [amount, unit] = duration.split(' ');
    const value = parseInt(amount);
    
    if (isNaN(value)) return 0;
    
    switch(unit.toLowerCase()) {
      case 'weeks':
        return value * 7;
      case 'days':
        return value;
      default:
        return value;
    }
  };

  const formatDuration = (days: number): string => {
    if (days % 7 === 0 && days >= 7) {
      return `${days / 7} weeks`;
    }
    return `${days} days`;
  };

  // Update service period display to show both original and normalized duration
  const getServicePeriod = (service: any) => {
    if (!service.min_duration || !service.max_duration) return 'N/A';

    const minDuration = service.min_duration;
    const maxDuration = service.max_duration;
    const minDays = convertToDays(minDuration);
    const maxDays = convertToDays(maxDuration);

    const formattedMin = formatDuration(minDays);
    const formattedMax = formatDuration(maxDays);

    return `${minDuration} (${formattedMin}) (Max: ${maxDuration})`;
  };

  // Update total period calculation to normalize and sum durations
  const getTotalPeriod = () => {
    if (!selectedServices.length) return '0 days';
    
    const totalDays = selectedServices.reduce((total, service) => {
      if (!service.min_duration) return total;
      return Math.max(total, convertToDays(service.min_duration));
    }, 0);

    return formatDuration(totalDays);
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

      {/* Removed supply details section */}

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
                <td style={invoiceStyles.tableCell}>{service.service_name}</td>
                <td style={invoiceStyles.tableCell}>
                  {getServicePeriod(service)}
                </td>
                <td style={invoiceStyles.tableCell}>
                  ₹ {service.fee.toLocaleString()}
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
          {/* <div style={invoiceStyles.boxContent}>
            <h3 style={invoiceStyles.boxHeading}>Additional Notes</h3>
            <p style={{ color: invoiceStyles.text.normal }}>Timeline starts after receiving initial payment. Please ensure timely payments for uninterrupted service.</p>
          </div> */}
        </div>
        
        <div className="right-column">
          <div style={invoiceStyles.boxContent}>
            {/* Period Details Box */}
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <h4 style={{ 
                margin: '0 0 8px 0',
                fontSize: '14px',
                color: '#495057',
                fontWeight: 600
              }}>
                Project Timeline
              </h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#6c757d', fontSize: '13px' }}>Acceptance Period:</span>
                <span style={{ fontWeight: 500, fontSize: '13px' }}>
                  {acceptancePeriod} {acceptancePeriodUnit}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6c757d', fontSize: '13px' }}>Publication Period:</span>
                <span style={{ fontWeight: 500, fontSize: '13px' }}>
                  {publicationPeriod} {publicationPeriodUnit}
                </span>
              </div>
            </div>

            {/* Existing Amount Details */}
            <div style={invoiceStyles.summaryRow}>
              <span>Initial Amount</span>
              <span>₹ {initialAmount.toLocaleString()}</span>
            </div>
            <div style={invoiceStyles.summaryRow}>
              <span>Acceptance Amount</span>
              <span>₹ {acceptanceAmount.toLocaleString()}</span>
            </div>
            {discountPercentage > 0 && (
              <div style={invoiceStyles.summaryRow}>
                <span>Discount ({discountPercentage}%)</span>
                <span>- ₹ {discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div style={{ ...invoiceStyles.summaryRow, ...invoiceStyles.totalRow }}>
              <span>Total Amount</span>
              <span>₹ {totalAmount.toLocaleString()}</span>
            </div>
            <div style={{ ...invoiceStyles.summaryRow, ...invoiceStyles.amountWords }}>
              <span>Amount in words:</span>
              <span>{convertAmountToWords(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFTemplate;
