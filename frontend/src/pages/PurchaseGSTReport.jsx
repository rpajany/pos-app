import React, { useState, useEffect, useMemo } from "react";
import { api, safeCall } from "@/services/ApiService";
import {
  Calendar,
  Download,
  Eye,
  FileSpreadsheet,
  Search,
  IndianRupee,
  TrendingUp,
  PieChart as PieIcon,
  ShoppingCart,
} from "lucide-react";
import { format, startOfMonth, parseISO } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export const PurchaseGSTReport = () => {
  const [reportType, setReportType] = useState("b2b");
  const [startDate, setStartDate] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await safeCall(
        api.get(`/purchaseGSTReport/download`, {
          params: { startDate, endDate, type: reportType, format: "json" },
        })
      );
      setReportData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType]); // Re-fetch when type changes

  const summary = useMemo(() => {
    return reportData.reduce(
      (acc, curr) => {
        // Use the exact keys from your API response
        acc.taxable += curr.taxableValue || 0;
        acc.cgst += curr.cgst || 0;
        acc.sgst += curr.sgst || 0;
        acc.igst += curr.igst || 0;
        acc.total += curr.total || 0;
        return acc;
      },
      { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
    );
  }, [reportData]);

  const chartData = useMemo(() => {
  const monthlyData = {};
  reportData.forEach((item) => {
    // Use 'date' since that's what your API returns
    const dateStr = item.date || new Date().toISOString();
    const monthKey = format(parseISO(dateStr), "MMM yyyy");
    
    if (!monthlyData[monthKey])
      monthlyData[monthKey] = { month: monthKey, CGST: 0, SGST: 0, IGST: 0 };
    
    // Match the exact keys from your API response
    monthlyData[monthKey].CGST += item.cgst || 0;
    monthlyData[monthKey].SGST += item.sgst || 0;
    monthlyData[monthKey].IGST += item.igst || 0;
  });
  return Object.values(monthlyData);
}, [reportData]);

  const renderTableHeaders = () => (
    <tr className="bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider">
      {reportType === "hsn" ? (
        <>
          <th className="p-4">HSN Code</th>
          <th className="p-4">Description</th>
          <th className="p-4 text-right">Qty</th>
          <th className="p-4 text-right">Taxable Val</th>
          <th className="p-4 text-right">CGST</th>
          <th className="p-4 text-right">SGST</th>
          <th className="p-4 text-right">IGST</th>
          <th className="p-4 text-right">Total</th>
        </>
      ) : (
        <>
          <th className="p-4">Bill Details</th>
          <th className="p-4 text-right">Taxable Val</th>
          <th className="p-4 text-right">CGST</th>
          <th className="p-4 text-right">SGST</th>
          <th className="p-4 text-right">IGST</th>
          <th className="p-4 text-right">Net Value</th>
        </>
      )}
    </tr>
  );

  const renderTableRows = () => {
    return reportData.map((row, i) => (
      <tr key={i} className="hover:bg-emerald-50/50 transition border-b">
        {reportType === "hsn" ? (
          <>
<td className="p-4 font-bold text-gray-800">{row.hsn}</td>
    <td className="p-4 text-xs text-gray-500">{row.description}</td>
    <td className="p-4 text-right font-medium">
      {row.totalQty} {row.uqc}
    </td>
    <td className="p-4 text-right">₹ {row.taxableValue?.toFixed(2)}</td>
    <td className="p-4 text-right text-orange-600">
      ₹ {row.cgst?.toFixed(2) || "0.00"}
    </td>
    <td className="p-4 text-right text-orange-600">
      ₹ {row.sgst?.toFixed(2) || "0.00"}
    </td>
    <td className="p-4 text-right text-purple-600">
      ₹ {row.igst?.toFixed(2) || "0.00"}
    </td>
      <td className="p-4 text-right text-purple-600">
      ₹ {row.totalValue?.toFixed(2) || "0.00"}
    </td>
          </>
        ) : (
          <>
            <td className="p-4">
              {/* Changed row.invoiceNo to row.date and row.supplierName to row.supplier */}
              <div className="font-bold text-gray-800">{row.supplier}</div>
              <div className="text-xs text-gray-500">{row.date}</div>
            </td>
            <td className="p-4 text-right">₹ {row.taxableValue?.toFixed(2)}</td>
            <td className="p-4 text-right text-orange-600">
              ₹ {row.cgst?.toFixed(2)}
            </td>
            <td className="p-4 text-right text-orange-600">
              ₹ {row.sgst?.toFixed(2)}
            </td>
            <td className="p-4 text-right text-purple-600">
              ₹ {row.igst?.toFixed(2)}
            </td>
            <td className="p-4 text-right font-bold text-gray-900">
              ₹ {row.total?.toFixed(2)}
            </td>
          </>
        )}
      </tr>
    ));
  };

  const handleExportCSV = () => {
  const queryParams = new URLSearchParams({
    startDate,
    endDate,
    type: reportType,
    format: "csv", // Tells backend to return CSV instead of JSON
  }).toString();

  // Construct the full URL for your download endpoint
  const downloadUrl = `http://localhost:5000/api/purchaseGSTReport/download?${queryParams}`;
  
  // Trigger download
  window.location.href = downloadUrl;
};

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <ShoppingCart className="text-emerald-600" size={28} />
              ITC (Purchase) Dashboard
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Claimable Input Tax Credit Tracking
            </p>
          </div>
          <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-bold">
            Total ITC: ₹
            {(summary.cgst + summary.sgst + summary.igst).toLocaleString(
              "en-IN"
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <SummaryCard
            title="Purchase Value"
            amount={summary.taxable}
            color="blue"
          />
          <SummaryCard
            title="Input CGST"
            amount={summary.cgst}
            color="orange"
          />
          <SummaryCard
            title="Input SGST"
            amount={summary.sgst}
            color="orange"
          />
          <SummaryCard
            title="Input IGST"
            amount={summary.igst}
            color="purple"
          />
          <SummaryCard
            title="Total ITC Claim"
            amount={summary.cgst + summary.sgst + summary.igst}
            color="emerald"
          />
        </div>

        {/* Chart Section */}
        {chartData.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={18} /> Monthly ITC Trend
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="CGST" fill="#f97316" stackId="a" />
                <Bar dataKey="SGST" fill="#fb923c" stackId="a" />
                <Bar dataKey="IGST" fill="#8b5cf6" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Filter Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border p-2.5 rounded-lg bg-gray-50"
            >
              <option value="b2b">GSTR-2: B2B Purchases</option>
              <option value="hsn">GSTR-2: HSN Summary</option>
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border p-2 rounded-lg"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border p-2 rounded-lg"
            />
            <button
              onClick={fetchReportData}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
            >
              {loading ? "Loading..." : "Refresh Data"}
            </button>

            <button
    onClick={handleExportCSV}
    className="flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition font-bold"
  >
    <Download size={18} />
    Export CSV
  </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>{renderTableHeaders()}</thead>
            <tbody className="divide-y divide-gray-100">
              {reportData.length > 0 ? (
                renderTableRows()
              ) : (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-gray-400">
                    No data found for selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, amount, color }) => {
  const colors = {
    blue: "text-blue-700",
    orange: "text-orange-700",
    purple: "text-purple-700",
    emerald: "text-emerald-700",
  };
  return (
    <div className="p-5 rounded-xl shadow-sm bg-white border border-gray-100">
      <p className="text-sm font-bold text-gray-500 uppercase">{title}</p>
      <div className="flex items-center gap-1 mt-1">
        <IndianRupee size={16} className="text-gray-400" />
        <span className={`text-xl font-black ${colors[color]}`}>
          {(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
};
