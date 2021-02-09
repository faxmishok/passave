const express = require("express");
const router = express.Router();
const { PERMISSIONS } = require("../constants/permissions");
const { protect } = require("../middleware/protect");

const { getUserDB, updateUserDB } = require("../controllers/profileController");

router.get("/dashboard", protect(PERMISSIONS.ONLY_USERS), getUserDB);
router.put("/dashboard", protect(PERMISSIONS.ONLY_USERS), updateUserDB);

module.exports = router;
