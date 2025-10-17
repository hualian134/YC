import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { Conversation } from '../services/chatService';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: SidebarProps) {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
          Recent Chats
        </h3>
        <div className="space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                activeConversationId === conv.id
                  ? 'bg-green-100 text-green-900'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate">{conv.title}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
              </button>
            </div>
          ))}
        </div>

        {conversations.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-8 px-2">
            No conversations yet. Start a new chat!
          </p>
        )}
      </div>
    </div>
  );
}