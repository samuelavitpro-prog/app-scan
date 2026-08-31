import { QuoteItemLine, InventoryItem, QuoteLogisticsMetrics } from "../types";

/**
 * Calcule automatiquement les métriques logistiques (Poids, Volume, Puissance, Véhicule, Électricité)
 * pour un devis ou une liste de matériel loué.
 */
export function calculateQuoteLogistics(
  items: QuoteItemLine[],
  inventory: InventoryItem[] = []
): QuoteLogisticsMetrics {
  const invMap = new Map<string, InventoryItem>();
  inventory.forEach((inv) => invMap.set(inv.id, inv));

  let totalWeightKg = 0;
  let totalVolumeM3 = 0;
  let totalPowerWatts = 0;

  items.forEach((item) => {
    const inv = invMap.get(item.itemId);
    const qty = item.quantity || 1;

    // Poids
    const unitWeight =
      inv?.weightKg ||
      (item as any).weightKg ||
      inferDefaultWeightKg(item.category || inv?.category || "", item.name);
    totalWeightKg += unitWeight * qty;

    // Volume estimé en m3
    const unitVolumeM3 = inferDefaultVolumeM3(
      item.category || inv?.category || "",
      item.name
    );
    totalVolumeM3 += unitVolumeM3 * qty;

    // Puissance électrique (Watts)
    const unitWatts =
      inv?.powerWatts ||
      (item as any).powerWatts ||
      inferDefaultPowerWatts(item.category || inv?.category || "", item.name);
    totalPowerWatts += unitWatts * qty;
  });

  // Arrondis propres
  totalWeightKg = Math.round(totalWeightKg * 10) / 10;
  totalVolumeM3 = Math.round(totalVolumeM3 * 100) / 100;
  totalPowerWatts = Math.round(totalPowerWatts);

  // Ampérage monophasé 230V approximatif (P = U * I * cos phi, cos phi ~ 0.95 pour LED/électronique)
  const totalAmperage230V = Math.round(totalPowerWatts / 220);

  // Détermination du véhicule recommandé
  let suggestedVehicleType: QuoteLogisticsMetrics["suggestedVehicleType"] = "utilitaire_compact";
  let vehicleDescription = "Véhicule utilitaire compact (Kangoo, Berlingo, Vito court - Charge utile < 650 kg)";
  let truckPayloadWarning = false;

  if (totalWeightKg > 1500 || totalVolumeM3 > 18) {
    suggestedVehicleType = "poids_lourd";
    vehicleDescription = "Camion Poids Lourd Régie (C / C1 - Hayon 7.5T / 12T - Charge utile > 2.5 tonnes)";
    truckPayloadWarning = true;
  } else if (totalWeightKg > 900 || totalVolumeM3 > 9) {
    suggestedVehicleType = "grand_fourgon_hayon";
    vehicleDescription = "Grand Fourgon 20m³ avec Hayon élévateur (Permis B - Charge utile max 1 100 kg)";
    if (totalWeightKg > 1100) truckPayloadWarning = true;
  } else if (totalWeightKg > 350 || totalVolumeM3 > 4) {
    suggestedVehicleType = "fourgon_moyen";
    vehicleDescription = "Fourgon moyen 10-12m³ (Renault Master, Mercedes Sprinter L2H2 - Charge utile < 1 200 kg)";
  }

  // Détermination de l'infrastructure électrique requise
  let electricalTier: QuoteLogisticsMetrics["electricalTier"] = "mono_16A";
  let electricalDescription = "Prise domestique standard Monophasé 16A (jusqu'à 3 680 Watts)";
  let isGeneratorRequired = false;

  if (totalPowerWatts > 15000) {
    electricalTier = "tri_63A_plus";
    electricalDescription = "Alimentation Triphasé 63A / 125A ou Groupe Électrogène de tournage lourd (>20 kVA)";
    isGeneratorRequired = true;
  } else if (totalPowerWatts > 7360) {
    electricalTier = "tri_32A";
    electricalDescription = "Alimentation Triphasé 32A (Armoire de distribution de plateau ou Groupe 15-20 kVA)";
    isGeneratorRequired = true;
  } else if (totalPowerWatts > 3680) {
    electricalTier = "mono_32A";
    electricalDescription = "Prise renforcée Monophasé 32A (jusqu'à 7 360 Watts - Coffret de chantier ou 2 lignes 16A séparées)";
  }

  return {
    totalWeightKg,
    totalVolumeM3,
    totalPowerWatts,
    totalAmperage230V,
    suggestedVehicleType,
    vehicleDescription,
    electricalTier,
    electricalDescription,
    isGeneratorRequired,
    truckPayloadWarning,
  };
}

// Estimation heuristique des poids unitaires par défaut si non renseignés
function inferDefaultWeightKg(category: string, name: string): number {
  const n = (name || "").toLowerCase();
  const c = (category || "").toLowerCase();

  if (n.includes("alexa") || n.includes("venice") || n.includes("red v-raptor") || n.includes("caméra") || c.includes("caméra")) {
    return 14.5; // Valise caméra complète avec accessoires
  }
  if (n.includes("optique") || n.includes("prime") || n.includes("zoom") || c.includes("optique")) {
    return n.includes("zoom") ? 6.5 : 2.2;
  }
  if (n.includes("aputure 600") || n.includes("nanlite 720") || n.includes("skypanel") || n.includes("m18")) {
    return 18.0; // Projecteur lourd + ballast + valise
  }
  if (n.includes("led") || n.includes("panneau") || n.includes("tube") || c.includes("lumière") || c.includes("éclairage")) {
    return 6.0;
  }
  if (n.includes("pied") || n.includes("combo") || n.includes("c-stand") || n.includes("machinerie") || c.includes("machinerie")) {
    return 8.5;
  }
  if (n.includes("trépied") || n.includes("ronford") || n.includes("sachtler") || n.includes("cartoni")) {
    return 12.0;
  }
  if (n.includes("malle") || n.includes("câble") || n.includes("régie")) {
    return 22.0;
  }
  return 3.0;
}

