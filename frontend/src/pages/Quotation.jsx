"use client";
import React, { useState, useEffect } from "react";
import { api, safeCall } from "@/services/ApiService";

import { CustomerFormModal } from "@/components/CustomerFormModal";
import CustomerAutocomplete from "../components/CustomerAutocomplete";
import { Plus, Save, Trash2, Download, List } from "lucide-react";
import { QuotationDataTable } from "@/components/QuotationDataTable";
import { QuotationStatusModal } from "@/components/QuotationStatusModal";


export const Quotation = () => {


  const [isEditable, setIsEditable] = useState(false); // Controls Read-Only state

  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    contact: "",
    quoteNo: "QID-AUTO",
    date: new Date().toISOString().split("T")[0],
    items: [],
    notInScope: "Standard exclusions apply.",
    terms: {
      taxes:
        "The Above Price Is Without GST (Exclusive GST), Applicable @ 18%.",
      payment: "100% Advance Along With The Order.",
      validity:
        "Quote Valid For 30 Days Thereafter Subject To Our Confirmation In Writing.",
      delivery: "Estimate Delivery One Week.",
    },
    taxPercentage: 18, // Default to 18
    totalAmount: 0,
  });

  const [currentItem, setCurrentItem] = useState({
    description: "",
    qty: 1,
    rate: 0,
    hsnCode: "",
    total: 0,
  });

  const [customers, setCustomers] = useState([]);
  // 1. Add a state for the key
  const [resetKey, setResetKey] = useState(0);
  const [view, setView] = useState("list"); // "list" or "form"
  const [dateFilter, setDateFilter] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const [quotations, setQuotations] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Update your filtering logic to handle both Search and Status
  const filteredQuotes = (Array.isArray(quotations) ? quotations : []).filter(
    (q) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        (q.quoteNo?.toLowerCase() || "").includes(search) ||
        (q.customerName?.toLowerCase() || "").includes(search);

      const matchesStatus =
        selectedStatus === "all" || q.status === selectedStatus;

      return matchesSearch && matchesStatus;
    }
  );

  const fetchCustomers = async () => {
    try {
      const response = await safeCall(api.get("/customer/load"));

      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchQuotations = async () => {
    try {
      const response = await safeCall(
        api.get("/quotation/load", {
          params: {
            startDate: dateFilter.start,
            endDate: dateFilter.end,
          },
        })
      );

      // Check if the Axios response body exists, then access your server's 'data' property
      if (response && response.data && Array.isArray(response.data.data)) {
        setQuotations(response.data.data);
      } else {
        console.error("Data structure mismatch:", response);
        setQuotations([]);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setQuotations([]);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchCustomers();
    fetchQuotations();
  }, []);

  const handleShowReport = () => {
    fetchQuotations();
  };

  console.log("quotations :", quotations);

  const handleAddItem = (e) => {
    e.preventDefault();

    // 1. Validation check
    if (!currentItem.description || currentItem.rate <= 0) {
      alert("Please enter description and rate!");
      return;
    }

    // 2. Create the new item object with calculation
    const newItem = {
      description: currentItem.description,
      qty: Number(currentItem.qty),
      rate: Number(currentItem.rate),
      hsnCode: currentItem.hsnCode,
      total: Number(currentItem.qty) * Number(currentItem.rate),
    };

    // 3. CRITICAL: Update the items array INSIDE formData
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem], // This pushes the new item into the list
    }));

    // 4. Reset the "Add Item" input fields
    setCurrentItem({
      description: "",
      qty: 1,
      rate: 0,
      hsnCode: "",
      total: 0,
    });
  };

  // Function to remove an item by its index
  const removeItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
  };

  //   console.log("formData : ", formData);
  //   console.log("formData : ", formData);

  const handleSaveQuotation = async (e) => {
    e.preventDefault();
    // 1. Basic Validation
    if (!formData.customerId) {
      alert("Please select a customer first.");
      return;
    }
    if (formData.items.length === 0) {
      alert("Please add at least one item.");
      return;
    }

    // 2. FORCE CALCULATE right before saving to avoid stale state
    const subTotal = formData.items.reduce(
      (sum, item) => sum + (item.total || 0),
      0
    );
    const taxAmount = (subTotal * (formData.taxPercentage || 0)) / 100;
    const grandTotal = subTotal + taxAmount;

    try {
      // 3. Prepare the payload with the calculated numbers
      const payload = {
        ...formData,
        subTotal: subTotal,
        taxAmount: taxAmount,
        totalAmount: grandTotal, // This is what the backend needs
      };

      console.log("Saving Payload:", payload); // Debug to see if totalAmount is still 0 here

      // 3. API Call
      const response = await safeCall(api.post("/quotation/insert", payload));

      if (response && response.data && response.data.success) {
        alert(
          "Quotation Saved Successfully! Quote No: " +
            response.data.data.quoteNo
        );
        // Optional: Redirect to list or Reset Form
        window.location.reload();
      }
    } catch (error) {
      console.error("Save Error:", error);
      alert(error.response?.data?.message || "Failed to save quotation");
    }
  };

  // CSV Export Function
  const downloadCSV = (data) => {
    const headers = ["Quote No,Date,Customer,Contact,Total,Status\n"];
    const rows = data.map(
      (q) =>
        `${q.quoteNo},${new Date(q.date).toLocaleDateString()},"${
          q.customerName
        }","${q.contact}",${q.totalAmount},${q.status}`
    );
    const blob = new Blob([headers + rows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute(
      "download",
      `quotations_${dateFilter.start}_to_${dateFilter.end}.csv`
    );
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const openStatusModal = (quote) => {
    setSelectedQuote(quote);
    setIsModalOpen(true);
  };

  const handleStatusUpdate = async (quoteId, updateData) => {
    try {
      // updateData contains { status, statusComment }
      const response = await safeCall(
        api.put(`/quotation/status/${quoteId}`, updateData)
      );

      if (response.success) {
        alert("Status updated successfully!");
        setIsModalOpen(false); // Close the modal
        fetchQuotations(); // Refresh the table data
      }
    } catch (error) {
      console.error("Status Update Error:", error);
      alert("Failed to update status");
    }
  };

  // calc
  const subTotal = formData.items.reduce(
    (sum, item) => sum + (item.total || 0),
    0
  );
  const taxRate = formData.taxPercentage / 100; // Convert 18 to 0.18
  const taxAmount = subTotal * taxRate;
  const grandTotal = subTotal + taxAmount;

  const handleDeleteQuotation = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this quotation? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await safeCall(api.delete(`/quotation/${id}`));

      // Using the structure we found works for your API
      if (response && response.data && response.data.success) {
        alert("Quotation deleted!");
        fetchQuotations(); // Refresh the list
      }
    } catch (error) {
      console.error("Delete Error:", error);
      alert("Failed to delete quotation.");
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen border-t-4 border-green-600 max-w-6xl mx-auto shadow-lg">
      {/* <h1 className="text-center text-2xl font-bold text-gray-700 mb-8">
        Quotation
      </h1> */}

      <div className="p-6 bg-gray-50 min-h-screen">
        {/* TOP HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Quotation Management
          </h2>

          <button
            onClick={() => setView(view === "list" ? "form" : "list")}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-green-700 flex items-center gap-2"
          >
            {view === "list" ? <Plus size={20} /> : <List size={20} />}
            {view === "list" ? "New Quotation" : "Back to List"}
          </button>
        </div>

        {/* DATE PICKERS & ACTIONS */}
        {view === "list" && (
          <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="border p-2 rounded text-sm"
                value={dateFilter.start}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, start: e.target.value })
                }
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                className="border p-2 rounded text-sm"
                value={dateFilter.end}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, end: e.target.value })
                }
              />
              <button
                onClick={handleShowReport}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700"
              >
                Show Report
              </button>

              <div className="flex items-center gap-2 ml-4">
                <label className="text-xs font-black uppercase text-gray-400">
                  Status:
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="border p-2 rounded-lg text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="inprocess">In Process</option>
                  <option value="completed">Completed</option>
                  <option value="cancel">Cancelled</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => downloadCSV(filteredQuotes)}
              className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-green-600 transition"
            >
              <Download size={18} /> Export Filtered CSV
            </button>
          </div>
        )}

        {/* CONDITIONAL RENDERING */}
        {view === "form" ? (
          // Your existing quotation form component
          <form onSubmit={handleSaveQuotation}>
            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
              <div className="space-y-4">
                <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider">
                  Customer Details :
                </h3>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-bold text-gray-700">
                    Customer
                  </label>
                  {/* <input className="border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" placeholder="Enter Customer Name" /> */}

                  <CustomerAutocomplete
                    key={resetKey}
                    customers={customers}
                    selectedCustomerId={formData.customerId}
                    // onSelect={(customerId) =>
                    //   setFormData((prev) => ({
                    //     ...prev,
                    //     customerId,
                    //   }))
                    // }

                    onSelect={(customerId) => {
                      const selectedCust = customers.find(
                        (c) => c._id === customerId
                      );
                      setFormData((prev) => ({
                        ...prev,
                        customerId,
                        customerName: selectedCust?.name,
                        //   customerType: selectedCust?.gstNumber ? "B2B" : "B2C",
                        //   placeOfSupply:
                        //     selectedCust?.state_code || MY_BUSINESS_STATE_CODE,
                      }));
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-bold text-gray-700">
                    Kind Attn :
                  </label>
                  <input
                    className="border p-2 rounded w-full md:w-2/3 focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Enter Contact Person Name"
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({ ...formData, contact: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider">
                  Quotation details:
                </h3>

                {/* <div className="flex items-center justify-between border-b pb-2">
                  <label className="text-sm font-bold text-gray-700">
                    Qote No:
                  </label>
                  <span className="font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded">
                    QID-AUTO
                  </span>
                </div> */}

                <div className="flex flex-col">
                  <label className="text-xs font-black uppercase text-gray-400 mb-1">
                    Quotation Date
                  </label>
                  <input
                    type="date"
                    // Extract only the YYYY-MM-DD part from the state
                    value={
                      formData.date
                        ? new Date(formData.date).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="border-2 p-2 rounded-xl outline-none focus:border-blue-500 font-bold text-gray-700"
                  />
                </div>

              </div>
            </div>

            {/* Add Item Section */}
            <div className="bg-gray-50 p-5 rounded-xl mb-6 border border-gray-200">
              <h3 className="font-bold text-gray-600 mb-3 text-sm uppercase">
                Add Quotation Item :
              </h3>
              <label className="text-xs font-bold text-gray-500">Desc</label>
              <textarea
                className="w-full border p-3 mb-4 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Quotation Item Details..."
                value={currentItem.description}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    description: e.target.value,
                  })
                }
              />
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500">Qty</label>
                  <input
                    type="number"
                    className="border p-2 rounded"
                    value={currentItem.qty}
                    onChange={(e) =>
                      setCurrentItem({
                        ...currentItem,
                        qty: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500">
                    Rate
                  </label>
                  <input
                    type="number"
                    className="border p-2 rounded"
                    value={currentItem.rate}
                    onChange={(e) =>
                      setCurrentItem({
                        ...currentItem,
                        rate: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="flex flex-col md:col-span-2">
                  <label className="text-xs font-bold text-gray-500">
                    HSN Code
                  </label>
                  <input
                    className="border p-2 rounded"
                    value={currentItem.hsnCode}
                    onChange={(e) =>
                      setCurrentItem({
                        ...currentItem,
                        hsnCode: e.target.value,
                      })
                    }
                  />
                </div>
                <button
                  onClick={handleAddItem}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition h-10 flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Add Items
                </button>
              </div>

              {/* Items Table */}
              <div className="mt-8 border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100 text-gray-600 uppercase text-[11px] font-black tracking-widest">
                    <tr>
                      <th className="p-4 border-b">Description</th>
                      <th className="p-4 border-b text-center">HSN</th>
                      <th className="p-4 border-b text-center">Qty</th>
                      <th className="p-4 border-b text-center">Rate</th>
                      <th className="p-4 border-b text-right">Total</th>
                      <th className="p-4 border-b text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {formData.items.length > 0 ? (
                      formData.items.map((item, index) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="p-4 text-sm text-gray-700 font-medium whitespace-pre-wrap">
                            {item.description}
                          </td>
                          <td className="p-4 text-sm text-center text-gray-500">
                            {item.hsnCode || "-"}
                          </td>
                          <td className="p-4 text-sm text-center font-bold">
                            {item.qty}
                          </td>
                          <td className="p-4 text-sm text-center">
                            ₹{item.rate.toLocaleString()}
                          </td>
                          <td className="p-4 text-sm text-right font-black text-gray-800">
                            ₹{item.total.toLocaleString()}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => removeItem(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              title="Remove Item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="p-10 text-center text-gray-400 italic text-sm"
                        >
                          No items added yet. Use the form above to add
                          products.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end mt-6 mb-8">
                <div className="w-full md:w-80 space-y-3 bg-white p-6 rounded-2xl border shadow-sm">
                  <div className="flex justify-between text-sm text-gray-600 font-medium">
                    <span>Sub-Total:</span>
                    <span>₹ {subTotal.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-600 font-medium border-b pb-3">
                    <div className="flex items-center gap-1">
                      <span>GST (</span>
                      <input
                        type="number"
                        className="w-12 border rounded px-1 text-center font-bold text-blue-600 outline-none focus:ring-1 focus:ring-blue-500"
                        value={formData.taxPercentage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            taxPercentage: Number(e.target.value),
                          })
                        }
                      />
                      <span>%):</span>
                    </div>
                    <span>
                      ₹ 
                      {taxAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-base font-black text-gray-800 uppercase tracking-tighter">
                      Total Amount:
                    </span>
                    <span className="text-2xl font-black text-green-600">
                      ₹ 
                      {grandTotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Terms Toggle */}
            <div className="flex items-center gap-2 mb-4 bg-yellow-50 p-2 rounded border border-yellow-100 w-fit">
              <input
                type="checkbox"
                id="editTerms"
                className="w-4 h-4 accent-green-600 cursor-pointer"
                checked={isEditable}
                onChange={(e) => setIsEditable(e.target.checked)}
              />
              <label
                htmlFor="editTerms"
                className="text-sm font-bold text-yellow-800 cursor-pointer"
              >
                Edit Terms
              </label>
            </div>

            {/* Not in Scope */}
            <div className="mb-6">
              <label className="block font-bold text-gray-600 mb-2 uppercase text-xs">
                Not in scope :
              </label>
              <textarea
                className={`w-full border p-3 rounded-lg h-24 transition-colors ${
                  !isEditable
                    ? "bg-gray-100 text-gray-500"
                    : "bg-white text-gray-800 focus:ring-2 focus:ring-green-500"
                }`}
                readOnly={!isEditable}
                value={formData.notInScope}
                onChange={(e) =>
                  setFormData({ ...formData, notInScope: e.target.value })
                }
              />
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-3 mb-10">
              <h3 className="font-bold text-gray-600 mb-2 uppercase text-xs tracking-widest">
                Terms and Conditions :
              </h3>
              {Object.entries(formData.terms).map(([key, value]) => (
                <div
                  key={key}
                  className="flex border rounded-lg overflow-hidden shadow-sm"
                >
                  <span className="w-32 bg-gray-200 p-3 text-[10px] font-black uppercase text-gray-600 border-r flex items-center">
                    {key} :
                  </span>
                  <input
                    className={`flex-1 p-3 text-sm outline-none transition-colors ${
                      !isEditable
                        ? "bg-gray-50 text-gray-400"
                        : "bg-white text-gray-800"
                    }`}
                    value={value}
                    readOnly={!isEditable}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        terms: { ...formData.terms, [key]: e.target.value },
                      })
                    }
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 shadow-lg hover:shadow-green-200 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <Save size={20} /> Save Quotation
            </button>
          </form>
        ) : (
          <QuotationDataTable
            data={filteredQuotes}
            onStatusClick={openStatusModal}
            onDeleteClick={handleDeleteQuotation} // Pass it here
          />
        )}
      </div>

      {isModalOpen && (
        <QuotationStatusModal
          isOpen={isModalOpen}
          currentData={selectedQuote}
          onClose={() => setIsModalOpen(false)}
          onUpdate={handleStatusUpdate} // Function that calls the API
        />
      )}
    </div>
  );
};
