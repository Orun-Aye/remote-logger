import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { status: "error", message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Forward to backend
    const res = await fetch(`${API_BASE_URL}/waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { status: "error", message: data.message || "Something went wrong." },
        { status: res.status }
      );
    }

    return NextResponse.json({
      status: "success",
      position: data.position,
      message: data.message,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Failed to join waitlist. Please try again." },
      { status: 500 }
    );
  }
}
