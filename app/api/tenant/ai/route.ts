import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { getBusinessCredentials } from "@/lib/business";

export async function POST(request: Request) {
  try {
    await requireApiRole(["tenant", "tenant_employee"]);
    const { action, prompt } = await request.json() as { action?: "chat" | "destination" | "hotel"; prompt?: string };
    if (!action || !prompt?.trim()) return fail("Write a request for AI", 422);
    const key = (await getBusinessCredentials()).find((item) => item.platform === "GEMINI_AI")?.apikey?.trim();
    if (!key) return fail("Add your Gemini AI API key in Settings → Integrations before using AI", 503);
    const instruction = action === "chat"
      ? "You are a concise travel-agency operations assistant. Answer the user's question with practical, accurate advice."
      : action === "destination"
        ? "Return ONLY JSON: {\"name\":\"\",\"country\":\"\",\"location\":\"\",\"description\":\"\"}. Create one complete destination record."
        : "Return ONLY JSON: {\"name\":\"\",\"country\":\"\",\"location\":\"\",\"description\":\"\",\"rooms\":[{\"name\":\"\",\"category\":\"CP\",\"capacity\":2,\"numberOfRooms\":1,\"price\":0,\"currency\":\"INR\"}]}. Create one complete hotel record and room types.";
    const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.1-flash-lite";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, signal: AbortSignal.timeout(60_000), body: JSON.stringify({ contents: [{ parts: [{ text: `${instruction}\nUser request: ${prompt.trim()}` }] }], generationConfig: { temperature: 0.3, ...(action === "chat" ? {} : { responseMimeType: "application/json" }) } }) });
    const raw = await response.text();
    const data = raw ? JSON.parse(raw) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } } : {};
    if (!response.ok) return fail(data.error?.message || "AI could not process this request", 502);
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!text) return fail("AI did not return a response", 502);
    if (action === "chat") return ok({ text });
    try { return ok(JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""))); } catch { return fail("AI returned an unreadable draft. Please try again.", 502); }
  } catch (error) { return handleError(error); }
}
