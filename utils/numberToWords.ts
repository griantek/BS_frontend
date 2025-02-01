const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

function convertToWords(num: number): string {
  if (num === 0) return 'Zero';
  
  function recur(n: number): string {
    if (n === 0) return '';
    
    if (n < 10) return ones[n];
    
    if (n < 20) return teens[n - 10];
    
    if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    }
    
    if (n < 1000) {
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + recur(n % 100) : '');
    }
    
    if (n < 100000) {
      return recur(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + recur(n % 1000) : '');
    }
    
    if (n < 10000000) {
      return recur(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + recur(n % 100000) : '');
    }
    
    return recur(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + recur(n % 10000000) : '');
  }

  return recur(num);
}

export function convertAmountToWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  
  let result = convertToWords(rupees) + ' Rupees';
  if (paise > 0) {
    result += ' and ' + convertToWords(paise) + ' Paise';
  }
  
  return result;
}
