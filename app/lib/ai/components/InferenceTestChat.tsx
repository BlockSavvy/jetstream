"use client";

import { useState, useRef, useEffect } from "react";
import { Message, getInferenceClient, StreamingCallbacks } from "../AIInferenceClient";

export function InferenceTestChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize available models
  useEffect(() => {
    try {
      const client = getInferenceClient();
      const models = client.getAvailableModels();
      setAvailableModels(models);
      setSelectedModel(client.getDefaultModel());
    } catch (error) {
      console.error("Error initializing inference client:", error);
    }
  }, []);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: inputValue,
    };

    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setStreamingResponse("");

    try {
      const client = getInferenceClient();
      const newMessages = [...messages, userMessage];

      // Start streaming response
      const callbacks: StreamingCallbacks = {
        onStart: () => {
          setStreamingResponse("");
        },
        onToken: (token) => {
          setStreamingResponse((prev) => prev + token);
        },
        onComplete: (fullResponse) => {
          setStreamingResponse("");
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: fullResponse },
          ]);
          setIsLoading(false);
        },
        onError: (error) => {
          console.error("Error streaming response:", error);
          setStreamingResponse("");
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Error: " + error.message },
          ]);
          setIsLoading(false);
        },
      };

      await client.streamCompletion(
        newMessages,
        callbacks,
        { modelName: selectedModel }
      );
    } catch (error) {
      console.error("Error getting completion:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Unable to get response" },
      ]);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-[80vh] border rounded-lg shadow-sm flex flex-col bg-white dark:bg-gray-800">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">AI Inference Test Chat</h2>
          <select 
            className="border rounded-md p-2 bg-white dark:bg-gray-700"
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <option value="" disabled>Select model</option>
            {availableModels.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {streamingResponse && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-gray-200 dark:bg-gray-700">
              <p className="whitespace-pre-wrap">{streamingResponse}</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="w-full flex space-x-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow resize-none border rounded-md p-2 dark:bg-gray-700"
            rows={2}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
} 