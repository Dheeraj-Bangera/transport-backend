const { body, param, validationResult } = require("express-validator");
const Client = require("../models/Client"); // Adjust the path as needed

// Create a new client
const createClient = async (req, res) => {
  await body("clientName")
    .isString()
    .notEmpty()
    .withMessage("Client name is required.")
    .run(req);
  await body("email")
    .isString()
    .notEmpty()
    .withMessage("Email is required.")
    .run(req);
  await body("phoneNumber")
    .isNumeric()
    .notEmpty()
    .isMobilePhone()
    .withMessage("Phone number is required.")
    .run(req);
  await body("companyName")
    .isString()
    .notEmpty()
    .withMessage("Company Name is required.")
    .run(req);
  await body("industry")
    .isString()
    .notEmpty()
    .withMessage("Industry is required.")
    .run(req);
  await body("status")
    .optional()
    .isIn(["Active", "Inactive"])
    .withMessage("Availability status must be either Active or Inactive.")
    .run(req);
  await body("note").isString().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    clientName,
    email,
    phoneNumber,
    companyName,
    industry,
    note,
    status,
  } = req.body;

  try {
    const exist = await Client.findOne({ phoneNumber: phoneNumber });
    console.log(exist);
    if (exist) {
      return res.status(400).json({
        success: false,
        message: "Client Exists",
      });
    }

    const newClient = new Client({
      clientId: 0,
      clientName,
      email,
      phoneNumber,
      companyName,
      industry,
      status,
      note,
    });

    await newClient.save(); // This will trigger the pre-save hook

    res.status(201).json({
      message: "Client created successfully",
      client: {
        clientId: newClient.clientId,
        clientName: newClient.clientName,
        email: newClient.email,
        phoneNumber: newClient.phoneNumber,
        companyName: newClient.companyName,
        industry: newClient.industry,
        status: newClient.status,
        note: newClient.note,
      },
    });
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Get all clients
const getClients = async (req, res) => {
  try {
    const clients = await Client.find();
    res.status(200).json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Get a client by ID
const getClientById = async (req, res) => {
  await param("clientId")
    .isNumeric()
    .withMessage("Client ID must be a valid ID.")
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { clientId } = req.params;

  try {
    const client = await Client.findOne({ clientId });
    if (!client) {
      return res.status(404).json({ error: "Client not found." });
    }
    return res.status(200).json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
};

// Update a client by ID
const updateClient = async (req, res) => {
  await param("clientId")
    .isNumeric()
    .withMessage("Client ID must be a valid ID.")
    .run(req);
  await body("clientName")
    .optional()
    .notEmpty()
    .withMessage("Client name is required.")
    .run(req);
  await body("email")
    .optional()
    .notEmpty()
    .withMessage("Email is required.")
    .run(req);
  await body("phoneNumber")
    .optional()
    .notEmpty()
    .isMobilePhone()
    .withMessage("Phone number is required.")
    .run(req);
  await body("companyName")
    .optional()
    .notEmpty()
    .withMessage("Company Name is required.")
    .run(req);
  await body("industry")
    .optional()
    .notEmpty()
    .withMessage("Industry is required.")
    .run(req);
  await body("status")
    .optional()
    .isIn(["Active", "Inactive"])
    .withMessage("Availability status must be either Active or Inactive.")
    .run(req);
  await body("note").optional().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { clientId } = req.params;
  const updateData = req.body;

  try {
    const client = await Client.findOneAndUpdate({ clientId }, updateData, {
      new: true,
      runValidators: true,
    });
    if (!client) {
      return res.status(404).json({ error: "Client not found." });
    }

    return res.status(200).json({
      message: "Client updated successfully.",
      client,
    });
  } catch (error) {
    console.error("Error updating client:", error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
};

// Delete a client by ID
const deleteClient = async (req, res) => {
  try {
    const deletedClient = await Client.findByIdAndDelete(req.params.id);

    if (!deletedClient) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
};
