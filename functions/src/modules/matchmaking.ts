import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Calculate compatibility score between two users
export const calculateCompatibilityScore = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { targetUserId, matchType } = data;
  const userId = context.auth.uid;

  if (!targetUserId || !matchType) {
    throw new functions.https.HttpsError('invalid-argument', 'targetUserId and matchType are required');
  }

  try {
    // Get both users' data
    const [currentUserDoc, targetUserDoc] = await Promise.all([
      db.collection('users').doc(userId).get(),
      db.collection('users').doc(targetUserId).get()
    ]);

    if (!currentUserDoc.exists || !targetUserDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const currentUser = currentUserDoc.data();
    const targetUser = targetUserDoc.data();

    if (!currentUser || !targetUser) {
      throw new functions.https.HttpsError('not-found', 'User data not found');
    }

    const score = calculateScore(currentUser, targetUser, matchType);
    
    return { 
      compatibilityScore: score.total,
      breakdown: score.breakdown,
      matchType
    };
  } catch (error) {
    console.error('Error calculating compatibility score:', error);
    throw new functions.https.HttpsError('internal', 'Failed to calculate compatibility');
  }
});

// Helper function to calculate detailed compatibility score
function calculateScore(user1: any, user2: any, matchType: string) {
  let total = 0;
  const breakdown: any = {};

  // Skill overlap (high weight for teammates/cofounders)
  const skillOverlap = calculateArrayOverlap(user1.skills || [], user2.skills || []);
  const skillScore = skillOverlap.overlap * (matchType === 'teammate' || matchType === 'cofounder' ? 15 : 10);
  total += skillScore;
  breakdown.skills = { score: skillScore, overlap: skillOverlap.overlap, common: skillOverlap.common };

  // Interest overlap
  const interestOverlap = calculateArrayOverlap(user1.interests || [], user2.interests || []);
  const interestScore = interestOverlap.overlap * 8;
  total += interestScore;
  breakdown.interests = { score: interestScore, overlap: interestOverlap.overlap, common: interestOverlap.common };

  // Goal alignment (important for cofounders)
  if (user1.compatibility?.goals && user2.compatibility?.goals) {
    const goalOverlap = calculateArrayOverlap(user1.compatibility.goals, user2.compatibility.goals);
    const goalScore = goalOverlap.overlap * (matchType === 'cofounder' ? 20 : 10);
    total += goalScore;
    breakdown.goals = { score: goalScore, overlap: goalOverlap.overlap, common: goalOverlap.common };
  }

  // Role compatibility
  if (matchType === 'mentor') {
    // For mentorship, prioritize experience gap
    const experienceGap = calculateExperienceGap(user1, user2);
    const roleScore = experienceGap > 0 ? 25 : 0; // Positive if user2 can mentor user1
    total += roleScore;
    breakdown.mentorship = { score: roleScore, experienceGap };
  } else {
    // For other matches, same role gets bonus
    const roleScore = user1.role === user2.role ? 15 : 0;
    total += roleScore;
    breakdown.role = { score: roleScore, match: user1.role === user2.role };
  }

  // Location proximity (if available)
  if (user1.location && user2.location) {
    const locationScore = user1.location === user2.location ? 10 : 5;
    total += locationScore;
    breakdown.location = { score: locationScore, sameLocation: user1.location === user2.location };
  }

  // Company/College affinity
  let affiliationScore = 0;
  if (user1.company && user2.company && user1.company === user2.company) {
    affiliationScore = 15;
  } else if (user1.college && user2.college && user1.college === user2.college) {
    affiliationScore = 10;
  }
  total += affiliationScore;
  breakdown.affiliation = { score: affiliationScore };

  // Personality compatibility (if available)
  if (user1.compatibility?.personalityType && user2.compatibility?.personalityType) {
    const personalityScore = calculatePersonalityCompatibility(
      user1.compatibility.personalityType, 
      user2.compatibility.personalityType
    );
    total += personalityScore;
    breakdown.personality = { score: personalityScore };
  }

  // Work style compatibility
  if (user1.compatibility?.workStyle && user2.compatibility?.workStyle) {
    const workStyleScore = user1.compatibility.workStyle === user2.compatibility.workStyle ? 10 : 5;
    total += workStyleScore;
    breakdown.workStyle = { score: workStyleScore };
  }

  // Normalize to 0-100 scale
  const maxPossibleScore = 150; // Approximate maximum based on all factors
  total = Math.min(100, (total / maxPossibleScore) * 100);

  return { total: Math.round(total), breakdown };
}

// Calculate array overlap
function calculateArrayOverlap(arr1: string[], arr2: string[]) {
  const set1 = new Set(arr1.map(item => item.toLowerCase()));
  const set2 = new Set(arr2.map(item => item.toLowerCase()));
  
  const common = [...set1].filter(item => set2.has(item));
  const overlap = common.length;
  
  return { overlap, common };
}

