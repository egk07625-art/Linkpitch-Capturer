/**
 * @file app/api/generate-step/route.ts
 * @description Step 생성 API 라우트
 *
 * n8n Webhook을 호출하여 콜드메일을 생성하는 API
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { GenerationRequest, GenerationResult } from "@/types/generation";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const _body: GenerationRequest = await request.json();

    // TODO: n8n Webhook 호출 로직 구현 (Week 3)
    // const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    // const response = await fetch(n8nWebhookUrl, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(body),
    // });
    // const result: GenerationResult = await response.json();

    // 임시 응답
    const result: GenerationResult = {
      insights: [],
      email_subject: "",
      email_body: "",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating step:", error);
    return NextResponse.json(
      { error: "Failed to generate step" },
      { status: 500 }
    );
  }
}
















