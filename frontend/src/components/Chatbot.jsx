import React, { useState, useRef, useEffect } from "react";

const GREETING =
  "Hello and welcome to Hotel Heaven! 👋\nRoom, Food, Hall, Parking pathi kேட்கலாம். எப்படி உதவலாம்?";

const QUICK_ACTIONS = [
  "🛏️ Room Booking",
  "🍽️ Food Menu",
  "🏛️ Hall Booking",
  "🚗 Parking Info",
];

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isTyping]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (trimmed === "") return;

    setMessages((prev) => [...prev, { sender: "user", text: trimmed }]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("https://hotelheaven.onrender.com/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await res.json();
      const botText =
        data.reply || "Sorry, konjam problem iruku. Try again pannunga.";

      setMessages((prev) => [...prev, { sender: "bot", text: botText }]);
    } catch (err) {
      console.error("Chatbot request failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, backend ah connect panna mudiyala. Server run aaguthaa nu check pannunga.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => sendMessage(input);
  const handleQuickAction = (label) => sendMessage(label);
  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          position: "fixed",
          bottom: "25px",
          right: "25px",
          width: "58px",
          height: "58px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0b3d5c, #145374)",
          color: "#d4af37",
          border: "2px solid #d4af37",
          fontSize: "24px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
          cursor: "pointer",
          zIndex: 1000,
        }}
      >
        {isOpen ? "✖" : "💬"}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "95px",
            right: "25px",
            width: "330px",
            height: "460px",
            background: "#1c1c1c",
            borderRadius: "16px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
            border: "1px solid #d4af37",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #0b3d5c, #145374)",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#d4af37",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              🏨
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: "15px" }}>
                Hotel Heaven
              </div>
              <div style={{ color: "#d4af37", fontSize: "11px" }}>
                Online • AI Assistant
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: "12px",
              overflowY: "auto",
              background: "#1c1c1c",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent:
                    msg.sender === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "9px 13px",
                    borderRadius: "14px",
                    fontSize: "13.5px",
                    lineHeight: "1.4",
                    whiteSpace: "pre-line",
                    background: msg.sender === "user" ? "#145374" : "#2a2a2a",
                    color: msg.sender === "user" ? "#fff" : "#f0f0f0",
                    borderBottomRightRadius: msg.sender === "user" ? "4px" : "14px",
                    borderBottomLeftRadius: msg.sender === "user" ? "14px" : "4px",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Quick Actions - first load la mattum kaatum */}
            {messages.length === 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {QUICK_ACTIONS.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(label)}
                    style={{
                      background: "#2a2a2a",
                      color: "#d4af37",
                      border: "1px solid #d4af37",
                      borderRadius: "20px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {isTyping && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "9px 13px",
                    borderRadius: "14px",
                    fontSize: "13.5px",
                    background: "#2a2a2a",
                    color: "#aaa",
                    fontStyle: "italic",
                  }}
                >
                  typing...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px",
              background: "#161616",
              borderTop: "1px solid #333",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about rooms, food, booking..."
              disabled={isTyping}
              style={{
                flex: 1,
                background: "#2a2a2a",
                border: "none",
                outline: "none",
                color: "#fff",
                padding: "10px 12px",
                borderRadius: "20px",
                fontSize: "13px",
              }}
            />
            <button
              onClick={handleSend}
              disabled={isTyping}
              style={{
                marginLeft: "8px",
                background: "#d4af37",
                border: "none",
                color: "#1c1c1c",
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatbot;