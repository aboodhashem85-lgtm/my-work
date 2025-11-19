/**
 * Data Migration Script from localStorage to SQLite
 * This script is intended to be run from the main process (electron-main.js)
 * upon the first launch of the Electron application.
 */

const { app } = require("electron");
const path = require("path");
const fs = require("fs");
const sqliteService = require("./sqliteService");

const LOCAL_STORAGE_KEY = "buildingManagementSystem";

/**
 * Reads the old data from the localStorage file path.
 * In a real Electron app, localStorage data is stored in a file.
 * The path is usually: userDataPath/Local Storage/leveldb.
 * However, since the original app was likely a web app, and we are simulating
 * the migration in a development environment, we will look for a file
 * that was likely created during the web app's execution.
 *
 * For this simulation, we will assume the old localStorage data was backed up
 * or is available from the original `database.js` logic, which we will simulate
 * by reading the JSON structure from a temporary file if it exists, or
 * by reading the data from the `pasted_content.txt` file which seems to contain
 * a JSON structure of the old data.
 *
 * NOTE: In a real-world scenario, the data would need to be extracted from the
 * browser's localStorage or a backup file. Here, we'll use the provided
 * `pasted_content.txt` as the source of the old data.
 */
function getOldLocalStorageData() {
  const backupPath = path.join(app.getAppPath(), "pasted_content.txt");
  if (fs.existsSync(backupPath)) {
    try {
      const rawData = fs.readFileSync(backupPath, "utf8");
      const data = JSON.parse(rawData);

      // Check if it's the expected structure
      if (data && data.settings && data.units && data.residents) {
        console.log(
          "Successfully loaded old data from pasted_content.txt for migration.",
        );
        return data;
      }
    } catch (e) {
      console.error(
        "Error reading or parsing pasted_content.txt for migration:",
        e,
      );
    }
  }

  console.log(
    "No valid old data found for migration. Starting with an empty database.",
  );
  return null;
}

/**
 * Migrates data from the old localStorage structure to the new SQLite database.
 */
async function migrateData() {
  const oldData = getOldLocalStorageData();
  if (!oldData) {
    // If no old data, ensure default settings are initialized and exit
    await sqliteService.initializeSettings();
    return;
  }

  try {
    console.log("Starting data migration...");

    // 1. Migrate Settings
    // The password is the only setting that needs special handling
    // All other settings are migrated by the default initialization logic
    // We will manually insert the password from the old settings
    if (oldData.settings && oldData.settings.password) {
      // The old password was a simple btoa(password + 'building_mgmt_salt')
      // We will save it as is to maintain compatibility with the old login logic
      // until the login logic is updated to use the new PBKDF2 hashing.
      await sqliteService.saveSetting("password", oldData.settings.password);
      console.log("Settings (including password) migrated.");
    }

    // Ensure all default settings are present
    await sqliteService.initializeSettings();

    // 2. Migrate Tables (units, residents, contracts, payments, maintenance, messages)
    const tablesToMigrate = [
      "units",
      "residents",
      "contracts",
      "payments",
      "maintenance",
      "messages",
    ];

    for (const tableName of tablesToMigrate) {
      const oldRecords = oldData[tableName] || [];
      let migratedCount = 0;

      for (const record of oldRecords) {
        // Remove the old auto-generated ID if it exists to let SQLite generate a new one
        // Wait, no, we need to keep the old ID for foreign key relationships (e.g., unitId, residentId)
        // We will keep the old ID and ensure it's a primary key in the new schema (already done in sqliteService)

        try {
          // Use a raw INSERT to preserve the original ID and timestamps
          const keys = Object.keys(record).filter(
            (k) => k !== "id" && k !== "createdAt" && k !== "updatedAt",
          );
          keys.unshift("id", "createdAt", "updatedAt");

          const values = keys.map((key) => record[key]);
          const placeholders = keys.map(() => "?").join(", ");

          const sql = `INSERT INTO ${tableName} (${keys.join(", ")}) VALUES (${placeholders})`;

          await sqliteService.run(sql, values);
          migratedCount++;
        } catch (e) {
          // Log error but continue to next record
          console.error(
            `Error migrating record to ${tableName} with ID ${record.id}:`,
            e.message,
          );
        }
      }
      console.log(`Migrated ${migratedCount} records to table: ${tableName}`);
    }

    console.log("Data migration completed successfully.");

    // 3. Clean up old data source (optional but recommended)
    // fs.unlinkSync(backupPath); // Not doing this to keep the file for debugging if needed

    // In a real Electron app, we would clear the localStorage key here:
    // mainWindow.webContents.executeJavaScript(`localStorage.removeItem('${LOCAL_STORAGE_KEY}');`);
  } catch (error) {
    console.error("CRITICAL: Failed to complete data migration:", error);
    throw error;
  }
}

module.exports = {
  migrateData,
};
