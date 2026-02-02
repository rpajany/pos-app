import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/useApp";

export const SupplierAutocomplete = ({ onSelect, defaultValue = "" }) => {
  const { suppliers } = useApp();
  const [search, setSearch] = useState(defaultValue);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  // Sync search text if defaultValue changes (e.g., on form reset)
  useEffect(() => {
    setSearch(defaultValue);
  }, [defaultValue]);

  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredSuppliers.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredSuppliers.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0) {
        handlePick(filteredSuppliers[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handlePick = (supplier) => {
    setSearch(supplier.name);
    setShowDropdown(false);
    onSelect(supplier); // Send data back to Purchase Page
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Supplier Name
      </label>
      <input
        type="text"
        className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        placeholder="Search supplier..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowDropdown(true);
          setSelectedIndex(0);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
      />

      {showDropdown && search && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
          {filteredSuppliers.length > 0 ? (
            filteredSuppliers.map((s, index) => (
              <li
                key={s._id}
                className={`p-3 cursor-pointer text-sm flex justify-between items-center transition-colors ${
                  index === selectedIndex ? "bg-blue-600 text-white" : "hover:bg-gray-50 text-gray-700"
                }`}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => handlePick(s)}
              >
                <div>
                  <div className="font-bold">{s.name}</div>
                  <div className={`text-xs ${index === selectedIndex ? "text-blue-100" : "text-gray-400"}`}>
                    {s.contactPerson} • {s.phone}
                  </div>
                </div>
                {index === selectedIndex && (
                  <span className="text-[10px] font-bold bg-white/20 px-1 rounded">ENTER</span>
                )}
              </li>
            ))
          ) : (
            <li className="p-3 text-sm text-gray-500 italic">No suppliers found</li>
          )}
        </ul>
      )}
    </div>
  );
};