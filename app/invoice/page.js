"use client";
import React, { useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Plus, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

export default function InvoicePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [logo, setLogo] = useState(null);
  const [amountPaid, setAmountPaid] = useState(0);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    from: "",
    billTo: "",
    shipTo: "",
    invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().slice(0, 10),
    paymentTerms: "",
    dueDate: "",
    poNumber: "",
    notes: "",
    terms: "",
  });

  const [items, setItems] = useState([
    { id: Date.now(), description: "", qty: 1, rate: 0, amount: 0 },
  ]);

  const [taxPercent, setTaxPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [shipping, setShipping] = useState(0);

  
  function updateForm(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function addItem() {
    setItems((p) => [...p, { id: Date.now() + Math.random(), description: "", qty: 1, rate: 0, amount: 0 }]);
  }

  function removeItem(id) {
    setItems((p) => p.filter((i) => i.id !== id));
  }

  function updateItem(id, key, value) {
    setItems((p) =>
      p.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [key]: value };
        const qty = Number(updated.qty) || 0;
        const rate = Number(updated.rate) || 0;
        updated.amount = +(qty * rate).toFixed(2);
        return updated;
      })
    );
  }

  const subtotal = items.reduce((s, i) => s + Number(i.amount || 0), 0);
  const taxAmount = +(subtotal * (Number(taxPercent) || 0) / 100).toFixed(2);
  const discountAmount = +(subtotal * (Number(discountPercent) || 0) / 100).toFixed(2);
  const total = +(subtotal + taxAmount - discountAmount + Number(shipping || 0)).toFixed(2);



