"use client";
import { useState, useEffect } from "react";
import { api, safeCall } from "@/services/ApiService";
import { InputField } from "@/components/InputField";
import { X } from "lucide-react"; // Optional: for close icon

import { toast } from "react-toastify";



export const CustomerFormModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const [formData, setFormData] = useState({
    customerCode: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstNumber: "",
    customerType: "B2C",
    state_code: 0,
    is_sez: false,
    loyaltyPoints:0,
    creditLimit: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setFormData({
      customerCode: "", name: "", email: "", phone: "", address: "",
      city: "", state: "", pincode: "", gstNumber: "",
      customerType: "B2C", state_code: 0, is_sez: false, creditLimit: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (initialData?._id) {
       const res1 = await safeCall(api.put(`/customer/${initialData._id}`, formData));
       if(res1.success){
        toast.success(`Customer Updated Success !`)
       }
      } else {
        const res = await safeCall(api.post("/customer", formData));
         if(res.success){
        toast.success(`Customer Added Success !`)
       }
      }
      onSuccess(); // Refresh parent list
      onClose();   // Close modal
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error(`Error : ${error}`)
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-10 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? "Edit Customer" : "Add New Customer"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
             <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* <InputField label="Customer Code" name="customerCode" value={formData.customerCode} onChange={handleInputChange} /> */}
          <InputField label="Name" name="name" value={formData.name} onChange={handleInputChange} required />
          <InputField type="email" label="Email" name="email" value={formData.email} onChange={handleInputChange} />
          <InputField type="tel" label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} />
          <InputField label="Address" name="address" value={formData.address} onChange={handleInputChange} />
          <InputField label="City" name="city" value={formData.city} onChange={handleInputChange} />
          <InputField label="State" name="state" value={formData.state} onChange={handleInputChange} />
          <InputField label="PIN Code" name="pincode" value={formData.pincode} onChange={handleInputChange} />
          <InputField label="GST Number" name="gstNumber" value={formData.gstNumber} onChange={handleInputChange} />
          
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">State Code</label>
            <select name="state_code" value={formData.state_code} onChange={handleInputChange} className="w-full px-4 py-2 border rounded">
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
              {/* Add other options here */}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Customer Type</label>
            <select name="customerType" value={formData.customerType} onChange={handleInputChange} className="w-full px-4 py-2 border rounded">
              <option value="B2C">B2C</option>
              <option value="B2B">B2B</option>
            </select>
            <p><b>Note :</b> If customerType is B2C, you might want to make gstNumber optional; if B2B, it should be mandatory.</p>
          </div>

          

           <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Is SEZ?
              </label>
              <select
                name="is_sez"
                value={formData.is_sez}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-purple-600"
              >
                <option value={false}>No</option>
                <option value={true}>Yes</option>
              </select>

              <p>Zero-Rated Supply: When you sell to a customer in an SEZ, you don't usually charge GST (it's "Zero-Rated"), even if they are in the same state as you.</p>
            </div>

          <InputField type="number" label="Loyalty Points" min="0"  step="1" name="loyaltyPoints" value={formData.loyaltyPoints || 0} onChange={handleInputChange} />
          <InputField type="number" label="Credit Limit" name="creditLimit" value={formData.creditLimit || 0} onChange={handleInputChange} />


          <div className="col-span-full flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 border rounded hover:bg-gray-100">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-purple-700 text-white rounded hover:bg-purple-800">
              {initialData ? "Update" : "Save"} Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};