export const features = {
  openRouter: process.env.NEXT_PUBLIC_FEATURE_OPENROUTER === 'true',
  offlineAI: process.env.NEXT_PUBLIC_FEATURE_OFFLINE_AI === 'true',
  prWrite: process.env.NEXT_PUBLIC_FEATURE_PR_WRITE === 'true',
  eccReviews: process.env.NEXT_PUBLIC_FEATURE_ECC_REVIEWS === 'true',
}
