import React from "react"
import "../styles/ThermalReceipt.css"

const ThermalReceipt = React.forwardRef(({ sale, customer, items }, ref) => {
  const companyName = "POS SYSTEM"
  const address = "123 Business Street, City, Country"
  const phone = "1-800-POS-9999"

  return (
    <div ref={ref} className="w-80 p-4 bg-white text-gray-900 font-mono text-sm">
      {/* Header */}
      <div className="text-center border-b border-gray-300 pb-2 mb-2">
        <h1 className="text-lg font-bold">{companyName}</h1>
        <p className="text-xs">{address}</p>
        <p className="text-xs">Tel: {phone}</p>
      </div>

      {/* Transaction Details */}
      <div className="border-b border-gray-300 pb-2 mb-2">
        <div className="flex justify-between text-xs">
          <span>Receipt No:</span>
          <span>{sale.invoiceNo}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Date:</span>
          <span>{new Date(sale.saleDate).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Time:</span>
          <span>{new Date(sale.saleDate).toLocaleTimeString()}</span>
        </div>
        {customer && (
          <div className="flex justify-between text-xs">
            <span>Customer:</span>
            <span>{customer.name}</span>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="border-b border-gray-300 pb-2 mb-2">
        <div className="flex justify-between text-xs font-bold mb-1">
          <span>Item</span>
          <span>Qty</span>
          <span>Price</span>
          <span>Total</span>
        </div>
        {items.map((item, index) => (
          <div key={index} className="flex justify-between text-xs">
            <span className="flex-1">{item.itemName}</span>
            <span className="w-8">{item.quantity}</span>
            <span className="w-12 text-right">₹{item.sellingPrice.toFixed(2)}</span>
            <span className="w-12 text-right">₹{item.total.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-b border-gray-300 pb-2 mb-2">
        <div className="flex justify-between text-xs">
          <span>Subtotal:</span>
          <span>₹{sale.subtotal.toFixed(2)}</span>
        </div>
        {sale.tax > 0 && (
          <div className="flex justify-between text-xs">
            <span>Tax:</span>
            <span>₹{sale.tax.toFixed(2)}</span>
          </div>
        )}
        {sale.discount > 0 && (
          <div className="flex justify-between text-xs discount">
            <span>Discount:</span>
            <span>-₹{sale.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-bold mt-2">
          <span>TOTAL:</span>
          <span>₹{sale.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Method */}
      <div className="border-b border-gray-300 pb-2 mb-2">
        <div className="flex justify-between text-xs">
          <span>Payment:</span>
          <span>{sale.paymentMethod.toUpperCase()}</span>
        </div>
      </div>

      {/* Notes */}
      {sale.notes && (
        <div className="border-b border-gray-300 pb-2 mb-2">
          <p className="text-xs">{sale.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center">
        <p className="text-xs mt-2">Thank you for your purchase!</p>
        <p className="text-xs">Please visit again</p>
      </div>
    </div>
  )
})

ThermalReceipt.displayName = "ThermalReceipt"
export default ThermalReceipt
