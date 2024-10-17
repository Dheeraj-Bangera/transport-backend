const express = require("express");
const {
  createClient,
  getClientById,
  updateClient,
  getClients,
} = require("../controller/clientController"); // Adjust the path as needed
const { adminMiddleware } = require("../middleware/authMiddleware");
const clientRouter = express.Router();

// Route to create a new client
clientRouter.get("/", getClients);

clientRouter.post("/", createClient);

clientRouter.get("/:clientId", getClientById);

clientRouter.put("/:clientId", updateClient);

module.exports = clientRouter;
