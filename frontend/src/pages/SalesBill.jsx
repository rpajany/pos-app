// pages/SalesBill.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { api, safeCall } from "@/services/ApiService";
import ThermalReceipt from "../components/ThermalReceipt";
import CustomerAutocomplete from "../components/CustomerAutocomplete";
import ItemAutocomplete from "../components/ItemAutocomplete";
import { InputField } from "@/components/InputField";
import no_image from "@/assets/no_image.png";
import { format } from "date-fns";
import { POSA4 } from "@/services/POSA4";
import { PrintA5Invoice } from "@/services/PrintA5Invoice";
import { CustomerFormModal } from "@/components/CustomerFormModal";
import { SalesPaymentModal } from "@/components/SalesPaymentModal";
import { CircleX, SquareX } from "lucide-react";
import { toast } from "react-toastify";


export const SalesBill = () => {
  const [sales, setSales] = useState([]);
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  // const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeRef = useRef(null);
  // 1. Add a state for the key
  const [resetKey, setResetKey] = useState(0);

  // for report
  const today = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const MY_BUSINESS_STATE_CODE = import.meta.env.VITE_BUSINESS_STATE_CODE || 34;
  const MY_PRINT_MODE = import.meta.env.VITE_PRINT_MODE || "web";

  const [formData, setFormData] = useState({
    invoiceNo: "",
    customerId: "",
    customerType: "B2C", // Default to B2C
    saleDate: new Date().toISOString().split("T")[0],
    items: [],
    totalTaxableValue: 0, // Renamed from subtotal
    totalCGST: 0,
    totalSGST: 0,
    totalIGST: 0,
    totalTax: 0,
    totalPrice: 0,
    totalDiscount: 0,
    totalAmount: 0,
    paymentMethod: "Cash",
    status: "completed",
    notes: "",
    cashReceived: 0,
    upiReceived: 0,
    totalReceived: 0,
    balanceChange: 0,
    totalItems: 0,
    totalQty: 0,
    pointsEarned: 0, // <--- Add this
  });

  const [currentItem, setCurrentItem] = useState({
    itemId: "",
    quantity: 1,
    sellingPrice: 0,
    discountAmount: 0,
    gstPercentage: 0,
    discountPercentage: 0,
    photo: "",
  });

  const [selectedSale, setSelectedSale] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const receiptRef = useRef(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  // const token = localStorage.getItem("token");



console.log("showForm :",showForm)

  //  Reset form to initial state
  const reset_formData = () => {
    setResetKey((prev) => prev + 1); // This wipes the component clean
    setFormData({
      invoiceNo: "",
      customerId: "",
      saleDate: new Date().toISOString().split("T")[0],
      items: [],
      totalTaxableValue: 0,
      totalCGST: 0,
      totalSGST: 0,
      totalIGST: 0,
      totalTax: 0,
      totalPrice: 0,
      totalDiscount: 0,
      totalAmount: 0,
      paymentMethod: "cash",
      status: "completed",
      notes: "",
      cashReceived: 0,
      upiReceived: 0,
      totalReceived: 0,
      balanceChange: 0,
      totalItems: 0,
      totalQty: 0,
    });

    fetchSales();
    fetchItems();
    fetchCustomers();
  };

  // console.log("formData :", formData);
  // console.log("items :",items)
  console.log("selectedSale :", selectedSale);
  // console.log("currentItem :", currentItem);

  // Initial Load
  useEffect(() => {
    fetchSales(today, today);
    fetchItems();
    fetchCustomers();
    if (barcodeRef.current) barcodeRef.current.focus();
  }, []);

  // const calculateTotal = () => {

  //   const subtotal = formData.items.reduce(
  //     (sum, item) => sum + (item.total - item.gstAmount),
  //     0
  //   );
  //   const totalGST = formData.items.reduce(
  //     (sum, item) => sum + item.gstAmount,
  //     0
  //   );

  //   const totalDiscount = formData.items.reduce(
  //     (sum, item) => sum + item.discountAmount,
  //     0
  //   );

  //   // New: Summing up every item's quantity
  //   const totalQty = formData.items.reduce(
  //     (sum, item) => sum + Number(item.quantity || 0),
  //     0
  //   );

  //   const totalPrice = formData.items.reduce(
  //     (sum, item) => sum + Number(item.sellingPrice),
  //     0
  //   );

  //   const total = subtotal + totalGST; //- discountInput;

  //   // POINT CALCULATION: Based on Subtotal (Pre-tax)
  //   // Example: If Subtotal is ₹950 and Tax is ₹50 (Total ₹1000)
  //   // Customer gets 9 points (950/100), not 10 points.
  //   const earnedPoints = Math.floor(subtotal / 100);

  //   setFormData((prev) => ({
  //     ...prev,
  //     totalTaxableValue: Number(subtotal.toFixed(2)),
  //     totalTax: Number(totalGST.toFixed(2)),
  //     totalAmount: total,
  //     totalItems: formData.items.length,
  //     totalQty: totalQty, // Add this to your state
  //     totalDiscount: Number(totalDiscount.toFixed(2)),
  //     totalPrice: totalPrice,
  //     pointsEarned: earnedPoints, // Updated logic

  //   }));
  // };

  const calculateTotal = () => {
    const totals = formData.items.reduce(
      (acc, item) => {
        acc.taxable += item.taxableValue || 0;
        acc.cgst += item.cgst || 0;
        acc.sgst += item.sgst || 0;
        acc.igst += item.igst || 0;
        acc.discount += item.discountAmount || 0;
        acc.qty += Number(item.quantity || 0);
        acc.price += item.sellingPrice * item.quantity;
        return acc;
      },
      { taxable: 0, cgst: 0, sgst: 0, igst: 0, discount: 0, qty: 0, price: 0 }
    );

    const totalTax = totals.cgst + totals.sgst + totals.igst;

    setFormData((prev) => ({
      ...prev,
      totalTaxableValue: Number(totals.taxable.toFixed(2)),
      totalCGST: Number(totals.cgst.toFixed(2)),
      totalSGST: Number(totals.sgst.toFixed(2)),
      totalIGST: Number(totals.igst.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      totalDiscount: Number(totals.discount.toFixed(2)),
      totalQty: totals.qty,
      totalPrice: totals.price,
      totalAmount: Math.round(totals.taxable + totalTax), // Rounding for Final Bill
      isLargeB2C:
        !prev.customerId &&
        totals.igst > 0 &&
        totals.taxable + totalTax > 100000,
    }));
  };

  useEffect(() => {
    calculateTotal();
  }, [formData.items, formData.totalDiscount]);

  // Update fetchSales to accept dates
  const fetchSales = async (from = fromDate, to = toDate) => {
    setLoading(true);
    try {
      // Append query parameters to the URL
      const result = await safeCall(
        api.get(`/sales/load?from=${from}&to=${to}`)
      );
      if (result.success) {
        setSales(result?.data);
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await safeCall(api.get("/item_master/load"));
      if (response.success) {
        setItems(response.data);
      } else {
        alert("item not found!");
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await safeCall(api.get("/customer/load"));

      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  // const handleBarcodeInput = async (e) => {
  //   if (e.key === "Enter") {
  //     e.preventDefault();
  //     try {
  //       const response = await safeCall(
  //         api.get(`/item_master/barcode/${barcodeInput}`)
  //       );
  //       const item = response.data;
  //       setCurrentItem({
  //         itemId: item._id,
  //         quantity: 1,
  //         sellingPrice: item.sellingPrice,
  //         discount: 0,
  //         gstPercentage: item.gstPercentage || 0,
  //       });
  //       setBarcodeInput("");
  //     } catch (error) {
  //       alert("Item not found");
  //       setBarcodeInput("");
  //     }
  //   }
  // };

  // const handleAddItem = () => {
  //   if (currentItem.itemId && currentItem.quantity) {
  //     const qtyToAdd = Number.parseInt(currentItem.quantity);
  //     const sellingPrice = Number.parseFloat(currentItem.sellingPrice);
  //     const gstPct = currentItem.gstPercentage;

  //     setFormData((prev) => {
  //       // 1. Check if item already exists in the bill
  //       const existingItemIndex = prev.items.findIndex(
  //         (item) => item.itemId === currentItem.itemId
  //       );

  //       let updatedItems;

  //       if (existingItemIndex > -1) {
  //         // 2. Item exists: Update the quantity of the existing entry
  //         updatedItems = [...prev.items];
  //         const existingItem = updatedItems[existingItemIndex];

  //         const newQty = existingItem.quantity + qtyToAdd;

  //         // Recalculate values for the updated quantity
  //         const totalLinePrice = newQty * sellingPrice;
  //         // Re-apply discount based on the updated quantity
  //         const totalDiscount =
  //           (totalLinePrice * existingItem.discountPercentage) / 100;
  //         const priceAfterDiscount = totalLinePrice - totalDiscount;
  //         const gstAmount = (priceAfterDiscount * gstPct) / 100;

  //         updatedItems[existingItemIndex] = {
  //           ...existingItem,
  //           quantity: newQty,
  //           discountAmount: Number(totalDiscount.toFixed(2)),
  //           gstAmount: gstAmount,
  //           total: priceAfterDiscount + gstAmount,
  //         };
  //       } else {
  //         // 3. Item doesn't exist: Add as new row
  //         const itemPrice = qtyToAdd * sellingPrice;
  //         const itemDiscount = Number.parseFloat(
  //           currentItem.discountAmount || 0
  //         );
  //         const priceAfterDiscount = itemPrice - itemDiscount;
  //         const gstAmount = (priceAfterDiscount * gstPct) / 100;

  //         const newItem = {
  //           itemId: currentItem.itemId,
  //           quantity: qtyToAdd,
  //           sellingPrice: sellingPrice,
  //           discountPercentage: currentItem.discountPercentage,
  //           discountAmount: itemDiscount,
  //           gstPercentage: gstPct,
  //           gstAmount: gstAmount,
  //           total: priceAfterDiscount + gstAmount,
  //         };
  //         updatedItems = [...prev.items, newItem];
  //       }

  //       return {
  //         ...prev,
  //         items: updatedItems,
  //       };
  //     });

  //     // Reset current item input
  //     setCurrentItem({
  //       itemId: "",
  //       quantity: 1,
  //       sellingPrice: "",
  //       discountAmount: 0,
  //       gstPercentage: 0,
  //       discountPercentage: 0,
  //       photo: "",
  //     });

  //     if (barcodeRef.current) barcodeRef.current.focus();
  //   }
  // };

  const handleAddItem = () => {
    if (currentItem.itemId && currentItem.quantity) {
      const selectedItem = items.find((i) => i._id === currentItem.itemId);
      const qtyToAdd = Number.parseInt(currentItem.quantity);
      const sellingPrice = Number.parseFloat(currentItem.sellingPrice);
      const gstPct = currentItem.gstPercentage;

      // Determine if Inter-state (IGST) or Intra-state (CGST+SGST)
      const isInterState =
        formData.placeOfSupply &&
        formData.placeOfSupply !== MY_BUSINESS_STATE_CODE;

      setFormData((prev) => {
        const existingItemIndex = prev.items.findIndex(
          (item) => item.itemId === currentItem.itemId
        );
        let updatedItems = [...prev.items];

        const calculateItemGst = (taxableVal) => {
          const totalGst = (taxableVal * gstPct) / 100;
          if (isInterState) {
            return { igst: totalGst, cgst: 0, sgst: 0, gstAmount: totalGst };
          } else {
            return {
              igst: 0,
              cgst: totalGst / 2,
              sgst: totalGst / 2,
              gstAmount: totalGst,
            };
          }
        };

        if (existingItemIndex > -1) {
          const existingItem = updatedItems[existingItemIndex];
          const newQty = existingItem.quantity + qtyToAdd;
          const totalLinePrice = newQty * sellingPrice;
          const totalDiscount =
            (totalLinePrice * existingItem.discountPercentage) / 100;
          const taxableValue = totalLinePrice - totalDiscount;
          const gst = calculateItemGst(taxableValue);

          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQty,
            taxableValue: taxableValue,
            discountAmount: Number(totalDiscount.toFixed(2)),
            ...gst,
            total: taxableValue + gst.gstAmount,
          };
        } else {
          const totalLinePrice = qtyToAdd * sellingPrice;
          const itemDiscount = Number.parseFloat(
            currentItem.discountAmount || 0
          );
          const taxableValue = totalLinePrice - itemDiscount;
          const gst = calculateItemGst(taxableValue);

          updatedItems.push({
            itemId: currentItem.itemId,
            hsnCode: selectedItem?.hsnCode, // Snapshot HSN
            quantity: qtyToAdd,
            sellingPrice: sellingPrice,
            taxableValue: taxableValue,
            discountPercentage: currentItem.discountPercentage,
            discountAmount: itemDiscount,
            gstPercentage: gstPct,
            ...gst,
            total: taxableValue + gst.gstAmount,
          });
        }
        return { ...prev, items: updatedItems };
      });

      // Reset currentItem logic...
      setCurrentItem({
        itemId: "",
        quantity: 1,
        sellingPrice: "",
        discountAmount: 0,
        gstPercentage: 0,
        discountPercentage: 0,
        photo: "",
      });

      if (barcodeRef.current) barcodeRef.current.focus();
    }
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calculateReceived = () => {
    const cash = parseFloat(formData.cashReceived || 0);
    const upi = parseFloat(formData.upiReceived || 0);
    const totalReceived = cash + upi;
    const balance = totalReceived - formData.totalAmount;

    let updateStatus;

    if (totalReceived >= formData.totalAmount ) {
      updateStatus = "completed";
    } else {
      updateStatus = "pending";
    }

    setFormData((prev) => ({
      ...prev,
      status: updateStatus,
      totalReceived: Number(totalReceived.toFixed(2)),
      balanceChange: Number(balance.toFixed(2)), // > 0 ? balance : 0, // Only show change if they overpaid
    }));
  };

  // Trigger this whenever payments change
  useEffect(() => {
    calculateReceived();
  }, [formData.cashReceived, formData.upiReceived, formData.totalAmount]);

  // const handleInputChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }));
  // };

  //   const handleInputChange = (e) => {
  //   const { name, value } = e.target;

  //   // Convert to number if the value is not empty and is a valid number
  //   // Otherwise, keep it as the raw string value
  //   const processedValue = (value !== "" && !isNaN(value))
  //     ? parseFloat(value)
  //     : value;

  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: processedValue,
  //   }));
  // };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // List of fields that should always be numbers
    const numericFields = [
      "cashReceived",
      "upiReceived",
      "totalDiscount",
      "totalAmount",
    ];

    const processedValue = numericFields.includes(name)
      ? parseFloat(value) || 0 // Fallback to 0 if input is empty or invalid
      : value;

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  // call when an item is selected from the list,
  const handleCurrentItemChange = (e) => {
    console.log("qty change called");
    const { name, value } = e.target;

    // 1. Handle Item Selection from dropdown (already works, but keeping for logic)
    if (name === "itemId" && value) {
      const selectedItem = items.find((item) => item._id === value);

      console.log("selectedItem :", selectedItem);
      if (selectedItem) {
        const price = selectedItem.sellingPrice || 0;
        const discPct = selectedItem.discountPercentage || 0;

        setCurrentItem((prev) => ({
          ...prev,
          itemId: value,
          sellingPrice: selectedItem.sellingPrice,
          gstPercentage: selectedItem.gstPercentage || 0,
          quantity: 1,

          photo: selectedItem.photo,
          discountPercentage: discPct,
          discountAmount: (price * 1 * discPct) / 100, // Initial calculation for qty 1
        }));
      }
    }
    // 2. Handle Quantity, Price, or Discount % changes
    else {
      // setCurrentItem((prev) => ({
      //   ...prev,
      //   [name]: value,

      // }));

      setCurrentItem((prev) => {
        // Create the updated object with the new value first
        const updated = { ...prev, [name]: value };

        const qty = parseFloat(updated.quantity || 0);
        const price = parseFloat(updated.sellingPrice || 0);
        const discPct = parseFloat(updated.discountPercentage || 0);

        // Recalculate discountAmount based on new values
        // Formula: (Price * Qty * Discount%) / 100
        if (
          name === "quantity" ||
          name === "sellingPrice" ||
          name === "discountPercentage"
        ) {
          updated.discountAmount = (price * qty * discPct) / 100;
        }
        // Reverse calculation: If user manually changes Discount Amount, update the Percentage
        else if (name === "discountAmount") {
          const totalLinePrice = price * qty;
          updated.discountPercentage =
            totalLinePrice > 0 ? (parseFloat(value) / totalLinePrice) * 100 : 0;
        }

        return updated;
      });
    }
  };

  // const handleCurrentItemChange = (e) => {
  //   alert("handleCurrentItemChange - called")
  //   const { name, value } = e.target;
  //   const val = value === "" ? 0 : parseFloat(value);

  //   setCurrentItem((prev) => {
  //     let updatedItem = { ...prev, [name]: value };

  //     // Auto-fill details when an Item is selected
  //     if (name === "itemId" && value) {
  //       const selectedItem = items.find((item) => item._id === value);

  //       console.log("selectedItem :",selectedItem)

  //       if (selectedItem) {
  //         const price = selectedItem.sellingPrice || 0;
  //         const discPct = selectedItem.discountPercentage || 0;
  //         updatedItem = {
  //           ...prev,
  //           itemId: value,
  //           sellingPrice: price,
  //           gstPercentage: selectedItem.gstPercentage || 0,
  //           quantity: 1,
  //           discountPercentage: discPct,
  //           discountAmount: (price * discPct) / 100, // Calc Amount from Pct
  //         };
  //       }
  //     }
  //     // If user changes Discount Percentage input
  //     else if (name === "discountPercentage") {
  //       const price = parseFloat(prev.sellingPrice || 0);
  //       updatedItem.discount = ((price * val) / 100).toFixed(2);
  //     }
  //     // If user changes Discount Amount input
  //     else if (name === "discount") {
  //       const price = parseFloat(prev.sellingPrice || 0);
  //       updatedItem.discountPercentage = price > 0 ? ((val / price) * 100).toFixed(2) : 0;
  //     }

  //     return updatedItem;
  //   });
  // };

  const handleKeyDown = (e) => {
    // Check if the key pressed is 'Enter'
    if (e.key === "Enter") {
      e.preventDefault(); // Prevents the default form submission
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validation check
    if (formData.items.length === 0) {
      alert("Please add items to the sale");
      return;
    }

    setLoading(true);

    try {
      // 2. Build the full payload
      // We send 'formData' directly so the backend receives all required fields
      // like subtotal, totalAmount, tax, etc.
      const salePayload = {
        ...formData,
        // Ensure numeric fields are properly formatted
        discount: Number(formData.discount || 0),
        totalAmount: Number(formData.totalAmount),
        totalTaxableValue: Number(formData.totalTaxableValue),
        totalCGST: formData.totalCGST,
        totalSGST: formData.totalSGST,
        totalIGST: formData.totalIGST,
        // Ensure customerId is null if not selected to avoid Mongo errors
        customerId: formData.customerId || null,
      };

      // 3. Make the API call
      // Based on your previous error, we wrap it in an object if your backend expects req.body.formData
      const response = await safeCall(
        api.post("/sales/insert", { formData: salePayload })
      );

      if (response && response.success) {
        // 4. Handle success actions
        setSelectedSale(response.data);

        // Corrected template literal syntax (fixed the ₹ placement and backticks)
        // alert(`Sale created successfully! Invoice #${response.data.sale.invoiceNo}`);
        toast.success(`Saved Invoice #${response.data.sale.invoiceNo}`)

        // Optional: Handle printing
        if (handlePrintReceipt)
          handlePrintReceipt(response.data, MY_PRINT_MODE);

        // 5. Reset form to initial state
        reset_formData();

        // 6. Refresh the sales list
        fetchSales();
      } else {
        alert(response?.message || "Failed to create sale");
      }
    } catch (error) {
      console.error("Error creating sale:", error);
      alert("Error creating sale");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = async (sale, MY_PRINT_MODE) => {
    // console.log("sale :", sale);
    try {
      setLoading(true);

      // 1. Prepare the data (Enrich items with names if they are missing)
      const enrichedItems = sale.items.map((item) => ({
        ...item,
        itemName:
          items.find((i) => i._id === (item.itemId?._id || item.itemId))
            ?.itemName || "Unknown Item",
        nameTamil:
          items.find((i) => i._id === (item.itemId?._id || item.itemId))
            ?.nameTamil || "Unknown Item",
            sellingPrice:
            items.find((i) => i._id === (item.itemId?._id || item.itemId))
            ?.sellingPrice || "0",
      }));

      // 2. Find customer info for the print job
      const customerInfo = customers.find(
        (c) => c._id === (sale.customerId?._id || sale.customerId)
      );

      // console.log("enrichedItems :", enrichedItems);
      // console.log("customerInfo :", customerInfo);

      // 3. Construct the payload
      const printData = {
        ...sale,
        items: enrichedItems,
        customerInfo: customerInfo,
        customerName: customerInfo?.name || "Walk-in",
        // Add any other specific fields your print API expects
      };

      console.log("printData :", printData);

      if (MY_PRINT_MODE == "web") {
        PrintA5Invoice(printData);
        return;
      } else {
        // 2. Generate the HTML String using your template
        const htmlReceipt = POSA4(printData);

        // console.log("htmlReceipt :", htmlReceipt);

        // 3. Construct the payload
        const printPayload = {
          invoiceNo: sale.invoiceNo,
          html: htmlReceipt, // Sending the full HTML string
        };

        // 4. Send to your endpoint
        // Note: Make sure VITE_PRINT_URL is defined in your .env
        const PRINT_URL = import.meta.env.VITE_PRINT_URL;

        // We use api.post or safeCall depending on how your ApiService is structured
        const response = await safeCall(
          api.post(`${PRINT_URL}/print`, { data: printPayload })
        );

        if (response.success) {
          alert("Receipt sent to printer successfully!");
        } else {
          alert("Failed to print: " + (response.message || "Unknown error"));
        }
      }
    } catch (error) {
      console.error("Print Error:", error);
      alert("An error occurred while trying to print.");
    } finally {
      setLoading(false);
    }

    // setSelectedSale(sale);
    // setShowPrintPreview(true);
    // setTimeout(() => {
    //   if (receiptRef.current) {
    //     const printWindow = window.open("", "", "width=400,height=600");
    //     printWindow.document.write(receiptRef.current.innerHTML);
    //     printWindow.document.close();
    //     printWindow.print();
    //     setShowPrintPreview(false);
    //   }
    // }, 100);
  };

  // download report
  const downloadCSV = () => {
    if (sales.length === 0) return alert("No data to download");

    // Define Headers
    const headers = [
      "Date",
      "Invoice No",
      "Customer",
      "Total Items",
      "Total Amount",
      "Status",
    ];

    // Map Data
    const rows = sales.map((sale) => [
      format(new Date(sale.createdAt), "dd-MM-yyyy"),
      `"${sale.invoiceNo}"`, // Quoted to prevent scientific notation in Excel
      sale.customerId?.name || "Walk-in",
      sale.items.length,
      sale.totalAmount,
      sale.status,
    ]);

    // Combine to string
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");

    // Create Download Link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Sales_Report_${fromDate}_to_${toDate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddNewCustomer = () => {
    // setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const openPaymentModal = (sale) => {
    setSelectedSale(sale);
    setIsPayModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold text-gray-800">Sales & Billing</h1>
          <div className="flex gap-4">
            {showForm && (
              <button
                onClick={handleAddNewCustomer}
                className="bg-gray-400 p-2 rounded-sm text-white"
              >
                + Customer
              </button>
            )}

            <button
              onClick={() => {
                if (showForm) reset_formData();
                setShowForm(!showForm);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              {showForm ? "Cancel" : "New Sale"}
            </button>
          </div>
        </div>

        {selectedSale?.length > 0    && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-semibold">
              Invoice Generated:{" "}
              <span className="text-lg text-green-900">
                {selectedSale.invoiceNo }
              </span>
            </p>
          </div>
        )}

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Create New Sale
            </h2>
            <form
              onSubmit={handleSubmit}
              onKeyDown={handleKeyDown}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* <input
                  type="text"
                  name="invoiceNo"
                  placeholder="Invoice Number"
                  value={formData.invoiceNo}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-purple-600"
                  readOnly
                  disabled
                /> */}

                <CustomerAutocomplete
                  key={resetKey}
                  customers={customers}
                  selectedCustomerId={formData.customerId}
                  // onSelect={(customerId) =>
                  //   setFormData((prev) => ({
                  //     ...prev,
                  //     customerId,
                  //   }))
                  // }

                  onSelect={(customerId) => {
                    const selectedCust = customers.find(
                      (c) => c._id === customerId
                    );
                    setFormData((prev) => ({
                      ...prev,
                      customerId,
                      customerType: selectedCust?.gstNumber ? "B2B" : "B2C",
                      placeOfSupply:
                        selectedCust?.state_code || MY_BUSINESS_STATE_CODE,
                      // Store the current balance in local state if needed
                      currentCustomerBalance: selectedCust?.loyaltyPoints || 0,
                    }));
                  }}
                />

                {/* {formData.customerId && (
                  <span className="text-xs font-bold text-indigo-600 mt-1">
                    Current loyaltyPoints:{" "}
                    {customers.find((c) => c._id === formData.customerId)
                      ?.loyaltyPoints || 0}{" "}
                    Pts
                  </span>
                )} */}

                <input
                  type="date"
                  name="saleDate"
                  value={formData.saleDate}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-purple-600"
                />
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-purple-600"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Check">Check</option>
                  <option value="Credit">Credit</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              {/* <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Barcode Scanner
                </h3>
                <input
                  ref={barcodeRef}
                  type="text"
                  placeholder="Scan or enter barcode..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeInput}
                  className="w-full px-4 py-2 border-2 border-purple-600 rounded focus:outline-none"
                />
              </div> */}

              <div className="border-t pt-4">
                <div className="flex grid-cols-2 mb-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Add Items
                    </h3>
                  </div>
                  <div className="flex border border-gray-300 w-12 h-12 items-center justify-center rounded-sm bg-gray-50 ">
                    <img
                      src={currentItem.photo || no_image}
                      alt="product-image"
                      className="w-10 h-10 m-0.5 "
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2 items-center">
                  <ItemAutocomplete
                    barcodeRef={barcodeRef}
                    items={items}
                    selectedItemId={currentItem.itemId}
                    onSelect={(itemId) => {
                      const selectedItem = items.find(
                        (item) => item._id === itemId
                      );
                      if (selectedItem) {
                        setCurrentItem((prev) => ({
                          ...prev,
                          itemId: itemId,
                          sellingPrice: selectedItem.sellingPrice,
                          gstPercentage: selectedItem.gstPercentage || 0,
                          quantity: 1,
                          photo: selectedItem.photo,
                          discountPercentage:
                            selectedItem.discountPercentage || 0,
                          discountAmount:
                            (selectedItem.sellingPrice *
                              1 *
                              selectedItem.discountPercentage) /
                            100,
                        }));
                      }
                    }}
                  />

                  <InputField
                    label="Qty"
                    type="number"
                    name="quantity"
                    placeholder="Qty"
                    value={currentItem.quantity}
                    onChange={handleCurrentItemChange}
                    min="1"
                    size="w-30"
                    // className="   px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-purple-600"
                  />
                  <InputField
                    label="Price"
                    type="number"
                    name="sellingPrice"
                    placeholder="Price"
                    value={Number(currentItem.sellingPrice).toFixed(2)}
                    onChange={handleCurrentItemChange}
                    size="w-40"
                    // className="   px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-purple-600"
                  />

                  <InputField
                    label="Discount %"
                    type="number"
                    name="discountPercentage"
                    placeholder="discount Percentage"
                    value={currentItem.discountPercentage}
                    onChange={handleCurrentItemChange}
                    size="w-30"
                    // className="  px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-purple-600"
                  />

                  <InputField
                    label="Discount Amt"
                    type="number"
                    name="discountAmount"
                    placeholder="discountAmount"
                    value={currentItem.discountAmount.toFixed(2)}
                    onChange={handleCurrentItemChange}
                    size="w-40"
                    // className="  px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-purple-600"
                  />

                  <div>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-2 py-1 bg-yellow-600 text-white font-semibold rounded hover:opacity-90 transition"
                    >
                      Add Item
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto bg-white rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Item</th>
                        <th className="px-4 py-2 text-left">Qty</th>
                        <th className="px-4 py-2 text-left">Price</th>
                        <th className="px-4 py-2 text-left">Disc%</th>
                        <th className="px-4 py-2 text-left">Disc Amt</th>
                        <th className="px-4 py-2 text-left">GST%</th>
                        <th className="px-4 py-2 text-left">GST Amt</th>
                        <th className="px-4 py-2 text-left">Total</th>
                        <th className="px-4 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-2">
                            {items.find((i) => i._id === item.itemId)?.itemName}
                          </td>
                          <td className="px-4 py-2">{item.quantity}</td>
                          <td className="px-4 py-2">
                            ₹ {item.sellingPrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-2">
                            {item.discountPercentage}%
                          </td>
                          <td className="px-4 py-2">
                            ₹ {item.discountAmount.toFixed(2)}
                          </td>
                          {/* <td className="px-4 py-2">₹{item.discountAmount}</td> */}
                          <td className="px-4 py-2">{item.gstPercentage}%</td>
                          <td className="px-4 py-2">
                            ₹ {item.gstAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-2">
                            ₹ {item.total.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              className="text-red-600 hover:text-red-800  "
                              onClick={() => handleRemoveItem(index)}
                            >
                              <SquareX />
                              {/* <CircleX/>  */}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t pt-6 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  {/* <div>
                     <label className="text-sm text-gray-600">Total Price:</label>
                      <p className="text-2xl font-bold ">
                      ₹ {formData.totalPrice.toFixed(2)}
                    </p>
          
                  </div> */}

                  <div>
                    <label className="text-sm text-gray-600">
                      Total Discount:
                    </label>
                    <p className="text-2xl font-bold text-red-600">
                      ₹ {formData.totalDiscount.toFixed(2)}
                    </p>
                    {/* <input
                      type="number"
                      name="totalDiscount"
                      placeholder="Total Discount"
                      value={formData.totalDiscount}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded"
                    /> */}
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">
                      totalTaxableValue:
                    </label>
                    <p className="text-xl font-bold">
                      ₹ {formData.totalTaxableValue.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">GST:</label>
                    <p className="text-xl font-bold text-green-600">
                      ₹ {formData.totalTax.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Net Total:</label>
                    <p className="text-2xl font-bold text-blue-600">
                      ₹ {formData.totalAmount.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <div>
                      <label>Cash :</label>
                      <input
                        type="number"
                        name="cashReceived"
                        className="w-full p-2 border rounded"
                        value={formData.cashReceived}
                        onChange={handleInputChange}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label>UPI :</label>
                      <input
                        type="number"
                        name="upiReceived"
                        className="w-full p-2 border rounded"
                        value={formData.upiReceived}
                        onChange={handleInputChange}
                        placeholder="0.00"
                      />
                    </div>

                    {/* Summary Section */}
                    <div className="flex flex-col justify-center bg-white p-4 rounded shadow-sm">
                      <div className="flex justify-between mb-2">
                        <span>Total Received :</span>
                        <span className="font-bold">
                          ₹ {formData.totalReceived.toFixed(2)}
                          {/* ₹{typeof formData.totalReceived === "number" ? formData.totalReceived.toFixed(2) : "0.00"} */}
                        </span>
                      </div>
                      <div className="flex justify-between text-red-600 font-bold text-xl">
                        <span>Balance :</span>
                        <span>₹ {formData.balanceChange.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col mt-4">
                    <span className="text-gray-600">
                      Total Items:{" "}
                      <span className="font-bold text-indigo-600">
                        {formData.totalItems || formData.items.length}
                      </span>
                    </span>
                    <span className="text-gray-600">
                      Total Quantity:{" "}
                      <span className="font-bold text-indigo-600">
                        {formData.totalQty || 0}
                      </span>
                    </span>
                  </div>

                  {/* start Customer loyal points */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-1 bg-gray-100 rounded-lg border border-gray-300">
                    {/* 1. Show what they HAVE (from Database) */}
                    <div className="border-r border-gray-300 ">
                      <label className="text-xs text-gray-500 uppercase font-bold">
                        loyaltyPoints Balance
                      </label>
                      <p className="text-xl font-semibold text-gray-700">
                        {customers.find((c) => c._id === formData.customerId)
                          ?.loyaltyPoints || 0}{" "}
                        Pts
                      </p>
                    </div>

                    {/* 2. Show what they will GET (Current Calculation) */}
                    <div>
                      <label className="text-xs text-indigo-500 uppercase font-bold">
                        Earning Today
                      </label>
                      <p className="text-xl font-bold text-indigo-600">
                        + {formData.pointsEarned} Pts
                      </p>
                    </div>
                  </div>
                  {/* End Customer loyal points */}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-green-600 text-white font-semibold text-lg rounded hover:opacity-90 transition"
                >
                  Complete Sale
                </button>

                <button
                  onClick={() => {
                    if (showForm) reset_formData();
                    setShowForm(!showForm);
                  }}
                  className=" bg-red-400 text-white rounded-sm px-2 "
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {showPrintPreview && selectedSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 relative max-h-96 overflow-y-auto">
              <button
                onClick={() => setShowPrintPreview(false)}
                className="absolute top-4 right-4 text-2xl text-gray-600 hover:text-gray-800"
              >
                ✕
              </button>
              <ThermalReceipt
                ref={receiptRef}
                sale={selectedSale}
                customer={customers.find(
                  (c) => c._id === selectedSale.customerId
                )}
                items={selectedSale.items.map((item) => ({
                  ...item,
                  itemName:
                    items.find((i) => i._id === item.itemId)?.itemName ||
                    "Unknown Item",
                }))}
              />
            </div>
          </div>
        )}

      {!showForm && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => fetchSales(fromDate, toDate)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition font-medium"
            >
              View Report
            </button>
            <button
              onClick={downloadCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md transition font-medium"
            >
              Download CSV
            </button>
          </div>
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : (
               <div className="w-full overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Invoice</th>
                  <th className="px-6 py-3 text-left font-semibold">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left font-semibold">Date</th>
                  <th className="px-6 py-3 text-left font-semibold">Amount</th>
                  <th className="px-6 py-3 text-left font-semibold">Payment</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-6 py-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{sale.invoiceNo}</td>
                    <td className="px-6 py-4">
                      {sale.customerId?.name || "Walk-in"}
                    </td>
                    <td className="px-6 py-4">
                      {format(new Date(sale.saleDate), "dd-MM-yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      ₹{sale.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">{sale.paymentMethod}</td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          sale.status === "completed"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-amber-100 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {sale.status === "completed" ? "COMPLETED" : "PENDING"}
                      </span>
                    </td>

                    {/* NEW PAYMENT BUTTON COLUMN */}
                    <td className="p-4">
                      {sale.paymentStatus !== "Fully Paid" ? (
                        <button
                          onClick={() => openPaymentModal(sale)}
                          className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-200 hover:bg-blue-600 hover:text-white transition"
                        >
                          Pay Now
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          No Balance
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-4">
                        <button
                          onClick={() => handlePrintReceipt(sale, "web")}
                          className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:opacity-90"
                        >
                          Print (web)
                        </button>

                        <button
                          onClick={() => handlePrintReceipt(sale, "server")}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:opacity-90"
                        >
                          Print (server)
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
        )}
        
      </div>

      {/* The Modal */}
      <SalesPaymentModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        sale={selectedSale}
        onSuccess={fetchSales} // This re-fetches your report list
      />

      {isModalOpen && (
        <CustomerFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchCustomers}
          // initialData={selectedCustomer}
        />
      )}
    </div>
  );
};
