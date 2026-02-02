import React, { useState, useEffect } from "react";
import { api, safeCall } from "@/services/ApiService";
import { InputField } from "@/components/InputField";
import { Building2, Save, Upload, MapPin } from "lucide-react";

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
    if (result.success) alert("Shop profile updated successfully!");
    setLoading(false);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Building2 size={32} className="text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Shop Settings</h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-xl overflow-hidden"
        >
          <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Business Identity</h3>
            {/* <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
            >
              <Save size={18} /> {loading ? "Saving..." : "Save Changes"}
            </button> */}
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Section */}
            <div className="md:col-span-2 flex flex-col items-center p-4 border-2 border-dashed border-gray-200 rounded-lg">
              {formData.logo ? (
                <div className="relative group">
                  <img
                    src={formData.logo}
                    alt="Logo"
                    className="h-32 w-auto object-contain mb-2"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logo: "" })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto text-gray-400 mb-2" size={40} />
                  <p className="text-sm text-gray-500">
                    Upload Shop Logo (Recommended: 200x200px)
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-2 text-sm"
              />
            </div>

            {/* Basic Info */}
            <InputField
              label="Business Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <InputField
              label="Tagline (Slogan)"
              value={formData.tagline}
              placeholder="e.g. Quality You Can Trust"
              onChange={(e) =>
                setFormData({ ...formData, tagline: e.target.value })
              }
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Address
              </label>
              <textarea
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                rows="3"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                required
              />
            </div>

            {/* Tax & Contact */}
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
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
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

            <h1 className="text-green-600">Bank Details </h1>
            {/* Bank Details */}
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
              label="AC Number"
              value={formData.acNumber}
              onChange={(e) =>
                setFormData({ ...formData, acNumber: e.target.value })
              }
            />

            <InputField
              label="IFSC"
              value={formData.ifsc}
              onChange={(e) =>
                setFormData({ ...formData, ifsc: e.target.value })
              }
            />

            <InputField
              label="MICR"
              value={formData.micr}
              onChange={(e) =>
                setFormData({ ...formData, micr: e.target.value })
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Footer Note
            </label>
            <input
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.footerNote}
              onChange={(e) =>
                setFormData({ ...formData, footerNote: e.target.value })
              }
            />
          </div>

          <div className="mt-4 mb-4 ">
            <button
              type="submit"
              disabled={loading}
              className="w-full    bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition"
            >
              <Save size={18} /> {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
