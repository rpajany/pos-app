// import { format } from "date-fns";

// export const POSA4 = (data) => {
//   console.log("print data :", data);

//   const salesDate = data.saleDate
//     ? format(new Date(data.saleDate), "dd-MM-yyyy, hh:mm a")
//     : "N/A";
//   console.log("salesDate :", salesDate);

//   const htmlContent = `
//         <html>
//         <body style="font-family: Arial; padding: 10px;">
//           <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
//               <h2 style="margin: 0; padding: 0;">POS Shop</h2>
//               <p style="margin: 0; padding: 0;">V.O.C Street</p>
//               <p style="margin: 0; padding: 0;">GSTIN: 123</p>
//           </div>
       
//             <hr>
//             <div>
//                 <div style="display:flex; justify-content: space-between; align-items: center; width: 100%;">
//                     <p style="margin: 0;"><strong>Bill No.:</strong> ${
//                       data.invoiceNo
//                     }</p>
//                     <p style="margin: 0;">Customer : ${
//                       data.customerName
//                     }</p>            
//                 </div>
//                 <div style="display:flex; justify-content: space-between; align-items: center; width: 100%;">
//                     <p style="margin: 0;">Date : ${salesDate}</p>
//                     <p style="margin: 0;">Bill Type : ${data.paymentMethod}</p>
//                 </div>
//             </div>
         
//             <table style="width: 100%; border-collapse: collapse; margin-Top:10px">
//                 <thead>
//                     <tr style="background: #eee;">
//                         <th style="border: 1px solid #ddd; padding: 8px;">#</th>
//                         <th style="border: 1px solid #ddd; padding: 8px;width:40%">Item</th>
//                         <th style="border: 1px solid #ddd; padding: 8px;">Qty</th>
//                         <th style="border: 1px solid #ddd; padding: 8px;">Price</th>                      
//                         <th style="border: 1px solid #ddd; padding: 8px;">Discount %</th>
//                           <th style="border: 1px solid #ddd; padding: 8px;">Discount Amt</th>
//                         <th style="border: 1px solid #ddd; padding: 8px;">GST %</th>
//                         <th style="border: 1px solid #ddd; padding: 8px;">GST Amount</th>
//                         <th style="border: 1px solid #ddd; padding: 8px;">Total</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     ${data.items
//                       .map(
//                         (item, index) => `
//                         <tr>
//                             <td style="border: 1px solid #ddd; padding: 8px;">${
//                               index + 1
//                             }</td>
//                             <td style="border: 1px solid #ddd; padding: 8px;width:40%">${
//                               item.itemName
//                             }</td>
//                             <td style="border: 1px solid #ddd; padding: 8px;">${
//                               item.quantity
//                             }</td>
//                             <td style="border: 1px solid #ddd; padding: 8px;">${item.sellingPrice.toFixed(
//                               2
//                             )}</td>

//      <td style="border: 1px solid #ddd; padding: 8px;">${
//        item.discountPercentage
//      } %</td>

//              <td style="border: 1px solid #ddd; padding: 8px;">${item.discountAmount.toFixed(
//                               2
//                             )}</td>

//                             <td style="border: 1px solid #ddd; padding: 8px;">${
//                               item.gstPercentage
//                             }%</td>
//                             <td style="border: 1px solid #ddd; padding: 8px;">${item.gstAmount.toFixed(
//                               2
//                             )}</td>
//                             <td style="border: 1px solid #ddd; padding: 8px;">${item.total.toFixed(
//                               2
//                             )}</td>
//                         </tr>
//                     `
//                       )
//                       .join("")}
//                 </tbody>
//             </table>
//             <h5 style="text-align: right;">Tax : ₹ ${data.totalTax.toFixed(
//               2
//             )}</h5>
//             <h5 style="text-align: right;">Net Total : ₹ ${data.totalAmount.toFixed(
//               2
//             )}</h5>


//             <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>
//                 <div style="display: flex; justify-content: space-between;">
//                     <span>Cash Paid:</span>
//                     <span>₹${data.cashReceived.toFixed(2)}</span>
//                 </div>
//                 <div style="display: flex; justify-content: space-between;">
//                     <span>UPI Paid:</span>
//                     <span>₹${data.upiReceived.toFixed(2)}</span>
//                 </div>
//                 <div style="display: flex; justify-content: space-between; font-weight: bold;">
//                     <span>Total Paid:</span>
//                     <span>₹${data.totalReceived.toFixed(2)}</span>
//                 </div>
//                 <div style="display: flex; justify-content: space-between;">
//                     <span>Balance Return:</span>
//                     <span>₹${data.balanceChange.toFixed(2)}</span>
//                 </div>
//               </div>
              
//         </body>
//         </html>
//     `;
//   return htmlContent;
// };


import { format } from "date-fns";

