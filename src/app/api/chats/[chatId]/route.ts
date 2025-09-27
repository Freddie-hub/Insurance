import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function PATCH(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const { chatId } = params;
    const { chat_name } = await req.json();

    if (!chat_name) {
      return NextResponse.json(
        { error: "chat_name is required" },
        { status: 400 }
      );
    }

    await adminDb.collection("chats").doc(chatId).update({
      chat_name,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update chat" },
      { status: 500 }
    );
  }
}