// Calculate experience gap for mentorship
function calculateExperienceGap(user1: any, user2: any) {
  // Simple heuristic based on role and years (would need more data in real app)
  const roles = { 'student': 0, 'professional': 1, 'organizer': 2 };
  const user1Level = roles[user1.role as keyof typeof roles] || 0;
  const user2Level = roles[user2.role as keyof typeof roles] || 0;
  
  return user2Level - user1Level;
}

// Calculate personality compatibility (simplified MBTI compatibility)
function calculatePersonalityCompatibility(type1: string, type2: string) {
  // Simplified compatibility matrix
  const compatibilityMatrix: { [key: string]: { [key: string]: number } } = {
    'ENTJ': { 'INTP': 20, 'INTJ': 15, 'ENTP': 15 },
    'INTJ': { 'ENFP': 20, 'ENTP': 15, 'ENTJ': 15 },
    'ENFP': { 'INTJ': 20, 'INFJ': 15, 'ENFJ': 15 },
    'INFJ': { 'ENFP': 20, 'ENTP': 15, 'ENFJ': 15 }
    // Add more combinations as needed
  };
  
  return compatibilityMatrix[type1]?.[type2] || 
         compatibilityMatrix[type2]?.[type1] || 
         (type1 === type2 ? 10 : 5);
}

// Generate team suggestions for a user
export const generateTeamSuggestions = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { projectType, requiredSkills, teamSize } = data;
  const userId = context.auth.uid;

  try {
    // Get current user data
    const currentUserDoc = await db.collection('users').doc(userId).get();
    const currentUser = currentUserDoc.data();

    if (!currentUser) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    // Get potential team members
    const usersSnapshot = await db.collection('users')
      .where('isLookingForTeammate', '==', true)
      .limit(50)
      .get();

    const candidates = [];
    
    for (const doc of usersSnapshot.docs) {
      if (doc.id === userId) continue; // Skip current user
      
      const candidate = doc.data();
      const compatibility = calculateScore(currentUser, candidate, 'teammate');
      
      // Check skill match with required skills
      const skillMatch = requiredSkills ? 
        calculateArrayOverlap(candidate.skills || [], requiredSkills) : 
        { overlap: 0, common: [] };
      
      candidates.push({
        id: doc.id,
        name: candidate.name,
        role: candidate.role,
        skills: candidate.skills?.slice(0, 5) || [],
        company: candidate.company,
        compatibility: compatibility.total,
        skillMatch: skillMatch.overlap,
        avatar: candidate.avatar
      });
    }

    // Sort by compatibility and skill match
    candidates.sort((a, b) => {
      const scoreA = a.compatibility + (a.skillMatch * 10);
      const scoreB = b.compatibility + (b.skillMatch * 10);
      return scoreB - scoreA;
    });

    // Generate team combinations if team size specified
    let teamSuggestions = [];
    if (teamSize && teamSize > 1) {
      teamSuggestions = generateTeamCombinations(
        candidates.slice(0, 20), // Top 20 candidates
        teamSize - 1, // Excluding current user
        requiredSkills
      );
    }

    return {
      individualSuggestions: candidates.slice(0, 10),
      teamSuggestions: teamSuggestions.slice(0, 5),
      projectType,
      requiredSkills
    };
  } catch (error) {
    console.error('Error generating team suggestions:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate suggestions');
  }
});

// Generate team combinations
function generateTeamCombinations(candidates: any[], teamSize: number, requiredSkills: string[]) {
  if (teamSize === 1) {
    return candidates.slice(0, 5).map(candidate => ({
      members: [candidate],
      totalCompatibility: candidate.compatibility,
      skillCoverage: calculateSkillCoverage([candidate], requiredSkills),
      teamScore: candidate.compatibility
    }));
  }

  const combinations = [];
  
  // Generate pairs/small teams (simplified for performance)
  for (let i = 0; i < Math.min(10, candidates.length); i++) {
    for (let j = i + 1; j < Math.min(15, candidates.length) && combinations.length < 20; j++) {
      const team = [candidates[i], candidates[j]];
      const avgCompatibility = (team[0].compatibility + team[1].compatibility) / 2;
      const skillCoverage = calculateSkillCoverage(team, requiredSkills);
      
      combinations.push({
        members: team,
        totalCompatibility: avgCompatibility,
        skillCoverage,
        teamScore: avgCompatibility + (skillCoverage * 10)
      });
    }
  }

  return combinations.sort((a, b) => b.teamScore - a.teamScore);
}