export const POSA4 = (data) => {
  console.log("print data :", data);

  const salesDate = data.saleDate
    ? format(new Date(data.saleDate), "dd-MM-yyyy, hh:mm a")
    : "N/A";

  // Determine if we show IGST or CGST/SGST based on the data calculated in the frontend
  const showIGST = data.totalIGST > 0;

  const htmlContent = `
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <div style="text-align: center; border-bottom: 2px solid #444; padding-bottom: 10px; margin-bottom: 20px;">
          <h1 style="margin: 0; text-transform: uppercase;">Tax Invoice</h1>
          <h2 style="margin: 5px 0 0; color: #000;">POS Shop</h2>
          <p style="margin: 2px 0;">V.O.C Street, Puducherry</p>
          <p style="margin: 2px 0;"><strong>GSTIN:</strong> 34AAAAA0000A1Z5 | <strong>State:</strong> Puducherry (34)</p>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div style="width: 50%;">
              <p style="margin: 2px 0;"><strong>Bill To:</strong></p>
              <p style="margin: 2px 0; font-size: 1.1em;"><strong>${data.customerName || "Walk-in Customer"}</strong></p>
              ${data.customerInfo?.gstNumber ? `<p style="margin: 2px 0;">GSTIN: ${data.customerInfo.gstNumber}</p>` : ""}
              ${data.customerInfo?.address ? `<p style="margin: 2px 0;">${data.customerInfo.address}</p>` : ""}
          </div>
          <div style="width: 40%; text-align: right;">
              <p style="margin: 2px 0;"><strong>Invoice No:</strong> ${data.invoiceNo}</p>
              <p style="margin: 2px 0;"><strong>Date:</strong> ${salesDate}</p>
              <p style="margin: 2px 0;"><strong>Mode:</strong> ${data.paymentMethod.toUpperCase()}</p>
              <p style="margin: 2px 0;"><strong>Place of Supply:</strong> ${data.placeOfSupply || "34"}</p>
          </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
              <tr style="background: #f2f2f2; border-top: 2px solid #444; border-bottom: 2px solid #444;">
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">#</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Item / HSN</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Qty</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Rate</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Disc</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Taxable Val</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">GST%</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Total</th>
              </tr>
          </thead>
          <tbody>
              ${data.items.map((item, index) => `
                  <tr>
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
                      <td style="padding: 8px; border: 1px solid #ddd;">
                        <strong>${item.itemName}</strong><br/>
                        <small>HSN: ${item.hsnCode || "N/A"}</small>
                      </td>
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.sellingPrice.toFixed(2)}</td>
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.discountAmount.toFixed(2)}</td>
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${(item.taxableValue || (item.total - item.gstAmount)).toFixed(2)}</td>
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.gstPercentage}%</td>
                      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.total.toFixed(2)}</td>
                  </tr>
              `).join("")}
          </tbody>
      </table>

      <div style="display: flex; justify-content: space-between;">
          <div style="width: 55%;">
              <p style="margin-bottom: 5px;"><strong>Tax Summary:</strong></p>
              <table style="width: 100%; border-collapse: collapse; font-size: 0.9em; text-align: right;">
                  <tr style="background: #f9f9f9;">
                      <th style="border: 1px solid #ddd; padding: 5px;">Type</th>
                      <th style="border: 1px solid #ddd; padding: 5px;">CGST</th>
                      <th style="border: 1px solid #ddd; padding: 5px;">SGST</th>
                      <th style="border: 1px solid #ddd; padding: 5px;">IGST</th>
                      <th style="border: 1px solid #ddd; padding: 5px;">Total Tax</th>
                  </tr>
                  <tr>
                      <td style="border: 1px solid #ddd; padding: 5px; text-align: left;">GST Values</td>
                      <td style="border: 1px solid #ddd; padding: 5px;">₹${(data.totalCGST || 0).toFixed(2)}</td>
                      <td style="border: 1px solid #ddd; padding: 5px;">₹${(data.totalSGST || 0).toFixed(2)}</td>
                      <td style="border: 1px solid #ddd; padding: 5px;">₹${(data.totalIGST || 0).toFixed(2)}</td>
                      <td style="border: 1px solid #ddd; padding: 5px; font-weight: bold;">₹${data.totalTax.toFixed(2)}</td>
                  </tr>
              </table>
              <p style="margin-top: 15px; font-size: 0.85em;"><strong>Notes:</strong> ${data.notes || "Thank you for your business!"}</p>
          </div>

          <div style="width: 35%; text-align: right;">
              <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                      <td style="padding: 5px;">Taxable Value:</td>
                      <td style="padding: 5px;">₹${(data.totalTaxableValue || data.subtotal).toFixed(2)}</td>
                  </tr>
                  <tr>
                      <td style="padding: 5px;">Total Tax:</td>
                      <td style="padding: 5px;">₹${data.totalTax.toFixed(2)}</td>
                  </tr>
                  <tr style="font-size: 1.2em; font-weight: bold; background: #eee;">
                      <td style="padding: 10px; border-top: 2px solid #444;">Grand Total:</td>
                      <td style="padding: 10px; border-top: 2px solid #444;">₹${Math.round(data.totalAmount).toFixed(2)}</td>
                  </tr>
              </table>
          </div>
      </div>

      <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.9em;">
              <div>
                  <p>Cash: ₹${data.cashReceived.toFixed(2)} | UPI: ₹${data.upiReceived.toFixed(2)}</p>
                  <p><strong>Balance Return: ₹${data.balanceChange.toFixed(2)}</strong></p>
              </div>
              <div style="text-align: center; margin-top: 20px;">
                  <br/><br/>
                  <p style="border-top: 1px solid #000; display: inline-block; padding: 5px 20px;">Authorized Signatory</p>
              </div>
          </div>
      </div>
    </body>
    </html>
  `;
  return htmlContent;
};