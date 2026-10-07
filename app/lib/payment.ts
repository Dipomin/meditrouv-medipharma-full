/**
 * Catalogue de paiement partagé (source unique).
 *
 * Les écrans `paiement`, `paiement-mobile` et `pharmacien-paiement-mobile`
 * dupliquaient plans, opérateurs et libellés de durée — avec des
 * divergences (180 jours affiché « 1 an » dans `paiement.tsx`).
 *
 * Règle anti-fraude : les écrans de paiement ne font PAS confiance aux
 * paramètres de route (prix, montant, forfait forgeables par deep-link).
 * Ils recherchent le plan par ID dans ce catalogue et utilisent les
 * valeurs du catalogue.
 */

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  duration: number; // en jours
  description: string;
};

export const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basique",
    price: 1000,
    duration: 30,
    description: "Accès aux recherches de médicaments pendant 1 mois",
  },
  {
    id: "premium",
    name: "Premium",
    price: 2500,
    duration: 90,
    description: "Accès aux recherches de médicaments pendant 3 mois",
  },
  {
    id: "premiumPlus",
    name: "Premium +",
    price: 4000,
    duration: 180,
    description: "Accès aux recherches de médicaments pendant 6 mois",
  },
  {
    id: "annual",
    name: "Annuel",
    price: 8000,
    duration: 365,
    description: "Accès aux recherches de médicaments pendant 1 an",
  },
];

export const getSubscriptionPlan = (
  planId: string | undefined
): SubscriptionPlan | undefined =>
  SUBSCRIPTION_PLANS.find((plan) => plan.id === planId);

export const formatPlanDuration = (durationDays: number): string => {
  if (durationDays === 30) {
    return "1 mois";
  }
  if (durationDays === 90) {
    return "3 mois";
  }
  if (durationDays === 180) {
    return "6 mois";
  }
  if (durationDays === 365) {
    return "1 an";
  }
  return `${durationDays} jours`;
};

/** Abonnement pharmacien unique (montant/forfait de référence, pas ceux de l'URL). */
export const PHARMACIEN_SUBSCRIPTION = {
  montant: "30000",
  forfait: "Abonnement Medipharma Annuel",
  durationDays: 365,
} as const;

export type PaymentOperator = {
  id: string;
  name: string;
  color: string;
  instructions: string;
  ussdCode?: string;
};

export const PAYMENT_OPERATORS: readonly PaymentOperator[] = [
  {
    id: "orange",
    name: "Orange Money",
    color: "#ff6600",
    instructions:
      "Composez #144#4*6*1# sur votre téléphone pour confirmer le paiement",
    ussdCode: "#144#4*6*1#",
  },
  {
    id: "mtn",
    name: "MTN Mobile Money",
    color: "#ffcc00",
    instructions:
      "Composez *133*4*5# sur votre téléphone pour confirmer le paiement",
    ussdCode: "*133*4*5#",
  },
  {
    id: "moov",
    name: "Moov Money",
    color: "#0066cc",
    instructions:
      "Composez *155*1*5# sur votre téléphone pour confirmer le paiement",
    ussdCode: "*155*1*5#",
  },
  {
    id: "wave",
    name: "Wave",
    color: "#00cc66",
    instructions: "Scannez le code QR ci-dessous avec votre application Wave",
  },
];

/**
 * Logo d'un opérateur, chargé à la demande (les `require` statiques restent
 * analysables par Metro, mais le module reste importable sous Node pour les
 * tests tant que cette fonction n'est pas appelée).
 */
export const getOperatorLogo = (operatorId: string): number => {
  switch (operatorId) {
    case "orange":
      return require("../../assets/images/orange_money.png");
    case "mtn":
      return require("../../assets/images/mtn_mobile_money.png");
    case "moov":
      return require("../../assets/images/moov_money.png");
    case "wave":
    default:
      return require("../../assets/images/wave.png");
  }
};

export const getPaymentOperator = (
  operatorId: string | null
): PaymentOperator | undefined =>
  PAYMENT_OPERATORS.find((operator) => operator.id === operatorId);

/** Référence de paiement locale (démo : à remplacer par la référence opérateur). */
export const generatePaymentReference = (): string =>
  `PAY-${new Date().getTime()}`;

/** Période d'abonnement : souscription maintenant, expiration à +durationDays. */
export const buildSubscriptionPeriod = (
  durationDays: number
): { dateSouscription: string; dateExpiration: string } => {
  const now = new Date();
  const expiration = new Date(now);
  expiration.setDate(now.getDate() + durationDays);
  return {
    dateSouscription: now.toISOString(),
    dateExpiration: expiration.toISOString(),
  };
};
