require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
mongoose.set("strictQuery", false);
const cors = require("cors");

const userRoute = require("./routes/auth");
const { checkForAuthenticationCookie } = require("./middleware/authMiddleware");

const app = express();
const port = process.env.PORT || 8000;

mongoose
  .connect(process.env.MONGO_URI)
  .then((e) => console.log("MongoDB Connected"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));
app.use(cors());

app.use("/user", userRoute);
app.get("/", (req, res) => {
  res.send(`
        <!DOCTYPE html>
<html lang="en">
<head>
    <title>Welcome to the Backend</title>
    <style>
        /* Apply a global font and remove default margins */
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #e0eafc, #cfdef3);
            color: #333;
        }

        /* Style the container of the content */
        .container {
            max-width: 700px;
            margin: 0 auto;
            padding: 40px;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
            text-align: center;
            position: relative;
            top: 50px;
        }

        /* Apply styling to heading */
        h1 {
            font-size: 2.5rem;
            color: #3c3c3c;
            margin-bottom: 20px;
            font-weight: 600;
            letter-spacing: 1px;
            transition: color 0.3s ease;
        }

        h1:hover {
            color: #007bff;
        }

        /* Style the paragraph */
        p {
            font-size: 1.2rem;
            color: #555;
            line-height: 1.6;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to the Backend</h1>
        <p>This is the main page of the Express server.</p>
    </div>
</body>
</html>
    `);
});

app.get("/healthcheck", (req, res) => {
  res.status(200).json({ status: "ok", message: "Service is healthy!" });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
