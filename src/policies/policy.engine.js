// src/policies/policy.engine.js

const { POLICY_V2: POLICY } = require('./policy');

const CURRENT_ANALYSIS_VERSION = 2; 

function num(x) { return (typeof x === 'number' && isFinite(x)) ? x : 0; }
function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function round(x, d=4){ const k = Math.pow(10,d); return Math.round(x*k)/k; }
function get(obj, path) {
  try { return path.split('.').reduce((o, k) => (o && k in o ? o[k] : undefined), obj); }
  catch { return undefined; }
}

function computeNudity(raw) {
  const n = raw.nudity || raw.nudity_2 || {};
  const suggestive = n.suggestive_classes || n.suggestive || {};
  const ctx = n.context || {};

  const explicit = Math.max(num(n.sexual_activity), num(n.sexual_display));
  const erotica  = num(n.erotica);

  // Suma ponderada de señales
  let sugScore = 0; let totalW = 0;
  const sf = POLICY.nudity.suggestive_features;
  for (const key of Object.keys(sf)) {
    const coef = (typeof sf[key] === 'number') ? sf[key] : undefined;
    if (coef) {
      sugScore += num(suggestive[key]) * coef; totalW += coef;
    } else if (typeof sf[key] === 'object') {
      // subcategorías (cleavage_categories, male_chest_categories)
      const sub = sf[key];
      for (const subKey of Object.keys(sub)) {
        const prob = num(get(suggestive, `${key}.${subKey}`));
        const c = num(sub[subKey]);
        sugScore += prob * c; totalW += c;
      }
    }
  }
  const suggestive_raw = totalW ? clamp01(sugScore / totalW) : num(n.suggestive);
  const none_penalty = 1 - num(n.none);

  const w = POLICY.nudity.weights;
  let sWeighted = w.explicit*explicit + w.erotica*erotica + w.suggestive*suggestive_raw + w.none_penalty*none_penalty;
  sWeighted = clamp01(sWeighted);

  let S = Math.max(sWeighted, erotica*0.90, explicit);

  // Context modifiers (piscina/playa + swimwear)
  const condPool = (num(ctx.sea_lake_pool) >= 0.50) && (
    num(suggestive.swimwear_one_piece) >= 0.40 || num(suggestive.swimwear_male) >= 0.40
  );
  if (condPool) S *= num(POLICY.nudity.context_modifiers.swimwear_pool_discount.factor) || 0.70;

  // Overrides
  const redOverride = (erotica >= 0.80) || (num(n.sexual_activity) >= 0.20);

  return { score: clamp01(S), explicit, erotica, suggestive_raw, none_penalty, redOverride };
}

function computeWeapons(raw) {
  const w = raw.weapon || {};
  const classes = w.classes || {};
  const act = w.firearm_action || w.action || {};

  const firearm = num(classes.firearm);
  const knife   = num(classes.knife);
  const toy     = num(classes.firearm_toy);
  const gest    = num(classes.firearm_gesture);

  const am = POLICY.weapons.action_modifiers;
  const actionSum = (
    num(act.aiming_threat)*am.aiming_threat +
    num(act.aiming_camera)*am.aiming_camera +
    num(act.in_hand_not_aiming)*am.in_hand_not_aiming +
    num(act.worn_not_in_hand)*am.worn_not_in_hand +
    num(act.not_worn)*am.not_worn +
    num(act.aiming_safe)*am.aiming_safe
  );
  const firearm_base = firearm * clamp01(1 + actionSum);

  const S = Math.max(firearm_base, knife, toy * 0.60, gest * 0.50);

  // Overrides
  const red = (
    firearm >= 0.80 ||
    (num(act.not_worn) >= 0.50 && firearm >= 0.50) ||
    (firearm >= 0.80 && num(act.aiming_threat) >= 0.40) ||
    knife >= 0.85 ||
    toy >= 0.90
  );

  return { score: clamp01(S), classes: { firearm, knife, firearm_toy: toy, firearm_gesture: gest }, action: act, redOverride: red };
}

function computeSimpleProb(obj, key){ return clamp01(num((obj||{})[key])); }

function computeViolence(raw){
  const v = raw.violence || {};
  const s = computeSimpleProb(v, 'prob');
  return { score: s, redOverride: s >= 0.15 };
}

