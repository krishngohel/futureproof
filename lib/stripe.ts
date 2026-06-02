import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export const PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_ID_STARTER!,
  pro:     process.env.STRIPE_PRICE_ID_PRO!,
  max:     process.env.STRIPE_PRICE_ID_MAX!,
};

export const PLANS = {
  starter: {
    name: "Starter",
    price: 5,
    tokensPerWeek: 50_000,
    priceId: PRICE_IDS.starter,
  },
  pro: {
    name: "Pro",
    price: 12,
    tokensPerWeek: 150_000,
    priceId: PRICE_IDS.pro,
  },
  max: {
    name: "Max",
    price: 20,
    tokensPerWeek: 200_000,
    priceId: PRICE_IDS.max,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
