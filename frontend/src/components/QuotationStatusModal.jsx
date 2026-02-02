import React, { useState, useEffect } from "react";

export const QuotationStatusModal = ({ isOpen, onClose, currentData, onUpdate }) => {
  const [status, setStatus] = useState("pending");
  const [comment, setComment] = useState("");

  // Sync internal state when a new quote is selected
  useEffect(() => {
    if (currentData) {
      setStatus(currentData.status || "pending");
      setComment(currentData.statusComment || "");
    }
  }, [currentData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-1">Update Status</h3>
          <p className="text-sm text-gray-500 mb-6 font-medium">Quote: {currentData?.quoteNo}</p>

          <div className="space-y-5">
            <div>
              <label className="text-xs font-black uppercase text-gray-400 tracking-widest mb-2 block">
                Select Status
              </label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border-2 p-3 rounded-xl bg-gray-50 outline-none focus:border-green-500 transition-all font-bold text-gray-700"
              >
                <option value="pending">Pending</option>
                <option value="inprocess">In Process</option>
                <option value="completed">Completed</option>
                <option value="cancel">Cancel</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-black uppercase text-gray-400 tracking-widest mb-2 block">
                Comments / Reason
              </label>
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Why is this status changing?"
                className="w-full border-2 p-3 rounded-xl h-28 outline-none focus:border-green-500 transition-all text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition"
          >
            Go Back
          </button>
          <button 
            onClick={() => onUpdate(currentData._id, { status, statusComment: comment })}
            className="flex-1 py-3 text-sm font-bold bg-green-600 text-white hover:bg-green-700 rounded-xl shadow-lg shadow-green-200 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};