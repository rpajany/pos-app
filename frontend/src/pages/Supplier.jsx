import React, { useState, useEffect } from "react";
import { api, safeCall } from "@/services/ApiService";
import { InputField } from "@/components/InputField";
import {SupplierFormModal} from "@/components/SupplierFormModal";
import { Plus, X, Search, Download } from "lucide-react";

export const SupplierPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // Search state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    gstNumber: "",
    address: "",
    pinCode: "",
    state: "",
    state_code: 0,
  });
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);

  const fetchSuppliers = async () => {
    const res = await safeCall(api.get("/supplier"));
    setSuppliers(res.data);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Filter Logic: Check name, phone, or gstNumber
  const filteredSuppliers = suppliers?.filter((s) => {
    const search = searchTerm.toLowerCase();
    return (
      s.name?.toLowerCase().includes(search) ||
      s.phone?.includes(search) ||
      s.gstNumber?.toLowerCase().includes(search)
    );
  });

  const resetForm = () => {
    setFormData({
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      gstNumber: "",
      address: "",
      pinCode: "",
      state: "",
      state_code: 0,
    });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await safeCall(api.put(`/supplier/${editingId}`, formData));
    } else {
      await safeCall(api.post("/supplier", formData));
    }
    resetForm();
    fetchSuppliers();
  };

  const handleEdit = (supplier) => {
    setFormData(supplier);
    setEditingId(supplier._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this supplier?")) {
      await safeCall(api.delete(`/supplier/${id}`));
      fetchSuppliers();
    }
  };

  const handleAddNew = () => {
    setEditingData(null);
    setIsModalOpen(true);
  };

  const exportToCSV = () => {
    // 1. Define the headers
    const headers = ["Name,Contact Person,Phone,Email,GST Number,Address"];

    // 2. Map the supplier data to rows
    const rows = suppliers.map(
      (s) =>
        `"${s.name}","${s.contactPerson}","${s.phone}","${s.email}","${
          s.gstNumber || "N/A"
        }","${s.address?.replace(/,/g, " ") || ""}"`
    );

    // 3. Combine headers and rows
    const csvContent = [headers, ...rows].join("\n");

    // 4. Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Suppliers_Export_${new Date().toLocaleDateString()}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Supplier Management
          </h2>
          <p className="text-sm text-gray-500">
            Manage your business vendors and contact details
          </p>
        </div>

        <div className="flex gap-2">
          {/* {!isFormOpen && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
            >
              <Plus size={18} /> Add Supplier
            </button>
          )} */}

          <button onClick={handleAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus size={18} /> Add Supplier
          </button>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            disabled={suppliers.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* Form Section (Same as previous step)
      {isFormOpen && (
        <div className="w-full animate-in fade-in slide-in-from-top-4 duration-300">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-100 relative"
          >
            <button
              type="button"
              onClick={resetForm}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              {editingId ? "Edit Supplier" : "New Supplier"}
            </h3>
            <div className="grid md:grid-cols-3 gap-x-6 gap-y-2">
              <InputField
                label="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <InputField
                label="Contact Person"
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
                required
              />
              <InputField
                label="GST Number"
                value={formData.gstNumber}
                onChange={(e) =>
                  setFormData({ ...formData, gstNumber: e.target.value })
                }
              />
              <InputField
                label="Phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
              />
              <InputField
                label="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
              <InputField
                label="Address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                required
              />

              <InputField
                type="text"
                label="PIN Code"
                name="pincode"
                placeholder="Pincode"
                value={formData.pinCode}
                onChange={(e) =>
                  setFormData({ ...formData, pinCode: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-purple-600"
              />

              <InputField
                type="text"
                label="State"
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-purple-600"
              />

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  State Code
                </label>
                <select
                  name="state_code"
                  value={formData.state_code}
                  onChange={(e) =>
                    setFormData({ ...formData, state_code: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-purple-600"
                >
                  <option value="">-SELECT-</option>
                  <option value="1">1 Jammu & Kashmir (or Ladakh)</option>
                  <option value="2">2. Himachal Pradesh</option>
                  <option value="3">3. Punjab </option>
                  <option value="4">4. Chandigarh</option>
                  <option value="5">5. Uttarakhand</option>
                  <option value="6">6. Haryana</option>
                  <option value="7">7. Delhi</option>
                  <option value="8">8. Rajasthan</option>
                  <option value="9">9. Uttar Pradesh</option>
                  <option value="10">10. Bihar</option>
                  <option value="11">11. Sikkim</option>
                  <option value="12">12. Arunachal Pradesh</option>
                  <option value="13">13. Nagaland</option>
                  <option value="14">14. Manipur </option>
                  <option value="15">15. Mizoram</option>
                  <option value="16">16. Tripura</option>
                  <option value="17">17. Meghalaya</option>
                  <option value="18">18. Assam</option>
                  <option value="19">19. West Bengal</option>
                  <option value="20">20. Jharkhand</option>
                  <option value="21">21. Odisha</option>
                  <option value="22">22. Chhattisgarh</option>
                  <option value="23">23. Madhya Pradesh</option>
                  <option value="24">24. Gujarat</option>
                  <option value="25">
                    25. Daman and Diu (now merged with Dadra & Nagar Haveli)
                  </option>
                  <option value="26">
                    26. Dadra and Nagar Haveli and Daman & Diu
                  </option>
                  <option value="27">27. Maharashtra</option>
                  <option value="28">
                    28. Andhra Pradesh (before division){" "}
                  </option>
                  <option value="29">29. Karnataka </option>
                  <option value="30">30. Goa </option>
                  <option value="31">31. Lakshadweep</option>
                  <option value="32">32. Kerala</option>
                  <option value="33">33. Tamil Nadu</option>
                  <option value="34">34. Puducherry (Pondicherry) </option>
                  <option value="35">35. Andaman & Nicobar Islands</option>
                  <option value="36">36. Telangana</option>
                  <option value="37">37. Andhra Pradesh (New)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex-1 font-semibold"
              >
                {editingId ? "Update" : "Save"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-100 text-gray-600 px-6 py-2 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )} */}

      <SupplierFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchSuppliers}
        initialData={editingData}
      />

      {/* Filter and Search Bar */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-t-xl border border-gray-100 border-b-0">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search by name, phone, or GST..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-500">
          Showing <b>{filteredSuppliers?.length || 0}</b> suppliers
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
            <tr>
              <th className="p-4 border-b">Name</th>
              <th className="p-4 border-b">Contact Info</th>
              <th className="p-4 border-b">GSTIN</th>
              <th className="p-4 border-b text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {filteredSuppliers && filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((s) => (
                <tr
                  key={s._id}
                  className="hover:bg-gray-50 border-b last:border-0 transition"
                >
                  <td className="p-4">
                    <div className="font-semibold text-blue-900">{s.name}</div>
                    <div className="text-xs text-gray-400">{s.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium">{s.contactPerson}</div>
                    <div className="text-xs text-gray-500">{s.phone}</div>
                  </td>
                  <td className="p-4 font-mono text-xs">
                    {s.gstNumber || "---"}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleEdit(s)}
                      className="text-blue-600 hover:underline mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s._id)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-12 text-center text-gray-400">
                  {searchTerm
                    ? "No suppliers match your search."
                    : "No suppliers registered yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
