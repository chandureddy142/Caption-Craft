import { API_BASE_URL } from "../config/api";

export interface GenerateOptions {
  prompt: string;
  systemInstruction?: string;
}

export async function generateContent({ prompt, systemInstruction }: GenerateOptions): Promise<string> {
  const url = `${API_BASE_URL}/api/ai/generate`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, systemInstruction }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to generate AI content");
  }

  const data = await res.json();
  return data.text || "";
}
