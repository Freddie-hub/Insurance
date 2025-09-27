import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { userId, chat_name } = await req.json();

    if (!userId || !chat_name) {
      return NextResponse.json(
        { error: "userId and chat_name are required" },
        { status: 400 }
      );
    }

    const chatRef = await adminDb.collection("chats").add({
      userId,
      chat_name,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ id: chatRef.id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create chat" },
      { status: 500 }
    );
  }
}
