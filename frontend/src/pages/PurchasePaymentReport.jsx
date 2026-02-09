"use client";
import React, { useState,useEffect } from "react";
import { api, safeCall } from "@/services/ApiService";
import { Download, Search, IndianRupee, Truck } from "lucide-react";
import { format } from "date-fns";

export const PurchasePaymentReport = () => {
  const [dates, setDates] = useState({
    from: format(new Date(), "yyyy-MM-dd"),
    to: format(new Date(), "yyyy-MM-dd"),
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    // Updated endpoint to purchasePayment
    const res = await safeCall(
      api.get(
        `/purchasePayment/outward?fromDate=${dates.from}&toDate=${dates.to}`
      )
    );
    if (res.success) setReportData(res.data.data);
    setLoading(false);
  };


    useEffect(()=>{
  fetchReport();
    },[])

  const exportToCSV = () => {
    if (!reportData?.allTransactions?.length) return;

    const headers = ["Date,Purchase No,Supplier,Payment Mode,Amount,Note\n"];
    const rows = reportData.allTransactions.map(
      (t) =>
        `${format(new Date(t.date), "dd-MM-yyyy")},${t.purchaseNo},${
          t.supplierName
        },${t.type},${t.amount},${t.note || ""}`
    );

    const blob = new Blob([headers + rows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Purchase_Payment_Report_${dates.from}_to_${dates.to}.csv`;
    a.click();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Truck className="text-orange-600" /> Purchase Payment Report
          (Outward)
        </h1>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-4 items-end border-t-4 border-orange-500">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
              From Date
            </label>
            <input
              type="date"
              className="border p-2 rounded-md outline-none focus:ring-2 focus:ring-orange-500"
              value={dates.from}
              onChange={(e) => setDates({ ...dates, from: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
              To Date
            </label>
            <input
              type="date"
              className="border p-2 rounded-md outline-none focus:ring-2 focus:ring-orange-500"
              value={dates.to}
              onChange={(e) => setDates({ ...dates, to: e.target.value })}
            />
          </div>
          <button
            onClick={fetchReport}
            className="bg-orange-600 text-white px-6 py-2 rounded-md font-bold flex items-center gap-2 hover:bg-orange-700 transition"
          >
            <Search size={18} /> {loading ? "Loading..." : "Generate"}
          </button>
          <button
            onClick={exportToCSV}
            disabled={!reportData?.allTransactions?.length}
            className="bg-gray-800 text-white px-6 py-2 rounded-md font-bold flex items-center gap-2 hover:bg-black disabled:bg-gray-300 transition"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>

        {reportData && (
          <>
            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                <p className="text-sm text-gray-500 font-bold uppercase">
                  Cash
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  ₹{(reportData.totalCash || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                <p className="text-sm text-gray-500 font-bold uppercase">
                  UPI Payments
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  ₹{(reportData.totalUPI || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                <p className="text-sm text-gray-500 font-bold uppercase">
                  Bank Transfers
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  ₹{(reportData.totalBank || 0).toFixed(2)}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
                <p className="text-sm text-gray-500 font-bold uppercase">
                  Total Paid Out
                </p>
                <p className="text-3xl font-bold text-red-600">
                  ₹
                  {(
                    (reportData?.totalCash ?? 0) +
                    (reportData?.totalUPI ?? 0) +
                    (reportData?.totalBank ?? 0)
                  ).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="w-full bg-white rounded-xl shadow-sm overflow-x-auto border">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="bg-gray-100 text-gray-700 border-b">
                  <tr>
                    <th className="p-4 text-xs uppercase font-bold">Date</th>
                    <th className="p-4 text-xs uppercase font-bold">
                      Purchase No
                    </th>
                    <th className="p-4 text-xs uppercase font-bold">
                      Supplier
                    </th>
                    <th className="p-4 text-xs uppercase font-bold">Mode</th>
                    <th className="p-4 text-xs uppercase font-bold text-right">
                      Amount Paid
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.allTransactions?.length > 0 ? (
                    reportData.allTransactions.map((t, i) => (
                      <tr
                        key={i}
                        className="border-b hover:bg-orange-50 transition"
                      >
                        <td className="p-4 text-sm text-gray-600">
                          {format(new Date(t.date), "dd MMM yyyy")}
                        </td>
                        <td className="p-4 text-sm font-bold text-gray-800">
                          {t.purchaseNo}
                        </td>
                        <td className="p-4 text-sm text-gray-700">
                          {t.supplierName}
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-600 border`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-bold text-right text-red-600">
                          ₹{(t.amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-10 text-center text-gray-400 italic"
                      >
                        No outward payments found for these dates.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
