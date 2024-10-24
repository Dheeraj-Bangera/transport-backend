// controllers/shipmentController.js

const Shipment = require("../models/Shipment");
const { body, validationResult } = require("express-validator");
const Truck = require("../models/Truck");
const Driver = require("../models/Driver");
const Client = require("../models/Client");

// Create a new shipment
const createShipment = async (req, res) => {
  // Validate request body using express-validator
  await body("clientId")
    .isNumeric()
    .withMessage("Client ID must be an integer.")
    .run(req);
  await body("shipmentName")
    .isString()
    .withMessage("Shipment Name is required.")
    .run(req);
  await body("pickupLocation")
    .isString()
    .notEmpty()
    .withMessage("Pickup location is required.")
    .run(req);
  await body("deliveryLocation")
    .isString()
    .notEmpty()
    .withMessage("Delivery location is required.")
    .run(req);
  await body("cargoType")
    .isString()
    .notEmpty()
    .withMessage("Cargo type is required.")
    .run(req);
  await body("cargoWeight")
    .isFloat({ gt: 0 })
    .withMessage("Cargo weight must be a positive number.")
    .run(req);
  await body("departureDate")
    .isISO8601()
    .toDate()
    .withMessage("Departure date must be a valid date.")
    .run(req);
  await body("arrivalDate")
    .isISO8601()
    .toDate()
    .withMessage("Arrival date must be a valid date.")
    .run(req);
  await body("truckId")
    .optional()
    .isNumeric()
    .withMessage("Truck ID must be a valid MongoDB ObjectId.")
    .run(req);
  await body("driverId")
    .optional()
    .isNumeric()
    .withMessage("Driver ID must be a valid MongoDB ObjectId.")
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    shipmentName,
    clientId,
    pickupLocation,
    deliveryLocation,
    cargoType,
    cargoWeight,
    specialInstructions,
    departureDate,
    arrivalDate,
    status = "pending", // Default to 'pending' if not provided
    truckId,
    driverId,
  } = req.body;

  try {
    // Check if truck exists and is available
    if (truckId) {
      const truck = await Truck.findOne({ truckId });
      if (!truck) {
        return res.status(400).json({
          success: false,
          message: "Invalid Truck ID. Truck does not exist.",
        });
      } else if (truck.availabilityStatus !== "Available") {
        return res.status(400).json({
          success: false,
          message: "Truck is not available.",
        });
      }
    }

    // Check if driver exists and is available
    if (driverId) {
      const driver = await Driver.findOne({ driverId });
      if (!driver) {
        return res.status(400).json({
          success: false,
          message: "Invalid Driver ID. Driver does not exist.",
        });
      } else if (driver.availabilityStatus !== "Available") {
        return res.status(400).json({
          success: false,
          message: "Driver is not available.",
        });
      }
    }

    // Check if client exists
    if (clientId) {
      const client = await Client.findOne({ clientId });
      if (!client) {
        return res.status(400).json({
          success: false,
          message: "Invalid Client ID. Client does not exist.",
        });
      }
    }

    // Create a new shipment
    const shipment = new Shipment({
      shipmentId: 0, // You can generate a shipment ID dynamically if needed
      shipmentName,
      clientId,
      pickupLocation,
      deliveryLocation,
      cargoType,
      cargoWeight,
      specialInstructions,
      departureDate,
      arrivalDate,
      status,
      truckId,
      driverId,
    });

    await shipment.save();

    // Set truck's availability to 'Not Available'
    if (truckId) {
      await Truck.updateOne(
        { truckId },
        { $set: { availabilityStatus: "Not Available" } },
      );
    }

    // Set driver's availability to 'Not Available'
    if (driverId) {
      await Driver.updateOne(
        { driverId },
        {
          $set: { availabilityStatus: "Not Available", assignedTruck: truckId },
        },
      );
    }

    return res.status(201).json({
      message: "Shipment created successfully.",
      shipment,
    });
  } catch (error) {
    console.error("Error creating shipment:", error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
};

// Get all shipments
const getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find().exec();

    const populatedShipments = await Promise.all(
      shipments.map(async (shipment) => {
        const truck = await Truck.findOne({ truckId: shipment.truckId });

        const driver = await Driver.findOne({ driverId: shipment.driverId });
        const client = await Client.findOne({ clientId: shipment.clientId });
        const clientName = client.clientName;

        return {
          ...shipment.toObject(),
          truck,
          driver,
          clientName,
        };
      }),
    );

    return res.status(200).json(populatedShipments);
  } catch (error) {
    console.error("Error retrieving shipments:", error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
};

// Get a shipment by ID
const getShipmentById = async (req, res) => {
  const { shipmentId } = req.params;
  try {
    const shipment = await Shipment.findOne({ shipmentId: shipmentId }).exec();

    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found." });
    }

    const truck = await Truck.findOne({ truckId: shipment.truckId });
    const driver = await Driver.findOne({ driverId: shipment.driverId });

    return res.status(200).json({
      ...shipment.toObject(),
      truck,
      driver,
    });
  } catch (error) {
    console.error("Error retrieving shipment:", error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
};

// Update a shipment
const updateShipment = async (req, res) => {
  const id = req.params.shipmentId;

  // Validate request body
  await body("shipmentName")
    .optional()
    .isString()
    .notEmpty()
    .withMessage("Shipment Name must be a non-empty string.")
    .run(req);
  await body("pickupLocation")
    .optional()
    .isString()
    .notEmpty()
    .withMessage("Pickup location must be a non-empty string.")
    .run(req);
  await body("deliveryLocation")
    .optional()
    .isString()
    .notEmpty()
    .withMessage("Delivery location must be a non-empty string.")
    .run(req);
  await body("cargoType")
    .optional()
    .isString()
    .notEmpty()
    .withMessage("Cargo type must be a non-empty string.")
    .run(req);
  await body("cargoWeight")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Cargo weight must be a positive number.")
    .run(req);
  await body("departureDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Departure date must be a valid date.")
    .run(req);
  await body("arrivalDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Arrival date must be a valid date.")
    .run(req);
  await body("status")
    .isIn(["pending", "delivered", "cancelled"])
    .optional()
    .withMessage("Status must be 'pending', 'delivered', or 'cancelled'.")
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const updatedShipment = await Shipment.findOneAndUpdate(
      { shipmentId: id },
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    const truck = await Truck.findOne({ truckId: updatedShipment.truckId });
    const driver = await Driver.findOne({ driverId: updatedShipment.driverId });

    if (!updatedShipment) {
      return res.status(404).json({ error: "Shipment not found." });
    }

    return res.status(200).json({
      message: "Shipment updated successfully.",
      ...updatedShipment.toObject(),
      truck,
      driver,
    });
  } catch (error) {
    console.error("Error updating shipment:", error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
};

// Delete a shipment
const deleteShipment = async (req, res) => {
  const id = req.params.shipmentId;

  try {
    const deletedShipment = await Shipment.findOneAndDelete({ shipmentId: id });

    if (!deletedShipment) {
      return res.status(404).json({ error: "Shipment not found." });
    }

    return res.status(200).json({
      message: "Shipment deleted successfully.",
      shipment: deletedShipment,
    });
  } catch (error) {
    console.error("Error deleting shipment:", error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
};

// Export all controller functions
module.exports = {
  createShipment,
  getAllShipments,
  getShipmentById,
  updateShipment,
  deleteShipment,
};