function computeGore(raw){
  const g = raw.gore || {};
  const s = computeSimpleProb(g, 'prob');
  return { score: s, redOverride: s >= 0.15 };
}

function computeOffensive(raw){
  const off = raw.offensive || {};
  const cls = off.classes || off; 
  const wt = POLICY.offensive.weights;
  let best = 0; let bestKey = null;
  for (const k of Object.keys(wt)) {
    const v = num(cls[k]) * num(wt[k]);
    if (v > best) { best = v; bestKey = k; }
  }
  const score = clamp01(best);
  const red   = (num(cls.nazi) >= 0.50) || (num(cls.terrorist) >= 0.50) || (num(cls.asian_swastika) >= 0.50);
  return { score, top_class: bestKey, classes: cls, redOverride: red };
}


function computeDrugs(raw){
  const d = raw.recreational_drug || {};
  const s = computeSimpleProb(d, 'prob');
  const yellow = s >= (POLICY.drugs.yellow_min || 0.30);
  const red    = s >= (POLICY.drugs.red_min || 0.50);
  return { score: s, yellowOverride: yellow, redOverride: red };
}

function computeAlcohol(raw){
  const a = raw.alcohol || {};
  const s = computeSimpleProb(a, 'prob');
  const yellow = s >= (POLICY.alcohol.yellow_min || 0.80);
  return { score: s, yellowOverride: yellow, redOverride: false };
}

function applyPolicyV2(raw){
  // 1) índices por categoría
  const idx = {
    nudity:   computeNudity(raw),
    weapons:  computeWeapons(raw),
    violence: computeViolence(raw),
    gore:     computeGore(raw),
    offensive:computeOffensive(raw),
    drugs:    computeDrugs(raw),
    alcohol:  computeAlcohol(raw)
  };

  // 2) weighted sum
  let finalScore = 0;
  const contribs = [];
  for (const cat of Object.keys(POLICY.category_weights)) {
    const w = num(POLICY.category_weights[cat]);
    const s = num(idx[cat]?.score);
    const c = w * s; finalScore += c; contribs.push({ cat, w, s, contrib: c });
  }
  finalScore = clamp01(finalScore);

  // 3) overrides
  const anyRedOverride = (
    idx.nudity.redOverride ||
    idx.weapons.redOverride ||
    idx.violence.redOverride ||
    idx.gore.redOverride ||
    idx.offensive.redOverride ||
    idx.drugs.redOverride === true
  );

  // 4) semáforo
  const { green_max, yellow_max } = POLICY.final.semaphore_thresholds;
  let semaforo;
  if (POLICY.final.override_wins && anyRedOverride) semaforo = 'rojo';
  else if (finalScore < green_max) semaforo = 'verde';
  else if (finalScore < yellow_max) semaforo = 'amarillo';
  else semaforo = 'rojo';

  // 5) decisión sugerida
  let decision = (semaforo === 'rojo') ? 'rejected'
               : (semaforo === 'amarillo') ? 'manual_review'
               : 'approved_suggest';

  // 6) razones top (por contribución / overrides)
  contribs.sort((a,b)=> b.contrib - a.contrib);
  const topReasons = [];
  for (const c of contribs) {
    if (c.contrib > 0) topReasons.push(`${c.cat}:${round(c.s,2)}`);
    if (topReasons.length >= (POLICY.final.top_reasons||3)) break;
  }
  if (anyRedOverride && !topReasons.includes('override:red')) topReasons.unshift('override:red');

  // 7) resultado final
  const derived = {
    version: CURRENT_ANALYSIS_VERSION,
    semaforo,
    decision,
    final_score: round(finalScore, POLICY.final.round_decimals||4),
    indices: {
      nudity:   round(idx.nudity.score,4),
      weapons:  round(idx.weapons.score,4),
      violence: round(idx.violence.score,4),
      gore:     round(idx.gore.score,4),
      offensive:round(idx.offensive.score,4),
      drugs:    round(idx.drugs.score,4),
      alcohol:  round(idx.alcohol.score,4)
    },
    reasons: topReasons,
    raw_indices: idx
  };

  return derived;
}

module.exports = { applyPolicyV2, CURRENT_ANALYSIS_VERSION };
