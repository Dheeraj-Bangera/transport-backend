const { body, param, validationResult } = require("express-validator");
const Driver = require("../models/Driver"); // Adjust the path as necessary

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
    .isMobilePhone()
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
  await body("availabilityStatus")
    .optional()
    .isIn(["Available", "Not Available"])
    .withMessage(
      "Availability status must be either Available or Not Available.",
    )
    .run(req);
  await body("assignedTruck")
    .optional()
    .isInt()
    .withMessage("Assigned truck must be a valid number.")
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
    availabilityStatus,
    assignedTruck,
    salary,
  } = req.body;

  try {
    const exist = await Driver.findOne({ licenseNumber: licenseNumber });
    console.log(exist);
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
      availabilityStatus,
      assignedTruck,
      salary,
    });

    // Save the driver to the database
    await driver.save();

    return res.status(201).json({
      message: "Driver created successfully.",
      driver: {
        driverId: driver.driverId,
        name: driver.name,
        licenseNumber: driver.licenseNumber,
        phoneNumber: driver.phoneNumber,
        address: driver.address,
        availabilityStatus: driver.availabilityStatus,
        assignedTruck: driver.assignedTruck,
        salary: driver.salary,
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
    .isNumeric()
    .withMessage("Driver ID must be a valid ID.")
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { driverId } = req.params;

  try {
    const driver = await Driver.findOne({ driverId });
    if (!driver) {
      return res.status(404).json({ error: "Driver not found." });
    }

    return res.status(200).json(driver);
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
    .isNumeric()
    .withMessage("Driver ID must be a valid ID.")
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
    .isString()
    .withMessage("Phone number must be a string.")
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
  await body("availabilityStatus")
    .optional()
    .isIn(["Available", "Not Available"])
    .withMessage(
      "Availability status must be either Available or Not Available.",
    )
    .run(req);
  await body("assignedTruck")
    .optional()
    .isInt()
    .withMessage("Assigned truck must be a valid number.")
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
    if (!driver) {
      return res.status(404).json({ error: "Driver not found." });
    }

    return res.status(200).json({
      message: "Driver updated successfully.",
      driver,
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
    .isNumeric()
    .withMessage("Driver ID must be a valid ID.")
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
    const drivers = await Driver.find();
    return res.status(200).json(drivers);
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
    return res.status(200).json(availableDrivers);
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
