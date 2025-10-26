"use client";
import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Card from "./components/Card";
import Chart from "./components/Chart";
import MobileHeader from "./components/MobileHeader";
import { toast } from "sonner";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    totalCustomers: 0,
    totalPendingDues: 0,
    totalProducts: 0,
    graph: { months: [], income: [], expense: [] },
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        const data = await res.json();
        setDashboardData(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard data!");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <main className="flex bg-gray-100 min-h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <div className="flex-1 w-full h-[100vh] overflow-y-auto">
        <MobileHeader toggleSidebar={toggleSidebar} />

        <div className="p-6 space-y-6">
          <header>
            <h1 className="text-2xl text-black/70 font-bold">Dashboard</h1>
            <p className="text-gray-500">{new Date().toLocaleDateString()}</p>
          </header>

          {/* Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card
              title="Total Income"
              value={`Rs. ${dashboardData.totalIncome.toLocaleString()}`}
              change="+20.9%"
              positive
              loading={loading}
            />
            <Card
              title="Total Expense"
              value={`Rs. ${dashboardData.totalExpense.toLocaleString()}`}
              change="-5.2%"
              positive={false}
              loading={loading}
            />
            <Card
              title="Balance"
              value={`Rs. ${dashboardData.balance.toLocaleString()}`}
              change={dashboardData.balance >= 0 ? "+10%" : "-10%"}
              positive={dashboardData.balance >= 0}
              loading={loading}
            />
            <Card
              title="Customers"
              value={dashboardData.totalCustomers}
              change="+2.5%"
              positive
              loading={loading}
            />
            <Card
              title="Pending Dues"
              value={`Rs. ${dashboardData.totalPendingDues.toLocaleString()}`}
              change="-3%"
              positive={false}
              loading={loading}
            />
            <Card
              title="Products in Stock"
              value={dashboardData.totalProducts}
              change="+5%"
              positive
              loading={loading}
            />
          </section>

          {/* Chart */}
          <Chart
            months={dashboardData.graph.months}
            income={dashboardData.graph.income}
            expense={dashboardData.graph.expense}
            loading={loading}
          />
        </div>
      </div>
    </main>
  );
}
