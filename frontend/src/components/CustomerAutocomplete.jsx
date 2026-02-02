"use client"

import { useState, useRef, useEffect } from "react"

const CustomerAutocomplete = ({ customers, selectedCustomerId, onSelect }) => {
  const [input, setInput] = useState("")
  const [filtered, setFiltered] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  const handleInputChange = (e) => {
    const value = e.target.value
    setInput(value)
    setIsOpen(true)

    if (value.trim()) {
      const results = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(value.toLowerCase()) || c.phone.toLowerCase().includes(value.toLowerCase()),
      )
      setFiltered(results)
    } else {
      setFiltered([])
    }
  }

  const handleSelectCustomer = (customer) => {
    setInput(`${customer.name} (${customer.phone})`)
    onSelect(customer._id)
    setIsOpen(false)
    setFiltered([])
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search customer by name or phone..."
        value={input}
        onChange={handleInputChange}
        onFocus={() => input && setIsOpen(true)}
        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-purple-600"
      />
      {isOpen && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-b shadow-lg z-10 max-h-48 overflow-y-auto">
          {filtered.map((customer) => (
            <div
              key={customer._id}
              onClick={() => handleSelectCustomer(customer)}
              className="px-4 py-2 hover:bg-indigo-100 cursor-pointer border-b last:border-b-0"
            >
              <div className="font-semibold text-gray-800">{customer.name}</div>
              <div className="text-sm text-gray-600">{customer.phone}</div>
            </div>
          ))}
        </div>
      )}
      {isOpen && input && filtered.length === 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-b shadow-lg p-3 text-gray-500 text-sm z-10">
          No customers found
        </div>
      )}
    </div>
  )
}

export default CustomerAutocomplete
