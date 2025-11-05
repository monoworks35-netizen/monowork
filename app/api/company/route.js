import { NextResponse } from "next/server";
import { connectDb } from "@/helpers/db";
import Company from "@/models/Company";
import cloudinary from "@/helpers/cloudinary";

export async function GET() {
  await connectDb();
  const company = await Company.findOne();
  return NextResponse.json(company || {});
}

export async function POST(req) {
  await connectDb();
  const data = await req.json();

  // 🔹 Check if there's a base64 logo string
  let logoUrl = data.logo;

  if (data.logo && data.logo.startsWith("data:image")) {
    try {
      const uploadResponse = await cloudinary.uploader.upload(data.logo, {
        folder: "company_logos",
      });
      logoUrl = uploadResponse.secure_url; // ✅ Cloudinary URL
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      return NextResponse.json({ success: false, error: "Image upload failed" }, { status: 500 });
    }
  }

  // 🔹 Save or update company
  let company = await Company.findOne();
  if (company) {
    company.set({ ...data, logo: logoUrl });
    await company.save();
  } else {
    company = await Company.create({ ...data, logo: logoUrl });
  }

  return NextResponse.json({ success: true, company });
}
