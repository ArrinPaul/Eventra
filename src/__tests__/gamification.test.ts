import { describe, expect, it } from 'vitest';
import { EVENTOS_CONFIG, canAccessFeature, getRolePermissions } from '@/core/config/eventos-config';
import { getUserSkills, type User } from '@/types';

describe('Gamification and Plan Access', () => {
  it('grants AI recommendations to Pro and Enterprise plans', () => {
    expect(canAccessFeature('pro', 'aiRecommendations')).toBe(true);
    expect(canAccessFeature('enterprise', 'aiRecommendations')).toBe(true);
  });

  it('does not grant AI recommendations to Free plan', () => {
    expect(canAccessFeature('free', 'aiRecommendations')).toBe(false);
  });

  it('returns role hierarchy permissions for admin and organizer', () => {
    const adminPermissions = getRolePermissions('admin');
    const organizerPermissions = getRolePermissions('organizer');

    expect(adminPermissions).toContain('admin');
    expect(organizerPermissions).toContain('organizer');
    expect(organizerPermissions).not.toContain('admin');
  });

  it('derives user skills from profile interests plus role defaults', () => {
    const user: User = {
      id: 'u1',
      name: 'A',
      email: 'a@example.com',
      role: 'organizer',
      interests: 'ai, networking',
    };

    const skills = getUserSkills(user);
    expect(skills).toContain('ai');
    expect(skills).toContain('networking');
    expect(skills).toContain('event management');
  });

  it('keeps plan constants stable for automation workflow limits', () => {
    expect(EVENTOS_CONFIG.plans.FREE.features.automationWorkflows).toBe(0);
    expect(EVENTOS_CONFIG.plans.PRO.features.automationWorkflows).toBe(5);
    expect(EVENTOS_CONFIG.plans.ENTERPRISE.features.automationWorkflows).toBe(-1);
  });
});