// Estimation heuristique des volumes en m3
function inferDefaultVolumeM3(category: string, name: string): number {
  const n = (name || "").toLowerCase();
  const c = (category || "").toLowerCase();

  if (n.includes("aputure") || n.includes("skypanel") || n.includes("m18") || n.includes("projecteur")) return 0.25;
  if (n.includes("caméra") || c.includes("caméra")) return 0.18; // Peli Case 1560
  if (n.includes("pied") || n.includes("c-stand") || n.includes("trépied")) return 0.12;
  if (n.includes("optique") || c.includes("optique")) return 0.04;
  if (n.includes("malle") || n.includes("cantine")) return 0.45;
  return 0.05;
}

// Estimation heuristique de puissance électrique (Watts)
function inferDefaultPowerWatts(category: string, name: string): number {
  const n = (name || "").toLowerCase();
  const c = (category || "").toLowerCase();

  if (n.includes("aputure 1200") || n.includes("1200d")) return 1400;
  if (n.includes("aputure 600") || n.includes("600c") || n.includes("nanlite 720")) return 720;
  if (n.includes("aputure 300") || n.includes("300d") || n.includes("nanlite 300")) return 350;
  if (n.includes("skypanel s60") || n.includes("vortex8")) return 450;
  if (n.includes("skypanel s360")) return 1500;
  if (n.includes("m18") || n.includes("hmi 1.8")) return 1800;
  if (n.includes("m40") || n.includes("hmi 4k")) return 4000;
  if (n.includes("tube") || n.includes("astera") || n.includes("titan")) return 75;
  if (n.includes("caméra") || c.includes("caméra")) return 90; // Consommation caméra + moniteur + HF
  return 0;
}

/**
 * Suggestions intelligentes de matériels équivalents en cas de rupture de stock
 */
export interface SubstitutionRecommendation {
  originalName: string;
  suggestedItems: Array<{
    item: InventoryItem;
    similarityReason: string;
    priceDifferencePercent: number;
  }>;
}

export function findSmartEquivalents(
  unavailableItem: InventoryItem,
  allInventory: InventoryItem[]
): SubstitutionRecommendation {
  const cat = unavailableItem.category.toLowerCase();
  const name = unavailableItem.name.toLowerCase();

  // Filter available items in same or compatible category, excluding the item itself
  const candidates = allInventory.filter(
    (inv) => inv.id !== unavailableItem.id && inv.availableQuantity > 0
  );

  const matched: SubstitutionRecommendation["suggestedItems"] = [];

  candidates.forEach((cand) => {
    const candCat = cand.category.toLowerCase();
    const candName = cand.name.toLowerCase();
    let isMatch = false;
    let reason = "";

    // 1. Camera Body matching
    if (cat.includes("caméra") && candCat.includes("caméra")) {
      if (
        (name.includes("alexa") && (candName.includes("fx9") || candName.includes("venice") || candName.includes("red"))) ||
        (name.includes("sony") && (candName.includes("canon") || candName.includes("red") || candName.includes("alexa"))) ||
        (name.includes("c70") && (candName.includes("fx6") || candName.includes("fx3"))) ||
        cand.brand === unavailableItem.brand
      ) {
        isMatch = true;
        reason = `Corps caméra cinéma équivalent (${cand.brand} - Monture & Capteur similaires)`;
      }
    }

    // 2. Optics matching
    else if (cat.includes("optique") && candCat.includes("optique")) {
      if (
        (name.includes("prime") && candName.includes("prime")) ||
        (name.includes("zoom") && candName.includes("zoom")) ||
        (name.includes("50mm") && candName.includes("50mm")) ||
        (name.includes("35mm") && candName.includes("35mm")) ||
        (name.includes("85mm") && candName.includes("85mm"))
      ) {
        isMatch = true;
        reason = `Série optique de focale et ouverture comparables`;
      }
    }

    // 3. Lighting matching
    else if ((cat.includes("lumière") || cat.includes("éclairage")) && (candCat.includes("lumière") || candCat.includes("éclairage"))) {
      if (
        (name.includes("600") && (candName.includes("600") || candName.includes("720") || candName.includes("vortex"))) ||
        (name.includes("tube") && candName.includes("tube")) ||
        (name.includes("panel") && candName.includes("panel")) ||
        cand.brand === unavailableItem.brand
      ) {
        isMatch = true;
        reason = `Projecteur LED à puissance et IRC comparables`;
      }
    }

    // 4. Same exact category and close price
    else if (cand.category === unavailableItem.category) {
      const priceDiff = Math.abs(cand.rentalRatePerDay - unavailableItem.rentalRatePerDay);
      if (priceDiff <= unavailableItem.rentalRatePerDay * 0.4) {
        isMatch = true;
        reason = `Même catégorie (${cand.category}) et gamme tarifaire proche`;
      }
    }

    if (isMatch) {
      const priceDiffPercent = Math.round(
        ((cand.rentalRatePerDay - unavailableItem.rentalRatePerDay) /
          unavailableItem.rentalRatePerDay) *
          100
      );
      matched.push({
        item: cand,
        similarityReason: reason,
        priceDifferencePercent: priceDiffPercent,
      });
    }
  });

  return {
    originalName: unavailableItem.name,
    suggestedItems: matched.slice(0, 4),
  };
}
