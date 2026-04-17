'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Calendar, Users, MessageSquare, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function SearchPage() {
  const [query, setQuery] = useState('');
//   
//   const hasResults = results.events.length > 0 || results.users.length > 0 || results.communities.length > 0;
// 
//   return (
//     <div className="container mx-auto px-4 py-12 max-w-5xl text-white space-y-12">
//       <div className="text-center space-y-4">
//         <h1 className="text-5xl font-extrabold tracking-tight">Search Eventra</h1>
//         <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Find events, connect with people, and discover communities across the platform.</p>
//         
//         <div className="relative max-w-2xl mx-auto mt-8">
//           <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
//           <Input 
//             autoFocus
//             placeholder="Search for anything..." 
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             className="pl-14 h-16 text-xl bg-muted/40 border-border rounded-2xl focus-visible:ring-primary transition-all"
//           />
//         </div>
//       </div>
// 
//       {!query.trim() ? (
//         <div className="py-20 text-center space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
//             <div className="p-6 bg-muted/40 border border-border rounded-2xl text-center space-y-3">
//               <Calendar className="h-8 w-8 mx-auto text-primary" />
//               <h3 className="font-bold">Events</h3>
//               <p className="text-xs text-muted-foreground">Workshops, conferences, and meetups</p>
//             </div>
//             <div className="p-6 bg-muted/40 border border-border rounded-2xl text-center space-y-3">
//               <Users className="h-8 w-8 mx-auto text-purple-400" />
//               <h3 className="font-bold">People</h3>
//               <p className="text-xs text-muted-foreground">Network with professionals and students</p>
//             </div>
//             <div className="p-6 bg-muted/40 border border-border rounded-2xl text-center space-y-3">
//               <MessageSquare className="h-8 w-8 mx-auto text-pink-400" />
//               <h3 className="font-bold">Communities</h3>
//               <p className="text-xs text-muted-foreground">Join interest-based groups</p>
//             </div>
//           </div>
//         </div>
//       ) : query.length < 2 ? (
//         <div className="py-20 text-center text-muted-foreground">
//           Keep typing to see results...
//         </div>
//       ) : !hasResults ? (
//         <div className="py-20 text-center space-y-4">
//           <div className="w-20 h-20 bg-muted/40 rounded-full flex items-center justify-center mx-auto">
//             <Search className="h-10 w-10 text-muted-foreground" />
//           </div>
//           <p className="text-xl font-medium">No results found for &quot;{query}&quot;</p>
//           <p className="text-muted-foreground">Try adjusting your search or check for typos.</p>
//         </div>
//       ) : (
//         <div className="space-y-12">
//           {results.events.length > 0 && (
//             <section className="space-y-6">
//               <div className="flex items-center justify-between border-b border-border pb-4">
//                 <h2 className="text-2xl font-bold flex items-center gap-2">
//                   <Calendar className="text-primary h-6 w-6" /> Events
//                 </h2>
//                 <Badge variant="secondary" className="bg-primary/10 text-primary border-0">{results.events.length} found</Badge>
//               </div>
//               <div className="grid gap-4">
//                 {results.events.map((e: any) => (
//                   <Link key={e._id} href={`/events/${e._id}`}>
//                     <Card className="bg-muted/40 border-border hover:bg-muted transition-all group overflow-hidden">
//                       <CardContent className="p-6 flex items-center justify-between">
//                         <div className="space-y-1">
//                           <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{e.title}</h3>
//                           <div className="flex items-center gap-4 text-sm text-muted-foreground">
//                             <span>{e.category}</span>
//                             <span>•</span>
//                             <span>{format(new Date(e.startDate), 'PPP')}</span>
//                           </div>
//                         </div>
//                         <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-white transition-all transform group-hover:translate-x-1" />
//                       </CardContent>
//                     </Card>
//                   </Link>
//                 ))}
//               </div>
//             </section>
//           )}
// 
//           {results.users.length > 0 && (
//             <section className="space-y-6">
//               <div className="flex items-center justify-between border-b border-border pb-4">
//                 <h2 className="text-2xl font-bold flex items-center gap-2">
//                   <Users className="text-purple-400 h-6 w-6" /> People
//                 </h2>
//                 <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-0">{results.users.length} found</Badge>
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {results.users.map((u: any) => (
//                   <Link key={u._id} href={`/profile/${u._id}`}>
//                     <Card className="bg-muted/40 border-border hover:border-purple-500/30 transition-all group h-full">
//                       <CardContent className="p-6 flex items-center gap-4">
//                         <Avatar className="h-14 w-14 border border-border group-hover:border-purple-500/50 transition-all">
//                           <AvatarImage src={u.image} />
//                           <AvatarFallback className="bg-purple-500/10 text-purple-400">{u.name?.charAt(0)}</AvatarFallback>
//                         </Avatar>
//                         <div className="overflow-hidden">
//                           <h3 className="font-bold text-lg truncate group-hover:text-purple-400 transition-colors">{u.name}</h3>
//                           <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   </Link>
//                 ))}
//               </div>
//             </section>
//           )}
// 
//           {results.communities.length > 0 && (
//             <section className="space-y-6">
//               <div className="flex items-center justify-between border-b border-border pb-4">
//                 <h2 className="text-2xl font-bold flex items-center gap-2">
//                   <MessageSquare className="text-pink-400 h-6 w-6" /> Communities
//                 </h2>
//                 <Badge variant="secondary" className="bg-pink-500/10 text-pink-400 border-0">{results.communities.length} found</Badge>
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {results.communities.map((c: any) => (
//                   <Link key={c._id} href={`/community/${c._id}`}>
//                     <Card className="bg-muted/40 border-border hover:border-pink-500/30 transition-all group overflow-hidden h-full">
//                       <CardContent className="p-6 flex items-center justify-between">
//                         <div className="space-y-1">
//                           <h3 className="text-lg font-bold group-hover:text-pink-400 transition-colors">{c.name}</h3>
//                           <p className="text-sm text-muted-foreground">{c.category}</p>
//                         </div>
//                         <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center group-hover:bg-pink-500/20 transition-all">
//                           <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-pink-400" />
//                         </div>
//                       </CardContent>
//                     </Card>
//                   </Link>
//                 ))}
//               </div>
//             </section>
//           )}
//         </div>
//       )}
//     </div>
//   );
}


