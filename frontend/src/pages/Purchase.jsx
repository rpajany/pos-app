"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api, safeCall } from "@/services/ApiService";
import ItemAutocomplete from "../components/ItemAutocomplete";
import { InputField } from "@/components/InputField";
import { SupplierAutocomplete } from "../components/SupplierAutocomplete";
import { SupplierFormModal } from "@/components/SupplierFormModal";
import { useApp } from "@/context/useApp";
import {
  Trash2,
  PlusCircle,
  ReceiptText,
  Calendar,
  User,
  PackagePlus,
  Plus,
} from "lucide-react";
import { PurchasePaymentModal } from "@/components/PurchasePaymentModal";

export const Purchase = () => {
  const { fetchSuppliers } = useApp();
  const [purchases, setPurchases] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const barcodeRef = useRef(null);

  const MY_BUSINESS_STATE_CODE =
    Number(import.meta.env.VITE_BUSINESS_STATE_CODE) || 34;

  const [formData, setFormData] = useState({
    purchaseNo: "",
    supplierId: "",
    supplierName: "",
    supplierStateCode: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    items: [],
    totalTaxableValue: 0,
    totalCGST: 0,
    totalSGST: 0,
    totalIGST: 0,
    totalTax: 0,
    totalDiscount: 0,
    totalAmount: 0,
    paymentMethod: "cash",
    amountPaid: 0,
    amountBalance: 0,
    status: "pending",
    notes: "",
  });

  const [currentItem, setCurrentItem] = useState({
    itemId: "",
    quantity: 1,
    purchasePrice: 0,
    gstPercentage: 0,
    discountAmount: 0,
    discountPercentage: 0,
  });

  // --- HELPER: Global Focus Back to Barcode ---
  const focusBarcode = () => {
    setTimeout(() => {
      if (barcodeRef.current) barcodeRef.current.focus();
    }, 10);
  };

  const resetForm = () => {
    setFormData({
      purchaseNo: "",
      supplierId: "",
      supplierName: "",
      supplierStateCode: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      items: [],
      totalTaxableValue: 0,
      totalCGST: 0,
      totalSGST: 0,
      totalIGST: 0,
      totalTax: 0,
      totalDiscount: 0,
      totalAmount: 0,
      status: "pending",
      notes: "",
    });
    setEditingId(null);
    focusBarcode();
  };

  const isFormValid = () => {
    return (
      formData.purchaseNo.trim() !== "" &&
      formData.supplierId !== "" &&
      formData.items.length > 0 &&
      formData.totalAmount > 0
    );
  };

  useEffect(() => {
    fetchPurchases();
    fetchItems();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (showForm) focusBarcode();
  }, [showForm]);

  // Recalculate Totals whenever items change
  useEffect(() => {
    calculateFinalTotals();
  }, [formData.items]);

  const fetchPurchases = async () => {
    setLoading(true);
    const response = await safeCall(api.get("/purchase/load"));
    if (response.success) setPurchases(response.data);
    setLoading(false);
  };

  const fetchItems = async () => {
    const response = await safeCall(api.get("/item_master/load"));
    if (response.success) setItems(response.data);
  };

  const handleItemSelect = (itemId) => {
    const selected = items.find((i) => i._id === itemId);
    if (selected) {
      setCurrentItem((prev) => ({
        ...prev,
        itemId: itemId,
        purchasePrice: selected.purchasePrice || 0,
        gstPercentage: selected.gstPercentage || 0,
      }));
    }
  };

  const calculateFinalTotals = () => {
    const totals = formData.items.reduce(
      (acc, item) => {
        acc.taxable += item.taxableValue || 0;
        acc.cgst += item.cgst || 0;
        acc.sgst += item.sgst || 0;
        acc.igst += item.igst || 0;
        acc.discount += item.discountAmount || 0;
        return acc;
      },
      { taxable: 0, cgst: 0, sgst: 0, igst: 0, discount: 0 }
    );

    const totalTax = totals.cgst + totals.sgst + totals.igst;

    setFormData((prev) => ({
      ...prev,
      totalTaxableValue: Number(totals.taxable.toFixed(2)),
      totalCGST: Number(totals.cgst.toFixed(2)),
      totalSGST: Number(totals.sgst.toFixed(2)),
      totalIGST: Number(totals.igst.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      totalDiscount: Number(totals.discount.toFixed(2)),
      totalAmount: Math.round(totals.taxable + totalTax),
    }));
  };

  // --- CORE LOGIC: SUPPLIER CHANGE TAX SWITCHING ---
  // --- 2. INSTANT SUPPLIER & TAX SWITCHING ---
  const handleSupplierSelect = (supplier) => {
    const newSupplierState = Number(supplier.state_code || 0);
    const isInterState = newSupplierState !== MY_BUSINESS_STATE_CODE;

    setFormData((prev) => {
      // Recalculate tax split for all existing items in the cart immediately
      const updatedItems = prev.items.map((item) => {
        const totalGst = Number(item.gstAmount || 0);
        const gstSplit = isInterState
          ? { igst: totalGst, cgst: 0, sgst: 0 }
          : { igst: 0, cgst: totalGst / 2, sgst: totalGst / 2 };

        return { ...item, ...gstSplit };
      });

      return {
        ...prev,
        supplierId: supplier._id,
        supplierName: supplier.name,
        supplierStateCode: newSupplierState,
        items: updatedItems,
      };
    });

    setTimeout(() => barcodeRef.current?.focus(), 50);
  };

  // --- 3. TOTALS CALCULATION ---
  useEffect(() => {
    const totals = formData.items.reduce(
      (acc, item) => {
        acc.taxable += Number(item.taxableValue || 0);
        acc.cgst += Number(item.cgst || 0);
        acc.sgst += Number(item.sgst || 0);
        acc.igst += Number(item.igst || 0);
        acc.discount += Number(item.discountAmount || 0);
        return acc;
      },
      { taxable: 0, cgst: 0, sgst: 0, igst: 0, discount: 0 }
    );

    const totalTax = totals.cgst + totals.sgst + totals.igst;
    setFormData((prev) => ({
      ...prev,
      totalTaxableValue: Number(totals.taxable.toFixed(2)),
      totalCGST: Number(totals.cgst.toFixed(2)),
      totalSGST: Number(totals.sgst.toFixed(2)),
      totalIGST: Number(totals.igst.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      totalDiscount: Number(totals.discount.toFixed(2)),
      totalAmount: Math.round(totals.taxable + totalTax),
    }));
  }, [formData.items]);

  // 1. Updated handleAddItem to be more robust
  const handleAddItem = () => {
    if (currentItem.itemId && currentItem.quantity > 0) {
      const selectedItem = items.find((i) => i._id === currentItem.itemId);
      const isInterState =
        Number(formData.supplierStateCode) !== MY_BUSINESS_STATE_CODE;

      const qty = Number(currentItem.quantity);
      const price = Number(currentItem.purchasePrice);
      const gstPct = Number(currentItem.gstPercentage);
      const discAmt = Number(currentItem.discountAmount);

      const taxableVal = qty * price - discAmt;
      const totalGst = (taxableVal * gstPct) / 100;

      const gstSplit = isInterState
        ? { igst: totalGst, cgst: 0, sgst: 0 }
        : { igst: 0, cgst: totalGst / 2, sgst: totalGst / 2 };

      const newItem = {
        itemId: currentItem.itemId,
        itemName: selectedItem?.itemName,
        quantity: qty,
        purchasePrice: price,
        discountPercentage: Number(currentItem.discountPercentage),
        discountAmount: discAmt,
        taxableValue: taxableVal,
        gstPercentage: gstPct,
        gstAmount: totalGst,
        ...gstSplit,
        total: taxableVal + totalGst,
      };

      setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
      setCurrentItem({
        itemId: "",
        quantity: 1,
        purchasePrice: 0,
        gstPercentage: 0,
        discountAmount: 0,
        discountPercentage: 0,
      });
      barcodeRef.current?.focus();
    }
  };

  // --- 1. FIXED BI-DIRECTIONAL DISCOUNT CALCULATION ---
  const handleDiscountChange = (value, type) => {
    const qty = Number(currentItem.quantity) || 0;
    const price = Number(currentItem.purchasePrice) || 0;
    const totalBeforeDiscount = qty * price;

    if (value === "" || value === null) {
      setCurrentItem((prev) => ({
        ...prev,
        discountPercentage: "",
        discountAmount: "",
      }));
      return;
    }

    const numericValue = parseFloat(value);

    if (type === "percentage") {
      const calculatedAmt =
        totalBeforeDiscount > 0
          ? (totalBeforeDiscount * numericValue) / 100
          : 0;
      setCurrentItem((prev) => ({
        ...prev,
        discountPercentage: value,
        discountAmount: Number(calculatedAmt.toFixed(2)), // Keep as number for the math
      }));
    } else {
      const calculatedPct =
        totalBeforeDiscount > 0
          ? (numericValue / totalBeforeDiscount) * 100
          : 0;
      setCurrentItem((prev) => ({
        ...prev,
        discountAmount: value,
        discountPercentage: Number(calculatedPct.toFixed(2)),
      }));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isFormValid() || loading) return;

    const response = editingId
      ? await safeCall(api.put(`/purchase/${editingId}`, formData))
      : await safeCall(api.post("/purchase/insert", formData));

    if (response.success) {
      resetForm();
      fetchPurchases();
      setShowForm(false);
    }
  };

  // --- 4. KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F2" && showForm && formData.items.length > 0) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForm, formData]);

  const handleAddNew = () => {
    setIsModalOpen(true);
  };


  useEffect(()=>{

    const amtPaid = Number(formData.amountPaid).toFixed(2);
    const balanceAmt = Number(formData.totalAmount) - Number(formData.amountPaid);

    setFormData((prev)=>({
      ...prev,
  
      amountBalance:balanceAmt.toFixed(2)
    }))
  },[formData.totalAmount, formData.amountPaid])


  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            PURCHASE MANAGEMENT
          </h1>
          <p className="text-sm text-slate-500">
            Create and manage your inward supply stock
          </p>
        </div>

        <div className="flex gap-4">
          {showForm && (
            <button
              onClick={handleAddNew}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus size={18} /> Add Supplier
            </button>
          )}

          <button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) resetForm();
            }}
            className={`px-6 py-2 rounded-lg font-bold transition-all shadow-md flex items-center gap-2 ${
              showForm
                ? "bg-white text-red-500 border border-red-200"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {showForm ? (
              "Close"
            ) : (
              <>
                <PlusCircle size={18} /> New Purchase
              </>
            )}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="md:col-span-1">
                <SupplierAutocomplete
                  onSelect={handleSupplierSelect}
                  defaultValue={formData.supplierName}
                />
              </div>
              <div className="relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase absolute left-3 top-2 z-10">
                  Purchase No
                </label>
                <input
                  type="text"
                  value={formData.purchaseNo}
                  onChange={(e) =>
                    setFormData({ ...formData, purchaseNo: e.target.value })
                  }
                  className="w-full border-2 border-slate-100 rounded-xl pt-6 pb-2 px-3 focus:border-blue-500 outline-none font-bold text-slate-700"
                  placeholder="PUR-001"
                  required
                />
              </div>
              <div className="relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase absolute left-3 top-2 z-10">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) =>
                    setFormData({ ...formData, purchaseDate: e.target.value })
                  }
                  className="w-full border-2 border-slate-100 rounded-xl pt-6 pb-2 px-3 focus:border-blue-500 outline-none font-bold text-slate-700"
                />
              </div>
              <div className="relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase absolute left-3 top-2 z-10">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  className="w-full border-2 border-slate-100 rounded-xl pt-6 pb-2 px-3 focus:border-blue-500 outline-none font-bold text-slate-700"
                />
              </div>
            </div>

            {/* Item Input Row */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-end mb-6">
              <div className="md:col-span-4">
                <ItemAutocomplete
                  barcodeRef={barcodeRef}
                  items={items}
                  onSelect={handleItemSelect}
                  selectedItemId={currentItem.itemId}
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                  Qty
                </label>
                <input
                  type="number"
                  value={currentItem.quantity}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, quantity: e.target.value })
                  }
                  className="w-full border-2 border-white rounded-lg p-2 outline-none focus:border-blue-400"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                  Price
                </label>
                <input
                  type="number"
                  value={currentItem.purchasePrice}
                  onChange={(e) =>
                    setCurrentItem({
                      ...currentItem,
                      purchasePrice: e.target.value,
                    })
                  }
                  className="w-full border-2 border-white rounded-lg p-2 outline-none focus:border-blue-400"
                />
              </div>
              {/* DISCOUNT PERCENTAGE */}
              <div className="md:col-span-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                  Disc %
                </label>
                <input
                  type="number"
                  value={currentItem.discountPercentage}
                  onChange={(e) =>
                    handleDiscountChange(e.target.value, "percentage")
                  } // Call the helper here
                  className="w-full border-2 border-white rounded-lg p-2 outline-none focus:border-blue-400"
                />
              </div>
              {/* DISCOUNT AMOUNT (NEW) */}
              <div className="md:col-span-1">
                <label className="text-[10px] font-bold text-orange-500 uppercase mb-1 block">
                  Disc Amt (₹)
                </label>
                <input
                  type="number"
                  value={currentItem.discountAmount}
                  onChange={(e) =>
                    handleDiscountChange(e.target.value, "amount")
                  }
                  className="w-full border-2 border-white rounded-lg p-2 outline-none focus:border-orange-400"
                  placeholder="0.00"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                  GST %
                </label>
                <input
                  type="number"
                  value={currentItem.gstPercentage}
                  onChange={(e) =>
                    setCurrentItem({
                      ...currentItem,
                      gstPercentage: e.target.value,
                    })
                  }
                  className="w-full border-2 border-white rounded-lg p-2 outline-none focus:border-blue-400"
                />
              </div>
              <div className="md:col-span-1">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition shadow-md flex justify-center"
                >
                  <PlusCircle size={20} />
                </button>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-100 rounded-xl overflow-x-auto mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-slate-200">
                    <th className="p-4 text-left font-semibold">
                      Item Details
                    </th>
                    <th className="p-4 text-right font-semibold">Qty</th>
                    <th className="p-4 text-right font-semibold">Rate</th>
                    <th className="p-4 text-right font-semibold">Disc %</th>
                    <th className="p-4 text-right font-semibold">Disc Amt</th>
                    <th className="p-4 text-right font-semibold">Taxable</th>
                    <th className="p-4 text-right font-semibold">GST %</th>
                    <th className="p-4 text-right font-semibold">GST Amt</th>
                    <th className="p-4 text-right font-semibold">Total</th>
                    <th className="p-4 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.items.map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-bold text-slate-700">
                          {item.itemName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          HSN: {item.hsnCode || "-"}
                        </div>
                      </td>
                      <td className="p-4 text-right font-semibold">
                        {item.quantity}
                      </td>
                      <td className="p-4 text-right text-slate-600">
                        ₹ {item.purchasePrice.toLocaleString()}
                      </td>
                      <td className="p-4 text-right text-orange-600">
                        {item.discountPercentage}%
                      </td>
                      <td className="p-4 text-right text-orange-700 font-medium">
                        -₹ {item.discountAmount.toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-medium text-slate-900 bg-slate-50/50">
                        ₹ {item.taxableValue.toFixed(2)}
                      </td>
                      <td className="p-4 text-right text-blue-600 font-semibold">
                        {item.gstPercentage}%
                      </td>
                      <td className="p-4 text-right text-blue-700">
                        ₹ {item.gstAmount.toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-black text-slate-600">
                        ₹ {item.total.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              items: prev.items.filter((_, i) => i !== index),
                            }))
                          }
                          className="text-red-300 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">
                  Notes / Terms
                </label>
                <textarea
                  rows="3"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-blue-500 outline-none text-sm"
                  placeholder="Any internal notes or supplier terms..."
                ></textarea>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 space-y-3">
                <div className="flex justify-between text-slate-500">
                  <span>Taxable Subtotal</span>
                  <span className="font-bold">
                    ₹ {formData.totalTaxableValue.toFixed(2)}
                  </span>
                </div>
                {formData.totalIGST > 0 ? (
                  <div className="flex justify-between text-blue-700 font-bold">
                    <span>IGST (Inter-State)</span>
                    <span>₹{formData.totalIGST.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-500">
                      <span>CGST Total</span>
                      <span className="font-bold">
                        ₹ {formData.totalCGST.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 border-b border-slate-200 pb-2">
                      <span>SGST Total</span>
                      <span className="font-bold">
                        ₹ {formData.totalSGST.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xl font-black text-slate-700">
                    GRAND TOTAL
                  </span>
                  <span className="text-3xl font-black text-blue-600">
                    ₹ {formData.totalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <label className="block">Pay - Type</label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    // onChange={handleInputChange}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethod: e.target.value,
                      })
                    }
                    className=" px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-purple-600"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">UPI</option>
                    <option value="card">Card</option>
                    <option value="check">Check</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>

                <div className="flex justify-between items-center">
                
                    <span className="text-md   text-slate-700">Amount Paid</span>
                    {/* <label className="block">Amount Paid</label> */}
                    <InputField
                      type="text"
                      value={(formData.amountPaid || 0)}
                      onChange={(e) =>
                        setFormData({ ...formData, amountPaid: e.target.value })
                      }
                   
                    />
                 
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-md   text-slate-700">
                    Balance Amount
                  </span>
                  <InputField
                    type="text"
                    value={(formData.amountBalance || 0)}
                    // onChange={(e) =>
                    //   setFormData({
                    //     ...formData,
                    //     amountBalance: e.target.value,
                    //   })
                    // }
                  />
                </div>

                <div className="mt-4">
                  {!formData.supplierId && (
                    <p className="text-[10px] text-red-500 font-bold mb-1">
                      ⚠️ Please select a Supplier
                    </p>
                  )}
                  {!formData.purchaseNo && (
                    <p className="text-[10px] text-red-500 font-bold mb-1">
                      ⚠️ Invoice No. Missing
                    </p>
                  )}
                  {formData.items.length === 0 && (
                    <p className="text-[10px] text-red-500 font-bold mb-1">
                      ⚠️ Add at least one item
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={!isFormValid() || loading}
                    className={`w-full py-2 rounded-xl font-black text-lg shadow-lg transition-all uppercase tracking-wider ${
                      isFormValid() && !loading
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                    }`}
                  >
                    {loading
                      ? "Processing..."
                      : editingId
                      ? "Update (F2)"
                      : "Save Purchase (F2)"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* List Table (Same as before but styled) */}
      {!showForm && (
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase">
                  Purchase No
                </th>
                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase">
                  Supplier
                </th>
                <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase">
                  Date
                </th>
                <th className="p-4 text-right text-xs font-bold text-slate-400 uppercase">
                  Amount
                </th>
                <th className="p-4 text-center text-xs font-bold text-slate-400 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {purchases.map((p) => (
                <tr
                  key={p._id}
                  className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                >
                  <td className="p-4 font-bold text-blue-600">
                    {p.purchaseNo}
                  </td>
                  <td className="p-4 text-slate-700 font-medium">
                    {p.supplierName}
                  </td>
                  <td className="p-4 text-slate-500">
                    {new Date(p.purchaseDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right font-bold text-slate-700">
                    ₹ {p.totalAmount.toFixed(2)}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        p.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>

                  <td>
                    <button
                      onClick={() => {
                        setSelectedPurchase(p);
                        setIsPaymentModalOpen(true);
                      }}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                    >
                      Pay Now
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {purchases.length === 0 && !loading && (
            <div className="p-20 text-center text-slate-400">
              <ReceiptText size={48} className="mx-auto mb-4 opacity-20" />
              <p>No purchase records found.</p>
            </div>
          )}
        </div>
      )}

      <SupplierFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSuppliers}
        // initialData={editingData}
      />

      <PurchasePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        purchase={selectedPurchase}
        onSuccess={fetchPurchases}
      />
    </div>
  );
};
