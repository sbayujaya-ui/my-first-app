import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const ROOT = process.cwd();
const ROADMAP_FILE = path.join(ROOT, "roadmap.json");
const BACKUP_ROOT = path.join(ROOT, ".doctor-backup", "roadmap-engine");

function load() {
  if (!fs.existsSync(ROADMAP_FILE)) {
    throw new Error("roadmap.json tidak ditemukan.");
  }

  const raw = fs
    .readFileSync(ROADMAP_FILE, "utf8")
    .replace(/^\uFEFF/, "");

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(
      "roadmap.json tidak valid: " + error.message
    );
  }
}

function save(data) {
  fs.mkdirSync(BACKUP_ROOT, { recursive: true });

  const backup = path.join(
    BACKUP_ROOT,
    `roadmap.before-save.${Date.now()}.json`
  );

  if (fs.existsSync(ROADMAP_FILE)) {
    fs.copyFileSync(ROADMAP_FILE, backup);
  }

  fs.writeFileSync(
    ROADMAP_FILE,
    JSON.stringify(data, null, 2) + "\n",
    "utf8"
  );

  return backup;
}

function tasks(data) {
  const result = [];

  for (const phase of data.phases || []) {
    for (const task of phase.tasks || []) {
      result.push({
        ...task,
        phaseId: phase.id,
        phaseName: phase.name
      });
    }
  }

  return result;
}

function nextTask(data) {
  const list = tasks(data);

  return (
    list.find((task) => task.status === "next") ||
    list.find((task) => task.status === "partial") ||
    list.find((task) => task.status === "planned") ||
    null
  );
}

function progress(data) {
  const list = tasks(data);

  const done = list.filter(
    (task) => task.status === "complete"
  ).length;

  return list.length
    ? Math.round((done / list.length) * 100)
    : 100;
}

function statusSymbol(status) {
  if (status === "complete") return "[OK]";
  if (status === "partial") return "[PARTIAL]";
  if (status === "next") return "[NEXT]";
  return "[PLAN]";
}

function printStatus(data) {
  console.log("");
  console.log("==================================================");
  console.log(" WARUNG HRD ROADMAP ENGINE");
  console.log("==================================================");
  console.log("");

  console.log("Progress: " + progress(data) + "%");
  console.log("");

  for (const phase of data.phases || []) {
    let phaseSymbol = "[PLAN]";

    if (phase.status === "complete") {
      phaseSymbol = "[OK]";
    } else if (phase.status === "in_progress") {
      phaseSymbol = "[NEXT]";
    }

    console.log(
      phaseSymbol +
      " " +
      phase.id +
      " - " +
      phase.name
    );

    for (const task of phase.tasks || []) {
      console.log(
        "   " +
        statusSymbol(task.status) +
        " " +
        task.id +
        " - " +
        task.name
      );
    }
  }

  const next = nextTask(data);

  console.log("");
  console.log("==================================================");
  console.log(" NEXT TASK");
  console.log("==================================================");

  if (next) {
    console.log(
      next.id +
      " - " +
      next.name
    );

    console.log(
      "Phase: " +
      next.phaseId +
      " - " +
      next.phaseName
    );
  } else {
    console.log("Tidak ada task tersisa.");
  }

  console.log("");
}

function run(command, args) {
  return spawnSync(
    command,
    args,
    {
      cwd: ROOT,
      stdio: "inherit",
      shell: true
    }
  );
}

function runBuild() {
  console.log("");
  console.log("BUILD");
  console.log("");

  const result = run(
    "npm",
    ["run", "build"]
  );

  return result.status === 0;
}

function runDoctor() {
  console.log("");
  console.log("PROJECT DOCTOR");
  console.log("");

  const result = run(
    "npm",
    ["run", "doctor"]
  );

  return result.status === 0;
}

function backupFile(target, label) {
  if (!fs.existsSync(target)) {
    throw new Error(
      "File target tidak ditemukan: " + target
    );
  }

  const backupDir = path.join(
    ROOT,
    ".doctor-backup",
    label
  );

  fs.mkdirSync(
    backupDir,
    { recursive: true }
  );

  const backup = path.join(
    backupDir,
    path.basename(target) +
      "." +
      Date.now() +
      ".bak"
  );

  fs.copyFileSync(
    target,
    backup
  );

  return backup;
}

function rollback(target, backup) {
  if (
    backup &&
    fs.existsSync(backup)
  ) {
    fs.copyFileSync(
      backup,
      target
    );

    return true;
  }

  return false;
}

/*
====================================================
DASH-001
====================================================
*/

