const express = require("express");
const router = express.Router();
const { PERMISSIONS } = require("../constants/permissions");
const { protect } = require("../middleware/protect");

const {
  getUserDB,
  updateUserDB,
  createSave,
  updateSave,
  deleteSave,
} = require("../controllers/profileController");

router.get("/dashboard", protect(PERMISSIONS.ONLY_USERS), getUserDB);
router.put("/dashboard", protect(PERMISSIONS.ONLY_USERS), updateUserDB);

// Create, update & delete saves
router.post("/saves/add", protect(PERMISSIONS.ONLY_USERS), createSave);
router.put("/saves/:id", protect(PERMISSIONS.ONLY_USERS), updateSave);
router.delete("/saves/:id", protect(PERMISSIONS.ONLY_USERS), deleteSave);

module.exports = router;
