import React, { useState, useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { InputField } from "@/components/InputField";
import { api, safeCall, logoutUser } from "@/services/ApiService";
import "@/styles/ItemMaster.css";
import {
  Factory,
  Flag,
  Download,
  Search,
  Printer,
  BarcodeIcon,
  History,
} from "lucide-react";

export const ItemMaster = () => {
  const fileInputRef = useRef(null); // Create the ref
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // history
  const [historyData, setHistoryData] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedItemName, setSelectedItemName] = useState("");

  const [formData, setFormData] = useState({
    itemCode: "",
    itemName: "",
    nameTamil: "",
    description: "",
    category: "",
    barcode: "",
    purchasePrice: "",
    sellingPrice: "",
    hsnCode: "",
    gstPercentage: 0,
    discountPercentage: 0,
    stock: "",
    minStock: "",
    unit: "piece",
    supplier: "",
    photo: "",
  });

  const resetForm = () => {
    setFormData({
      itemCode: "",
      itemName: "",
      nameTamil: "",
      description: "",
      category: "",
      barcode: "",
      purchasePrice: "",
      sellingPrice: "",
      hsnCode: "",
      gstPercentage: 0,
      discountPercentage: 0,
      stock: "",
      minStock: "",
      unit: "piece",
      supplier: "",
      photo: "",
    });
    // Manually clear the file input name
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setEditingId(null);
    setShowForm(false);
    fetchItems();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const result = await safeCall(api.get("/item_master/load"));
      if (result.success) {
        setItems(result?.data);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Optional: Check file size (e.g., 1MB limit)
      if (file.size > 1048576) {
        alert("File is too large! Max limit is 1MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          photo: reader.result, // This is the Base64 string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    if (editingId) {
      const result = await safeCall(
        api.put(`/item_master/${editingId}`, formData)
      );
      if (result.success) {
        alert("Updated success!");
      }
    } else {
      const result = await safeCall(api.post("/item_master/insert", formData));
      if (result.success) {
        alert("Saved success!");
      }
    }

    resetForm();
    setLoading(false);
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditingId(item._id);
    setShowForm(true);
  };

  // 1. Search Logic: Filter items when searchTerm or items list changes
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = items.filter(
      (item) =>
        item.itemName?.toLowerCase().includes(term) ||
        item.itemCode?.toLowerCase().includes(term) ||
        item.barcode?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term)
    );
    setFilteredItems(filtered);
  }, [searchTerm, items]);

  // 2. CSV Download Logic
  const downloadCSV = () => {
    if (filteredItems.length === 0) return alert("No items to export");

    const headers = [
      "Item Code",
      "Item Name",
      "Category",
      "Barcode",
      "Purchase Price",
      "Selling Price",
      "Stock",
    ];
    const csvRows = [
      headers.join(","), // Header row
      ...filteredItems.map((item) =>
        [
          `"${item.itemCode}"`,
          `"${item.itemName}"`,
          `"${item.category}"`,
          `"${item.barcode || ""}"`,
          item.purchasePrice,
          item.sellingPrice,
          item.stock,
        ].join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute(
      "download",
      `ItemMaster_${new Date().toLocaleDateString()}.csv`
    );
    a.click();
  };

  // handel upload function..
  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = text.split("\n").slice(1); // Skip header row

      const itemsToUpload = rows
        .filter((row) => row.trim() !== "")
        .map((row) => {
          const columns = row.split(",");
          return {
            itemCode: columns[0]?.replace(/"/g, ""),
            itemName: columns[1]?.replace(/"/g, ""),
            category: columns[2]?.replace(/"/g, ""),
            barcode: columns[3]?.replace(/"/g, ""),
            purchasePrice: parseFloat(columns[4]) || 0,
            sellingPrice: parseFloat(columns[5]) || 0,
            stock: parseInt(columns[6]) || 0,
            unit: "piece",
            isActive: true,
          };
        });

      setUploading(true);
      try {
        const result = await safeCall(
          api.post("/item_master/bulk-insert", { items: itemsToUpload })
        );
        if (result.success) {
          alert(`${result.data.count} items imported successfully!`);
          fetchItems();
        }
      } catch (err) {
        alert("handleBulkUpload Import failed. Check CSV format.");
        console.log("Error handleBulkUpload :", err);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsText(file);
  };

  // 1. Soft Delete Logic
  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to deactivate this item? It will be hidden from the active list."
      )
    ) {
      const result = await safeCall(api.delete(`/item_master/${id}`));
      if (result.success) {
        // Remove from the local state list immediately
        setItems((prev) => prev.filter((item) => item._id !== id));
      }
    }
  };

  // 2. Barcode Auto-Focus Logic
  // This ensures that when a user scans a barcode, the text goes into the search bar automatically
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // If user is not typing in another input and presses a key, focus search
      if (
        document.activeElement.tagName !== "INPUT" &&
        document.activeElement.tagName !== "TEXTAREA" &&
        e.key.length === 1 // Only alphanumeric keys
      ) {
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const printLabels = (item) => {
    const qty = prompt(`How many labels for ${item.itemName}?`, "1");
    const quantity = parseInt(qty);

    if (isNaN(quantity) || quantity <= 0) return;

    const canvas = document.createElement("canvas");
    JsBarcode(canvas, item.barcode || item.itemCode, {
      format: "CODE128",
      width: 2,
      height: 40,
      displayValue: true,
      fontSize: 14,
    });

    const barcodeImg = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank");

    // Create the HTML for 'N' number of labels
    let labelsHtml = "";
    for (let i = 0; i < quantity; i++) {
      labelsHtml += `
      <div class="label-page">
        <div class="name">${item.itemName}</div>
        <img src="${barcodeImg}" />
        <div class="price">MRP: ₹${item.sellingPrice}</div>
      </div>
    `;
    }

    printWindow.document.write(`
    <html>
      <head>
        <title>Print Labels</title>
        <style>
          /* Define the sticker size */
          @page { size: 50mm 25mm; margin: 0; }
          body { margin: 0; padding: 0; }
          
          /* Force a new page (sticker) after each div */
          .label-page { 
            width: 50mm; 
            height: 25mm; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            page-break-after: always; 
            overflow: hidden;
            font-family: sans-serif;
          }
          .name { font-size: 10px; font-weight: bold; text-align: center; white-space: nowrap; }
          .price { font-size: 12px; margin-top: 2px; font-weight: bold; }
          img { max-width: 90%; height: auto; }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        ${labelsHtml}
      </body>
    </html>
  `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250); // 250ms is usually enough for a dataURL image to render
  };

  //   const printLabels = (item) => {
  //   const qty = prompt(`How many labels for ${item.itemName}?`, "1");
  //   const quantity = parseInt(qty);

  //   if (isNaN(quantity) || quantity <= 0) return;

  //   const canvas = document.createElement("canvas");
  //   JsBarcode(canvas, item.barcode || item.itemCode, {
  //     format: "CODE128",
  //     width: 2,
  //     height: 40,
  //     displayValue: true,
  //     fontSize: 14,
  //   });

  //   const barcodeImg = canvas.toDataURL("image/png");

  //   // 1. Open the window
  //   const printWindow = window.open("", "_blank");

  //   // 2. Generate HTML
  //   let labelsHtml = "";
  //   for (let i = 0; i < quantity; i++) {
  //     labelsHtml += `
  //       <div class="label-page">
  //         <div class="name">${item.itemName}</div>
  //         <img src="${barcodeImg}" />
  //         <div class="price">MRP: ₹${item.sellingPrice}</div>
  //       </div>`;
  //   }

  //   // 3. Write content (Note: Removed onload from body to handle it via JS)
  //   printWindow.document.write(`
  //     <html>
  //       <head>
  //         <title>Print Labels</title>
  //         <style>
  //           @page { size: 50mm 25mm; margin: 0; }
  //           body { margin: 0; padding: 0; font-family: sans-serif; }
  //           .label-page {
  //             width: 50mm;
  //             height: 25mm;
  //             display: flex;
  //             flex-direction: column;
  //             align-items: center;
  //             justify-content: center;
  //             page-break-after: always;
  //             break-inside: avoid;
  //             overflow: hidden;
  //           }
  //           .name { font-size: 10px; font-weight: bold; text-align: center; }
  //           .price { font-size: 12px; margin-top: 2px; font-weight: bold; }
  //           img { max-width: 95%; height: auto; }
  //         </style>
  //       </head>
  //       <body>
  //         ${labelsHtml}
  //       </body>
  //     </html>
  //   `);

  //   printWindow.document.close(); // Important for loading to finish

  //   // 4. Wait for images and content to render
  //   setTimeout(() => {
  //     printWindow.focus();
  //     printWindow.print();
  //     printWindow.close();
  //   }, 250); // 250ms is usually enough for a dataURL image to render
  // };

  const fetchStockHistory = async (itemId, itemName) => {
    setSelectedItemName(itemName);
    setLoading(true);
    try {
      // Calling the ledger endpoint
      const result = await safeCall(api.get(`/item_master/ledger/${itemId}`));
      if (result.success) {
        setHistoryData(result.data);
        setShowHistoryModal(true);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      alert("Could not load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const term = searchTerm.toLowerCase();

    const filtered = items.filter((item) => {
      // Check if it matches the search term
      const matchesSearch =
        item.itemName?.toLowerCase().includes(term) ||
        item.itemCode?.toLowerCase().includes(term) ||
        item.barcode?.toLowerCase().includes(term);

      // Check if it matches the category filter
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    setFilteredItems(filtered);
  }, [searchTerm, selectedCategory, items]);

  return (
    <div className="item-master border   rounded-md">
      <div className="flex justify-between px-2 py-2 header bg-amber-300 gap-2 rounded-t-md">
        {/* 1. HEADER */}
        <div className="flex gap-2 items-center">
          <h2 className="font-bold">Item Master</h2>
          <button
            className="bg-gray-100 hover:bg-gray-300 text-black px-3 py-1 text-sm rounded-md cursor-pointer transition"
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
          >
            {showForm ? "Cancel" : "+ New Item"}
          </button>
        </div>

        <div className="flex gap-2">
          {/* Hidden Input */}
          <input
            type="file"
            id="bulk-upload"
            hidden
            accept=".csv"
            onChange={handleBulkUpload}
          />

          {/* Upload Button */}
          <label
            htmlFor="bulk-upload"
            className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1 rounded-md text-sm cursor-pointer hover:bg-indigo-700 transition"
          >
            {uploading ? "Uploading..." : "Bulk Upload (CSV)"}
          </label>

          <button
            onClick={downloadCSV}
            className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 transition"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex  grid-cols-1 md:grid-cols-3 bg-gray-400 gap-4 pl-2 py-2">
        {/* 2. INSERT STOCK SUMMARY HERE */}

        {/* Total Items Card */}
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-xs uppercase font-semibold">
              Total Items
            </p>
            <p className="text-2xl font-bold text-gray-800">{items.length}</p>
          </div>
          <div className="bg-blue-50 p-2 rounded-full text-blue-500">
            <Factory size={20} />
          </div>
        </div>

        {/* Low Stock Card */}
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500 flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-xs uppercase font-semibold">
              Low Stock Alert
            </p>
            <p className="text-2xl font-bold text-red-600">
              {items.filter((i) => i.stock <= i.minStock).length}
            </p>
          </div>
          <div className="bg-red-50 p-2 rounded-full text-red-500">
            <Flag size={20} />
          </div>
        </div>

        {/* Inventory Value Card */}
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500 flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-xs uppercase font-semibold">
              Total Stock Value (Cost)
            </p>
            <p className="text-2xl font-bold text-gray-800">
              ₹
              {items
                .reduce(
                  (acc, curr) =>
                    acc +
                    Number(curr.purchasePrice || 0) * Number(curr.stock || 0),
                  0
                )
                .toLocaleString()}
            </p>
          </div>
          <div className="bg-green-50 p-2 rounded-full text-green-500">₹</div>
        </div>
      </div>

      {showForm && (
        <div className="form-section  p-3">
          <h3>{editingId ? "Edit Item" : "Add New Item"}</h3>
          <form onSubmit={handleSubmit} className="item-form">
            <div className="form-grid grid grid-cols-2 gap-4">
              <InputField
                type="text"
                label="Item Code"
                name="itemCode"
                placeholder="Item Code"
                value={formData.itemCode}
                onChange={handleInputChange}
                required
              />
              <InputField
                type="text"
                label="Item Name (English)"
                name="itemName"
                placeholder="Item Name"
                value={formData.itemName}
                onChange={handleInputChange}
                required
              />

              <InputField
                type="text"
                label="Item Name (Tamil)"
                 name="nameTamil"
                placeholder="எ.கா. அரிசி"
                value={formData.nameTamil}
               onChange={handleInputChange}
         
              />

              <InputField
                type="text"
                label="category"
                name="category"
                placeholder="Category"
                value={formData.category}
                onChange={handleInputChange}
                required
              />
              <InputField
                type="text"
                label="Barcode"
                name="barcode"
                placeholder="Barcode"
                value={formData.barcode}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <InputField
                type="number"
                label="Purchase Price"
                name="purchasePrice"
                placeholder="Purchase Price"
                value={formData.purchasePrice}
                onChange={handleInputChange}
                required
              />
              <InputField
                type="number"
                label="Selling Price"
                name="sellingPrice"
                placeholder="Selling Price"
                value={formData.sellingPrice}
                onChange={handleInputChange}
                required
              />

              <InputField
                type="text"
                label="HSN Code"
                name="hsnCode"
                placeholder="HSN Code"
                value={formData.hsnCode}
                onChange={handleInputChange}
              />

              <InputField
                type="number"
                label="GST %"
                name="gstPercentage"
                placeholder="GST %"
                value={formData.gstPercentage}
                onChange={handleInputChange}
                required
              />

              <InputField
                type="number"
                min="0"
                label="Discount %"
                name="discountPercentage"
                placeholder="Discount %"
                value={formData.discountPercentage}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <InputField
                type="number"
                label="Stock"
                name="stock"
                placeholder="Stock"
                value={formData.stock}
                onChange={handleInputChange}
                required
              />
              <InputField
                type="number"
                label="Min Stock"
                name="minStock"
                placeholder="Min Stock"
                value={formData.minStock}
                onChange={handleInputChange}
              />

              {/* <InputField
                type="text"
                label="unit"
                name="unit"
                placeholder="Unit"
                value={formData.unit}
                onChange={handleInputChange}
              /> */}

              {/* Replace the unit InputField with this */}
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none bg-white"
                >
                  <option value="piece">Piece (Pcs)</option>
                  <option value="kg">Kilogram (Kg)</option>
                  <option value="gram">Gram (g)</option>
                  <option value="box">Box</option>
                  <option value="liter">Liter (L)</option>
                  <option value="meter">Meter (m)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                type="text"
                label="Supplier"
                name="supplier"
                placeholder="Supplier"
                value={formData.supplier}
                onChange={handleInputChange}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  placeholder="Description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border rounded-md transition duration-200 outline-none border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-gray-700">
                  Item Photo
                </label>
                <div className="flex items-center gap-4">
                  {/* Hidden actual file input */}
                  <input
                    ref={fileInputRef} // Attach the ref here
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />

                  {/* Image Preview */}
                  {formData.photo && (
                    <div className="relative w-16 h-16 border rounded-md overflow-hidden bg-gray-100">
                      <img
                        src={formData.photo}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, photo: "" }));
                          if (fileInputRef.current)
                            fileInputRef.current.value = ""; // Clear name here too
                        }}
                        className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded-bl-md"
                      >
                        X
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-2">
              <button
                type="submit"
                className="btn-success px-3 py-1 rounded-md cursor-pointer"
              >
                {editingId ? "Update Item" : "Add Item"}
              </button>
            </div>
          </form>
        </div>
      )}

      <hr className=" border-blue-400"></hr>

      {/* 3. Improved Search Bar UI */}
      <div className=" flex  w-full search-container mt-4 px-3 ">
        <div className="w-1/2">
          <div className="flex items-stretch shadow-sm max-w-2xl">
            {/* The Glass Icon as a decorative prefix */}
            <div className="flex items-center justify-center bg-gray-100 border border-r-0 border-gray-300 px-3 rounded-l-lg text-gray-500">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search by Code, Name, Barcode or Category..."
              className="flex-1 px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Clear Button (Only shows when there is text) */}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="bg-white border-y border-gray-300 px-3 text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Showing {filteredItems.length} items
          </div>
        </div>

        <div className="w-1/2">
          {/* Add this inside your search-bar div */}
          <select
            className=" w-1/2 border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-amber-300"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {/* Generate unique categories from items list */}
            {[...new Set(items.map((i) => i.category))].map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="items-table px-3 bg-white rounded-lg shadow-md overflow-x-auto mb-2 mt-4">
        {loading ? (
          <p className="p-4 text-center">Loading items...</p>
        ) : (
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 border-b">
              <tr>
                {/* Headers remain same */}
                <th className="px-4 py-3 text-left font-semibold text-gray-800">
                  Item Code
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">
                  Item Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">
                  Category
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">
                  Barcode
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">
                  Price
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">
                  Stock
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-800">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Map over filteredItems instead of items */}
              {filteredItems.map((item) => (
                <tr
                  key={item._id}
                  className="border-b hover:bg-blue-50 transition"
                >
                  <td className="px-4 py-3 font-medium text-blue-700">
                    {item.itemCode}
                  </td>
                  <td className="px-4 py-3">{item.itemName}</td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-200 px-2 py-1 rounded text-xs">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {item.barcode || "-"}
                  </td>
                  <td className="px-4 py-3">₹{item.sellingPrice}</td>

                  <td className="px-6 py-4">
                    {item.stock <= item.minStock ? (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
                        Low: {item.stock}
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                        {item.stock}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          fetchStockHistory(item._id, item.itemName)
                        }
                        className="p-1.5 text-amber-600 hover:bg-amber-100 rounded border border-amber-300 transition"
                      >
                        <History size={16} />
                      </button>

                      <button
                        onClick={() => printLabels(item)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded border border-gray-300 transition"
                        title="Print Label"
                      >
                        {/* <Printer size={16} /> */}
                        <BarcodeIcon size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-white bg-blue-500 px-2   rounded-sm hover:underline mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-white bg-red-500 px-2  rounded-sm hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
              <h3 className="font-bold text-lg">
                Stock History: {selectedItemName}
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Change</th>
                    <th className="px-4 py-2">Final Stock</th>
                    <th className="px-4 py-2">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {historyData.map((log, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td
                        className={`px-4 py-2 font-bold ${
                          log.changeQuantity >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {log.changeQuantity >= 0
                          ? `+${log.changeQuantity}`
                          : log.changeQuantity}
                      </td>
                      <td className="px-4 py-2 font-medium">
                        {log.finalStock}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{log.reason}</td>
                    </tr>
                  ))}
                  {historyData.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-4">
                        No history found for this item.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-gray-50 border-t text-right">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
