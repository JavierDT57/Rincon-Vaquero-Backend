// routes/tienda.js
const router = require("express").Router();
const { requireAuth, requireRole } = require("../middlewares/auth");

// Crear publicación (usuario o admin)
router.post("/", requireAuth, requireRole("usuario", "admin"), async (req, res) => {
  // ...
});


router.put("/:id", requireAuth, requireRole("usuario", "admin"), async (req, res) => {

});


router.delete("/:id", requireAuth, requireRole("usuario", "admin"), async (req, res) => {
  // ...
});


router.get("/", async (req, res) => { /* ... */ });
router.get("/:id", async (req, res) => { /* ... */ });

module.exports = router;
