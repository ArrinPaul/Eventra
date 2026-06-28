import { CampusLocation, CAMPUS_LOCATIONS } from './campus-locations';
import { findNearestLocations } from './gps-utils';

interface GPSMatch {
  location: CampusLocation;
  distance: number;
  confidence: number;
}

interface AIPrediction {
  location: CampusLocation;
  confidence: number;
}

interface HybridWeights {
  gps: number;
  ai: number;
}

export interface HybridPredictionResult {
  finalLocation: CampusLocation | null;
  finalConfidence: number;
  gpsContribution: number;
  aiContribution: number;
  method: 'gps-only' | 'ai-only' | 'hybrid';
  breakdown: { gpsScore: number; aiScore: number; combinedScore: number };
  suggestions: Array<{
    location: CampusLocation;
    confidence: number;
    source: 'gps' | 'ai' | 'both';
  }>;
}

export function combinePredictions(
  gpsMatch: GPSMatch | null,
  aiPrediction: AIPrediction | null,
  weights: HybridWeights = { gps: 0.4, ai: 0.6 }
): HybridPredictionResult {
  const hasGPS = !!gpsMatch;
  const hasAI = !!aiPrediction;

  if (!hasGPS && !hasAI) {
    return {
      finalLocation: null,
      finalConfidence: 0,
      gpsContribution: 0,
      aiContribution: 0,
      method: 'hybrid',
      breakdown: { gpsScore: 0, aiScore: 0, combinedScore: 0 },
      suggestions: [],
    };
  }

  if (hasGPS && !hasAI) {
    return {
      finalLocation: gpsMatch!.location,
      finalConfidence: gpsMatch!.confidence,
      gpsContribution: 100,
      aiContribution: 0,
      method: 'gps-only',
      breakdown: { gpsScore: gpsMatch!.confidence, aiScore: 0, combinedScore: gpsMatch!.confidence },
      suggestions: [{ location: gpsMatch!.location, confidence: gpsMatch!.confidence, source: 'gps' }],
    };
  }

  if (!hasGPS && hasAI) {
    return {
      finalLocation: aiPrediction!.location,
      finalConfidence: aiPrediction!.confidence,
      gpsContribution: 0,
      aiContribution: 100,
      method: 'ai-only',
      breakdown: { gpsScore: 0, aiScore: aiPrediction!.confidence, combinedScore: aiPrediction!.confidence },
      suggestions: [{ location: aiPrediction!.location, confidence: aiPrediction!.confidence, source: 'ai' }],
    };
  }

  const gpsScore = gpsMatch!.confidence * weights.gps;
  const aiScore = aiPrediction!.confidence * weights.ai;
  const combinedScore = gpsScore + aiScore;

  let agreementBoost = 0;
  if (gpsMatch!.location.id === aiPrediction!.location.id) {
    agreementBoost = Math.min(0.2, combinedScore * 0.2);
  }

  const finalConfidence = Math.min(1, combinedScore + agreementBoost);

  const gpsContrib = Math.round((gpsScore / combinedScore) * 100);
  const aiContrib = Math.round((aiScore / combinedScore) * 100);

  const suggestions = buildSuggestions(gpsMatch!, aiPrediction!, weights);

  return {
    finalLocation: combinedScore >= gpsScore ? aiPrediction!.location : gpsMatch!.location,
    finalConfidence,
    gpsContribution: gpsContrib,
    aiContribution: aiContrib,
    method: 'hybrid',
    breakdown: { gpsScore, aiScore, combinedScore },
    suggestions,
  };
}

function buildSuggestions(
  gpsMatch: GPSMatch,
  aiPrediction: AIPrediction,
  weights: HybridWeights
): HybridPredictionResult['suggestions'] {
  const allLocations = new Map<string, { location: CampusLocation; gpsScore: number; aiScore: number }>();

  const gpsNearest = findNearestLocations(gpsMatch.location.lat, gpsMatch.location.lng).slice(0, 3);
  for (const g of gpsNearest) {
    allLocations.set(g.location.id, { location: g.location, gpsScore: g.confidence * weights.gps, aiScore: 0 });
  }

  const existing = allLocations.get(aiPrediction.location.id);
  if (existing) {
    existing.aiScore = aiPrediction.confidence * weights.ai;
  } else {
    allLocations.set(aiPrediction.location.id, {
      location: aiPrediction.location,
      gpsScore: 0,
      aiScore: aiPrediction.confidence * weights.ai,
    });
  }

  return Array.from(allLocations.values())
    .map((item) => ({
      location: item.location,
      confidence: item.gpsScore + item.aiScore,
      source: item.gpsScore > 0 && item.aiScore > 0 ? 'both' as const :
              item.gpsScore > 0 ? 'gps' as const : 'ai' as const,
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

export function parseAIPrediction(result: any): AIPrediction | null {
  if (!result?.location) return null;
  const location = CAMPUS_LOCATIONS.find(
    (l) => l.name.toLowerCase() === result.location.toLowerCase() ||
           l.id.toLowerCase() === result.location.toLowerCase()
  );
  if (!location) return null;
  return { location, confidence: result.confidence || 0.8 };
}
