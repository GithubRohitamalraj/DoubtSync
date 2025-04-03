import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import io from "socket.io-client";
import { MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

const socket = io("http://localhost:5000");

interface Connection {
  id: string;
  partner_id: string;
  partner_full_name: string;
  partner_profile_image: string;
}

interface Message {
  id?: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at?: string;
}

interface DynamicMessagePanelProps {
  currentUserId: string;
  connectionId?: string | null;
  onBack: () => void;
}

const DynamicMessagePanel = ({ currentUserId, connectionId, onBack }: DynamicMessagePanelProps) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Function to get the public URL for profile images
  const getProfileImageUrl = (filePath: string) => {
    if (!filePath) return '/default-avatar.png';
    
    // If the path already contains a full URL, return it as is
    if (filePath.startsWith('http')) return filePath;
    
    // Otherwise, generate public URL from Supabase storage
    const { data } = supabase.storage.from('profile-buckets').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Join socket room when component mounts
  useEffect(() => {
    if (currentUserId) {
      socket.emit("join", currentUserId);
    }

    // Listen for incoming messages
    socket.on("receive_message", (msg: Message) => {
      if ((selectedConnection && (
        (msg.sender_id === selectedConnection.partner_id && msg.receiver_id === currentUserId) ||
        (msg.sender_id === currentUserId && msg.receiver_id === selectedConnection.partner_id)
      )) || !selectedConnection) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off("receive_message");
    };
  }, [currentUserId, selectedConnection]);

  // Fetch user connections
  useEffect(() => {
    const fetchConnections = async () => {
      setLoading(true);
      try {
        // First determine if the user is a student or mentor
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', currentUserId)
          .single();

        const isStudent = profileData?.user_type === 'student';
        
        // Then get connections based on user type
        const partnerJoin = isStudent
          ? 'profiles!connections_mentor_id_fk(id, full_name, profile_image)'
          : 'profiles!connections_student_id_fk(id, full_name, profile_image)';

        const filterColumn = isStudent ? 'student_id' : 'mentor_id';
        const partnerColumn = isStudent ? 'mentor_id' : 'student_id';

        const { data, error } = await supabase
          .from('connections')
          .select(`id, ${partnerColumn}, ${partnerJoin}`)
          .eq(filterColumn, currentUserId)
          .eq('status', 'accepted');

        if (error) throw error;

        const formattedConnections = data.map((connection: any) => {
          const partnerProfile = connection.profiles || {};
          return {
            id: connection.id,
            partner_id: connection[partnerColumn],
            partner_full_name: partnerProfile.full_name || 'Unknown',
            partner_profile_image: partnerProfile.profile_image || '/default-avatar.png',
          };
        });

        setConnections(formattedConnections);

        // If connectionId is provided, set the selected connection
        if (connectionId) {
          const selected = formattedConnections.find(conn => conn.id === connectionId);
          if (selected) {
            setSelectedConnection(selected);
            fetchMessages(selected.partner_id);
          }
        }
      } catch (err) {
        console.error('Error fetching connections:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      fetchConnections();
    }
  }, [currentUserId, connectionId]);

  // Fetch messages for a selected connection
  const fetchMessages = async (partnerId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // Select a connection to chat with
  const handleSelectConnection = (connection: Connection) => {
    setSelectedConnection(connection);
    fetchMessages(connection.partner_id);
  };

  // Send a message
  const sendMessage = async () => {
    if (!message.trim() || !selectedConnection) return;

    const newMessage: Message = {
      sender_id: currentUserId,
      receiver_id: selectedConnection.partner_id,
      content: message.trim()
    };

    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from('messages')
        .insert([newMessage])
        .select();

      if (error) throw error;

      // Send via Socket.io
      socket.emit("send_message", data[0]);

      // Update local state
      setMessages(prev => [...prev, data[0]]);
      setMessage("");
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Scroll to bottom of messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle enter key press for sending messages
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading messages...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Messages</h2>
        {selectedConnection && (
          <button 
            onClick={() => setSelectedConnection(null)} 
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Connections
          </button>
        )}
      </div>

      {!selectedConnection ? (
        // Show list of connections
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Your Connections</h3>
          {connections.length === 0 ? (
            <p className="text-gray-500">No connections yet. Connect with mentors or students to start messaging.</p>
          ) : (
            connections.map((connection) => (
              <div 
                key={connection.id} 
                className="flex items-center justify-between p-4 border rounded-lg mb-2 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSelectConnection(connection)}
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={getProfileImageUrl(connection.partner_profile_image)} alt={connection.partner_full_name} />
                    <AvatarFallback>{connection.partner_full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{connection.partner_full_name}</h3>
                  </div>
                </div>
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
            ))
          )}
        </div>
      ) : (
        // Show chat with selected connection
        <div className="flex flex-col h-[600px]">
          {/* Chat header */}
          <div className="p-4 border-b flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={getProfileImageUrl(selectedConnection.partner_profile_image)} alt={selectedConnection.partner_full_name} />
              <AvatarFallback>{selectedConnection.partner_full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <h3 className="font-medium">{selectedConnection.partner_full_name}</h3>
          </div>
          
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 my-10">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={msg.id || index} 
                  className={`max-w-[75%] p-3 rounded-lg ${
                    msg.sender_id === currentUserId 
                      ? "ml-auto bg-blue-600 text-white rounded-tr-none" 
                      : "mr-auto bg-gray-200 text-gray-800 rounded-tl-none"
                  }`}
                >
                  <p>{msg.content}</p>
                  {msg.created_at && (
                    <p className={`text-xs mt-1 ${msg.sender_id === currentUserId ? "text-blue-100" : "text-gray-500"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              ))
            )}
            <div ref={messageEndRef} />
          </div>
          
          {/* Input area */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
              />
              <button
                onClick={sendMessage}
                disabled={!message.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicMessagePanel;