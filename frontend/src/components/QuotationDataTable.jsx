import React from "react";
import {FileText, Trash2} from "lucide-react";
import { generateQuotationPDF } from "@/services/quotationPDF";
import { useApp } from "@/context/useApp";

export const QuotationDataTable = ({ data, onStatusClick, onDeleteClick }) => {
    const { company} = useApp();
console.log(company)
  const getStatusColor = (status) => {
    const colors = {
      completed: "bg-green-100 text-green-700 border-green-200",
      inprocess: "bg-blue-100 text-blue-700 border-blue-200",
      cancel: "bg-red-100 text-red-700 border-red-200",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
    return colors[status?.toLowerCase()] || "bg-gray-100 text-gray-600";
  };

  return (
    <div className="w-full overflow-x-auto bg-white rounded-xl shadow border overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-500 border-b">
          <tr className="text-[11px] font-black uppercase text-gray-200 tracking-wider">
            <th className="p-4">Quote No</th>
            <th className="p-4">Date</th>
            <th className="p-4">Customer</th>
            <th className="p-4">Total Amount</th>
            <th className="p-4 text-center">Status</th>
            <th className="p-4 text-right">Actions</th>  
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data && data.length > 0 ? (
            data.map((item, index) => (
              <tr key={item._id || index} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-mono font-bold text-blue-600">{item.quoteNo}</td>
                <td className="p-4 text-sm text-gray-600">
                  {new Date(item.date).toLocaleDateString("en-IN")}
                </td>
                <td className="p-4 text-sm font-medium text-gray-800">{item.customerName || "N/A"}</td>
                <td className="p-4 text-sm font-bold text-gray-900">
                  ₹ {item.totalAmount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => onStatusClick(item)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border transition-transform hover:scale-105 ${getStatusColor(item.status)}`}
                  >
                    {item.status || "pending"}
                  </button>
                </td>
                <td className="p-4 text-right flex justify-end gap-2">

                    <button 
    onClick={() => generateQuotationPDF({item, company})}
    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
    title="Download PDF"
  >
    <FileText size={18} />
  </button>
                <button 
                  onClick={() => onDeleteClick(item._id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="p-10 text-center text-gray-400 italic">
                No quotations found for this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};