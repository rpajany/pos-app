"use client";
import React, { useState, useEffect } from "react";
import { api, safeCall } from "@/services/ApiService";
import { X, CheckCircle, Clock, History, Edit2, Trash2 } from "lucide-react";

export const SalesPaymentModal = ({ isOpen, onClose, sale, onSuccess }) => {
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState({
    payments: [],
    balanceAmount: 0,
    totalPaidAmount: 0,
    totalInvoiceAmount: 0
  });

  const [paymentData, setPaymentData] = useState({
    amount_paid: "",
    pay_type: "Cash",
    note: "",
  });

  // 1. Reset Logic
  const reset_paymentDate = () => {
    setPaymentData({ amount_paid: "", pay_type: "Cash", note: "" });
    setEditingId(null);
  };

  // 2. Wrap the onClose prop
  const handleClose = () => {
    reset_paymentDate();
    onClose();
  };

  const fetchPaymentHistory = async () => {
    const res = await safeCall(api.get(`/salesPayment/${sale._id}`));
    if (res.success) {
      setPaymentHistory(res.data.data || { payments: [] });
    }
  };

  useEffect(() => {
    if (isOpen && sale?._id) {
      fetchPaymentHistory();
    }
  }, [isOpen, sale?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const url = editingId
      ? `/salesPayment/update/${sale._id}/${editingId}`
      : `/salesPayment/add/${sale._id}`;

    const res = await safeCall(api.put(url, paymentData));

    if (res.success) {
      if (onSuccess) onSuccess();
      
      if (editingId) {
        // If editing, refresh history and stay in modal
        await fetchPaymentHistory();
        reset_paymentDate();
      } else {
        // If new payment, close modal
        handleClose();
      }
    }
    setLoading(false);
  };

  if (!isOpen || !sale) return null;

  const handleEditClick = (item) => {
    setEditingId(item._id);
    setPaymentData({
      amount_paid: item.amount_paid,
      pay_type: item.pay_type,
      note: item.note || "",
    });
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm("Are you sure you want to delete this payment?")) return;
    const res = await safeCall(api.delete(`/salesPayment/${sale._id}/${paymentId}`));
    if (res.success) {
      fetchPaymentHistory();
      if (onSuccess) onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header - Using handleClose */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Payment Center</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-red-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[85vh] overflow-y-auto">
          {/* Summary Card */}
          <div className="bg-gray-900 text-white p-4 rounded-xl mb-6 shadow-lg flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Total Paid</p>
              <p className="text-xl font-bold text-green-600">
                ₹ {Number(paymentHistory?.totalPaidAmount || 0).toFixed(2)}
              </p>
              <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mt-2">Balance Due</p>
              <p className="text-2xl font-mono font-bold text-yellow-400">
                ₹ {Number(paymentHistory?.balanceAmount || 0).toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs uppercase font-bold">Invoice</p>
              <p className="font-semibold mb-2">{sale.invoiceNo}</p>
              <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Total Bill</p>
              <p className="text-xl font-mono font-bold text-blue-400">
                ₹ {Number(paymentHistory?.totalInvoiceAmount || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle size={16} className={editingId ? "text-blue-600" : "text-green-600"} />
                {editingId ? "Edit Installment" : "Add New Installment"}
              </span>
              {editingId && (
                <button type="button" onClick={reset_paymentDate} className="text-[10px] text-red-500 underline">
                  Cancel Edit
                </button>
              )}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Amount</label>
                <input
                  type="number"
                  required
                  className="w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                  value={paymentData.amount_paid}
                  onChange={(e) => setPaymentData({ ...paymentData, amount_paid: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Mode</label>
                <select
                  className="w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                  value={paymentData.pay_type}
                  onChange={(e) => setPaymentData({ ...paymentData, pay_type: e.target.value })}
                >
                   <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Check">Check</option>
                    <option value="Credit">Credit</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !paymentData.amount_paid || (Number(paymentHistory.balanceAmount) <= 0 && !editingId)}
              className="w-full text-white font-bold py-2 rounded-md transition bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Processing..." : editingId ? "Update Payment" : "Confirm Payment"}
            </button>
          </form>

          {/* History */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 border-b pb-2">
              <History size={16} className="text-blue-600" /> Payment History
            </h3>
            <div className="space-y-2">
              {paymentHistory?.payments?.length > 0 ? (
                paymentHistory.payments.slice().reverse().map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-bold text-gray-800">₹{item.amount_paid}</p>
                      <p className="text-[10px] text-gray-400">{new Date(item.payment_date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded text-gray-700 uppercase">{item.pay_type}</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditClick(item)} className="text-blue-600 hover:text-blue-800"><Edit2 size={14}/></button>
                        <button onClick={() => handleDelete(item._id)} className="text-red-600 hover:text-red-800"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm italic text-center py-4">No history available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};