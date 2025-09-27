import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, chat_name } = body;

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
    console.error("Create chat error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
