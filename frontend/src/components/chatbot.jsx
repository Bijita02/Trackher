// src/components/ChatBotWidget.jsx
import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are Luna, a warm and knowledgeable women's health assistant for TrackHer...`;
const SUGGESTED = ["When is my fertile window?", "Why are my periods irregular?", "What helps with period cramps?"];

export default function ChatBotWidget({ onClose }) { 
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm Trackher your personal women's health assistant..." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

 const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/ai/chat', { // Make sure this matches your server route!
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ message: userText })
      });

      const data = await response.json();
      
      // FIX: Use 'data.reply' because that is what your Gemini backend sends back
      const reply = data.reply || "Sorry, I couldn't respond.";
      
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages([...newMessages, { role: "assistant", content: "Something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };
  return (
    
    <div className="bg-white w-96 h-[500px] rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
      
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-lg">🌸</div>
          <div>
            <h1 className="text-sm font-semibold text-gray-800">Trackher</h1>
            <p className="text-[10px] text-green-400 font-medium">● Online</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm p-1">✕</button>
      </div>

      
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-xs mr-2 mt-1 shrink-0">🌸</div>
            )}
            <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
              msg.role === "user" ? "bg-pink-500 text-white rounded-br-sm" : "bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

     
      <div className="p-3 bg-white border-t border-gray-100">
        <div className="flex gap-2 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Luna something..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <button onClick={() => sendMessage()} className="bg-pink-500 text-white px-3 py-2 rounded-xl text-xs">Send</button>
        </div>
      </div>
    </div>
  );
}