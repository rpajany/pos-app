"use client";

import { useState, useEffect } from "react";
import { api, safeCall } from "@/services/ApiService";
import { InputField } from "@/components/InputField";
import { CustomerFormModal } from "@/components/CustomerFormModal";

export const Customer = () => {
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await safeCall(api.get("/customer/load"));
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
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
    if (window.confirm("Are you sure?")) {
      try {
        // await safeCall(api.delete(`http://localhost:5000/api/customers/${id}`));
        await safeCall(api.delete(`/customers/${id}`));
        fetchCustomers();
      } catch (error) {
        console.error("Error deleting customer:", error);
      }
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customerCode.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="flex-1 p-6 ml-64">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Customer Management</h1>
        <button onClick={handleAddNew} className="px-6 py-2 bg-purple-700 text-white rounded">+ New Customer</button>
      </div>

      <CustomerFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchCustomers}
        initialData={selectedCustomer}
      />

           <div className="mb-6">
        <input
          type="text"
          placeholder="Search by Customer Code or Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-purple-600"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-800">
                  Customer Code
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-800">
                  Name
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-800">
                  Email
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-800">
                  Phone
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-800">
                  City
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-800">
                  Credit Limit
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-800">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{customer.customerCode}</td>
                  <td className="px-6 py-4">{customer.name}</td>
                  <td className="px-6 py-4">{customer.email || "-"}</td>
                  <td className="px-6 py-4">{customer.phone}</td>
                  <td className="px-6 py-4">{customer.city || "-"}</td>
                  <td className="px-6 py-4">₹ {customer.creditLimit}</td>
                  <td className="px-6 py-4">
                    <button
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm mr-2 hover:opacity-90"
                      onClick={() => handleEdit(customer)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:opacity-90"
                      onClick={() => handleDelete(customer._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  
  );
};