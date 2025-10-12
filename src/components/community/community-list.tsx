'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  Star, 
  Eye, 
  ChevronRight,
  Pin,
  Lock,
  Shield,
  Flag,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Reply,
  Edit,
  Trash2,
  Globe,
  Crown,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Community, Post, Comment, Poll, AMASession } from '@/types';

// Mock data - replace with actual Firebase data
const mockCommunities: Community[] = [
  {
    id: '1',
    name: 'AI & Machine Learning',
    description: 'Discuss the latest in AI, ML, and data science',
    category: 'AI',
    icon: '🤖',
    memberCount: 1247,
    postCount: 342,
    createdAt: new Date('2024-01-15'),
    createdBy: 'admin',
    moderators: ['admin', 'mod1'],
    rules: ['Be respectful', 'No spam', 'Stay on topic'],
    isPrivate: false
  },
  {
    id: '2',
    name: 'Startup Founders',
    description: 'Connect with fellow entrepreneurs and share experiences',
    category: 'Startups',
    icon: '🚀',
    memberCount: 892,
    postCount: 156,
    createdAt: new Date('2024-02-01'),
    createdBy: 'founder1',
    moderators: ['founder1'],
    rules: ['Share genuine experiences', 'Help others grow'],
    isPrivate: false
  },
  {
    id: '3',
    name: 'Tech Design Hub',
    description: 'UI/UX, product design, and creative discussions',
    category: 'Design',
    icon: '🎨',
    memberCount: 634,
    postCount: 89,
    createdAt: new Date('2024-02-15'),
    createdBy: 'designer1',
    moderators: ['designer1', 'mod2'],
    rules: ['Constructive feedback only', 'Share your work'],
    isPrivate: false
  }
];

export function CommunityListClient() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>(mockCommunities);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Create community form
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    category: 'General' as Community['category'],
    icon: '💬',
    rules: [''],
    isPrivate: false
  });

  const categories = ['all', 'AI', 'Startups', 'Tech', 'Design', 'Business', 'General'];
  
  const filteredCommunities = communities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || community.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateCommunity = async () => {
    if (!user || !newCommunity.name.trim()) return;

    setLoading(true);
    try {
      // In a real app, this would call Firebase
      const community: Community = {
        id: Date.now().toString(),
        ...newCommunity,
        memberCount: 1,
        postCount: 0,
        createdAt: new Date(),
        createdBy: user.id,
        moderators: [user.id],
        rules: newCommunity.rules.filter(rule => rule.trim())
      };

      setCommunities(prev => [...prev, community]);
      setShowCreateDialog(false);
      setNewCommunity({
        name: '',
        description: '',
        category: 'General',
        icon: '💬',
        rules: [''],
        isPrivate: false
      });
    } catch (error) {
      console.error('Error creating community:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    setNewCommunity(prev => ({
      ...prev,
      rules: [...prev.rules, '']
    }));
  };

  const updateRule = (index: number, value: string) => {
    setNewCommunity(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) => i === index ? value : rule)
    }));
  };

  const removeRule = (index: number) => {
    setNewCommunity(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Communities</h1>
            <p className="text-gray-600">Join discussions and connect with like-minded people</p>
          </div>
          {user && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Community
            </Button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search communities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Community Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCommunities.map((community) => (
          <Link key={community.id} href={`/community/${community.id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">{community.icon}</div>
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{community.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {community.category}
                      </Badge>
                      {community.isPrivate && (
                        <Lock className="w-3 h-3 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {community.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{community.memberCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{community.postCount}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredCommunities.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No communities found</h3>
          <p className="text-gray-600">Try adjusting your search or create a new community</p>
        </div>
      )}

      {/* Create Community Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Community</DialogTitle>
            <DialogDescription>
              Start a new community to bring people together around shared interests
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Community Name *</label>
              <Input
                placeholder="Enter community name"
                value={newCommunity.name}
                onChange={(e) => setNewCommunity(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                placeholder="Describe what this community is about"
                value={newCommunity.description}
                onChange={(e) => setNewCommunity(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select 
                  value={newCommunity.category} 
                  onValueChange={(value: Community['category']) => 
                    setNewCommunity(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AI">AI & Technology</SelectItem>
                    <SelectItem value="Startups">Startups</SelectItem>
                    <SelectItem value="Tech">Technology</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Icon</label>
                <Input
                  placeholder="🚀"
                  value={newCommunity.icon}
                  onChange={(e) => setNewCommunity(prev => ({ ...prev, icon: e.target.value }))}
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Community Rules</label>
              {newCommunity.rules.map((rule, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Rule ${index + 1}`}
                    value={rule}
                    onChange={(e) => updateRule(index, e.target.value)}
                  />
                  {newCommunity.rules.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeRule(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addRule} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="private"
                checked={newCommunity.isPrivate}
                onChange={(e) => setNewCommunity(prev => ({ ...prev, isPrivate: e.target.checked }))}
              />
              <label htmlFor="private" className="text-sm font-medium">
                Make this a private community
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCommunity} disabled={loading || !newCommunity.name.trim()}>
              {loading ? 'Creating...' : 'Create Community'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}