// Calculate skill coverage for a team
function calculateSkillCoverage(team: any[], requiredSkills: string[]) {
  if (!requiredSkills || requiredSkills.length === 0) return 0;
  
  const teamSkills = new Set();
  team.forEach(member => {
    (member.skills || []).forEach((skill: string) => teamSkills.add(skill.toLowerCase()));
  });
  
  const coveredSkills = requiredSkills.filter(skill => 
    teamSkills.has(skill.toLowerCase())
  );
  
  return coveredSkills.length / requiredSkills.length;
}

// Process matchmaking requests (swipe actions)
export const processMatchmakingRequests = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { targetUserId, action, matchType } = data;
  const userId = context.auth.uid;

  if (!targetUserId || !action || !matchType) {
    throw new functions.https.HttpsError('invalid-argument', 'targetUserId, action, and matchType are required');
  }

  if (!['like', 'pass', 'super_like'].includes(action)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid action');
  }

  try {
    // Record the swipe action
    const swipeRef = await db.collection('swipeActions').add({
      userId,
      targetUserId,
      action,
      matchType,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    let matched = false;
    let matchId = null;

    // Check for mutual like (match)
    if (action === 'like' || action === 'super_like') {
      const reciprocalSwipe = await db.collection('swipeActions')
        .where('userId', '==', targetUserId)
        .where('targetUserId', '==', userId)
        .where('action', 'in', ['like', 'super_like'])
        .limit(1)
        .get();

      if (!reciprocalSwipe.empty) {
        // It's a match!
        matched = true;
        
        // Create match record
        const matchRef = await db.collection('matches').add({
          user1Id: userId,
          user2Id: targetUserId,
          matchType,
          status: 'matched',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          matchedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        matchId = matchRef.id;

        // Generate ice breakers
        const icebreakers = await generateIcebreakers(userId, targetUserId, matchType);

        // Update match with ice breakers
        await matchRef.update({
          icebreakers: icebreakers,
          commonInterests: [], // Would calculate based on user data
          reasonForMatch: `High compatibility match for ${matchType}`
        });

        // Send notifications to both users
        const batch = db.batch();

        const notification1Ref = db.collection('notifications').doc();
        batch.set(notification1Ref, {
          userId,
          type: 'match_found',
          title: 'New Match! 🎉',
          message: `You have a new ${matchType} match`,
          data: {
            matchId: matchRef.id,
            matchedUserId: targetUserId,
            matchType
          },
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        const notification2Ref = db.collection('notifications').doc();
        batch.set(notification2Ref, {
          userId: targetUserId,
          type: 'match_found',
          title: 'New Match! 🎉',
          message: `You have a new ${matchType} match`,
          data: {
            matchId: matchRef.id,
            matchedUserId: userId,
            matchType
          },
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await batch.commit();

        // Award points for matching
        await Promise.all([
          db.collection('users').doc(userId).update({
            points: admin.firestore.FieldValue.increment(20)
          }),
          db.collection('users').doc(targetUserId).update({
            points: admin.firestore.FieldValue.increment(20)
          })
        ]);
      }
    }

    // Track analytics
    await db.collection('analytics').add({
      userId,
      eventType: 'matchmaking_swipe',
      eventData: {
        action,
        matchType,
        targetUserId,
        matched,
        matchId
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { 
      success: true, 
      matched,
      matchId,
      swipeId: swipeRef.id
    };
  } catch (error) {
    console.error('Error processing matchmaking request:', error);
    throw new functions.https.HttpsError('internal', 'Failed to process matchmaking request');
  }
});

// Generate ice breakers for matches
async function generateIcebreakers(user1Id: string, user2Id: string, matchType: string): Promise<string[]> {
  try {
    const [user1Doc, user2Doc] = await Promise.all([
      db.collection('users').doc(user1Id).get(),
      db.collection('users').doc(user2Id).get()
    ]);

    const user1 = user1Doc.data();
    const user2 = user2Doc.data();

    const icebreakers = [];

    // Skill-based icebreakers
    const skillOverlap = calculateArrayOverlap(user1?.skills || [], user2?.skills || []);
    if (skillOverlap.common.length > 0) {
      icebreakers.push(`You both are skilled in ${skillOverlap.common[0]}!`);
    }

    // Interest-based icebreakers
    const interestOverlap = calculateArrayOverlap(user1?.interests || [], user2?.interests || []);
    if (interestOverlap.common.length > 0) {
      icebreakers.push(`You both are interested in ${interestOverlap.common[0]}!`);
    }

    // Match type specific icebreakers
    switch (matchType) {
      case 'cofounder':
        icebreakers.push('Discuss your startup ideas and vision');
        icebreakers.push('Share your entrepreneurial experience');
        break;
      case 'mentor':
        icebreakers.push('Ask about their career journey');
        icebreakers.push('Seek advice on professional development');
        break;
      case 'teammate':
        icebreakers.push('Discuss potential collaboration opportunities');
        icebreakers.push('Share your project experience');
        break;
      default:
        icebreakers.push('Start with a friendly introduction');
    }

    return icebreakers.slice(0, 3); // Return top 3
  } catch (error) {
    console.error('Error generating icebreakers:', error);
    return ['Start with a friendly hello!'];
  }
}

// Update matching preferences
export const updateMatchingPreferences = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { 
    lookingFor, 
    goals, 
    interests, 
    skills, 
    preferences, 
    personalityTraits, 
    availability 
  } = data;
  
  const userId = context.auth.uid;

  try {
    // Update user's match profile
    await db.collection('users').doc(userId).update({
      isLookingForMentor: lookingFor?.includes('mentor') || false,
      isLookingForMentee: lookingFor?.includes('mentee') || false,
      isLookingForCofounder: lookingFor?.includes('cofounder') || false,
      isLookingForTeammate: lookingFor?.includes('teammate') || false,
      matchingPreferences: {
        goals: goals || [],
        interests: interests || [],
        skills: skills || [],
        preferences: preferences || {},
        personalityTraits: personalityTraits || [],
        availability: availability || {}
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create or update match profile
    await db.collection('matchProfiles').doc(userId).set({
      userId,
      goals: goals || [],
      interests: interests || [],
      skills: skills || [],
      lookingFor: lookingFor || [],
      preferences: preferences || {},
      personalityTraits: personalityTraits || [],
      availability: availability || {},
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error updating matching preferences:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update preferences');
  }
});

// Get potential matches for a user
export const getPotentialMatches = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { matchType, limit = 10 } = data;
  const userId = context.auth.uid;

  try {
    // Get user's match profile and previous swipes
    const [userDoc, swipesSnapshot] = await Promise.all([
      db.collection('users').doc(userId).get(),
      db.collection('swipeActions')
        .where('userId', '==', userId)
        .get()
    ]);

    const userData = userDoc.data();
    if (!userData) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    // Get users already swiped on
    const swipedUserIds = new Set(
      swipesSnapshot.docs.map(doc => doc.data().targetUserId)
    );

    // Get potential matches based on match type
    let query = db.collection('users').limit(limit * 3); // Get more to filter

    switch (matchType) {
      case 'mentor':
        query = query.where('isLookingForMentee', '==', true);
        break;
      case 'mentee':
        query = query.where('isLookingForMentor', '==', true);
        break;
      case 'cofounder':
        query = query.where('isLookingForCofounder', '==', true);
        break;
      case 'teammate':
        query = query.where('isLookingForTeammate', '==', true);
        break;
    }

    const candidatesSnapshot = await query.get();
    const potentialMatches = [];

    for (const doc of candidatesSnapshot.docs) {
      if (doc.id === userId || swipedUserIds.has(doc.id)) {
        continue; // Skip self and already swiped users
      }

      const candidate = doc.data();
      const compatibility = calculateScore(userData, candidate, matchType);

      // Generate ice breakers and reasons
      const icebreakers = await generateIcebreakers(userId, doc.id, matchType);
      const commonInterests = calculateArrayOverlap(
        userData.interests || [], 
        candidate.interests || []
      ).common;

      potentialMatches.push({
        id: doc.id,
        user: {
          name: candidate.name,
          role: candidate.role,
          company: candidate.company,
          college: candidate.college,
          bio: candidate.bio,
          avatar: candidate.avatar,
          skills: candidate.skills?.slice(0, 5) || [],
          location: candidate.location
        },
        compatibilityScore: compatibility.total,
        matchType,
        icebreakers,
        commonInterests: commonInterests.slice(0, 3),
        reasonForMatch: generateMatchReason(compatibility, matchType)
      });
    }

    // Sort by compatibility score
    potentialMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return {
      matches: potentialMatches.slice(0, limit),
      matchType
    };
  } catch (error) {
    console.error('Error getting potential matches:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get matches');
  }
});

// Generate match reason based on compatibility breakdown
function generateMatchReason(compatibility: any, matchType: string): string {
  const breakdown = compatibility.breakdown;
  const reasons = [];

  if (breakdown.skills?.score > 15) {
    reasons.push('strong skill alignment');
  }
  if (breakdown.interests?.score > 10) {
    reasons.push('shared interests');
  }
  if (breakdown.goals?.score > 15) {
    reasons.push('aligned goals');
  }
  if (breakdown.role?.match) {
    reasons.push('same professional background');
  }
  if (breakdown.location?.sameLocation) {
    reasons.push('same location');
  }

  const reasonText = reasons.length > 0 ? 
    `Great match based on ${reasons.join(', ')}` :
    `Good potential for ${matchType} collaboration`;

  return reasonText;
}

export const matchmakingFunctions = {
  calculateCompatibilityScore,
  generateTeamSuggestions,
  processMatchmakingRequests,
  updateMatchingPreferences,
  getPotentialMatches
};