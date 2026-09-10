import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { prompt, inventorySummary, questionType } = body;

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `You are Stoq. Copilot, an expert AI Inventory & Operations Manager for Small and Medium Businesses (SMBs).
You have access to real-time inventory metrics, stock status, purchase orders, sales trends, and supplier records provided in the user context.

Your goals:
1. Answer natural language queries concisely and accurately based on the provided inventory data (e.g., "Show products running out this week", "Suggest reorder quantity", "Detect overstock").
2. Provide actionable insights with high business ROI (e.g. cash flow optimization, reorder priorities, risk mitigation).
3. If the user asks for a filter or specific product alert, state clearly which products match and why.
4. Keep answers professional, executive-ready, well-formatted with markdown tables, bullet points, and high-impact key metric highlights. Do NOT include markdown code blocks for plain text unless generating JSON.`;

    const userPrompt = `
Current SMB Inventory Context:
${JSON.stringify(inventorySummary, null, 2)}

User Question / Task: "${prompt}"
Query Type: ${questionType || 'GENERAL_QUERY'}

Please provide a detailed, intelligent, and actionable response for the SMB owner. Include specific product SKUs, quantities, recommended actions, and potential financial impact where applicable.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    return NextResponse.json({
      text: response.text || "No insights generated.",
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("Error in Gemini Inventory AI route:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
