import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { conversation, healthData } = await request.json()

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured. Please add OPENROUTER_API_KEY to your environment variables." },
        { status: 500 },
      )
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          {
            role: "system",
            content: `You are a medical assistant tasked with creating concise chat summaries for patient records. 

Based on the conversation provided, generate:
1. A brief summary (2-3 sentences) of the main health topics discussed
2. Key findings (3-5 important health insights or concerns mentioned)
3. Recommendations (3-5 actionable health suggestions given)

Patient's current health data:
- Heart Rate: ${healthData.heartRate} BPM
- Recent Sleep Hours: ${healthData.sleepEntries?.[0]?.hoursSlept || "Not logged"} hours
- Mood Score: ${healthData.moodScore}/10
- Current Medications: ${healthData.medications.map((med: any) => `${med.name} (${med.dosage})`).join(", ")}

Respond in JSON format:
{
  "summary": "Brief summary text",
  "keyFindings": ["finding1", "finding2", "finding3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}`,
          },
          {
            role: "user",
            content: `Please analyze this health conversation and create a summary:\n\n${conversation}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("OpenRouter API error:", errorData)
      return NextResponse.json({ error: "Failed to generate chat summary" }, { status: 500 })
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 })
    }

    // Parse the JSON response from the AI
    try {
      const parsedResponse = JSON.parse(aiResponse)
      return NextResponse.json(parsedResponse)
    } catch (parseError) {
      // Fallback if JSON parsing fails
      return NextResponse.json({
        summary: "Chat session completed with health discussion",
        keyFindings: ["Health metrics reviewed", "Patient concerns addressed"],
        recommendations: ["Continue monitoring health metrics", "Follow up as needed"],
      })
    }
  } catch (error) {
    console.error("Error in chat summary:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
