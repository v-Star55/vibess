import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function Page() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

    const result = await model.generateContent("Hello!");
    const text = result.response.text();

    return <div>{text}</div>;
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes("429")) {
      return (
        <div className="p-4 border border-red-300 rounded-lg bg-red-50">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Rate Limit Exceeded
          </h2>
          <p className="text-red-700">
            You have exceeded your current quota for the Gemini API. Please check
            your plan and billing details.
          </p>
          <p className="text-sm text-red-600 mt-2">
            For more information, visit:{" "}
            <a
              href="https://ai.google.dev/gemini-api/docs/rate-limits"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Rate Limits Documentation
            </a>
          </p>
        </div>
      );
    }

    return (
      <div className="p-4 border border-red-300 rounded-lg bg-red-50">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
        <p className="text-red-700">{error?.message || "An error occurred"}</p>
      </div>
    );
  }
}
