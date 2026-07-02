/**
 * 0to100 Tracker — two-way Google Sheet sync (Apps Script side).
 *
 * Lives inside the spreadsheet (Extensions → Apps Script). Two jobs:
 *
 *  1. Sheet → site: an installable onChange trigger posts the whole
 *     "Sorted Table" to the site's /api/sheet-sync endpoint whenever you edit
 *     the sheet. The site imports new rows (publishing them with AI-generated
 *     specs), applies edits to rows that carry a Car ID, and replies with the
 *     canonical table, which this script writes back (sorted, positions
 *     recomputed, hidden Car ID column maintained).
 *
 *  2. Site → sheet: deployed as a Web App, doPost() below receives a mirror of
 *     the leaderboard whenever a car is added/edited/deleted on the website
 *     and rewrites the table.
 *
 * Writes made by this script do NOT fire the onChange trigger (Apps Script
 * never triggers on script/API edits), so the two directions can't loop.
 *
 * Setup: see docs/SHEET_SYNC_SETUP.md in the repo.
 */

var CONFIG = {
  // The deployed website (no trailing slash needed).
  SITE_URL: "https://0to100-tracker.vercel.app",
  // Must equal SHEET_SYNC_SECRET in the site's environment variables.
  SYNC_SECRET: "PASTE-YOUR-SHARED-SECRET-HERE",
  // The tab this sync manages.
  SHEET_NAME: "Sorted Table",
};

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("⚡ 0to100 Sync")
    .addItem("Sync now", "syncNow")
    .addSeparator()
    .addItem("Enable instant sync", "enableInstantSync")
    .addItem("Disable instant sync", "disableInstantSync")
    .addToUi();
}

/** Create the onChange trigger (idempotent — removes any old one first). */
function enableInstantSync() {
  removeTriggers_();
  ScriptApp.newTrigger("handleChange")
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onChange()
    .create();
  toast_("Instant sync is ON — edits now sync to the site automatically.");
}

function disableInstantSync() {
  removeTriggers_();
  toast_("Instant sync is OFF. Use '⚡ 0to100 Sync → Sync now' to sync manually.");
}

function removeTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "handleChange") ScriptApp.deleteTrigger(t);
  });
}

// ---------------------------------------------------------------------------
// Sheet → site
// ---------------------------------------------------------------------------

/** onChange trigger handler. Debounced so one paste doesn't sync five times. */
function handleChange(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(0)) return; // a sync is already running — it reads fresh data anyway
  try {
    Utilities.sleep(1500); // let multi-cell pastes settle
    runSync_(true);
  } finally {
    lock.releaseLock();
  }
}

/** Menu entry — verbose feedback. */
function syncNow() {
  runSync_(false);
}

function runSync_(silent) {
  var sheet = getSheet_();
  if (!sheet) {
    toast_('Sheet "' + CONFIG.SHEET_NAME + '" was not found.');
    return;
  }

  var values = sheet.getDataRange().getValues();
  var response;
  try {
    response = UrlFetchApp.fetch(endpoint_(), {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({ secret: CONFIG.SYNC_SECRET, values: values }),
      muteHttpExceptions: true,
    });
  } catch (err) {
    toast_("Couldn't reach the site: " + err);
    return;
  }

  var data;
  try {
    data = JSON.parse(response.getContentText());
  } catch (err) {
    data = null;
  }

  if (!data || !data.ok) {
    var message = (data && data.error) || "HTTP " + response.getResponseCode();
    toast_("Sync failed: " + message);
    return;
  }

  var r = data.report;
  var changed = r.created.length + r.updated.length + r.linked > 0;

  // Only rewrite the table when it's safe and useful: something changed, or a
  // row count mismatch needs healing (e.g. a deleted row being restored). Any
  // row issue skips the rewrite so a half-typed row is never wiped out.
  if (r.issues.length === 0 && (changed || data.mirror.rows.length !== r.rowsSeen)) {
    writeMirror_(sheet, data.mirror);
  }

  reportOutcome_(r, silent);
}

