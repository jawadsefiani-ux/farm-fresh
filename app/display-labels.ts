export const fr = {
  status: { planned: "Prévue", seeded: "Semée", transplanted: "Repiquée", growing: "En croissance", ready_to_harvest: "Prête à récolter", harvesting: "Récolte en cours", finished: "Terminée", removed: "Retirée", in_stock: "En stock", low_stock: "Stock faible", out_of_stock: "Rupture de stock", discontinued: "Abandonnée" } as Record<string, string>,
  method: { direct_seed: "Semis direct", transplanted: "Repiqué", existing: "Déjà en place", unknown: "Inconnu" } as Record<string, string>,
  precision: { exact: "Exacte", approximate: "Approximative", unknown: "Inconnue" } as Record<string, string>,
  crop: { Tomato: "Tomate", "Cherry Tomato": "Tomate cerise", Onion: "Oignon", "Fava Bean": "Fève", "Spaghetti Squash": "Courge spaghetti", Pumpkin: "Citrouille", Courgette: "Courgette", Potato: "Pomme de terre" } as Record<string, string>,
};
export const label = (value: string, group: keyof Pick<typeof fr, "status" | "method" | "precision"> = "status") => fr[group][value] ?? value.replaceAll("_", " ");
export const cropLabel = (crop: string) => fr.crop[crop] ?? crop;
export const frenchDate = (date: string | Date, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) => new Intl.DateTimeFormat("fr-FR", options).format(new Date(date));
