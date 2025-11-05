require('dotenv').config();

module.exports = {
  apiUser: process.env.SIGHTENGINE_USER,
  apiSecret: process.env.SIGHTENGINE_SECRET,
  endpoint: 'https://api.sightengine.com/1.0/check.json',
  timeoutMs: 15000,
  // Modelos 
  models: 'nudity-2.1,weapon,alcohol,recreational_drug,offensive-2.0,violence,gore-2.0',
};
