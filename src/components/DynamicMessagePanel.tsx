import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import  io  from "socket.io-client";

const socket = io("http://localhost:5000");

const DynamicMessagePanel = () => {
  const [user, setUser] = useState<any>(null);
  const [receiverInput, setReceiverInput] = useState("");
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [receiverEmail, setReceiverEmail] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    // Get logged-in user
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        socket.emit("join", data.user.id);
      }
    });

    // Listen for incoming messages
    socket.on("receive_message", (msg:string) => {
      setMessages((prev) => [...prev, msg]);
    });
  }, []);

  // Fetch receiver ID from email
  const fetchReceiverId = async () => {
    if (!receiverInput) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", receiverInput)
      .single();

    if (error || !data) {
      console.error("User not found");
      return;
    }

    setReceiverId(data.id);
    setReceiverEmail(data.email);
  };

  // Send Message
  const sendMessage = async () => {
    if (!message || !receiverId) return;

    const newMessage = { sender_id: user.id, receiver_id: receiverId, content: message };

    socket.emit("send_message", newMessage);
    await supabase.from("messages").insert([newMessage]);

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">Messages</h2>

      {/* Input to Find Receiver */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter Receiver Email or ID"
          className="w-full p-2 border rounded"
          value={receiverInput}
          onChange={(e) => setReceiverInput(e.target.value)}
        />
        <button onClick={fetchReceiverId} className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
          Find User
        </button>
      </div>

      {/* Chat Panel */}
      {receiverId && (
        <>
          <h3 className="font-bold text-lg">Chat with {receiverEmail}</h3>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Type a message"
              className="w-full p-2 border rounded"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={sendMessage} className="mt-2 bg-green-500 text-white px-4 py-2 rounded">
              Send
            </button>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-bold">Chat History</h3>
            {messages.map((msg, index) => (
              <p key={index} className={`p-2 rounded ${msg.sender_id === user?.id ? "bg-blue-100" : "bg-gray-200"}`}>
                {msg.sender_id === user?.id ? "You" : "Them"}: {msg.content}
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DynamicMessagePanel;