function repairDash001() {
  const target = path.join(
    ROOT,
    "app",
    "page.tsx"
  );

  if (!fs.existsSync(target)) {
    throw new Error(
      "app/page.tsx tidak ditemukan."
    );
  }

  const current = fs.readFileSync(
    target,
    "utf8"
  );

  const markers = [
    "WARUNG HRD",
    "Kelola Produk",
    "Penjualan",
    "Lihat Stok",
    "Ringkasan Hari Ini"
  ];

  for (const marker of markers) {
    if (!current.includes(marker)) {
      throw new Error(
        'Safety check gagal. Marker "' +
        marker +
        '" tidak ditemukan.'
      );
    }
  }

  const backup = backupFile(
    target,
    "DASH-001"
  );

  let updated = current;

  /*
   * Kelola Produk
   */

  updated = updated.replace(
    /<button([^>]*)>\s*Kelola Produk\s*<\/button>/s,
    '<a href="/produk"$1>Kelola Produk</a>'
  );

  /*
   * Penjualan
   */

  updated = updated.replace(
    /<button([^>]*)>\s*Penjualan\s*<\/button>/s,
    '<a href="/penjualan"$1>Penjualan</a>'
  );

  /*
   * Stok
   */

  updated = updated.replace(
    /<button([^>]*)>\s*Lihat Stok\s*<\/button>/s,
    '<a href="/produk"$1>Lihat Stok</a>'
  );

  /*
   * Perbaiki emoji yang rusak.
   */

  updated = updated
    .replace(/Ã°Å¸â€œÂ¦/g, "ðŸ“¦")
    .replace(/Ã°Å¸â€ºâ€™/g, "ðŸ›’")
    .replace(/Ã°Å¸â€œÅ /g, "ðŸ“Š")
    .replace(/Ã°Å¸â€™Â°/g, "ðŸ’°");

  if (updated === current) {
    throw new Error(
      "Tidak ada perubahan DASH-001 yang berhasil diterapkan."
    );
  }

  fs.writeFileSync(
    target,
    updated,
    "utf8"
  );

  return {
    target,
    backup
  };
}

/*
====================================================
UPDATE ROADMAP
====================================================
*/

function markComplete(data, taskId) {
  let found = false;

  for (const phase of data.phases || []) {
    for (const task of phase.tasks || []) {
      if (task.id === taskId) {
        task.status = "complete";
        found = true;
      }
    }
  }

  if (!found) {
    throw new Error(
      "Task " +
      taskId +
      " tidak ditemukan."
    );
  }

  /*
   * Reset status "next" lama.
   */

  for (const phase of data.phases || []) {
    for (const task of phase.tasks || []) {
      if (
        task.status === "next" &&
        task.id !== taskId
      ) {
        task.status = "planned";
      }
    }
  }

  /*
   * Cari task berikutnya berdasarkan URUTAN ROADMAP.
   *
   * Partial task tidak mengambil alih task aktif.
   * Setelah task yang sedang dikerjakan selesai,
   * engine mencari task planned pertama setelahnya.
   */

  const all = tasks(data);

  const completedIndex =
    all.findIndex(
      (task) => task.id === taskId
    );

  let following = null;

  if (completedIndex >= 0) {
    following =
      all
        .slice(completedIndex + 1)
        .find(
          (task) =>
            task.status === "planned"
        ) || null;
  }

  /*
   * Jika tidak ada task setelah task yang selesai,
   * cari planned pertama dari seluruh roadmap.
   */

  if (!following) {
    following =
      all.find(
        (task) =>
          task.status === "planned"
      ) || null;
  }

  /*
   * Hapus status NEXT lama.
   */

  for (const phase of data.phases || []) {
    for (const task of phase.tasks || []) {
      if (
        task.status === "next" &&
        task.id !== taskId
      ) {
        task.status = "planned";
      }
    }
  }

  /*
   * Tetapkan task berikutnya.
   */

  if (following) {
    for (const phase of data.phases || []) {
      for (const task of phase.tasks || []) {
        if (
          task.id === following.id
        ) {
          task.status = "next";
        }
      }
    }

    data.currentTask =
      following.id;
  } else {
    data.currentTask = null;
  }

  /*
   * Update status phase.
   */

  for (const phase of data.phases || []) {
    const list = phase.tasks || [];

    if (
      list.length > 0 &&
      list.every(
        (task) =>
          task.status === "complete"
      )
    ) {
      phase.status = "complete";
    } else if (
      list.some(
        (task) =>
          task.status === "complete" ||
          task.status === "partial" ||
          task.status === "next"
      )
    ) {
      phase.status = "in_progress";
    } else {
      phase.status = "planned";
    }
  }

  save(data);
}

/*
====================================================
VERIFY
====================================================
*/

function verify(data) {
  console.log("");
  console.log("==================================================");
  console.log(" VERIFY");
  console.log("==================================================");
  console.log("");

  console.log(
    "Roadmap progress: " +
    progress(data) +
    "%"
  );

  const doctorOk = runDoctor();

  if (!doctorOk) {
    console.log("");
    console.log("[FAIL] PROJECT DOCTOR");
    return false;
  }

  const buildOk = runBuild();

  if (!buildOk) {
    console.log("");
    console.log("[FAIL] BUILD");
    return false;
  }

  console.log("");
  console.log("[OK] VERIFY BERHASIL");
  console.log("");

  return true;
}

/*
====================================================
REPAIR
====================================================
*/

