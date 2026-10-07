// Définition des routes typées pour Medipharma.
export type AppRoutes = {
  "/": undefined;
  "/about": undefined;
  "/auth": undefined;
  "/inscription": undefined;
  "/dashboard": undefined;
  "/notifications": undefined;
  "/notification-details/[id]": {
    id: string;
  };
  "/stock": undefined;
  "/stock-new": undefined;
  "/stock-edit/[id]": {
    id: string;
  };
  "/commandes": {
    tab?: string;
  };
  "/commande-new": {
    pharmacieId?: string;
    medicamentId?: string;
    medicamentNom?: string;
  };
  "/demandes": {
    tab?: string;
  };
  "/demande-new": undefined;
  "/demande-details/[id]": {
    id: string;
  };
  "/profil": undefined;
  "/abonnement": undefined;
  "/paiement-mobile": undefined;
};
