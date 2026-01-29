'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUp, ArrowDown, MessageCircle, Plus, Search, Users, TrendingUp, Loader2 } from 'lucide-react';
import { Community, Post, Comment } from '@/types';
import { communityService } from '@/lib/firestore-services';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function CommunityClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('hot');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    type: 'text' as const,
    tags: ''
  });

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    setIsLoading(true);
    try {
      const fetchedCommunities = await communityService.getCommunities();
      setCommunities(fetchedCommunities);
    } catch (error) {
      console.error('Error loading communities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load communities. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPosts = async (communityId: string) => {
    setIsLoadingPosts(true);
    try {
      const fetchedPosts = await communityService.getPosts(communityId);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load posts. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleCommunitySelect = (community: Community) => {
    setSelectedCommunity(community);
    loadPosts(community.id);
  };

  const handleCreatePost = async () => {
    if (!selectedCommunity || !user) return;

    try {
      const postData: Omit<Post, 'id'> = {
        communityId: selectedCommunity.id,
        authorId: user.id,
        title: newPost.title,
        content: newPost.content,
        type: newPost.type,
        upvotes: 0,
        downvotes: 0,
        votedBy: {},
        commentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: newPost.tags.split(',').map(tag => tag.trim()),
        isPinned: false,
        isLocked: false
      };

      await communityService.createPost(postData);
      setIsCreatePostOpen(false);
      setNewPost({ title: '', content: '', type: 'text', tags: '' });
      loadPosts(selectedCommunity.id);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleVote = async (postId: string, vote: 'up' | 'down') => {
    if (!user) return;

    try {
      await communityService.voteOnPost(postId, user.id, vote);
      
      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const votedBy = { ...post.votedBy };
            const previousVote = votedBy[user.id];
            
            // Remove previous vote
            if (previousVote === 'up') {
              post.upvotes = Math.max(0, post.upvotes - 1);
            } else if (previousVote === 'down') {
              post.downvotes = Math.max(0, post.downvotes - 1);
            }
            
            // Add new vote
            if (vote === 'up') {
              post.upvotes++;
            } else {
              post.downvotes++;
            }
            
            votedBy[user.id] = vote;
            
            return { ...post, votedBy };
          }
          return post;
        })
      );
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedPosts = [...posts].sort((a, b) => {
    if (activeTab === 'hot') {
      const aScore = a.upvotes - a.downvotes + a.commentCount;
      const bScore = b.upvotes - b.downvotes + b.commentCount;
      return bScore - aScore;
    } else if (activeTab === 'new') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (activeTab === 'top') {
      return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
    }
    return 0;
  });

  if (!selectedCommunity) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Communities</h1>
          <p className="text-muted-foreground">Connect with like-minded people and share knowledge</p>
        </div>

        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create Community
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community) => (
            <Card
              key={community.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleCommunitySelect(community)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{community.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{community.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {community.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4">{community.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {community.memberCount.toLocaleString()} members
                  </div>
                  <div>{community.postCount} posts</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Community Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedCommunity(null)}
          className="mb-4"
        >
          ← Back to Communities
        </Button>
        
        <div className="flex items-start gap-4">
          <div className="text-5xl">{selectedCommunity.icon}</div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{selectedCommunity.name}</h1>
            <p className="text-muted-foreground mb-4">{selectedCommunity.description}</p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {selectedCommunity.memberCount.toLocaleString()} members
              </div>
              <div>{selectedCommunity.postCount} posts</div>
              <Badge variant="secondary">{selectedCommunity.category}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Join Community</Button>
            <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Post title"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="What's on your mind?"
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={6}
                  />
                  <Input
                    placeholder="Tags (comma separated)"
                    value={newPost.tags}
                    onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreatePostOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePost}>Create Post</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="hot" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Hot
          </TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="top">Top</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {sortedPosts.map((post) => (
            <Card key={post.id} className="p-6">
              <div className="flex gap-4">
                {/* Voting */}
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0",
                      user && post.votedBy[user.id] === 'up' && "text-primary"
                    )}
                    onClick={() => handleVote(post.id, 'up')}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    {post.upvotes - post.downvotes}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0",
                      user && post.votedBy[user.id] === 'down' && "text-destructive"
                    )}
                    onClick={() => handleVote(post.id, 'down')}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* Post Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {post.isPinned && (
                      <Badge variant="default" className="text-xs">Pinned</Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      Posted {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                  <p className="text-foreground mb-4">{post.content}</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      {post.commentCount} Comments
                    </Button>
                    <Button variant="ghost" size="sm">
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}