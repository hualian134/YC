import { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, Mic, Loader2 } from 'lucide-react';
import { Message, sendMessage, getMessages, generateAIResponse ,uploadImageAndGetUrl} from '../services/chatService';

interface ChatInterfaceProps {
  conversationId: string;
}

export default function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    const data = await getMessages(conversationId);
    setMessages(data);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || isLoading) return;

    setIsLoading(true);

    let finalImageUrl: string | null = null;

    const messageText = inputText.trim() || 'ပုံမှအပင်၏ အခြေအနေကို တင်ပြပါ'; // Default text if only image is sent

  //   console.log('🖼️ Selected image before upload:', {
  //   file: selectedImage,
  //   name: selectedImage?.name,
  //   size: selectedImage?.size,
  //   type: selectedImage?.type
  // });

    if (selectedImage) {
      

      if (selectedImage.size === 0) {
        setIsLoading(false);
        alert("The selected file is empty or invalid. Please choose another image.");
        return;
      }

      // 1. Upload the image file to Supabase Storage and get the public URL
      const uploadedUrl = await uploadImageAndGetUrl(selectedImage);
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      } else {
        // If upload fails, stop the process
        setIsLoading(false);
        alert("Image upload failed. Please try again.");
        return;
      }
    }

    const userMessage = await sendMessage(conversationId, messageText, finalImageUrl || undefined);

    
    if (userMessage) {
      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      removeImage();

      const aiResponse = await generateAIResponse(conversationId, messageText, {
        hasImage: !!imagePreview,
        language: 'my',
      });

      if (aiResponse) {
        setMessages(prev => [...prev, aiResponse]);
      }
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <div className="text-6xl mb-4">🌾</div>
            <h2 className="text-2xl font-semibold mb-2">Welcome to Yaung Chi</h2>
            <p className="text-sm">Your AI agriculture assistant</p>
            <p className="text-xs mt-4 max-w-md mx-auto">
              Ask about crop diseases, pest control, fertilizers, weather, or market prices. You can also upload images or use voice chat.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.image_url && (
                <img
                  src={message.image_url}
                  alt="Uploaded"
                  className="rounded-lg mb-2 max-w-full h-auto"
                />
              )}
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
              <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-green-100' : 'text-gray-500'}`}>
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-green-600" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t bg-white p-4">
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-20 rounded-lg" />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Upload image"
          >
            <ImageIcon className="w-5 h-5 text-gray-600" />
          </button>

          <button
            className="flex-shrink-0 p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Voice input (coming soon)"
          >
            <Mic className="w-5 h-5 text-gray-600" />
          </button>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about crops, diseases, pests, weather, or prices..."
            className="flex-1 resize-none rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />

          <button
            onClick={handleSend}
            disabled={isLoading || (!inputText.trim() && !selectedImage)}
            className="flex-shrink-0 p-3 rounded-full bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
