import React, { useState, useEffect, useMemo } from "react";
import { api, safeCall } from "@/services/ApiService";
import {
  Calendar,
  Download,
  Eye,
  FileSpreadsheet,
    ShoppingBag,
  Search,
  IndianRupee,
  PieChart,
  TrendingUp,
  PieChart as PieIcon, // Rename the icon to avoid conflict
} from "lucide-react";

import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  isSameDay,
  parseISO,
  addMonths,
} from "date-fns";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart as ReChartsPie,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend as ReLegend,
} from "recharts";

export const SalesGSTReport = () => {
  const [reportType, setReportType] = useState("b2b");
  const [startDate, setStartDate] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [activePreset, setActivePreset] = useState("thisMonth");

  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({
    taxable: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // const API_URL = "http://localhost:5000/api/salesGSTReport";

  // Calculate Summary Totals from the visible data
  useEffect(() => {
    const totals = reportData.reduce(
      (acc, curr) => {
        acc.taxable += curr.totalTaxableValue || curr.taxableValue || 0;
        acc.cgst += curr.totalCGST || curr.cgst || 0;
        acc.sgst += curr.totalSGST || curr.sgst || 0;
        acc.igst += curr.totalIGST || curr.igst || 0;
        acc.total += curr.totalAmount || curr.totalValue || 0;
        return acc;
      },
      { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
    );
    setSummary(totals);
  }, [reportData]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await safeCall(
        api.get(`/salesGSTReport/download`, {
          params: { startDate, endDate, type: reportType, format: "json" },
        })
      );
      setReportData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const downloadReport = async () => {
    try {
      const response = await safeCall(
        api.get(`/salesGSTReport/download`, {
          params: { startDate, endDate, type: reportType },
          responseType: "blob",
        })
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `GSTR1_${reportType.toUpperCase()}_${startDate}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Download failed");
    }
  };

  const applyPreset = (preset) => {
    const today = new Date();
    let start, end;

    switch (preset) {
      case "thisMonth":
        start = startOfMonth(today);
        end = today;
        break;
      case "lastMonth":
        const lastMonth = subMonths(today, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case "thisQuarter":
        start = startOfQuarter(today);
        end = today;
        break;
      case "fy":
        // Indian Financial Year: April 1st to March 31st
        const currentYear = today.getFullYear();
        const startYear =
          today.getMonth() + 1 < 4 ? currentYear - 1 : currentYear;
        start = new Date(startYear, 3, 1); // April 1st
        end = today;
        break;
      default:
        return;
    }

    setStartDate(format(start, "yyyy-MM-dd"));
    setEndDate(format(end, "yyyy-MM-dd"));
    setActivePreset(preset);
    // Optional: Automatically fetch data after setting the date
    // setTimeout(() => fetchReportData(), 100);
  };

  // --- Logic: Process Data for the Chart ---
  const chartData = useMemo(() => {
    const monthlyData = {};

    reportData.forEach((item) => {
      // Extract month name (e.g., "Jan 2026")
      // Assuming row has a saleDate or using a placeholder if it's an HSN summary
      const date = item.saleDate ? parseISO(item.saleDate) : new Date();
      const monthKey = format(date, "MMM yyyy");

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, CGST: 0, SGST: 0, IGST: 0 };
      }

      monthlyData[monthKey].CGST += item.totalCGST || item.cgst || 0;
      monthlyData[monthKey].SGST += item.totalSGST || item.sgst || 0;
      monthlyData[monthKey].IGST += item.totalIGST || item.igst || 0;
    });

    return Object.values(monthlyData);
  }, [reportData]);

  // --- Logic: Process Data for the Donut Chart ---
  const rateData = useMemo(() => {
    const rates = {};

    reportData.forEach((row) => {
      // Handling B2B (Nested Items)
      if (row.items && Array.isArray(row.items)) {
        row.items.forEach((item) => {
          const p = item.gstPercentage ?? 0;
          const v = item.taxableValue ?? 0;
          const label = `${p}% GST`;
          rates[label] = (rates[label] || 0) + v;
        });
      }
      // Handling B2CS & HSN (Flattened rows from Backend)
      else {
        // Use the new gstPercentage field we added to the backend map
        const p = row.gstPercentage ?? 0;
        const v = row.taxableValue ?? 0;
        const label = `${p}% GST`;

        if (v > 0) {
          rates[label] = (rates[label] || 0) + v;
        }
      }
    });

    return Object.keys(rates)
      .map((key) => ({
        name: key,
        value: Math.round(rates[key]),
      }))
      .sort((a, b) => b.value - a.value);
  }, [reportData]);

  // Colors for the Donut Segments
  const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981"];

  // Dynamic Status Helper
  const getFilingStatus = () => {
    const today = new Date();
    const currentMonth = format(today, "MMMM");
    const currentYear = today.getFullYear();

    // GSTR-1 is due by the 11th of the next month
    const nextMonth = addMonths(today, 1);
    const dueDate = format(startOfMonth(nextMonth).setDate(11), "dd MMM yyyy");

    // Determine status based on the day of the month
    const dayOfMonth = today.getDate();
    let statusColor = "text-emerald-500";
    let statusText = "On Track";

    if (dayOfMonth > 11 && dayOfMonth < 20) {
      statusColor = "text-amber-500";
      statusText = "GSTR-1 Overdue / 3B Pending";
    } else if (dayOfMonth >= 20) {
      statusColor = "text-red-500";
      statusText = "Critical: Filings Due";
    }

    return {
      dueDate,
      statusText,
      statusColor,
      currentPeriod: `${currentMonth} ${currentYear}`,
    };
  };

  const filingInfo = getFilingStatus();

  const getDynamicFYLabel = () => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-indexed (Jan is 1)
    const currentYear = today.getFullYear();

    // If month is Jan, Feb, or Mar (1, 2, 3), we are in the second half of the FY
    const startYear = currentMonth <= 3 ? currentYear - 1 : currentYear;
    const endYear = (startYear + 1).toString().slice(-2); // Get last two digits, e.g., "26"

    return `FY ${startYear}-${endYear}`;
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-sm font-medium text-slate-500 bg-white px-4 py-1 rounded-full border border-slate-200 shadow-sm">
          System:{" "}
          <span className="text-emerald-500">
            Online {new Date().getFullYear()}
          </span>
        </div>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="text-blue-600" size={28} />
              Sales GST Compliance Dashboard
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Reporting Period:{" "}
              <span className="text-slate-800">{filingInfo.currentPeriod}</span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Next GSTR-1 Deadline
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-700">
                  {filingInfo.dueDate}
                </p>
                <p
                  className={`text-[10px] font-bold uppercase ${filingInfo.statusColor}`}
                >
                  ● {filingInfo.statusText}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Calendar size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Top Summary Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard title="Taxable Value" amount={chartData.reduce((a,b)=>a+(b.CGST*10), 0)} color="blue" />
            <SummaryCard title="CGST" amount={chartData.reduce((a,b)=>a+b.CGST, 0)} color="orange" />
            <SummaryCard title="SGST" amount={chartData.reduce((a,b)=>a+b.SGST, 0)} color="orange" />
            <SummaryCard title="IGST" amount={chartData.reduce((a,b)=>a+b.IGST, 0)} color="purple" />
        </div> */}

        {/* GSTR-3B Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <SummaryCard
            title="Taxable Value"
            amount={summary.taxable}
            color="blue"
          />
          <SummaryCard title="CGST" amount={summary.cgst} color="orange" />
          <SummaryCard title="SGST" amount={summary.sgst} color="orange" />
          <SummaryCard title="IGST" amount={summary.igst} color="purple" />
          <SummaryCard
            title="Total Tax (Liability)"
            amount={summary.cgst + summary.sgst + summary.igst}
            color="red"
          />
        </div>

        {/* Analytics Section: The Comparison Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-500" />
                Monthly Tax Comparison
              </h3>
              <div className="flex gap-2 text-[10px] font-bold uppercase">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" /> CGST
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" /> SGST
                </span>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" />
                  <Bar
                    dataKey="CGST"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  <Bar
                    dataKey="SGST"
                    fill="#f97316"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  <Bar
                    dataKey="IGST"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Donut Chart Container- NEW: Tax by GST Rate Donut Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[400px]">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <PieIcon size={18} className="text-purple-500" /> Revenue by GST
                Rate
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ReChartsPie>
                    {" "}
                    {/* Changed from RePieChart to ReChartsPie */}
                    <Pie
                      data={rateData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {rateData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `₹${value.toLocaleString("en-IN")}`}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </ReChartsPie>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick Actions / Presets */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white">
            <h3 className="font-bold mb-4 opacity-90">Quick Reports</h3>
            <div className="space-y-3">
              {["thisMonth", "lastMonth", "thisQuarter", "fy"].map((id) => (
                <button
                  key={id}
                  onClick={() => applyPreset(id)}
                  className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all font-medium flex justify-between items-center"
                >
                  {id === "fy"
                    ? "Full Financial Year"
                    : id.replace(/([A-Z])/g, " $1").trim()}
                  <Calendar size={14} />
                </button>
              ))}
            </div>
            {/* <div className="mt-8 p-4 bg-white/10 rounded-xl border border-white/5">
              <p className="text-xs opacity-70 mb-1 uppercase font-bold tracking-widest">
                Next Filing Due
              </p>
              <p className="text-xl font-black">Feb 11, 2026</p>
            </div> */}
          </div>
        </div>

        {/* Quick Presets Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3 md:mb-0">
            <Calendar className="text-blue-500" size={20} />
            <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">
              Period Select
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "thisMonth", label: "This Month" },
              { id: "lastMonth", label: "Last Month" },
              { id: "thisQuarter", label: "This Quarter" },
              { id: "fy", label: getDynamicFYLabel() },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => applyPreset(btn.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                  activePreset === btn.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-500"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Controls Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileSpreadsheet className="text-blue-600" /> GST Filings 2026
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={fetchReportData}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
                >
                  <Eye size={18} /> {loading ? "Loading..." : "View Report"}
                </button>
                <button
                  onClick={downloadReport}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition shadow-sm"
                >
                  <Download size={18} /> Download CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Report Category
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full border p-2.5 rounded-lg bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="b2b">GSTR-1: B2B Invoices</option>
                  <option value="hsn">GSTR-1: HSN Summary</option>
                  <option value="b2cs">GSTR-1: B2C Small</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border p-2.5 rounded-lg outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  To Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border p-2.5 rounded-lg outline-none"
                />
              </div>
            </div>
          </div>

          {/* Search & Table */}
          <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Filter current view..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm outline-none"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4">Details</th>
                  <th className="p-4 text-right">Taxable Val</th>
                  <th className="p-4 text-right">CGST</th>
                  <th className="p-4 text-right">SGST</th>
                  <th className="p-4 text-right">IGST</th>
                  <th className="p-4 text-right">Net Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportData.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/50 transition">
                    <td className="p-4">
                      <div className="font-bold text-gray-800">
                        {row.invoiceNo || row.hsn}
                      </div>
                      <div className="text-xs text-gray-500">
                        {row.customerId?.name || row.description || "HSN Item"}
                      </div>
                    </td>
                    <td className="p-4 text-right font-medium">
                      ₹
                      {(row.totalTaxableValue || row.taxableValue || 0).toFixed(
                        2
                      )}
                    </td>
                    <td className="p-4 text-right text-orange-600">
                      ₹{(row.totalCGST || row.cgst || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-right text-orange-600">
                      ₹{(row.totalSGST || row.sgst || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-right text-purple-600">
                      ₹{(row.totalIGST || row.igst || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-bold text-gray-900">
                      ₹{(row.totalAmount || row.totalValue || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, amount, color }) => {
  const colors = {
    blue: "border-blue-500 text-blue-700 bg-blue-50",
    orange: "border-orange-500 text-orange-700 bg-orange-50",
    red: "border-red-500 text-red-700 bg-red-50",
    purple: "border-purple-500 text-purple-700 bg-purple-50", // Added purple
  };
  // Fallback to blue if the color provided doesn't exist in our object
  const activeColorClass = colors[color] || colors.blue;

  return (
    <div className={`p-5 rounded-xl border-l-4 shadow-sm bg-white`}>
      <p className="text-sm font-bold text-gray-500 uppercase">{title}</p>
      <div className="flex items-center gap-1 mt-1">
        <IndianRupee size={20} className="text-gray-400" />
        {/* We use the second part of the string for the text color */}
        <span
          className={`text-2xl font-black ${activeColorClass.split(" ")[1]}`}
        >
          {(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
};
