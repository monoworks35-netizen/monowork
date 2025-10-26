"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";
import { Trash2, Printer } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SalesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchInvoices:", err);
      toast.error("Failed to load invoices!");
    } finally {
      setLoading(false);
    }
  }

  async function deleteInvoiceApi(id) {
    const res = await fetch(`/api/invoices?id=${id}`, { method: "DELETE" });
    return res.json();
  }

  const handleDelete = async (invoice) => {
    try {
      await deleteInvoiceApi(invoice._id);
      setInvoices((prev) => prev.filter((i) => i._id !== invoice._id));
      toast.success("Invoice deleted successfully!");
      setDialogOpen(false);
    } catch (err) {
      console.error("deleteInvoice:", err);
      toast.error("Failed to delete invoice!");
    }
  };

const handlePrintInvoice = (invoice) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const darkGreen = [0, 63, 32];
  const lightGray = [120, 120, 120];
  const formatNum = (num) =>
    `Rs. ${Number(num || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`;

  // ===== HEADER =====
  doc.setFontSize(18);
  doc.setTextColor(...darkGreen);
  doc.text("Invoice Receipt", 40, 30);

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Code: ${invoice.code}`, 450, 30);

  // ===== BILLING & SHIPPING =====
  doc.setFontSize(10);
  doc.setTextColor(...lightGray);
  doc.text("Bill To:", 40, 60);
  doc.setTextColor(0);
  doc.text(doc.splitTextToSize(invoice.billTo || "-", 220), 40, 75);

  doc.setTextColor(...lightGray);
  doc.text("Ship To:", 300, 60);
  doc.setTextColor(0);
  doc.text(doc.splitTextToSize(invoice.shipTo || "-", 220), 300, 75);

  // ===== INVOICE DETAILS (Right side) =====
  const rightX = 430;
  let y = 60;
  const details = [
    ["Date:", invoice.date],
    ["Payment Terms:", invoice.paymentTerms || "-"],
    ["PO Number:", invoice.poNumber || "-"],
    ["Status:", invoice.status || "-"],
  ];
  details.forEach(([label, val]) => {
    y += 15;
    doc.setTextColor(80);
    doc.text(label, rightX, y);
    doc.setTextColor(0);
    doc.text(val || "-", rightX + 100, y, { align: "right" });
  });

  // ===== ITEMS TABLE =====
  const bodyData = invoice.items.map((item) => [
    item.description || "-",
    item.qty,
    formatNum(item.rate),
    formatNum(item.amount),
  ]);

  autoTable(doc, {
    startY: 110,
    head: [["Description", "Qty", "Rate", "Amount"]],
    body: bodyData,
    styles: { fontSize: 10, halign: "center", valign: "middle" },
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

  drawLine("Subtotal:", formatNum(invoice.subtotal));
  drawLine(`Tax (${invoice.taxPercent}%):`, formatNum(invoice.taxAmount));
  drawLine(`Discount (${invoice.discountPercent}%):`, `- ${formatNum(invoice.discountAmount)}`);
  drawLine("Shipping:", formatNum(invoice.shipping));
  drawLine("Total:", formatNum(invoice.total), [0, 128, 0], true, true);
  drawLine("Amount Paid:", formatNum(invoice.amountPaid));
  drawLine("Balance Due:", formatNum(invoice.balanceDue), [200, 0, 0], true, true);

  // ===== FOOTER =====
  const footerY = ty + 10;
  doc.setDrawColor(210);
  doc.line(40, footerY, 555, footerY);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text("Thank you for your business!", 230, footerY + 15);

  doc.save(`${invoice.code}.pdf`);
};


  const filteredInvoices = invoices.filter((inv) =>
    (inv.code || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex bg-gray-100 min-h-screen">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 w-full overflow-y-scroll h-screen">
        <MobileHeader toggleSidebar={toggleSidebar} />

        <div className="p-6 space-y-6">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#003f20]">Sales / Invoice Module</h1>
              <p className="text-gray-500">View all your invoices</p>
            </div>
            <Input
              placeholder="Search by code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </header>

          <div className="rounded-2xl overflow-x-auto scrollbar-hide bg-white shadow-sm">
            <table className="min-w-full border-collapse">
             <thead className="bg-[#003f20] text-white">
  <tr>
    <th className="p-3 text-left text-sm font-semibold">Code</th>
    <th className="p-3 text-left text-sm font-semibold">Bill To</th>
    <th className="p-3 text-left text-sm font-semibold">Date</th>
    <th className="p-3 text-left text-sm font-semibold">Total Items</th>
    <th className="p-3 text-left text-sm font-semibold">Total Qty</th>
    <th className="p-3 text-left text-sm font-semibold">Total Amount</th>
  </tr>
</thead>
<tbody>
  {loading ? (
    Array.from({ length: 6 }).map((_, i) => (
      <tr key={i} className="border-b">
        <td className="p-3"><Skeleton className="h-4 w-24 rounded-md" /></td>
        <td className="p-3"><Skeleton className="h-4 w-28 rounded-md" /></td>
        <td className="p-3"><Skeleton className="h-4 w-20 rounded-md" /></td>
        <td className="p-3"><Skeleton className="h-4 w-20 rounded-md" /></td>
        <td className="p-3"><Skeleton className="h-4 w-16 rounded-md" /></td>
        <td className="p-3"><Skeleton className="h-4 w-20 rounded-md" /></td>
      </tr>
    ))
  ) : filteredInvoices.length === 0 ? (
    <tr><td colSpan={6} className="p-4 text-center">No invoices found.</td></tr>
  ) : (
    filteredInvoices.map((inv) => {
      const totalQty = inv.items.reduce((sum, i) => sum + (i.qty || 0), 0);
      return (
        <tr
          key={inv._id}
          className="border-b hover:bg-gray-50 cursor-pointer transition"
          onClick={() => {
            setSelectedInvoice(inv);
            setDialogOpen(true);
          }}
        >
          <td className="p-3 text-sm text-gray-700">{inv.code}</td>
          <td className="p-3 text-sm text-gray-700">{inv.billTo}</td>
          <td className="p-3 text-sm text-gray-700">{inv.date}</td>
          <td className="p-3 text-sm text-gray-700">{inv.items.length}</td>
          <td className="p-3 text-sm text-gray-700">{totalQty}</td>
          <td className="p-3 text-sm text-gray-700 font-semibold">Rs. {inv.total}</td>
        </tr>
      );
    })
  )}
</tbody>

            </table>
          </div>
        </div>

        {/* Invoice Details Modal */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-[#003f20]">Invoice Details</DialogTitle>
            </DialogHeader>

            {selectedInvoice && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <p><strong>Code:</strong> {selectedInvoice.code}</p>
                  <p><strong>Bill To:</strong> {selectedInvoice.billTo}</p>
                  <p><strong>Ship To:</strong> {selectedInvoice.shipTo}</p>
                  <p><strong>Date:</strong> {selectedInvoice.date}</p>
                  <p><strong>Payment Terms:</strong> {selectedInvoice.paymentTerms}</p>
                  <p><strong>Due Date:</strong> {selectedInvoice.dueDate}</p>
                  <p><strong>PO Number:</strong> {selectedInvoice.poNumber || "-"}</p>
                  <p><strong>Status:</strong> {selectedInvoice.status}</p>
                </div>

                <h3 className="mt-4 font-semibold text-[#003f20]">Items</h3>
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 border">Description</th>
                      <th className="p-2 border">Qty</th>
                      <th className="p-2 border">Rate</th>
                      <th className="p-2 border">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item) => (
                      <tr key={item._id} className="text-center">
                        <td className="p-2 border">{item.description}</td>
                        <td className="p-2 border">{item.qty}</td>
                        <td className="p-2 border">Rs. {item.rate}</td>
                        <td className="p-2 border">Rs. {item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <p><strong>Subtotal:</strong> Rs. {selectedInvoice.subtotal}</p>
                  <p><strong>Tax ({selectedInvoice.taxPercent}%):</strong> Rs. {selectedInvoice.taxAmount}</p>
                  <p><strong>Discount ({selectedInvoice.discountPercent}%):</strong> Rs. {selectedInvoice.discountAmount}</p>
                  <p><strong>Shipping:</strong> Rs. {selectedInvoice.shipping}</p>
                  <p><strong>Total:</strong> Rs. {selectedInvoice.total}</p>
                  <p><strong>Amount Paid:</strong> Rs. {selectedInvoice.amountPaid}</p>
                  <p><strong>Balance Due:</strong> Rs. {selectedInvoice.balanceDue}</p>
                </div>

                <p><strong>Notes:</strong> {selectedInvoice.notes}</p>
                <p><strong>Terms:</strong> {selectedInvoice.terms}</p>

                <div className="mt-4 flex gap-4">
                  <Button
                    className="bg-[#003f20] text-white hover:bg-[#005f33]"
                    onClick={() => handlePrintInvoice(selectedInvoice)}
                  >
                    <Printer size={16} /> Download PDF
                  </Button>
                  <Button
                    className="bg-red-600 text-white hover:bg-red-700"
                    onClick={() => handleDelete(selectedInvoice)}
                  >
                    <Trash2 size={16} /> Delete
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
