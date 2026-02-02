"use client";
import React, { useState, useEffect } from "react";
import { api, safeCall } from "@/services/ApiService";
import { InputField } from "@/components/InputField";
import { useApp } from "@/context/useApp";
import { X } from "lucide-react";

export const SupplierFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
}) => {
      const { fetchSuppliers } = useApp();
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

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
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
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (initialData?._id) {
        await safeCall(api.put(`/supplier/${initialData._id}`, formData));
      } else {
        await safeCall(api.post("/supplier", formData));
      }
      fetchSuppliers();
      onSuccess(); // Refresh parent data
      onClose(); // Close the modal
    } catch (error) {
      console.error("Error saving supplier:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? "Edit Supplier" : "Add New Supplier"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              type="email"
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
              label="PIN Code"
              value={formData.pinCode}
              onChange={(e) =>
                setFormData({ ...formData, pinCode: e.target.value })
              }
            />
            <InputField
              label="State"
              value={formData.state}
              onChange={(e) =>
                setFormData({ ...formData, state: e.target.value })
              }
            />

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                State Code
              </label>
              <select
                value={formData.state_code}
                onChange={(e) =>
                  setFormData({ ...formData, state_code: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="0">-SELECT-</option>
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

          <div className="flex gap-3 mt-8 border-t pt-6">
            <button
              type="submit"
              className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 font-bold flex-1"
            >
              {initialData ? "Update Supplier" : "Save Supplier"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-100 text-gray-600 px-8 py-2 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
