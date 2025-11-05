// src/policies/policy.v2.js
// Tu matriz de pesos y reglas EXACTAS

const POLICY_V2 = {
  // ------------------------------
  // 1) PESOS POR CATEGORÍA (0–1)
  // ------------------------------
  category_weights: {
    nudity:   0.40,  // 40%
    weapons:  0.20,  // 20%
    violence: 0.15,  // 15%
    gore:     0.10,  // 10%
    offensive:0.08,  // 8%
    drugs:    0.04,  // 4%
    alcohol:  0.03   // 3%
  },

  // ------------------------------
  // 2) NUDITY (ÍNDICE)
  // ------------------------------
  nudity: {
    weights: {
      explicit:      0.40,
      erotica:       0.35,
      suggestive:    0.20,
      none_penalty:  0.05
    },

    suggestive_features: {
      very_suggestive: 1.00,
      suggestive:      0.90,
      mildly_suggestive: 0.60,
      lingerie:        0.80,
      bikini:          0.60,
      cleavage:        0.50,
      cleavage_categories: { very_revealing: 0.80, revealing: 0.60 },
      male_chest_categories: { very_revealing: 0.60, revealing: 0.40, slightly_revealing: 0.20 },
      miniskirt:       0.50,
      minishort:       0.50,
      nudity_art:      0.40,
      schematic:       0.30,
      sextoy:          0.90,
      suggestive_focus:0.50,
      suggestive_pose: 0.50,
      visibly_undressed: 0.70,
      swimwear_one_piece: 0.50,
      swimwear_male:      0.50
    },

    // Descuento si hay piscina/playa + traje de baño
    context_modifiers: {
      swimwear_pool_discount: {
        if: "nudity.context.sea_lake_pool >= 0.50 && (nudity.suggestive_classes.swimwear_one_piece >= 0.40 || nudity.suggestive_classes.swimwear_male >= 0.40)",
        factor: 0.70
      }
    },

    // Overrides críticos
    overrides: { red: ["erotica >= 0.80", "sexual_activity >= 0.20"] }
  },

  // ------------------------------
  // 3) WEAPONS (ÍNDICE)
  // ------------------------------
  weapons: {
    weights: {
      firearm:        1.00,
      knife:          1.00,
      firearm_toy:    0.60,
      firearm_gesture:0.50
    },
    action_modifiers: {
      aiming_threat:      0.60,
      aiming_camera:      0.35,
      in_hand_not_aiming: 0.25,
      worn_not_in_hand:   0.15,
      not_worn:           0.10,
      aiming_safe:       -0.50
    },
    overrides: {
      red: [
        "classes.firearm >= 0.80",
        "firearm_action.not_worn >= 0.50 && classes.firearm >= 0.50",
        "classes.firearm >= 0.80 && firearm_action.aiming_threat >= 0.40",
        "classes.knife >= 0.85",
        "classes.firearm_toy >= 0.90"
      ]
    }
  },

  // ------------------------------
  // 4) VIOLENCE / GORE (ÍNDICE)
  // ------------------------------
  violence: { score_key: "prob", overrides: { red: ["prob >= 0.15"] } },
  gore:     { score_key: "prob", overrides: { red: ["prob >= 0.15"] } },

  // ------------------------------
  // 5) OFFENSIVE (ÍNDICE)
  // ------------------------------
  offensive: {
    weights: {
      nazi:            1.00,
      terrorist:       1.00,
      asian_swastika:  1.00,
      supremacist:     0.90,
      confederate:     0.80,
      middle_finger:   0.70
    },
    overrides: { red: ["nazi >= 0.50", "terrorist >= 0.50", "asian_swastika >= 0.50"] }
  },

  // ------------------------------
  // 6) DRUGS / ALCOHOL (ÍNDICE)
  // ------------------------------
  drugs: { 
    score_key: "prob", 
    yellow_min: 0.30, 
    red_min: 0.50, 
    overrides: { red: ["prob >= 0.50"] }
  },
  alcohol: { score_key: "prob", yellow_min: 0.80 },

  // ------------------------------
  // 7) MAPEOS FINALES (SUMA PONDERADA)
  // ------------------------------
  final: {
    semaphore_thresholds: { green_max: 0.20, yellow_max: 0.60 },
    override_wins: true,
    top_reasons: 3,
    fail_closed_color: "yellow",
    round_decimals: 4
  }
};

module.exports = { POLICY_V2 };
