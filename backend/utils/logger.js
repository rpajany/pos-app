import winston from "winston";
import "winston-mongodb";

const {
  LOG_LEVEL = "error",
  MONGOLOG_URI,
  SERVICE_NAME = "main-api",
  NODE_ENV = "development",
} = process.env;

if (!MONGOLOG_URI && NODE_ENV === "production") {
  console.warn("⚠️ MONGOLOG_URI not set. MongoDB logging disabled.");
}

const transports = [];

// 🔹 Console logging
transports.push(
  new winston.transports.Console({
    level: NODE_ENV === "production" ? "info" : "debug",
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(
        ({ level, message, timestamp }) =>
          `[${timestamp}] ${level} (${SERVICE_NAME}): ${message}`
      )
    ),
  })
);

// 🔹 MongoDB logging (ERRORS ONLY)
if (NODE_ENV === "production" && MONGOLOG_URI) {
  transports.push(
    new winston.transports.MongoDB({
      level: "error",
      db: MONGOLOG_URI,
      collection: "service_logs",
      tryReconnect: true,
      metaKey: "meta",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

const logger = winston.createLogger({
  defaultMeta: {
    service: SERVICE_NAME,
    env: NODE_ENV,
  },
  transports,
  exitOnError: false,
});


logger.transports.forEach(t => {
  t.on("error", err => {
    console.error("Winston transport error:", err);
  });
});

export default logger;
