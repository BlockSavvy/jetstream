import { InferenceTestChat } from "@/app/lib/ai/components/InferenceTestChat";

export const metadata = {
  title: "AI Inference Test Chat",
  description: "Test different AI inference models",
};

export default function TestChatPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">AI Inference Testing</h1>
      <div className="mb-4">
        <p>
          This page provides a testing interface for comparing different AI inference models.
          Currently testing:
        </p>
        <ul className="list-disc list-inside mt-2 mb-4">
          <li>OpenAI GPT-4 Turbo</li>
          <li>xAI Grok-3</li>
        </ul>
      </div>
      <InferenceTestChat />
    </div>
  );
} 