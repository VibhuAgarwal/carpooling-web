import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    // Extract text fields
    const phone = formData.get("phone") as string;
    const gender = formData.get("gender") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;
    const address = formData.get("address") as string;
    const aadharNumber = formData.get("aadharNumber") as string;
    const panNumber = formData.get("panNumber") as string;
    const drivingLicenseNumber = formData.get("drivingLicenseNumber") as string;

    // Extract files
    const aadharFile = formData.get("aadharFile") as File | null;
    const panFile = formData.get("panFile") as File | null;
    const drivingLicenseFile = formData.get("drivingLicenseFile") as File | null;

    // Log received data for debugging (RESTORED)
    console.log("Received form data:", {
      phone,
      gender,
      dateOfBirth,
      address,
      aadharNumber,
      panNumber,
      drivingLicenseNumber,
      aadharFileSize: aadharFile?.size,
      panFileSize: panFile?.size,
      drivingLicenseFileSize: drivingLicenseFile?.size,
    });

    // Validation - check all required fields
    const missingFields = [];
    if (!phone) missingFields.push("phone");
    if (!gender) missingFields.push("gender");
    if (!dateOfBirth) missingFields.push("dateOfBirth");
    if (!address) missingFields.push("address");
    if (!aadharNumber) missingFields.push("aadharNumber");
    if (!panNumber) missingFields.push("panNumber");
    if (!drivingLicenseNumber) missingFields.push("drivingLicenseNumber");

    if (missingFields.length > 0) {
      return NextResponse.json(
        { message: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate phone (10 digits)
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      return NextResponse.json(
        { message: `Invalid phone number. Must be 10 digits. Received: ${phoneDigits.length} digits` },
        { status: 400 }
      );
    }

    // Validate Aadhar (12 digits)
    const aadharDigits = aadharNumber.replace(/\D/g, "");
    if (aadharDigits.length !== 12) {
      return NextResponse.json(
        { message: `Invalid Aadhar number. Must be 12 digits. Received: ${aadharDigits.length} digits` },
        { status: 400 }
      );
    }

    // Validate PAN (10 characters: 5 letters + 4 numbers + 1 letter)
    const panUpperCase = panNumber.toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panUpperCase)) {
      return NextResponse.json(
        { message: `Invalid PAN number format. Expected format: ABCDE1234F. Received: ${panNumber}` },
        { status: 400 }
      );
    }

    // Validate DOB is a valid date
    const dobDate = new Date(dateOfBirth);
    if (isNaN(dobDate.getTime())) {
      return NextResponse.json(
        { message: `Invalid date of birth format. Received: ${dateOfBirth}` },
        { status: 400 }
      );
    }

    // Validate gender
    if (!["male", "female", "other"].includes(gender.toLowerCase())) {
      return NextResponse.json(
        { message: `Invalid gender. Must be male, female, or other. Received: ${gender}` },
        { status: 400 }
      );
    }

    // File validation
    let aadharFileUrl = null;
    let panFileUrl = null;
    let drivingLicenseFileUrl = null;

    if (aadharFile) {
      if (aadharFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { message: "Aadhar file too large. Max 5MB." },
          { status: 400 }
        );
      }
      aadharFileUrl = `aadhar-${Date.now()}.${aadharFile.name.split(".").pop()}`;
    }

    if (panFile) {
      if (panFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { message: "PAN file too large. Max 5MB." },
          { status: 400 }
        );
      }
      panFileUrl = `pan-${Date.now()}.${panFile.name.split(".").pop()}`;
    }

    if (drivingLicenseFile) {
      if (drivingLicenseFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { message: "Driving License file too large. Max 5MB." },
          { status: 400 }
        );
      }
      drivingLicenseFileUrl = `dl-${Date.now()}.${drivingLicenseFile.name.split(".").pop()}`;
    }

    // Update user in database (RESTORED: no select)
    const user = await prisma.user.update({
      where: { email: token.email },
      data: {
        phone: phoneDigits,
        gender: gender.toLowerCase(),
        dateOfBirth: dobDate,
        address,
        aadhaarNumber: aadharDigits,
        panNumber: panUpperCase,
        drivingLicenseNumber,
        aadhaarFile: aadharFileUrl,
        panFile: panFileUrl,
        drivingLicenseFile: drivingLicenseFileUrl,
      },
    });

    console.log("Profile updated successfully for user:", user.id);

    // RESTORED: return full user
    return NextResponse.json(
      { message: "Profile completed successfully", user },
      { status: 200 }
    );
  } catch (err) {
    console.error("COMPLETE PROFILE ERROR:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to complete profile";
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}