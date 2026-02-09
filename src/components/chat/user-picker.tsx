'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Loader2 } from 'lucide-react';
import { Id } from '../../../convex/_generated/dataModel';

interface UserPickerProps {
  onSelect: (userId: Id<"users">, name: string) => void;
  excludeIds?: string[];
}

export function UserPicker({ onSelect, excludeIds = [] }: UserPickerProps) {
  const [query, setQuery] = useState('');
  const allUsers = useQuery(api.users.list) || [];
  
  const filteredUsers = allUsers.filter(u => 
    !excludeIds.includes(u._id) && 
    (u.name?.toLowerCase().includes(query.toLowerCase()) || 
     u.email?.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input 
          placeholder="Search people by name or email..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 bg-white/5 border-white/10 text-white"
        />
      </div>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
        {filteredUsers.length === 0 ? (
          <p className="text-center py-10 text-gray-500 text-sm">No users found.</p>
        ) : (
          filteredUsers.map(u => (
            <button
              key={u._id}
              onClick={() => onSelect(u._id, u.name || 'User')}
              className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors text-left"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={u.image} />
                <AvatarFallback className="bg-cyan-500/10 text-cyan-500">{u.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-white">{u.name}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
