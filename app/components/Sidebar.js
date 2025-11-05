"use client";
import {
  LayoutDashboard,
  FileText,
  ShoppingBag,
  Users,
  AlertTriangle,
  Receipt,
  DollarSign,
  UserCheck,
  LogOut,
  Settings, // 👈 Added settings icon
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Sidebar({ isOpen, toggleSidebar }) {
  const pathname = usePathname();
  const router = useRouter();

  // 🔹 Logout function
  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      toast.success("Logged out successfully!");
      router.push("/login");
    } catch (error) {
      console.error("Logout Error:", error);
      toast.error("Logout failed!");
    }
  };

  const menu = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/" },
    { name: "Sales", icon: <Receipt size={20} />, href: "/sales" },
    { name: "Invoice", icon: <Receipt size={20} />, href: "/invoice" },
    { name: "Pending Dues", icon: <AlertTriangle size={20} />, href: "/pendingdues" },
    { name: "Customers", icon: <Users size={20} />, href: "/Coustomer" },
    { name: "Products / Inventory", icon: <ShoppingBag size={20} />, href: "/inventory" },
    { name: "Reports", icon: <FileText size={20} />, href: "/reports" },
    { name: "Accounting", icon: <DollarSign size={20} />, href: "/accounting" },
    { name: "Employees", icon: <UserCheck size={20} />, href: "/employ" },
    { name: "Company Settings", icon: <Settings size={20} />, href: "/settings" }, // 👈 Added this new menu
  ];

  return (
    <>
      {/* Overlay (Mobile Only) */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed h-full inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-[100vh] bg-gray-50 border-r p-5 flex flex-col justify-between transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:w-60`}
      >
        <div>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-green-700">Monowork</h1>
            <button onClick={toggleSidebar} className="lg:hidden text-gray-600">
              <X size={22} />
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            {menu.map((item, i) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={i}
                  href={item.href}
                  onClick={toggleSidebar}
                  className={`flex items-center gap-3 p-2 rounded-lg transition
                    ${
                      isActive
                        ? "bg-[#003f20] text-white"
                        : "text-gray-700 hover:bg-[#003f20] hover:text-white"
                    }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 🔹 Logout Button */}
        <div className="text-sm mt-10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
