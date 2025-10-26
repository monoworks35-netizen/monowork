import { connectDb } from "@/helpers/db";
import Due from "@/models/Due";

function sendJSON(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// GET all dues
export async function GET() {
  try {
    await connectDb();
    const dues = await Due.find({}).sort({ createdAt: -1 });
    return sendJSON(200, dues);
  } catch (err) {
    console.error("GET error:", err);
    return sendJSON(500, { error: "Server error" });
  }
}

// POST - Add new due
export async function POST(req) {
  try {
    await connectDb();
    const data = await req.json();
    const newDue = await Due.create(data);
    return sendJSON(201, newDue);
  } catch (err) {
    console.error("POST error:", err);
    return sendJSON(500, { error: err.message });
  }
}

// PUT - Update status or details
export async function PUT(req) {
  try {
    await connectDb();
    const { id, ...fields } = await req.json();
    const updated = await Due.findByIdAndUpdate(id, fields, { new: true });
    if (!updated) return sendJSON(404, { error: "Due not found" });
    return sendJSON(200, updated);
  } catch (err) {
    console.error("PUT error:", err);
    return sendJSON(500, { error: err.message });
  }
}

// DELETE - Remove a due
export async function DELETE(req) {
  try {
    await connectDb();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return sendJSON(400, { error: "id required" });

    const deleted = await Due.findByIdAndDelete(id);
    if (!deleted) return sendJSON(404, { error: "Due not found" });
    return sendJSON(200, { success: true });
  } catch (err) {
    console.error("DELETE error:", err);
    return sendJSON(500, { error: err.message });
  }
}
