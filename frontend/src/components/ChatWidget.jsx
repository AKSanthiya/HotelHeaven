import { useState } from "react";
import "./ChatWidget.css";

const quickActions = [
  { label: "🛏️ Room Booking", reply: "Room booking pathi therinjukka, 'Rooms' page ku pogalam! Adhla live availability kaatum." },
  { label: "🍽️ Food Order", reply: "Food order pandradhukku login pannitu 'Food' section ku pogalam." },
  { label: "🏛️ Hall Booking", reply: "Function hall booking details ku 'Halls' page pakkalam." },
  { label: "🚗 Parking Info", reply: "Parking slot select pannitu book pannalam, 'Parking' page la." },
  { label: "📞 Contact Us", reply: "Enna help venum-nu sollunga, namma team reach pannuvom!" },
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hello and welcome to Hotel Heaven! 👋\nHow can I help you today?" },
  ]);
  const [input, setInput] = useState("");

  const handleQuickAction = (action) => {
    setMessages((prev) => [
      ...prev,
      { from: "user", text: action.label },
      { from: "bot", text: action.reply },
    ]);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { from: "user", text: input },
      { from: "bot", text: "Idha pathi konjam vishayam sekaren, unga query ah namma team ku pass pannalama?" },
    ]);
    setInput("");
  };

  return (
    <div className="chat-widget-container">
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-avatar">🏨</div>
              <div>
                <div className="chat-title">Hotel Heaven</div>
                <div className="chat-subtitle">Online • 24/7 Support</div>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="chat-body">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.from}`}>
                {msg.text}
              </div>
            ))}

            <div className="chat-quick-actions">
              {quickActions.map((action, i) => (
                <button key={i} className="chat-quick-btn" onClick={() => handleQuickAction(action)}>
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="chat-input-row">
            <input
              type="text"
              value={input}
              placeholder="Ask about rooms, food, booking..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button className="chat-send-btn" onClick={handleSend}>➤</button>
          </div>
        </div>
      )}

      <button className="chat-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
}