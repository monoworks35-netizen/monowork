import { NextResponse } from "next/server";
import { connectDb } from "@/helpers/db";
import Customer from "@/models/Customer";
import Due from "@/models/Due";
import Inventory from "@/models/Inventory";
import Records from "@/models/Records";

export async function GET() {
  try {
    await connectDb();

    // Total Income
    const incomeRecords = await Records.find({ type: "Income" });
    const totalIncome = incomeRecords.reduce((sum, r) => sum + r.amount, 0);

    // Total Expense
    const expenseRecords = await Records.find({ type: "Expense" });
    const totalExpense = expenseRecords.reduce((sum, r) => sum + r.amount, 0);

    // Balance
    const balance = totalIncome - totalExpense;

    // Customers
    const totalCustomers = await Customer.countDocuments();

    // Pending Dues
    const pendingDues = await Due.find({ status: "Pending" });
    const totalPendingDues = pendingDues.reduce((sum, d) => sum + Number(d.amount), 0);

    // Products Info
    const products = await Inventory.find({});
    const totalProducts = products.reduce((sum, p) => sum + p.quantity, 0);

    // Graph Data: Monthly Income & Expense
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const incomeByMonth = Array(12).fill(0);
    const expenseByMonth = Array(12).fill(0);

    incomeRecords.forEach(r => {
      const month = new Date(r.date).getMonth();
      incomeByMonth[month] += r.amount;
    });

    expenseRecords.forEach(r => {
      const month = new Date(r.date).getMonth();
      expenseByMonth[month] += r.amount;
    });

    return NextResponse.json({
      totalIncome,
      totalExpense,
      balance,
      totalCustomers,
      totalPendingDues,
      totalProducts,
      graph: {
        months,
        income: incomeByMonth,
        expense: expenseByMonth,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
