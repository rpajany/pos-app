export const errorHandler = (err, req, res, next) => {
  console.log("--- ERROR STACK START ---");
  console.error(err.stack); // THIS WILL TELL YOU THE EXACT FILE AND LINE
  console.log("--- ERROR STACK END ---");
  
  console.error("🔴 Error:", err.message);
  const statusCode = err.statusCode || 500;
  const errorMessage = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    error: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
