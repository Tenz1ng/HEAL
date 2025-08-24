import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { messages, healthData, isFirstMessage } = await request.json()

    // Check if OpenRouter API key is available
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured. Please add OPENROUTER_API_KEY to your environment variables." },
        { status: 500 },
      )
    }

    const systemPrompt = `You are Clinic Copilot, a friendly and conversational AI health assistant. You have a warm, approachable personality while maintaining professionalism. 

Your conversation style:
- Ask ONE focused question at a time to avoid overwhelming the user
- Show genuine interest in their wellbeing
- Use natural, conversational language (avoid being overly clinical)
- Be curious and encouraging
- Be decisive - provide helpful guidance when you have sufficient information rather than always asking more questions
- Conclude conversations naturally when you've addressed the user's concern adequately
- Only ask follow-up questions when truly necessary for understanding or safety
- Format your responses with proper line breaks for readability

Response formatting guidelines:
- Use line breaks to separate different thoughts or topics
- Keep paragraphs short and digestible
- Use bullet points sparingly and only when listing specific items
- Provide actionable advice and recommendations when appropriate, rather than always ending with a question
- End with a question only when you genuinely need more information to help effectively

${
  isFirstMessage
    ? `You have access to the user's current health metrics:
- Current Heart Rate: ${healthData.heartRate} BPM
- Resting Heart Rate: ${healthData.restingHeartRate} BPM
- Heart Rate Variability: ${healthData.heartRateVariability} ms
- Recent Sleep Hours: ${healthData.sleepEntries?.[0]?.hoursSlept || "Not logged"} hours
- Mood Score: ${healthData.moodScore}/10
- Current Medications: ${healthData.medications.map((med: any) => `${med.name} (${med.dosage}, ${med.frequency})`).join(", ")}

${
  healthData.chatHistory && healthData.chatHistory.length > 0
    ? `Previous conversation summaries (for context and continuity):
${healthData.chatHistory
  .map(
    (chat: any, index: number) =>
      `${index + 1}. ${chat.date} - ${chat.summary}
   Key findings: ${chat.keyFindings}
   Recommendations given: ${chat.recommendations}`,
  )
  .join("\n\n")}`
    : "This is the user's first conversation with you."
}
`
    : ""
}

Always remember: You provide general health information and wellness guidance, but cannot replace professional medical advice. When in doubt, encourage consulting with healthcare providers.`

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "Clinic Copilot Health Assistant",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.8, // Increased temperature for more natural conversation
        max_tokens: 180, // Reduced token limit to stay within 199 credit limit
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("OpenRouter API error:", errorData)
      if (errorData.error?.code === 402) {
        return NextResponse.json(
          {
            error:
              "Insufficient API credits. Please check your OpenRouter account balance or reduce the conversation length.",
          },
          { status: 402 },
        )
      }
      return NextResponse.json({ error: "Failed to get AI response. Please try again." }, { status: 500 })
    }

    const data = await response.json()
    const aiResponse =
      data.choices[0]?.message?.content ||
      "I apologize, but I encountered an issue generating a response. Please try again."

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 })
  }
}
