

// components/ItemAutocomplete.jsx
// "use client"

// import { useState, useEffect, useRef } from "react"

// const ItemAutocomplete = ({ items, selectedItemId, onSelect, barcodeRef }) => {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [filteredItems, setFilteredItems] = useState([])
//   const [showDropdown, setShowDropdown] = useState(false)
//   const [highlightedIndex, setHighlightedIndex] = useState(-1) // Track selection index
//   const dropdownRef = useRef(null)

//   useEffect(() => {
//     const term = searchTerm.toLowerCase().trim()
//     if (term) {
//       const filtered = items.filter(
//         (item) =>
//           item.itemName.toLowerCase().includes(term) ||
//           item.itemCode?.toLowerCase().includes(term) ||
//           (item.barcode && item.barcode.toLowerCase().includes(term))
//       )
//       setFilteredItems(filtered)
//       setShowDropdown(true)
//       setHighlightedIndex(0) // Reset highlight to first item on search
//     } else {
//       setFilteredItems([])
//       setShowDropdown(false)
//       setHighlightedIndex(-1)
//     }
//   }, [searchTerm, items])

//   const handleSelect = (itemId) => {
//     onSelect(itemId)
//     setSearchTerm("")
//     setShowDropdown(false)
//     setHighlightedIndex(-1)
//   }

//   const handleKeyDown = (e) => {
//     if (!showDropdown || filteredItems.length === 0) return

//     if (e.key === "ArrowDown") {
//       e.preventDefault()
//       setHighlightedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev))
//     } else if (e.key === "ArrowUp") {
//       e.preventDefault()
//       setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
//     } else if (e.key === "Enter") {
//       if (highlightedIndex >= 0) {
//         e.preventDefault()
//         handleSelect(filteredItems[highlightedIndex]._id)
//       }
//     } else if (e.key === "Escape") {
//       setShowDropdown(false)
//     }
//   }

//   const selectedItem = items.find((item) => item._id === selectedItemId)

//   return (
//     <div className="relative w-full">
//       <input
//        ref={barcodeRef}
//         type="text"
//         placeholder="Type name or scan barcode..."
//         value={searchTerm || (selectedItem ? selectedItem.itemName : "")}
//         onChange={(e) => setSearchTerm(e.target.value)}
//         onKeyDown={handleKeyDown} // Listen for arrows/enter
//         onFocus={() => searchTerm && setShowDropdown(true)}
//         className="w-full px-4 py-2 border-2 border-indigo-200 rounded focus:outline-none focus:border-indigo-600 font-medium"
//       />

//       {showDropdown && filteredItems.length > 0 && (
//         <div 
//           ref={dropdownRef}
//           className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded mt-1 shadow-2xl z-50 max-h-80 overflow-y-auto"
//         >
//           {filteredItems.map((item, index) => (
//             <div
//               key={item._id}
//               onClick={() => handleSelect(item._id)}
//               className={`px-4 py-3 cursor-pointer border-b last:border-b-0 flex justify-between items-center ${
//                 highlightedIndex === index ? "bg-indigo-600 text-white" : "hover:bg-indigo-50"
//               }`}
//             >
//               <div>
//                 <div className={`font-bold ${highlightedIndex === index ? "text-white" : "text-gray-800"}`}>
//                   {item.itemName}
//                 </div>
//                 <div className={`text-xs ${highlightedIndex === index ? "text-indigo-100" : "text-gray-500"}`}>
//                   Code: {item.itemCode} | Barcode: {item.barcode || 'N/A'}
//                 </div>
//               </div>
//               <div className="text-right">
//                 <div className={`font-bold ${highlightedIndex === index ? "text-white" : "text-indigo-600"}`}>
//                   ₹{item.sellingPrice}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   )
// }

// export default ItemAutocomplete

"use client";

import { useState, useEffect, useRef } from "react";

const ItemAutocomplete = ({ items, selectedItemId, onSelect, barcodeRef }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);

  // Filter items based on search term
  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      const filtered = items.filter(
        (item) =>
          item.itemName.toLowerCase().includes(term) ||
          item.itemCode?.toLowerCase().includes(term) ||
          (item.barcode && item.barcode.toLowerCase().includes(term))
      );
      setFilteredItems(filtered);
      setShowDropdown(true);
      setHighlightedIndex(0); // Default to first item for fast Enter/Scan
    } else {
      setFilteredItems([]);
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  }, [searchTerm, items]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (itemId) => {
    onSelect(itemId);
    setSearchTerm(""); // Clear search for the next scan/type
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || filteredItems.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(filteredItems[highlightedIndex]._id);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        break;
      default:
        break;
    }
  };

  const selectedItem = items.find((item) => item._id === selectedItemId);

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
        Search Item / Scan Barcode
      </label>
      <div className="relative">
        <input
          ref={barcodeRef}
          type="text"
          placeholder="Type name or scan..."
          value={searchTerm || (selectedItem ? selectedItem.itemName : "")}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm && setShowDropdown(true)}
          className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 font-medium transition-colors"
        />
        
        {/* Indicator for scan mode */}
        <div className="absolute right-3 top-2.5 text-slate-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect width="10" height="8" x="7" y="8" rx="1"/></svg>
        </div>
      </div>

      {showDropdown && filteredItems.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl mt-2 shadow-2xl z-[100] max-h-80 overflow-y-auto overflow-x-hidden"
        >
          <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
            Results ({filteredItems.length})
          </div>
          {filteredItems.map((item, index) => (
            <div
              key={item._id}
              onClick={() => handleSelect(item._id)}
              className={`px-4 py-3 cursor-pointer border-b border-slate-50 last:border-b-0 flex justify-between items-center transition-all ${
                highlightedIndex === index
                  ? "bg-blue-600 text-white translate-x-1"
                  : "hover:bg-blue-50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className={`font-bold truncate ${
                  highlightedIndex === index ? "text-white" : "text-slate-800"
                }`}>
                  {item.itemName}
                </div>
                <div className={`text-xs flex gap-2 ${
                  highlightedIndex === index ? "text-blue-100" : "text-slate-500"
                }`}>
                  <span>Code: {item.itemCode}</span>
                  <span>|</span>
                  <span className="font-mono">HSN: {item.hsnCode}</span>
                </div>
              </div>
              <div className="text-right ml-4">
                <div className={`font-black ${
                  highlightedIndex === index ? "text-white" : "text-blue-600"
                }`}>
                  ₹{item.purchasePrice || item.sellingPrice}
                </div>
                <div className={`text-[10px] font-bold ${
                  highlightedIndex === index ? "text-blue-200" : "text-slate-400"
                }`}>
                  Stock: {item.stock}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ItemAutocomplete;