function reportOutcome_(r, silent) {
  var bits = [];
  if (r.created.length) bits.push("added: " + r.created.join(", "));
  if (r.updated.length) bits.push("updated: " + r.updated.join(", "));
  if (r.linked) bits.push(r.linked + " row(s) linked to existing cars");
  if (r.aiSkipped.length)
    bits.push(
      "specs pending for " +
        r.aiSkipped.join(", ") +
        " (use Auto-fill on the site)"
    );

  if (r.issues.length) {
    var detail = r.issues
      .map(function (i) {
        return "Row " + i.row + ": " + i.message;
      })
      .join("\n");
    if (silent) {
      toast_(
        (bits.length ? bits.join(" · ") + " — " : "") +
          r.issues.length +
          " row(s) need attention. Run '⚡ 0to100 Sync → Sync now' for details."
      );
    } else {
      alert_("Sync finished with notes", (bits.length ? bits.join("\n") + "\n\n" : "") + detail);
    }
    return;
  }

  if (bits.length) {
    toast_(bits.join(" · "));
  } else if (!silent) {
    toast_("Everything is already in sync.");
  }
}

// ---------------------------------------------------------------------------
// Site → sheet (Web App endpoint)
// ---------------------------------------------------------------------------

/**
 * Receives {secret, action: "mirror", mirror: {header, rows}} from the site
 * after any car write and rewrites the table. Deploy as Web App:
 * execute as Me, accessible to Anyone (the secret is the real gate).
 */
function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: "Body must be JSON." });
  }

  if (
    !CONFIG.SYNC_SECRET ||
    CONFIG.SYNC_SECRET.indexOf("PASTE-") === 0 ||
    body.secret !== CONFIG.SYNC_SECRET
  ) {
    return json_({ ok: false, error: "Invalid sync secret." });
  }

  if (body.action === "mirror" && body.mirror) {
    var sheet = getSheet_();
    if (!sheet) {
      return json_({ ok: false, error: 'Sheet "' + CONFIG.SHEET_NAME + '" not found.' });
    }
    writeMirror_(sheet, body.mirror);
    return json_({ ok: true });
  }

  if (body.action === "ping") {
    return json_({ ok: true, pong: true });
  }

  return json_({ ok: false, error: "Unknown action." });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Replace the table with the canonical mirror from the site. */
function writeMirror_(sheet, mirror) {
  var width = mirror.header.length;
  var lastRow = Math.max(sheet.getLastRow(), mirror.rows.length + 1, 1);
  var lastCol = Math.max(sheet.getLastColumn(), width);

  sheet.getRange(1, 1, lastRow, lastCol).clearContent();
  sheet.getRange(1, 1, 1, width).setValues([mirror.header]).setFontWeight("bold");
  if (mirror.rows.length) {
    sheet.getRange(2, 1, mirror.rows.length, width).setValues(mirror.rows);
    // Positions | year | ... | engine (L) | ... | 0-100 (s)
    sheet.getRange(2, 1, mirror.rows.length, 1).setNumberFormat("0");
    sheet.getRange(2, 5, mirror.rows.length, 1).setNumberFormat("0.0#");
    sheet.getRange(2, 9, mirror.rows.length, 1).setNumberFormat("0.00");
  }
  sheet.setFrozenRows(1);
  sheet.hideColumns(width); // the Car ID bookkeeping column stays out of sight
}

function endpoint_() {
  return CONFIG.SITE_URL.replace(/\/+$/, "") + "/api/sheet-sync";
}

function getSheet_() {
  return SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET_NAME);
}

function toast_(message) {
  try {
    SpreadsheetApp.getActive().toast(message, "0to100 Sync", 8);
  } catch (err) {
    // toast isn't available in every context (e.g. web app calls) — ignore
  }
}

function alert_(title, message) {
  try {
    SpreadsheetApp.getUi().alert(title, message, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (err) {
    toast_(message);
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
