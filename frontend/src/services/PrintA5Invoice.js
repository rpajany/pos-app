import { format } from "date-fns";

export const PrintA5Invoice = (data) => {
  console.log("data :",data)
  const language = import.meta.env.VITE_RECEIPT_LANGUAGE || "english";

  const salesDate = data.saleDate
    ? format(new Date(data.saleDate), "dd-MM-yyyy, hh:mm a")
    : "N/A";

  const printWindow = window.open("", "_blank");

  const htmlContent = `
    <html>
      <head>
        <title>Invoice - ${data.invoiceNo}</title>
        <style>
          /* A5 Paper Settings */
          @page { 
            size: A5 landscape; 
            margin: 5mm; 
          }
          
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 10px; 
            font-size: 12px; 
            color: #000;
          }

          .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
          .header h1 { margin: 0; font-size: 18px; text-transform: uppercase; }
          
          .info-section { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .info-box { width: 48%; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          th { background: #f0f0f0; border: 1px solid #000; padding: 4px; font-size: 11px; }
          td { border: 1px solid #000; padding: 4px; vertical-align: top; }
          
          .totals-section { display: flex; justify-content: flex-end; }
          .totals-table { width: 40%; }
          .totals-table td { border: none; padding: 2px; }
          
          .footer { margin-top: 15px; display: flex; justify-content: space-between; align-items: flex-end; }
          
          /* Utility for Tamil support */
          .tamil { font-family: 'Latha', sans-serif; font-size: 10px; }
          
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Tax Invoice</h1>
          <div style="font-weight: bold; font-size: 16px;">POS Shop</div>
          <div>V.O.C Street, Puducherry</div>
          <div><strong>GSTIN:</strong> 34AAAAA0000A1Z5 | <strong>State Code:</strong> 34</div>
        </div>

        <div class="info-section">
          <div class="info-box">
            <strong>Bill To:</strong><br>
            <span style="font-size: 13px;">${
              data.customerName || "Walk-in Customer"
            }</span><br>
            ${data.customerInfo?.address || ""}<br>
            ${
              data.customerInfo?.gstNumber
                ? `GST: ${data.customerInfo.gstNumber}`
                : ""
            }
          </div>
          <div class="info-box" style="text-align: right;">
            <strong>Invoice No:</strong> ${data.invoiceNo}<br>
            <strong>Date:</strong> ${salesDate}<br>
            <strong>Payment:</strong> ${data.paymentMethod.toUpperCase()}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th width="5%">#</th>
              <th width="45%">Description / HSN</th>
              <th width="10%">Qty</th>
              <th width="15%">Rate</th>
              <th width="10%">GST%</th>
              <th width="15%">Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.items
              .map(
                (item, index) => `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                    <td>
                  <strong>${language == "tamil" ? item.nameTamil : item.itemName}</strong><br>
                  <small>HSN: ${item.hsnCode || "N/A"}</small>
                </td>

             <!-- <td>
                  <strong>${item.itemName}</strong><br>
                  <small>HSN: ${item.hsnCode || "N/A"}</small>
                </td> -->
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">${item.sellingPrice.toFixed(
                  2
                )}</td>
                <td style="text-align: center;">${item.gstPercentage}%</td>
                <td style="text-align: right;">${item.total.toFixed(2)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="totals-section">
          <table class="totals-table">
            <tr>
              <td>Taxable Value:</td>
              <td style="text-align: right;">₹${(
                data.totalTaxableValue || data.subtotal
              ).toFixed(2)}</td>
            </tr>
     
                 <tr>
              <td>IGST:</td>
              <td style="text-align: right;">₹${data.totalIGST.toFixed(2)}</td>
            </tr>
                      <tr>
              <td>CGST:</td>
              <td style="text-align: right;">₹${data.totalCGST.toFixed(2)}</td>
            </tr>
                          <tr>
              <td>SGST:</td>
              <td style="text-align: right;">₹${data.totalSGST.toFixed(2)}</td>
            </tr>

                   <tr>
              <td>Total GST:</td>
              <td style="text-align: right;">₹${data.totalTax.toFixed(2)}</td>
            </tr>
            <tr style="font-weight: bold; border-top: 1px solid #000;">
              <td style="font-size: 14px;">Grand Total:</td>
              <td style="font-size: 14px; text-align: right;">₹${Math.round(
                data.totalAmount
              ).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <div style="font-size: 10px;">
            <p><strong>Declaration:</strong> Goods once sold will not be taken back.<br>
            This is a computer generated invoice.</p>
          </div>
          <div style="text-align: center;">
            <br><br>
            <div style="border-top: 1px solid #000; width: 150px; padding-top: 5px;">Authorized Signatory</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  setTimeout(() => {
    // printWindow.focus();
    // printWindow.print();
    printWindow.close();
  }, 250); // 250ms is usually enough for a dataURL image to render
};
