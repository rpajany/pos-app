import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api, safeCall } from "@/services/ApiService";
import { InputField } from "@/components/InputField";
import { Trash2, Wallet, Calendar, PlusCircle, FileText } from "lucide-react";

export const DailyExpense = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: "Staff Tea/Food",
    amount: "",
    description: "",
    paymentMethod: "Cash",
    date: new Date().toISOString().split("T")[0],
  });

  const fetchExpenses = async () => {
    setLoading(true);
    const result = await safeCall(api.get("/expenses/load"));
    if (result.success) setExpenses(result.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await safeCall(api.post("/expenses/insert", formData));
    if (result.success) {
      setFormData({
        category: "Staff Tea/Food",
        amount: "",
        description: "",
        paymentMethod: "Cash",
        date: new Date().toISOString().split("T")[0],
      });
      setShowForm(false);
      fetchExpenses();
    }
  };

  const totalToday = expenses
    .filter(
      (ex) => new Date(ex.date).toDateString() === new Date().toDateString()
    )
    .reduce((sum, curr) => sum + curr.amount, 0);

  const generateMonthlyReport = () => {
    const doc = new jsPDF();
    const now = new Date();
    const currentMonth = now.toLocaleString("default", { month: "long" });
    const year = now.getFullYear();

    // 1. Header
    doc.setFontSize(18);
    doc.text(`${currentMonth} Expense Report`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${now.toLocaleString()}`, 14, 28);

    // 2. Prepare Table Data
    const reportData = expenses
      .filter((ex) => {
        const exDate = new Date(ex.date);
        return (
          exDate.getMonth() === now.getMonth() && exDate.getFullYear() === year
        );
      })
      .map((ex) => [
        new Date(ex.date).toLocaleDateString(),
        ex.category,
        ex.description || "-",
        ex.paymentMethod,
        `Rs. ${ex.amount.toFixed(2)}`,
      ]);

    const totalMonthly = reportData.reduce((sum, row) => {
      return sum + parseFloat(row[4].replace("Rs. ", ""));
    }, 0);

    // 3. Use the autoTable function (Fixes the error)
    autoTable(doc, {
      startY: 35,
      head: [["Date", "Category", "Description", "Method", "Amount"]],
      body: reportData,
      foot: [["", "", "", "TOTAL", `Rs. ${totalMonthly.toFixed(2)}`]],
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] }, // Blue-500
      footStyles: {
        fillColor: [243, 244, 246],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
    });

    // 4. Save
    doc.save(`Expenses_${currentMonth}_${year}.pdf`);
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header & Stats */}
      <div className="flex   justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Daily Expenses</h2>

        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <PlusCircle size={20} /> {showForm ? "Close" : "Add Expense"}
          </button>

          <button
            onClick={generateMonthlyReport}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-black transition"
          >
            <FileText size={20} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-red-500">
          <p className="text-sm text-gray-500 uppercase">
            Today's Total Outflow
          </p>
          <p className="text-3xl font-bold text-red-600">
            ₹{totalToday.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-indigo-500">
          <p className="text-sm text-gray-500 uppercase">Primary Source</p>
          <p className="text-3xl font-bold text-gray-800">Cash Drawer</p>
        </div>
      </div>

      {/* Entry Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl shadow-md mb-6 animate-in slide-in-from-top"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                className="w-full border p-2 rounded-md"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option>Staff Tea/Food</option>
                <option>Electricity</option>
                <option>Rent</option>
                <option>Stationery</option>
                <option>Repair</option>
                <option>Other</option>
              </select>
            </div>
            <InputField
              label="Amount (₹)"
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
            />
            <InputField
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              className="w-full border p-2 rounded-md"
              rows="2"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="e.g. Paid for office cleaning"
            />
          </div>
          <button
            type="submit"
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
          >
            Save Expense
          </button>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-400 text-gray-100 text-sm">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Category</th>
              <th className="p-4">Description</th>
              <th className="p-4">Method</th>
              <th className="p-4 text-right">Amount</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {expenses.map((ex) => (
              <tr key={ex._id} className="hover:bg-gray-50 transition">
                <td className="p-4 text-sm text-gray-600">
                  {new Date(ex.date).toLocaleDateString()}
                </td>
                <td className="p-4 font-medium">{ex.category}</td>
                <td className="p-4 text-sm text-gray-500">{ex.description}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-gray-200 rounded text-xs">
                    {ex.paymentMethod}
                  </span>
                </td>
                <td className="p-4 text-right font-bold text-red-600">
                  ₹{ex.amount}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => {
                      /* Delete logic */
                    }}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
