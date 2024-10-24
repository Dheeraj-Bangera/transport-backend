const { body, param, validationResult } = require("express-validator");
const Driver = require("../models/Driver");
const Truck = require("../models/Truck");

// Create a new driver
const createDriver = async (req, res) => {
  await body("name")
    .isString()
    .notEmpty()
    .withMessage("Driver name is required.")
    .run(req);
  await body("licenseNumber")
    .isString()
    .notEmpty()
    .withMessage("License number is required.")
    .run(req);
  await body("phoneNumber")
    .isNumeric()
    .notEmpty()
    .withMessage("Phone number is required.")
    .run(req);
  await body("address")
    .isString()
    .notEmpty()
    .withMessage("Address is required.")
    .run(req);
  await body("salary")
    .isFloat({ gt: 0 })
    .withMessage("Salary must be a positive number.")
    .run(req);
  await body("experience")
    .optional()
    .isString()
    .withMessage("Experience must be a string.")
    .run(req);
  await body("availabilityStatus")
    .optional()
    .isIn(["Available", "Not Available"])
    .withMessage(
      "Availability status must be either Available or Not Available.",
    )
    .run(req);
  await body("assignedTruck")
    .optional()
    .isNumeric()
    .withMessage("Assigned truck must be a valid MongoDB ObjectId.")
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    licenseNumber,
    phoneNumber,
    address,
    salary,
    experience,
    availabilityStatus,
    assignedTruck,
  } = req.body;

  try {
    const exist = await Driver.findOne({ licenseNumber: licenseNumber });
    if (exist) {
      return res.status(400).json({
        success: false,
        message: "License Exists",
      });
    }

    const driver = new Driver({
      driverId: 0,
      name,
      licenseNumber,
      phoneNumber,
      address,
      salary,
      experience,
      availabilityStatus,
      assignedTruck,
    });

    await driver.save();

    return res.status(201).json({
      message: "Driver created successfully.",
      driver: {
        driverId: driver.driverId,
        name: driver.name,
        licenseNumber: driver.licenseNumber,
        phoneNumber: driver.phoneNumber,
        address: driver.address,
        salary: driver.salary,
        experience: driver.experience,
        availabilityStatus: driver.availabilityStatus,
        assignedTruck: driver.assignedTruck,
        createdAt: driver.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating driver:", error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
};

// Get a driver by ID
const getDriverById = async (req, res) => {
  await param("driverId")
    .isInt()
    .withMessage("Driver ID must be a valid integer.")
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { driverId } = req.params;

  try {
    const driver = await Driver.findOne({ driverId });
    const truck = await Truck.findOne({ truckId: driver.assignedTruck });
    if (!driver) {
      return res.status(404).json({ error: "Driver not found." });
    }

    return res.status(200).json({ ...driver.toObject(), truck });
  } catch (error) {
    console.error("Error fetching driver:", error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
};

// Update a driver by ID
const updateDriverById = async (req, res) => {
  await param("driverId")
    .isInt()
    .withMessage("Driver ID must be a valid integer.")
    .run(req);
  await body("name")
    .optional()
    .isString()
    .withMessage("Driver name must be a string.")
    .run(req);
  await body("licenseNumber")
    .optional()
    .isString()
    .withMessage("License number must be a string.")
    .run(req);
  await body("phoneNumber")
    .optional()
    .isNumeric()
    .withMessage("Phone number must be a number.")
    .run(req);
  await body("address")
    .optional()
    .isString()
    .withMessage("Address must be a string.")
    .run(req);
  await body("salary")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Salary must be a positive number.")
    .run(req);
  await body("experience")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Experience must be a non-negative integer.")
    .run(req);
  await body("availabilityStatus")
    .optional()
    .isIn(["Available", "Not Available"])
    .withMessage(
      "Availability status must be either Available or Not Available.",
    )
    .run(req);
  await body("assignedTruck")
    .optional()
    .isMongoId()
    .withMessage("Assigned truck must be a valid MongoDB ObjectId.")
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { driverId } = req.params;
  const updateData = req.body;

  try {
    const driver = await Driver.findOneAndUpdate({ driverId }, updateData, {
      new: true,
      runValidators: true,
    });
    const assignedTruck = await Truck.findOne({
      truckId: driver.assignedTruck,
    });

    if (!driver) {
      return res.status(404).json({ error: "Driver not found." });
    }

    return res.status(200).json({
      ...driver.toObject(),
      assignedTruck,
      message: "Driver updated successfully.",
    });
  } catch (error) {
    console.error("Error updating driver:", error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
};

// Delete a driver by ID
const deleteDriverById = async (req, res) => {
  await param("driverId")
    .isInt()
    .withMessage("Driver ID must be a valid integer.")
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { driverId } = req.params;

  try {
    const result = await Driver.findOneAndDelete({ driverId });
    if (!result) {
      return res.status(404).json({ error: "Driver not found." });
    }

    return res.status(200).json({ message: "Driver deleted successfully." });
  } catch (error) {
    console.error("Error deleting driver:", error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
};

// Get all drivers
const getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find(); // Fetch all drivers

    // Fetch assigned trucks for each driver
    const driversWithTrucks = await Promise.all(
      drivers.map(async (driver) => {
        const assignedTruck = await Truck.findOne({
          truckId: driver.assignedTruck,
        });
        return {
          ...driver.toObject(), // Convert driver document to plain JS object
          assignedTruck, // Add assignedTruck details to the driver object
        };
      }),
    );

    return res.status(200).json(driversWithTrucks);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
};

// Get all available drivers
const getAvailableDrivers = async (req, res) => {
  try {
    const availableDrivers = await Driver.find({
      availabilityStatus: "Available",
    });
    const driversWithTrucks = await Promise.all(
      availableDrivers.map(async (driver) => {
        const assignedTruck = await Truck.findOne({
          truckId: driver.assignedTruck,
        });
        return {
          ...driver.toObject(), // Convert driver document to plain JS object
          assignedTruck, // Add assignedTruck details to the driver object
        };
      }),
    );
    return res.status(200).json(driversWithTrucks);
  } catch (error) {
    console.error("Error fetching available drivers:", error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
};

module.exports = {
  createDriver,
  getDriverById,
  updateDriverById,
  deleteDriverById,
  getAllDrivers,
  getAvailableDrivers,
};
