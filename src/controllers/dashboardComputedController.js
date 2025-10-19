// src/controllers/dashboardComputedController.js
const Dashboard = require('../models/Dashboard');

const N = (x) => Number(x ?? 0);
const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0); // 1 decimal

exports.getPublicComputed = async (_req, res) => {
  try {
    const rows = await Dashboard.getAll();
    const by = Object.fromEntries(
      rows.map(r => [String(r.slug || '').toUpperCase(), r.value])
    );

    // --- Métricas atómicas (editables en admin) ---
    const POBMAS  = N(by.POBMAS);      // Hombres
    const POBFEM  = N(by.POBFEM);      // Mujeres
    const NINOS   = N(by.NINOS);       // 0–14
    const ADULTOS = N(by.ADULTOS);     // 15–64
    const TERCERA = N(by.TERCERA);     // 65+

    const CATOLICA = N(by.CATOLICA);
    const SINREL   = N(by.SINREL);
    const OTRASREL = N(by.OTRASREL);

    const PEA   = N(by.PEA);           // 15+
    const PEA_M = N(by.PEA_M);
    const PEA_F = N(by.PEA_F);

    const DER_SS = N(by.DER_SS);       // Con servicio de salud
    const IMSS   = N(by.IMSS);
    const IMSSB  = N(by.IMSSB);
    const ISSSTE = N(by.ISSSTE);
    const ISEST  = N(by.ISEST);
    const SP     = N(by.SP);
    const PRIV   = N(by.PRIV);
    const PROG   = N(by.PROG);
    const OTRA   = N(by.OTRA);

    // --- Derivados (NO se guardan en BD) ---
    const POBTOT   = POBMAS + POBFEM;
    const POB15MAS = ADULTOS + TERCERA;
    const NO_PEA   = Math.max(0, POB15MAS - PEA);
    const SIN_SS   = Math.max(0, POBTOT - DER_SS);

    // --- Porcentajes clave ---
    const porcentajes = {
      hombres: pct(POBMAS, POBTOT),
      mujeres: pct(POBFEM, POBTOT),
      ninos: pct(NINOS, POBTOT),
      adultos: pct(ADULTOS, POBTOT),
      tercera: pct(TERCERA, POBTOT),

      pea_sobre_15mas: pct(PEA, POB15MAS),
      pea_hombres: pct(PEA_M, PEA),
      pea_mujeres: pct(PEA_F, PEA),

      cobertura_salud: pct(DER_SS, POBTOT),
      sin_cobertura: pct(SIN_SS, POBTOT),

      catolica: pct(CATOLICA, POBTOT),
      sin_religion: pct(SINREL, POBTOT),
      otras_religiones: pct(OTRASREL, POBTOT),
    };

    // --- Datasets para Recharts (pasteles) ---
    const charts = {
      sexoData: [
        { name: 'Hombres', value: POBMAS },
        { name: 'Mujeres', value: POBFEM },
      ],
      edadData: [
        { name: '0–14',  value: NINOS },
        { name: '15–64', value: ADULTOS },
        { name: '65+',   value: TERCERA },
      ],
      religionData: [
        { name: 'Católica',     value: CATOLICA },
        { name: 'Sin religión', value: SINREL },
        { name: 'Otras',        value: OTRASREL },
      ],
      peaData: [
        { name: 'Activa (PEA)', value: PEA },
        { name: 'No activa',    value: NO_PEA },
      ],
      peaSexoData: [
        { name: 'Hombres (PEA)', value: PEA_M },
        { name: 'Mujeres (PEA)', value: PEA_F },
      ],
      ssCoberturaData: [
        { name: 'Con servicio', value: DER_SS },
        { name: 'Sin servicio', value: SIN_SS },
      ],
      ssDetalleData: [
        { name: 'IMSS',            value: IMSS },
        { name: 'IMSS-B',          value: IMSSB },
        { name: 'ISSSTE',          value: ISSSTE },
        { name: 'Inst. estatales', value: ISEST },
        { name: 'Seguro Popular',  value: SP },
        { name: 'Privada',         value: PRIV },
        { name: 'Programa púb.',   value: PROG },
        { name: 'Otra',            value: OTRA },
      ],
    };

    // --- Textos listos para tus CardInfo (opcional) ---
    const textos = {
      poblacionSexo:
        `La población es de ${POBTOT} personas: ${POBMAS} hombres (${porcentajes.hombres}%) y ` +
        `${POBFEM} mujeres (${porcentajes.mujeres}%). La relación es de ~${Math.round((POBMAS / Math.max(1, POBFEM)) * 100) / 100} hombres por cada mujer.`,
      estructuraEtaria:
        `Estructura etaria: ${porcentajes.ninos}% niños (0–14), ${porcentajes.adultos}% adultos (15–64) y ` +
        `${porcentajes.tercera}% personas mayores (65+).`,
      religion:
        `La mayoría se identifica como católica (${porcentajes.catolica}%). Las otras religiones concentran ` +
        `${porcentajes.otras_religiones}% y sin religión ${porcentajes.sin_religion}%.`,
      pea:
        `La PEA es ${PEA} de ${POB15MAS} personas de 15+ (${porcentajes.pea_sobre_15mas}%). Dentro de la PEA, ` +
        `${porcentajes.pea_hombres}% son hombres y ${porcentajes.pea_mujeres}% mujeres.`,
      salud:
        `${DER_SS} personas (${porcentajes.cobertura_salud}%) tienen derecho a algún servicio; ` +
        `${SIN_SS} (${porcentajes.sin_cobertura}%) no. La afiliación se concentra en IMSS y Seguro Popular.`,
    };

    res.json({
      ok: true,
      data: {
        atomicas: { POBMAS, POBFEM, NINOS, ADULTOS, TERCERA, CATOLICA, SINREL, OTRASREL, PEA, PEA_M, PEA_F, DER_SS, IMSS, IMSSB, ISSSTE, ISEST, SP, PRIV, PROG, OTRA },
        derivados: { POBTOT, POB15MAS, NO_PEA, SIN_SS },
        porcentajes,
        charts,
        textos,
      }
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
