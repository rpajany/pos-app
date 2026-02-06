"use client";
import React, { useState, useEffect } from "react";
import { api, safeCall } from "@/services/ApiService";
import { X, CheckCircle, History, Edit2, Trash2 } from "lucide-react";

export const PurchasePaymentModal = ({
  isOpen,
  onClose,
  purchase,
  onSuccess,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState({
    payments: [],
    balanceAmount: 0,
    totalPaidAmount: 0,
    totalPurchaseAmount: 0,
  });

  const [paymentData, setPaymentData] = useState({
    amount_paid: "",
    pay_type: "Cash",
    note: "",
  });

  const resetForm = () => {
    setPaymentData({ amount_paid: "", pay_type: "Cash", note: "" });
    setEditingId(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const fetchHistory = async () => {
    const res = await safeCall(api.get(`/purchasePayment/${purchase._id}`));
    if (res.success) {
      setPaymentHistory(res.data.data || { payments: [] });
    }
  };

  useEffect(() => {
    if (isOpen && purchase?._id) {
      fetchHistory();
    }
  }, [isOpen, purchase?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const url = editingId
      ? `/purchasePayment/update/${purchase._id}/${editingId}`
      : `/purchasePayment/add/${purchase._id}`;

    const res = await safeCall(api.put(url, paymentData));

    if (res.success) {
      if (onSuccess) onSuccess();
      if (editingId) {
        await fetchHistory();
        resetForm();
      } else {
        handleClose();
      }
    }
    setLoading(false);
  };

  if (!isOpen || !purchase) return null;

  const handleDelete = async (paymentId) => {
    if (!window.confirm("Delete this payment record?")) return;
    const res = await safeCall(
      api.delete(`/purchasePayment/${purchase._id}/${paymentId}`)
    );
    if (res.success) {
      fetchHistory();
      if (onSuccess) onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Supplier Payment</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-red-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[85vh] overflow-y-auto">
          {/* Summary Card */}
          <div className="bg-blue-900 text-white p-4 rounded-xl mb-6 shadow-lg flex justify-between items-center">
            <div>
      
              <p className="text-xs opacity-70 font-bold">PAID TO SUPPLIER</p>
              <p className="text-xl font-bold text-green-400">
                ₹ {Number(paymentHistory?.totalPaidAmount || 0).toFixed(2)}
              </p>

                      <p className="text-xs opacity-70 font-bold mt-2">OUTSTANDING</p>
              <p className="text-2xl font-mono font-bold text-orange-400">
                ₹ {Number(paymentHistory?.balanceAmount || 0).toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-70 font-bold">PURCHASE_No</p>
              <p className="font-semibold mb-2">{purchase.purchaseNo}</p>
              <p className="text-xs opacity-70 font-bold">TOTAL BILL</p>
              <p className="text-xl font-mono font-bold">
                ₹ {Number(paymentHistory?.totalPurchaseAmount || 0).toFixed(2)}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 mb-8 bg-gray-50 p-4 rounded-lg border"
          >
            <h3 className="text-sm font-bold flex items-center gap-2">
              <CheckCircle size={16} className="text-blue-600" />
              {editingId ? "Edit Payment" : "Record Payment Out"}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Amount"
                required
                className="w-full px-3 py-2 border rounded-md"
                value={paymentData.amount_paid}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    amount_paid: e.target.value,
                  })
                }
              />
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={paymentData.pay_type}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, pay_type: e.target.value })
                }
              >
                <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Check">Check</option>
                    <option value="Credit">Credit</option>
                    <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
            <button
              disabled={loading || !paymentData.amount_paid}
              className="w-full bg-blue-600 text-white font-bold py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading
                ? "Processing..."
                : editingId
                ? "Update Payment"
                : "Submit Payment"}
            </button>
          </form>

          {/* History */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-2">
              <History size={16} /> Payment History
            </h3>
            {paymentHistory?.payments
              ?.slice()
              .reverse()
              .map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <div>
                    <p className="font-bold">₹ {item.amount_paid}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(item.payment_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {item.pay_type}
                    </span>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
