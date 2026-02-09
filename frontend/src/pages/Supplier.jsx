"use client";

import React, { useState, useEffect } from "react";
import { api, safeCall } from "@/services/ApiService";
import { SupplierFormModal } from "@/components/SupplierFormModal";
import { Plus, Search, Download, Edit2, Trash2, Mail, Phone, Hash, UserCircle } from "lucide-react";

export const SupplierPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    const res = await safeCall(api.get("/supplier"));
    if (res.success) setSuppliers(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filteredSuppliers = suppliers?.filter((s) => {
    const search = searchTerm.toLowerCase();
    return (
      s.name?.toLowerCase().includes(search) ||
      s.phone?.includes(search) ||
      s.gstNumber?.toLowerCase().includes(search)
    );
  });

  const handleEdit = (supplier) => {
    setEditingData(supplier);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingData(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this supplier?")) {
      await safeCall(api.delete(`/supplier/${id}`));
      fetchSuppliers();
    }
  };

  const exportToCSV = () => {
    const headers = ["Name,Contact Person,Phone,Email,GST Number,Address"];
    const rows = suppliers.map(
      (s) => `"${s.name}","${s.contactPerson}","${s.phone}","${s.email}","${s.gstNumber || "N/A"}","${s.address?.replace(/,/g, " ") || ""}"`
    );
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Suppliers_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Supplier Management</h2>
          <p className="text-sm text-gray-500">Manage your business vendors and contact details</p>
        </div>

        <div className="flex w-full md:w-auto gap-2">
          <button 
            onClick={handleAddNew} 
            className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-md active:scale-95"
          >
            <Plus size={18} /> Add Supplier
          </button>
          <button
            onClick={exportToCSV}
            disabled={suppliers.length === 0}
            className="flex-1 md:flex-none bg-white text-green-700 border border-green-200 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-green-50 transition shadow-sm disabled:opacity-50"
          >
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      <SupplierFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchSuppliers}
        initialData={editingData}
      />

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, phone, or GST..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs md:text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full w-fit">
          Total Suppliers: {filteredSuppliers?.length || 0}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading Suppliers...</div>
      ) : (
        <>
          {/* MOBILE LIST VIEW (Cards) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredSuppliers?.map((s) => (
              <div key={s._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-blue-900 text-lg">{s.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Hash size={12} /> {s.gstNumber || "No GSTIN"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(s)} className="p-2 text-blue-600 bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(s._id)} className="p-2 text-red-600 bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                  </div>
                </div>
                
                <div className="space-y-2 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <UserCircle size={16} className="text-gray-400" />
                    <span>{s.contactPerson}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone size={16} className="text-gray-400" />
                    <span>{s.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail size={16} className="text-gray-400" />
                    <span className="truncate">{s.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
                <tr>
                  <th className="p-4 border-b">Supplier Details</th>
                  <th className="p-4 border-b">Contact Person</th>
                  <th className="p-4 border-b">State</th>
          
                  <th className="p-4 border-b">GSTIN</th>
                  <th className="p-4 border-b text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredSuppliers?.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="font-bold text-blue-900">{s.name}</div>
                      <div className="text-xs text-gray-400">{s.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-semibold text-gray-700">{s.contactPerson}</div>
                      <div className="text-xs text-gray-500">{s.phone}</div>
                    </td>
                    <td>{s.state}</td>
                    <td className="p-4">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                        {s.gstNumber || "---"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => handleEdit(s)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Edit2 size={18} /></button>
                        <button onClick={() => handleDelete(s._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && filteredSuppliers?.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center border border-dashed border-gray-300 mt-4">
          <p className="text-gray-400">No suppliers found.</p>
        </div>
      )}
    </div>
  );
};