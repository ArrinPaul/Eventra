'use server';

export interface RecommendationBundle {
	events: Array<{ id: string; title: string; category?: string; score?: number }>;
	sessions: Array<{ id: string; title: string; track?: string; score?: number }>;
	people: Array<{ id: string; name: string; role?: string; score?: number }>;
}

function getSeed(userId?: string): number {
	if (!userId) return 7;
	return userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function scoreFromSeed(seed: number, offset: number): number {
	return 65 + ((seed + offset * 13) % 31);
}

export async function getPersonalizedRecommendations(userId?: string): Promise<RecommendationBundle> {
	const seed = getSeed(userId);

	return {
		events: [
			{ id: 'event-ai-1', title: 'AI Product Strategy Summit', category: 'Tech', score: scoreFromSeed(seed, 1) },
			{ id: 'event-net-1', title: 'Startup Networking Mixer', category: 'Networking', score: scoreFromSeed(seed, 2) },
		],
		sessions: [
			{ id: 'session-ml-1', title: 'Practical LLM Ops', track: 'AI', score: scoreFromSeed(seed, 3) },
			{ id: 'session-ux-1', title: 'Designing Intelligent UX', track: 'Product', score: scoreFromSeed(seed, 4) },
		],
		people: [
			{ id: 'person-1', name: 'Alex Kim', role: 'Product Manager', score: scoreFromSeed(seed, 5) },
			{ id: 'person-2', name: 'Priya Nair', role: 'ML Engineer', score: scoreFromSeed(seed, 6) },
		],
	};
}

export async function getAIRecommendations(userId?: string): Promise<Array<{ id: string; title: string; score?: number; eventId?: string; relevanceScore?: number; reason?: string; pitch?: string; confidenceLevel?: 'high' | 'medium' | 'low' }>> {
	const seed = getSeed(userId);

	return [
		{
			id: 'rec-event-1',
			eventId: 'event-ai-1',
			title: 'AI Product Strategy Summit',
			score: scoreFromSeed(seed, 1),
			relevanceScore: scoreFromSeed(seed, 1),
			reason: 'Strong overlap with your interest in AI and product innovation.',
			pitch: 'High-impact sessions and practical takeaways for your current goals.',
			confidenceLevel: 'high',
		},
		{
			id: 'rec-event-2',
			eventId: 'event-net-1',
			title: 'Startup Networking Mixer',
			score: scoreFromSeed(seed, 2),
			relevanceScore: scoreFromSeed(seed, 2),
			reason: 'Good fit for expanding your peer and mentor network.',
			pitch: 'Ideal setting to build meaningful professional connections quickly.',
			confidenceLevel: 'medium',
		},
	];
}

export async function getAIContentRecommendations(userId?: string): Promise<Array<{ id: string; title: string; type?: string; contentId?: string; difficulty?: string; author?: string; personalizedRationale?: string; relevanceScore?: number; estimatedTime?: number }>> {
	const seed = getSeed(userId);

	return [
		{
			id: 'content-1',
			contentId: 'content-1',
			title: 'Building Better Event Funnels',
			type: 'Guide',
			difficulty: 'Intermediate',
			author: 'Eventra AI Coach',
			personalizedRationale: 'Matches your recent focus on attendee growth and conversion.',
			relevanceScore: scoreFromSeed(seed, 7),
			estimatedTime: 18,
		},
		{
			id: 'content-2',
			contentId: 'content-2',
			title: 'Networking Conversation Frameworks',
			type: 'Playbook',
			difficulty: 'Beginner',
			author: 'Community Team',
			personalizedRationale: 'Useful for preparing for upcoming networking-heavy events.',
			relevanceScore: scoreFromSeed(seed, 8),
			estimatedTime: 12,
		},
	];
}

export async function getAIConnectionRecommendations(userId?: string): Promise<Array<{ id: string; name: string; score?: number; userId?: string; successLikelihood?: 'high' | 'medium' | 'low'; role?: string; company?: string; connectionRationale?: string; connectionValue?: number; conversationStarters?: string[]; approachStrategy?: string }>> {
	const seed = getSeed(userId);

	return [
		{
			id: 'conn-1',
			userId: 'conn-1',
			name: 'Jordan Patel',
			score: scoreFromSeed(seed, 9),
			successLikelihood: 'high',
			role: 'Engineering Manager',
			company: 'Nova Labs',
			connectionRationale: 'Shared interests in product-led growth and developer tooling.',
			connectionValue: scoreFromSeed(seed, 10),
			conversationStarters: [
				'What has worked best for improving developer onboarding in your team?',
				'How do you balance feature velocity with platform stability?',
			],
			approachStrategy: 'Open with shared interests, then discuss practical collaboration opportunities.',
		},
		{
			id: 'conn-2',
			userId: 'conn-2',
			name: 'Maya Fernandez',
			score: scoreFromSeed(seed, 11),
			successLikelihood: 'medium',
			role: 'Community Lead',
			company: 'Catalyst Hub',
			connectionRationale: 'Aligned goals around community engagement and event retention.',
			connectionValue: scoreFromSeed(seed, 12),
			conversationStarters: [
				'What engagement tactic surprised you most this quarter?',
				'How do you measure quality of community interactions?',
			],
			approachStrategy: 'Start with community outcomes, then propose a concrete idea exchange.',
		},
	];
}
