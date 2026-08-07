export const TIER = {
  GUEST: 'guest',
  MEMBER: 'member',
  PREMIUM: 'premium',
}

export const DAILY_LIMIT = {
  [TIER.GUEST]: 1,
  [TIER.MEMBER]: 3,
  [TIER.PREMIUM]: 5,
}

export function getTier({ isLoggedIn, isPremium }) {
  if (isPremium) return TIER.PREMIUM
  if (isLoggedIn) return TIER.MEMBER
  return TIER.GUEST
}
