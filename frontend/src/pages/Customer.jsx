"use client";

import { useState, useEffect } from "react";
import { api, safeCall } from "@/services/ApiService";
import { CustomerFormModal } from "@/components/CustomerFormModal";
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  CreditCard,
  Download,
} from "lucide-react";
import { toast } from "react-toastify";

export const Customer = () => {
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    const response = await safeCall(api.get("/customer/load"));
    if (response.success) setCustomers(response.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      const response = await safeCall(api.delete(`/customer/${id}`));
      if (response.success) {
        toast.success("Customer Delete Success !");
      } else if (response.message) {
        toast.error(`Error : ${response.message}`);
      }
      fetchCustomers();
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // CSV Export Logic
  const downloadCSV = () => {
    const headers = ["Code,Name,State,gstNumber,Points,Credit Limit\n"];
    const rows = filteredCustomers.map(
      (row) =>
        `${row.customerCode},${row.name},${row.state},${row.gstNumber},${row.loyaltyPoints},${row.creditLimit}`
    );

    const blob = new Blob([headers + rows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Customer_Report.csv`;
    a.click();
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
            Customer Management
          </h1>
          <p className="text-gray-500 text-sm">
            View and manage your business clients
          </p>
        </div>

        <div className="flex w-full md:w-auto  gap-4">
          <button
            onClick={handleAddNew}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-lg shadow-purple-200 transition-all active:scale-95"
          >
            <UserPlus size={20} />
            <span className="font-semibold">Add Customer</span>
          </button>

 
            <button
              onClick={downloadCSV}
              className=" flex items-center justify-center gap-2  border-2 border-green-300 bg-green-100 px-6 py-3 rounded-lg hover:bg-green-300"
            >
              
              <Download size={18} />
              <span>Export CSV</span>
            </button>
    
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Search by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none shadow-sm transition-all"
        />
      </div>

      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCustomers}
        initialData={selectedCustomer}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-gray-400">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700 mb-4"></div>
          <p>Loading customers...</p>
        </div>
      ) : (
        <>
          {/* MOBILE VIEW: Card Stack (Visible only on small screens) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredCustomers.map((customer) => (
              <div
                key={customer._id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="">ID:</span>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded uppercase">
                      {customer.customerCode}
                    </span>
                    <h3 className="text-lg font-bold text-gray-800 mt-1">
                      {customer.name}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(customer)}
                      className="p-2 text-blue-600 bg-blue-50 rounded-lg"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(customer._id)}
                      className="p-2 text-red-600 bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-2 text-sm pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={14} /> {customer.phone}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={14} /> {customer.city || "N/A"}
                  </div>
                  <div className="col-span-2 flex items-center gap-2 font-semibold text-green-700 bg-green-50 w-fit px-2 py-1 rounded">
                    <CreditCard size={14} /> Limit: ₹{customer.creditLimit}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP VIEW: Table (Hidden on mobile) */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="">
                <tr className="bg-gray-400 border-b border-gray-100">
                  <th className="px-6 py-4 font-bold text-gray-600 text-sm">
                    CODE
                  </th>
                  <th className="px-6 py-4 font-bold text-gray-600 text-sm">
                    NAME
                  </th>
                  <th className="px-6 py-4 font-bold text-gray-600 text-sm">
                    CONTACT
                  </th>
                  <th className="px-6 py-4 font-bold text-gray-600 text-sm">
                    CITY
                  </th>
                  <th className="px-6 py-4 font-bold text-gray-600 text-sm">
                    Points
                  </th>
                  <th className="px-6 py-4 font-bold text-gray-600 text-sm">
                    CREDIT LIMIT
                  </th>
                  <th className="px-6 py-4 font-bold text-gray-600 text-sm text-right">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer._id}
                    className="hover:bg-purple-50/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-purple-600">
                      {customer.customerCode}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {customer.phone}
                      </div>
                      <div className="text-xs text-gray-400">
                        {customer.email || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {customer.city || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {customer.loyaltyPoints || 0}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-700">
                      ₹ {customer.creditLimit}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(customer._id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {filteredCustomers.length === 0 && !loading && (
        <div className="text-center p-10 bg-white rounded-2xl border-2 border-dashed">
          <p className="text-gray-400">
            No customers found matching your search.
          </p>
        </div>
      )}
    </div>
  );
};