function repair(data) {
  console.log("");
  console.log("==================================================");
  console.log(" AUTO-REPAIR ENGINE");
  console.log("==================================================");
  console.log("");

  const task = nextTask(data);

  if (!task) {
    console.log(
      "Tidak ada task yang perlu diperbaiki."
    );
    return;
  }

  console.log(
    "Target: " +
    task.id +
    " - " +
    task.name
  );

  console.log(
    "Phase: " +
    task.phaseId +
    " - " +
    task.phaseName
  );

  console.log("");

  if (task.id !== "DASH-001") {
    console.log(
      "Task " +
      task.id +
      " belum memiliki repair handler."
    );

    console.log(
      "Tidak ada source code yang diubah."
    );

    return;
  }

  let result = null;

  try {
    console.log(
      "[1/5] Safety check dan backup..."
    );

    result = repairDash001();

    console.log(
      "[OK] Backup dibuat:"
    );

    console.log(
      "     " +
      result.backup
    );

    console.log("");

    console.log(
      "[2/5] Repair Dashboard..."
    );

    console.log(
      "[OK] Produk -> /produk"
    );

    console.log(
      "[OK] Penjualan -> /penjualan"
    );

    console.log(
      "[OK] Stok -> /produk"
    );

    console.log(
      "[OK] Encoding emoji diperbaiki"
    );

    console.log("");

    console.log(
      "[3/5] Project Doctor..."
    );

    if (!runDoctor()) {
      throw new Error(
        "Project Doctor gagal."
      );
    }

    console.log(
      "[OK] Project Doctor"
    );

    console.log("");

    console.log(
      "[4/5] Production Build..."
    );

    if (!runBuild()) {
      throw new Error(
        "Production build gagal."
      );
    }

    console.log(
      "[OK] Production Build"
    );

    console.log("");

    console.log(
      "[5/5] Update roadmap..."
    );

    markComplete(
      data,
      "DASH-001"
    );

    console.log(
      "[OK] DASH-001 -> complete"
    );

    console.log("");

    console.log("==================================================");
    console.log(" AUTO-REPAIR BERHASIL");
    console.log("==================================================");
    console.log("");

  } catch (error) {
    console.log("");
    console.log("==================================================");
    console.log(" AUTO-REPAIR GAGAL");
    console.log("==================================================");
    console.log("");

    console.log(
      "Alasan: " +
      error.message
    );

    console.log("");

    if (
      result &&
      result.target &&
      result.backup
    ) {
      console.log(
        "Rollback..."
      );

      if (
        rollback(
          result.target,
          result.backup
        )
      ) {
        console.log(
          "[OK] Rollback berhasil."
        );
      } else {
        console.log(
          "[FAIL] Rollback gagal."
        );
      }
    }

    console.log("");

    process.exitCode = 1;
  }
}

/*
====================================================
PLAN
====================================================
*/

function plan(data) {
  const task = nextTask(data);

  console.log("");
  console.log("==================================================");
  console.log(" ROADMAP PLAN");
  console.log("==================================================");
  console.log("");

  if (!task) {
    console.log(
      "Semua task selesai."
    );
  } else {
    console.log(
      "Next: " +
      task.id +
      " - " +
      task.name
    );

    console.log(
      "Phase: " +
      task.phaseId +
      " - " +
      task.phaseName
    );

    console.log(
      "Status: " +
      task.status
    );
  }

  console.log("");
}

/*
====================================================
MAIN
====================================================
*/

const command =
  process.argv[2] || "status";

try {
  const data = load();

  switch (command) {
    case "status":
      printStatus(data);
      break;

    case "next":
      printStatus(data);
      break;

    case "plan":
      plan(data);
      break;

    case "doctor":
      process.exitCode =
        runDoctor() ? 0 : 1;
      break;

    case "build":
      process.exitCode =
        runBuild() ? 0 : 1;
      break;

    case "verify":
      process.exitCode =
        verify(data) ? 0 : 1;
      break;

    case "repair":
      repair(data);
      break;

    case "complete": {
      const taskId =
        process.argv[3];

      if (!taskId) {
        throw new Error(
          "Gunakan: npm run wh -- complete TASK-ID"
        );
      }

      markComplete(
        data,
        taskId
      );

      console.log(
        "[OK] " +
        taskId +
        " -> complete"
      );

      break;
    }

    case "help":
      console.log("");
      console.log("WARUNG HRD ROADMAP ENGINE");
      console.log("");
      console.log("Commands:");
      console.log("  npm run wh -- status");
      console.log("  npm run wh -- next");
      console.log("  npm run wh -- plan");
      console.log("  npm run wh -- doctor");
      console.log("  npm run wh -- build");
      console.log("  npm run wh -- verify");
      console.log("  npm run wh -- repair");
      console.log("  npm run wh -- complete TASK-ID");
      console.log("");
      break;

    default:
      throw new Error(
        "Command tidak dikenal: " +
        command
      );
  }
} catch (error) {
  console.error("");
  console.error(
    "[ERROR] ROADMAP ENGINE"
  );
  console.error("");
  console.error(
    error.message
  );
  console.error("");

  process.exitCode = 1;
}