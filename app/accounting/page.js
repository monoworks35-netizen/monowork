"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import MobileHeader from "../components/MobileHeader";
import { Plus, Search, MoreVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Skeleton row for loading
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b">
      {[...Array(9)].map((_, i) => (
        <td key={i} className="p-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </td>
      ))}
    </tr>
  );
}

export default function AccountingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Fetch accounting records
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch("/api/accounting");
        const data = await res.json();
        setRecords(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load records!");
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  // Add new record
  const handleAddRecord = async (e) => {
    e.preventDefault();
    const form = e.target.form;
    const description = form[0].value;
    const type = form[1].value;
    const amount = form[2].value;
    const paymentMethod = form[3].value;
    const source = form[4].value;
    const category = form[5].value;
    const notes = form[6].value;

    if (!description || !type || !amount || !paymentMethod || !source || !category) {
      toast.error("Please fill all required fields!");
      return;
    }

    const newRecord = {
      description,
      type,
      amount,
      paymentMethod,
      source,
      category,
      notes,
      date: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      });

      if (res.ok) {
        toast.success("Record added successfully!");
        setIsDialogOpen(false);
        const updated = await fetch("/api/accounting").then(r => r.json());
        setRecords(updated);
      } else {
        toast.error("Failed to add record!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error adding record!");
    }
  };

  // Delete record
  const deleteRecord = async (id) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch("/api/accounting", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success("Record deleted!");
        const updated = await fetch("/api/accounting").then(r => r.json());
        setRecords(updated);
      } else {
        toast.error("Failed to delete record!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting record!");
    }
  };

  // Filtered records
  const filteredRecords = records.filter(rec =>
    rec.description.toLowerCase().includes(search.toLowerCase())
  );

  // Totals
  const totalIncome = records.filter(r => r.type === "Income").reduce((a, b) => a + Number(b.amount), 0);
  const totalExpense = records.filter(r => r.type === "Expense").reduce((a, b) => a + Number(b.amount), 0);
  const balance = totalIncome - totalExpense;

  return (
    <main className="flex bg-gray-100 min-h-screen">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 w-full">
        <MobileHeader toggleSidebar={toggleSidebar} />

        <div className="p-6 space-y-6 h-[100vh] overflow-auto">
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#003f20]">Accounting</h1>
              <p className="text-gray-500">Manage income, expenses & payments</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-3 py-2 rounded-lg border w-64 focus:outline-none focus:ring-2 focus:ring-[#003f20]"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>

              {/* Add Record */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 bg-[#003f20] text-white px-4 py-2 rounded-lg hover:bg-[#005f33] transition">
                    <Plus size={18} /> Add Record
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-[#003f20] text-lg font-semibold">Add New Record</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4 mt-3">
                    <input type="text" placeholder="Description" className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]" />
                    <select className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]">
                      <option value="">Select Type</option>
                      <option value="Income">Income</option>
                      <option value="Expense">Expense</option>
                    </select>
                    <input type="number" placeholder="Amount" className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]" />
                    <select className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]">
                      <option value="">Select Payment Method</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                      <option value="Online">Online</option>
                    </select>
                    <input type="text" placeholder="Received From / Paid To" className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]" />
                    <select className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]">
                      <option value="">Select Category</option>
                      <option value="Office">Office</option>
                      <option value="Food">Food</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Salary">Salary</option>
                      <option value="Other">Other</option>
                    </select>
                    <textarea placeholder="Notes" className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003f20]"></textarea>
                    <button type="button" onClick={handleAddRecord} className="w-full bg-[#003f20] text-white py-2 rounded-lg hover:bg-[#005f33] transition">Save Record</button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          {/* Summary */}
          <div className="flex gap-6 mt-4">
            <div className="bg-white p-4 rounded-2xl shadow w-1/3 text-center">
              <h2 className="text-gray-500">Total Income</h2>
              <p className="text-green-600 text-xl font-bold">Rs. {totalIncome}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow w-1/3 text-center">
              <h2 className="text-gray-500">Total Expense</h2>
              <p className="text-red-600 text-xl font-bold">Rs. {totalExpense}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow w-1/3 text-center">
              <h2 className="text-gray-500">Balance</h2>
              <p className={`text-xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>Rs. {balance}</p>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl overflow-x-auto scrollbar-hide bg-white shadow-sm mt-4">
            <table className="min-w-full border-collapse">
              <thead className="bg-[#003f20] text-white">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold">Description</th>
                  <th className="p-3 text-left text-sm font-semibold">Type</th>
                  <th className="p-3 text-left text-sm font-semibold">Amount</th>
                  <th className="p-3 text-left text-sm font-semibold">Payment Method</th>
                  <th className="p-3 text-left text-sm font-semibold">Received From / Paid To</th>
                  <th className="p-3 text-left text-sm font-semibold">Category</th>
                  <th className="p-3 text-left text-sm font-semibold">Notes</th>
                  <th className="p-3 text-left text-sm font-semibold">Date</th>
                  <th className="p-3 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
                  : filteredRecords.length === 0
                  ? <tr><td colSpan={9} className="p-4 text-center text-gray-500">No records found.</td></tr>
                  : filteredRecords.map(rec => (
                      <tr key={rec._id} className="border-b hover:bg-gray-50 transition">
                        <td className="p-3 text-sm text-gray-700">{rec.description}</td>
                        <td className={`p-3 text-sm font-medium ${rec.type === "Income" ? "text-green-600" : "text-red-600"}`}>{rec.type}</td>
                        <td className="p-3 text-sm font-semibold">Rs. {rec.amount}</td>
                        <td className="p-3 text-sm text-gray-700">{rec.paymentMethod}</td>
                        <td className="p-3 text-sm text-gray-700">{rec.receivedFrom}</td>
                        <td className="p-3 text-sm text-gray-700">{rec.category}</td>
                        <td className="p-3 text-sm text-gray-700">{rec.notes}</td>
                        <td className="p-3 text-sm text-gray-500">{new Date(rec.date).toLocaleDateString()}</td>
                        <td className="p-3 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 rounded-full hover:bg-gray-100 transition">
                                <MoreVertical size={18} className="text-gray-700" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-36 bg-white shadow-lg rounded-xl border border-gray-100">
                              <DropdownMenuLabel className="text-xs text-gray-400">Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => deleteRecord(rec._id)}
                                className="flex items-center gap-2 text-sm text-red-600 cursor-pointer hover:text-red-700"
                              >
                                <Trash2 size={15} /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
