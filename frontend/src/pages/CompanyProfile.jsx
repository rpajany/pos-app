import React, { useState, useEffect } from "react";
import { api, safeCall } from "@/services/ApiService";
import { InputField } from "@/components/InputField";
import {
  Building2,
  Save,
  Upload,
  Landmark,
  CreditCard,
  Info,
} from "lucide-react";
import { toast } from "react-toastify";

export const CompanyProfile = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    address: "",
    phone: "",
    email: "",
    gstNumber: "",
    currencySymbol: "₹",
    logo: "",
    footerNote: "",
    bank_name: "",
    branch: "",
    acNumber: "",
    ifsc: "",
    micr: "",
  });

  useEffect(() => {
    const fetchCompany = async () => {
      const result = await safeCall(api.get("/company"));
      if (result.success && result.data) setFormData(result.data);
    };
    fetchCompany();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setFormData({ ...formData, logo: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await safeCall(api.post("/company/update", formData));
    if (result.success) {
      toast.success("Shop profile updated successfully!");
    }else if (result.message) {
      toast.error(`Error : ${result.message}`)
    }
    setLoading(false);
  };

  return (
    /* p-4 on mobile to save space, max-w-4xl for comfortable reading on desktop */
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 size={28} className="text-blue-600" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            Shop Settings
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. BUSINESS IDENTITY CARD */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
              <Info size={18} className="text-blue-500" />
              <h3 className="font-bold text-gray-700 text-sm md:text-base">
                Business Identity
              </h3>
            </div>

            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Logo Upload Section - Full width on all screens */}
              <div className="md:col-span-2 flex flex-col items-center p-6 border-2 border-dashed border-blue-100 bg-blue-50/30 rounded-xl transition-colors hover:bg-blue-50">
                {formData.logo ? (
                  <div className="relative group">
                    <img
                      src={formData.logo}
                      alt="Logo preview"
                      className="h-24 md:h-32 w-auto object-contain rounded-md shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo: "" })}
                      className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition"
                    >
                      <Save size={14} className="rotate-45" />{" "}
                      {/* Using rotate-45 as a cross icon alternative */}
                    </button>
                  </div>
                ) : (
                  <div className="text-center cursor-pointer">
                    <div className="bg-white p-3 rounded-full shadow-sm mx-auto w-fit mb-3">
                      <Upload className="text-blue-500" size={32} />
                    </div>
                    <p className="text-sm font-medium text-gray-600">
                      Upload Shop Logo
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Recommended: Square PNG/JPG
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-4 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              {/* Basic Fields */}
              <InputField
                label="Business Name"
                value={formData.name}
                required
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <InputField
                label="Tagline (Slogan)"
                value={formData.tagline}
                placeholder="e.g. Best Quality POS"
                onChange={(e) =>
                  setFormData({ ...formData, tagline: e.target.value })
                }
              />

              {/* Textarea - Full width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Full Address
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm min-h-[100px]"
                  placeholder="Enter shop address..."
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                />
              </div>

              <InputField
                label="GST Number"
                value={formData.gstNumber}
                onChange={(e) =>
                  setFormData({ ...formData, gstNumber: e.target.value })
                }
              />
              <InputField
                label="Phone Number"
                value={formData.phone}
                required
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
              <InputField
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              <InputField
                label="Currency Symbol"
                value={formData.currencySymbol}
                onChange={(e) =>
                  setFormData({ ...formData, currencySymbol: e.target.value })
                }
              />
            </div>
          </div>

          {/* 2. BANK DETAILS CARD */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b bg-green-50 flex items-center gap-2">
              <Landmark size={18} className="text-green-600" />
              <h3 className="font-bold text-gray-700 text-sm md:text-base">
                Bank Account Information
              </h3>
            </div>
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InputField
                label="Bank Name"
                value={formData.bank_name}
                onChange={(e) =>
                  setFormData({ ...formData, bank_name: e.target.value })
                }
              />
              <InputField
                label="Branch"
                value={formData.branch}
                onChange={(e) =>
                  setFormData({ ...formData, branch: e.target.value })
                }
              />
              <InputField
                label="A/C Number"
                value={formData.acNumber}
                onChange={(e) =>
                  setFormData({ ...formData, acNumber: e.target.value })
                }
              />
              <InputField
                label="IFSC Code"
                value={formData.ifsc}
                onChange={(e) =>
                  setFormData({ ...formData, ifsc: e.target.value })
                }
              />
              <InputField
                label="MICR Code"
                value={formData.micr}
                onChange={(e) =>
                  setFormData({ ...formData, micr: e.target.value })
                }
              />
            </div>
          </div>

          {/* 3. INVOICE CUSTOMIZATION */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
              <CreditCard size={18} className="text-gray-600" />
              <h3 className="font-bold text-gray-700 text-sm md:text-base">
                Invoice Customization
              </h3>
            </div>
            <div className="p-4 md:p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Invoice Footer Note
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="e.g. Thank you for shopping with us!"
                value={formData.footerNote}
                onChange={(e) =>
                  setFormData({ ...formData, footerNote: e.target.value })
                }
              />
            </div>
          </div>

          {/* Fixed Mobile / Sticky Desktop Save Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto md:min-w-[200px] bg-blue-600 text-white px-8 py-4 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={20} />
                  <span>Update Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
