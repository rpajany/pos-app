"use client";
import React, { useEffect, useState } from "react";
import { api, safeCall } from "@/services/ApiService";
import { Download, Search, Calendar, IndianRupee } from "lucide-react";
import { format } from "date-fns";

export const SalesPaymentReport = () => {
  const [dates, setDates] = useState({
    from: format(new Date(), "yyyy-MM-dd"),
    to: format(new Date(), "yyyy-MM-dd"),
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    const res = await safeCall(
      api.get(
        `/salesPayment/report/collection?fromDate=${dates.from}&toDate=${dates.to}`
      )
    );
    if (res.success) setReportData(res.data.data );
    setLoading(false);
  };

  useEffect(()=>{
fetchReport();
  },[])

  console.log("report : ", reportData)

  const exportToCSV = () => {
    if (!reportData?.allTransactions.length) return;

    const headers = ["Date,Invoice No,Payment Mode,Amount,Note\n"];
    const rows = reportData.allTransactions.map(
      (t) =>
        `${format(new Date(t.date), "dd-MM-yyyy")},${t.invoiceNo},${t.type},${
          t.amount
        },${t.note || ""}`
    );

    const blob = new Blob([headers + rows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Collection_Report_${dates.from}_to_${dates.to}.csv`;
    a.click();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Sales Collection Report
        </h1>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
              From Date
            </label>
            <input
              type="date"
              className="border p-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
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
              className="border p-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
              value={dates.to}
              onChange={(e) => setDates({ ...dates, to: e.target.value })}
            />
          </div>
          <button
            onClick={fetchReport}
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold flex items-center gap-2 hover:bg-blue-700 transition"
          >
            <Search size={18} /> {loading ? "Loading..." : "Generate"}
          </button>
          <button
            onClick={exportToCSV}
            disabled={!reportData}
            className="bg-green-600 text-white px-6 py-2 rounded-md font-bold flex items-center gap-2 hover:bg-green-700 disabled:bg-gray-300 transition"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>

        {reportData && (
          <>
            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                <p className="text-sm text-gray-500 font-bold uppercase">
                  Cash Collected
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  ₹{(reportData.totalCash || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                <p className="text-sm text-gray-500 font-bold uppercase">
                  UPI Collected
                </p>
                <p className="text-3xl font-bold text-gray-800">
                  ₹{(reportData.totalUPI || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                <p className="text-sm text-gray-500 font-bold uppercase">
                  Total Collection
                </p>
                {/* <p className="text-3xl font-bold text-gray-800">₹{(reportData.totalCash + reportData.totalUPI + reportData.totalBank).toFixed(2)}</p> */}
                <p className="text-3xl font-bold text-gray-800">
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
            <div className="w-full bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="p-4 text-xs uppercase font-bold">Date</th>
                    <th className="p-4 text-xs uppercase font-bold">
                      Invoice No
                    </th>
                    <th className="p-4 text-xs uppercase font-bold">Mode</th>
                    <th className="p-4 text-xs uppercase font-bold text-right">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.allTransactions?.length > 0 ? (
                    reportData.allTransactions.map((t, i) => (
                      <tr
                        key={i}
                        className="border-b hover:bg-gray-50 transition"
                      >
                        <td className="p-4 text-sm text-gray-600">
                          {format(new Date(t.date), "dd MMM yyyy")}
                        </td>
                        <td className="p-4 text-sm font-bold text-gray-800">
                          {t.invoiceNo}
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                              t.type === "Cash"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-bold text-right text-gray-900">
                          ₹{(t.amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-10 text-center text-gray-400 italic"
                      >
                        No transactions found for these dates.
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