async function handleDownloadPDF() {
  let processingToast;

  try {
    processingToast = toast.loading("🧾 Generating invoice, please wait...");

    // Prepare invoice data
    const invoiceData = {
      ...form,
      items,
      subtotal,
      taxPercent,
      taxAmount,
      discountPercent,
      discountAmount,
      shipping,
      total,
      amountPaid,
      balanceDue: Math.max(total - Number(amountPaid || 0), 0),
      logo,
    };

    // Send to backend
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoiceData),
    });

    if (!res.ok) throw new Error("Failed to save invoice");

    const savedInvoice = await res.json();
    const invoiceCode = savedInvoice.code || savedInvoice.invoiceNo;

    // ===== PDF Generation =====
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const darkGreen = [0, 63, 32];
    const lightGray = [120, 120, 120];
    const formatNum = (num) =>
      `Rs. ${Number(num || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`;

    // ===== HEADER =====
    if (logo) {
      try { doc.addImage(logo, "JPEG", 40, 25, 100, 50); }
      catch { doc.addImage(logo, 40, 25, 100, 50); }
    } else {
      doc.setFontSize(16);
      doc.setTextColor(...darkGreen);
      doc.text("GreenLeaf Enterprises", 40, 55);
    }

    doc.setFontSize(22);
    doc.setTextColor(...darkGreen);
    doc.text(`INVOICE`, 380, 55);
    doc.setFontSize(12);
    doc.text(`Code: ${invoiceCode}`, 380, 70);

    // ===== BILLING & SHIPPING INFO =====
    doc.setFontSize(10);
    doc.setTextColor(...lightGray);
    doc.text("Bill To:", 40, 110);
    doc.setTextColor(0);
    doc.text(doc.splitTextToSize(form.billTo || "-", 220), 40, 125);

    doc.setTextColor(...lightGray);
    doc.text("Ship To:", 300, 110);
    doc.setTextColor(0);
    doc.text(doc.splitTextToSize(form.shipTo || "-", 220), 300, 125);

    // ===== INVOICE DETAILS (Right side) =====
    const rightX = 430;
    let y = 110;
    const details = [
      ["Date:", form.date],
      ["Payment Terms:", form.paymentTerms || "-"],
      ["Due Date:", form.dueDate || "-"],
      ["PO Number:", form.poNumber || "-"],
    ];
    details.forEach(([label, val]) => {
      y += 15;
      doc.setTextColor(80);
      doc.text(label, rightX, y);
      doc.setTextColor(0);
      doc.text(val || "-", rightX + 100, y, { align: "right" });
    });

    // ===== ITEMS TABLE =====
    const tableBody = items.map((it) => [
      it.description || "-",
      it.qty,
      formatNum(it.rate),
      formatNum(it.amount),
    ]);

    autoTable(doc, {
      startY: 160,
      head: [["Item / Description", "Quantity", "Rate", "Amount"]],
      body: tableBody,
      styles: { fontSize: 10, halign: "left", valign: "middle" },
      headStyles: { fillColor: darkGreen, textColor: 255, halign: "center" },
      columnStyles: { 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "right" } },
      margin: { left: 40, right: 40 },
    });

    // ===== SUMMARY SECTION =====
    const finalY = doc.lastAutoTable.finalY + 20;
    const summaryX = 40;
    const summaryWidth = 515;
    const rowHeight = 20;

    doc.setFillColor(245, 245, 245);
    doc.rect(summaryX, finalY, summaryWidth, 140, "F");

    let ty = finalY + 25;
    const drawLine = (label, value, color = 0, bold = false, large = false) => {
      doc.setFont(undefined, bold ? "bold" : "normal");
      if (Array.isArray(color)) doc.setTextColor(...color);
      else doc.setTextColor(color);
      doc.setFontSize(large ? 13 : 11);
      doc.text(label, summaryX + 20, ty);
      doc.text(value, summaryX + summaryWidth - 20, ty, { align: "right" });
      ty += rowHeight;
    };

    drawLine("Subtotal:", formatNum(subtotal));
    drawLine(`Tax (${taxPercent}%):`, formatNum(taxAmount));
    drawLine(`Discount (${discountPercent}%):`, `- ${formatNum(discountAmount)}`);
    drawLine("Shipping:", formatNum(shipping));
    drawLine("Total:", formatNum(total), [0, 128, 0], true, true);
    drawLine("Amount Paid:", formatNum(amountPaid));
    drawLine("Balance Due:", formatNum(Math.max(total - Number(amountPaid || 0), 0)), [200, 0, 0], true, true);

    // ===== NOTES & TERMS =====
    let noteY = finalY + 170;
    doc.setDrawColor(200);
    doc.line(40, noteY - 10, 555, noteY - 10);

    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.setFont(undefined, "bold");
    doc.text("Notes:", 40, noteY);
    doc.setFont(undefined, "normal");
    doc.text(doc.splitTextToSize(form.notes || "-", 250), 40, noteY + 15);

    noteY += 60;
    doc.setFont(undefined, "bold");
    doc.text("Terms:", 40, noteY);
    doc.setFont(undefined, "normal");
    doc.text(doc.splitTextToSize(form.terms || "-", 250), 40, noteY + 15);

    // ===== FOOTER =====
    doc.setDrawColor(210);
    doc.line(40, 810, 555, 810);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("Thank you for your business!", 230, 825);

    doc.save(`Invoice_${invoiceCode}.pdf`);

    // ===== Success & Reset =====
    toast.success(`✅ Invoice ${invoiceCode} generated & saved successfully!`, { id: processingToast });
    setForm({
      from: "",
      billTo: "",
      shipTo: "",
      invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().slice(0, 10),
      paymentTerms: "",
      dueDate: "",
      poNumber: "",
      notes: "",
      terms: "",
    });
    setItems([{ id: Date.now(), description: "", qty: 1, rate: 0, amount: 0 }]);
    setAmountPaid(0);
    setTaxPercent(0);
    setDiscountPercent(0);
    setShipping(0);
    setLogo(null);
    if (fileRef.current) fileRef.current.value = null;

  } catch (err) {
    console.error(err);
    toast.error("❌ Error generating invoice", { id: processingToast });
  }
}








  const balanceDue = Math.max(total - Number(amountPaid || 0), 0).toFixed(2);

  return (
    <main className="flex bg-gray-50 min-h-screen">
  <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

  <div className="flex-1 w-full ">
    <MobileHeader toggleSidebar={toggleSidebar} />

    <div className="p-4 overflow-scroll h-[100vh] ">
      {/* --- Main Container --- */}
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-full mx-auto bg-white rounded-2xl shadow-md p-8 border border-gray-100">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#003f20] mb-2">
                GreenLeaf Enterprises
              </h1>
              <p className="text-sm text-gray-600 leading-tight">
                123 Business Street, Lahore, Pakistan <br />
                +92 300 1234567
              </p>
            </div>

            <div className="text-right">
              <h2 className="text-3xl font-bold text-[#003f20] tracking-wide">
                INVOICE
              </h2>
              <div className="mt-4 space-y-2 text-sm">
                
               <div className="flex justify-between gap-2">
  <label className="text-gray-600 w-28">Date</label>
  <input
    type="date"
    value={form.date}
    onChange={(e) => updateForm("date", e.target.value)}
    className="w-40 border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-[#005f33]"
  />
</div>
<div className="flex justify-between gap-2">
  <label className="text-gray-600 w-28">Payment Terms</label>
  <input
    value={form.paymentTerms}
    onChange={(e) => updateForm("paymentTerms", e.target.value)}
    placeholder="Net 7 / Net 30"
    className="w-40 border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-[#005f33]"
  />
</div>
<div className="flex justify-between gap-2">
  <label className="text-gray-600 w-28">Due Date</label>
  <input
    type="date"
    value={form.dueDate}
    onChange={(e) => updateForm("dueDate", e.target.value)}
    className="w-40 border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-[#005f33]"
  />
</div>
<div className="flex justify-between gap-2">
  <label className="text-gray-600 w-28">Phone Number</label>
  <input
    type="text"
    value={form.poNumber}
    onChange={(e) => updateForm("poNumber", e.target.value)}
    placeholder="Phone Number"
    className="w-40 border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-[#005f33]"
  />
</div>

                
              </div>
            </div>
          </div>

          {/* Bill To / Ship To */}
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bill To
              </label>
              <textarea
                value={form.billTo}
                onChange={(e) => updateForm("billTo", e.target.value)}
                placeholder="Client Name, Address, Phone..."
                className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#005f33] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ship To (optional)
              </label>
              <textarea
                value={form.shipTo}
                onChange={(e) => updateForm("shipTo", e.target.value)}
                placeholder="(optional)"
                className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#005f33] resize-none"
              />
            </div>
          </div>

          {/* Items */}
          <div className="mt-8">
  <div className="bg-[#003f20] text-white rounded-t-md p-3 grid grid-cols-12 gap-2 text-sm font-semibold">
    <div className="col-span-7">Item</div>
    <div className="col-span-2 text-center">Qty</div>
    <div className="col-span-2 text-center">Rate</div>
    <div className="col-span-1 text-right">Amount</div>
  </div>

  <div className="border border-t-0 rounded-b-md p-4 space-y-3 bg-white">
    {items.map((it) => (
      <div
        key={it.id}
        className="grid grid-cols-12 gap-2 items-center border-b pb-2"
      >
        <div className="col-span-7">
          <input
            value={it.description}
            onChange={(e) => updateItem(it.id, "description", e.target.value)}
            placeholder="Item or service description..."
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#005f33]"
          />
        </div>

        <div className="col-span-2">
          <input
            type="number"
            value={it.qty}
            onChange={(e) => updateItem(it.id, "qty", e.target.value)}
            className="w-full p-2 border rounded-md text-center focus:ring-1 focus:ring-[#005f33]"
          />
        </div>

        <div className="col-span-2 flex items-center gap-1">
          <span className="text-sm text-gray-600">Rs.</span>
          <input
            type="number"
            value={it.rate}
            onChange={(e) => updateItem(it.id, "rate", e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-1 focus:ring-[#005f33]"
          />
        </div>

        <div className="col-span-1 text-right">
          <span className="font-medium text-gray-700">
            Rs.{" "}
            {Number(it.amount || 0).toLocaleString("en-PK", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <button
            onClick={() => removeItem(it.id)}
            className="ml-2 text-red-500 hover:text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    ))}

    <button
      onClick={addItem}
      className="mt-3 inline-flex items-center gap-2 border border-green-500 text-green-700 hover:bg-green-50 px-3 py-2 rounded-md transition"
    >
      <Plus size={14} /> Add Item
    </button>
  </div>
</div>


          {/* Notes + Summary */}
          <div className="mt-8 grid grid-cols-12 gap-6">
            <div className="col-span-7 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateForm("notes", e.target.value)}
                  placeholder="Add any relevant notes..."
                  className="w-full h-24 p-3 border rounded-md focus:ring-1 focus:ring-[#005f33] resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Terms
                </label>
                <textarea
                  value={form.terms}
                  onChange={(e) => updateForm("terms", e.target.value)}
                  placeholder="Add payment or delivery terms..."
                  className="w-full h-24 p-3 border rounded-md focus:ring-1 focus:ring-[#005f33] resize-none"
                />
              </div>
            </div>

            {/* Summary */}
            {/* Summary */}
<div className="col-span-5 bg-gray-50 p-5 rounded-lg border border-gray-100">
  <div className="space-y-3 text-sm">
    <div className="flex justify-between">
      <span>Subtotal</span>
      <span className="font-medium">
        Rs. {Number(subtotal).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
      </span>
    </div>

    <div className="flex justify-between items-center">
      <label>Tax (%)</label>
      <input
        type="number"
        value={taxPercent}
        onChange={(e) => setTaxPercent(e.target.value)}
        className="w-24 p-2 border rounded-md text-center focus:ring-1 focus:ring-[#005f33]"
      />
    </div>

    <div className="flex justify-between items-center">
      <label>Discount (%)</label>
      <input
        type="number"
        value={discountPercent}
        onChange={(e) => setDiscountPercent(e.target.value)}
        className="w-24 p-2 border rounded-md text-center focus:ring-1 focus:ring-[#005f33]"
      />
    </div>

    <div className="flex justify-between items-center">
      <label>Shipping (Rs)</label>
      <input
        type="number"
        value={shipping}
        onChange={(e) => setShipping(e.target.value)}
        className="w-28 p-2 border rounded-md text-center focus:ring-1 focus:ring-[#005f33]"
      />
    </div>

    <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
      <div className="flex justify-between font-semibold text-gray-700">
        <span>Total</span>
        <span>
          Rs. {Number(total).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <label>Amount Paid</label>
        <input
          type="number"
          min={0}
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          className="w-28 p-2 border rounded-md text-center focus:ring-1 focus:ring-[#005f33]"
        />
      </div>

      <div className="flex justify-between font-semibold text-gray-800">
        <span>Balance Due</span>
        <span>
          Rs.{" "}
          {Number(Math.max(total - Number(amountPaid || 0), 0)).toLocaleString("en-PK", {
            minimumFractionDigits: 2,
          })}
        </span>
      </div>

      <button
        onClick={handleDownloadPDF}
        className="mt-4 w-full flex items-center justify-center gap-2 bg-[#003f20] text-white py-2 rounded-md hover:bg-[#005f33] transition"
      >
        <Download size={16} /> Download PDF
      </button>
    </div>
  </div>
</div>

          </div>
        </div>
      </div>
    </div>
  </div>
</main>

  );
}
