// Utility to get active users from AuthContext profiles.
// This module exposes a setter so the AuthProvider can push
// the latest profiles list without coupling to React context.

interface ActiveUser {
  id: string;
  user_id: string;
  name: string;
  role: string;
}

let _profiles: ActiveUser[] = [];

/** Called by AuthProvider whenever profiles change */
export function setActiveProfiles(profiles: ActiveUser[]) {
  _profiles = profiles.filter(p => (p as any).is_active !== false);
}

/** All active users (any role) — for Responsável / Criador filters */
export function getAllActiveUsers(): { value: string; label: string }[] {
  return _profiles.map(p => ({ value: p.name, label: p.name }));
}

/** Only active users whose role matches "designer" */
export function getActiveDesigners(): { id: string; name: string }[] {
  return _profiles
    .filter(p => p.role === "designer")
    .map(p => ({ id: p.user_id || p.id, name: p.name }));
}

/** Only active users whose role matches "copywriter" */
export function getActiveCopywriters(): { id: string; name: string }[] {
  return _profiles
    .filter(p => p.role === "copywriter")
    .map(p => ({ id: p.user_id || p.id, name: p.name }));
}

/** Designers + Copywriters — for Ranking filter options */
export function getActiveCreators(): string[] {
  return _profiles
    .filter(p => p.role === "designer" || p.role === "copywriter")
    .map(p => p.name);
}

/** Look up a user's squad by their display name */
export function getUserSquadByName(name: string): string | null {
  const profile = _profiles.find(p => p.name === name);
  return (profile as any)?.squad || null;
}
