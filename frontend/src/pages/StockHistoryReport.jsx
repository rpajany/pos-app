import React, { useState, useEffect } from "react";
import api from "@/services/api"; // Your API utility
import { Download, Search, Filter, Calendar } from "lucide-react";

export default function StockHistoryReport() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    itemId: "", // Optional: link to a product selector
  });

  // Fetch data from the router we created
  const fetchReport = async () => {
    setLoading(true);
    try {
      // If itemId is empty, you might want a global history endpoint or a specific one
      const endpoint = filters.itemId 
        ? `/stock/history/${filters.itemId}?startDate=${filters.startDate}&endDate=${filters.endDate}`
        : `/stock/summary?startDate=${filters.startDate}&endDate=${filters.endDate}`;
        
      const response = await api.get(endpoint);
      setHistory(response.data || []);
    } catch (error) {
      console.error("Report Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // CSV Export Logic
  const downloadCSV = () => {
    const headers = ["Date,Type,Reference,Item,Quantity,Opening,Closing\n"];
    const rows = history.map(log => 
      `${new Date(log.date).toLocaleDateString()},${log.transactionType},${log.referenceNo},${log.itemName},${log.quantity},${log.openingStock},${log.closingStock}`
    );
    
    const blob = new Blob([headers + rows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Stock_Report_${filters.startDate}_to_${filters.endDate}.csv`;
    a.click();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200">
        
        {/* HEADER & FILTERS */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Stock Movement Report</h1>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg border">
                <Calendar size={18} className="text-gray-500" />
                <input 
                  type="date" 
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  className="bg-transparent border-none text-sm focus:ring-0"
                />
                <span className="text-gray-400">to</span>
                <input 
                  type="date" 
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  className="bg-transparent border-none text-sm focus:ring-0"
                />
              </div>

              <button 
                onClick={fetchReport}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Search size={18} /> Run Report
              </button>

              <button 
                onClick={downloadCSV}
                className="border border-gray-300 hover:bg-gray-50 bg-green-600 text-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download size={18} /> Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-500 text-gray-200 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4 border-b">Date & Time</th>
                <th className="px-6 py-4 border-b">Item Name</th>
                <th className="px-6 py-4 border-b">Type</th>
                <th className="px-6 py-4 border-b">Ref No</th>
                <th className="px-6 py-4 border-b text-right">Qty Change</th>
                <th className="px-6 py-4 border-b text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-10 text-gray-400">Loading records...</td></tr>
              ) : history.length > 0 ? (
                history.map((log, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(log.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {log.itemName}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        log.transactionType === 'PURCHASE' ? 'bg-green-100 text-green-700' : 
                        log.transactionType === 'SALE' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {log.transactionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500">
                      {log.referenceNo}
                    </td>
                    <td className={`px-6 py-4 text-sm text-right font-bold ${
                      log.type === "IN" ? "text-green-600" : "text-red-600"
                    }`}>
                      {log.type === "IN" ? `+${log.quantity}` : `-${log.quantity}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900 bg-gray-50/50">
                      {log.closingStock}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="text-center py-10 text-gray-500">No stock movements found for selected dates.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}