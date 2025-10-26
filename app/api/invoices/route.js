import { connectDb } from "@/helpers/db";
import Invoice from "@/models/Invoice";

function sendJSON(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}



async function generateUniqueCode() {
  let unique = false;
  let code = "";
  while (!unique) {
    code = Math.random().toString(36).substring(2, 10).toUpperCase(); // random 8-char code
    const exists = await Invoice.findOne({ code });
    if (!exists) unique = true;
  }
  return code;
}
// --- GET: All invoices ---
export async function GET(req) {
  try {
    await connectDb();

    const url = new URL(req.url);
    const searchCode = url.searchParams.get("code");

    let invoices;
    if (searchCode) {
      invoices = await Invoice.find({ code: searchCode }).sort({ createdAt: -1 });
    } else {
      invoices = await Invoice.find({}).sort({ createdAt: -1 });
    }

    return sendJSON(200, invoices);
  } catch (err) {
    console.error("GET error:", err);
    return sendJSON(500, { error: "Server error" });
  }
}

// --- POST: Create invoice ---
// --- POST: Create invoice ---
export async function POST(req) {
  try {
    await connectDb();
    const data = await req.json();

    // Generate random code if missing
    if (!data.code) {
      data.code = await generateUniqueCode();
    }

    // Set invoiceNo same as code
    data.invoiceNo = data.code;

    // Map service, payment, amount, customer if not already present
    if (!data.service && data.items) {
      data.service = data.items.map(i => i.description).join(", ") || "-";
    }
    if (data.amountPaid !== undefined) data.payment = data.amountPaid;
    if (data.total !== undefined) data.amount = data.total;
    if (!data.customer && data.billTo) data.customer = data.billTo;

    // Save invoice
    const invoice = await Invoice.create(data);
    return sendJSON(201, invoice);
  } catch (err) {
    console.error("POST error:", err);

    // Handle duplicate key error gracefully
    if (err.code === 11000) {
      return sendJSON(400, { error: "Duplicate key error. Try again." });
    }

    return sendJSON(500, { error: err.message });
  }
}


// --- PUT: Update invoice ---
export async function PUT(req) {
  try {
    await connectDb();
    const { id, ...fields } = await req.json();
    if (!id) return sendJSON(400, { error: "Invoice id is required" });

    if (fields.amountPaid !== undefined) fields.payment = fields.amountPaid;
    if (fields.total !== undefined) fields.amount = fields.total;

    const updated = await Invoice.findByIdAndUpdate(id, fields, { new: true });
    if (!updated) return sendJSON(404, { error: "Invoice not found" });
    return sendJSON(200, updated);
  } catch (err) {
    console.error("PUT error:", err);
    return sendJSON(500, { error: err.message });
  }
}

// --- DELETE: Remove invoice ---
export async function DELETE(req) {
  try {
    await connectDb();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return sendJSON(400, { error: "id is required" });

    const deleted = await Invoice.findByIdAndDelete(id);
    if (!deleted) return sendJSON(404, { error: "Invoice not found" });
    return sendJSON(200, { success: true });
  } catch (err) {
    console.error("DELETE error:", err);
    return sendJSON(500, { error: err.message });
  }
}
