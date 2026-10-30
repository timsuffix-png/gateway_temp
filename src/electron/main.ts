import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync } from "fs";
import path, { resolve } from "path";
import { pathToFileURL } from "url";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.webContents.session.clearCache();
  if (app.isPackaged) {
    // โหลดไฟล์ index.html จาก out/
    const indexPath = path.join(process.resourcesPath, "out", "index.html");
    mainWindow.loadURL(pathToFileURL(indexPath).toString());
  } else {
    // ตอน dev
    mainWindow.loadURL("http://localhost:3000");
  }

  mainWindow.webContents.session.on(
    "select-serial-port",
    (event, portList, webContents, callback) => {
      const newPortList: Electron.SerialPort[] = [];
      for (let port of portList) {
        if (port.portName.includes("COM")) {
          newPortList.push(port);
        }
      }

      mainWindow?.webContents.send("portlist", newPortList);
    }
  );
}
let port: SerialPort | null;
let parser: ReadlineParser | null = null;

app.on("ready", () => {
  // //-----------------------------------------------------------File----------------------------------------------------------
  ipcMain.handle("readCalibrateFile", async (event, name?: string) => {
    const dataDir = path.join(process.cwd(), "data");
    if (!existsSync(dataDir)) {
      return { status: false, error: "File not found" };
    }
    //ถ้าไม่มีชื่อไฟล์ จะเลือกไฟล์แรกในโฟลเดอร์
    let targetPath = name ? path.join(dataDir, name) : "";
    if (!name || !existsSync(targetPath)) {
      const names = readdirSync(dataDir);
      if (!names.length) {
        return { status: false, error: "File not found" };
      }
      targetPath = path.join(dataDir, names[0]);
    }
    try {
      //อ่านไฟล์แบบ synchronous
      const text = readFileSync(targetPath, "utf8");
      const lines = text.trim().split("\n");
      const calibrateValue: any = [];

      lines.forEach((line) => {
        // ข้ามบรรทัดว่างและบรรทัด legend (เช่น "0, m1 , c1")
        const trimmed = line.trim();
        if (!trimmed) return;

        const parts = trimmed.split(",");
        const rowIndex = Number(parts[0]);   // index จากไฟล์ (0-5)
        const x = Number(parts[1]);          // ค่าแรก (m1/m2/k1/m3/m4/k2)
        const y = Number(parts[2]);          // ค่าที่สอง (c1/c2/x01/c3/c4/x02)

        // ข้าม legend หรือ header ที่ไม่ใช่ตัวเลข
        if (isNaN(rowIndex) || isNaN(x) || isNaN(y)) return;

        // ใช้ rowIndex จากไฟล์โดยตรง ไม่ใช่ตำแหน่งบรรทัด
        // ป้องกัน index เบี้ยวถ้าไฟล์มี header/blank lines ก่อนหน้า
        calibrateValue[rowIndex] = { x, y };
      });
      return {
        status: true,
        path: targetPath,
        name: path.basename(targetPath),
        text: calibrateValue,
      };
    } catch {
      return { status: false, error: "read failed" };
    }
  });

  ipcMain.handle("uploadCalibrateFileDialog", async () => {
    const dataDir = path.join(process.cwd(), "data");
    if (!existsSync(dataDir)) {
      require("fs").mkdirSync(dataDir, { recursive: true });
    }
    const fileDialog = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Text Files", extensions: ["txt"] }],
    });
    if (fileDialog.canceled || !fileDialog.filePaths.length) {
      return { status: false, error: "canceled" };
    }
    try {
      const src = fileDialog.filePaths[0];
      const name = path.basename(src);
      const buffer = readFileSync(src);
      const dest = path.join(dataDir, name);
      writeFileSync(dest, buffer);
      return { status: true, name, path: dest };
    } catch (e: any) {
      return { status: false, error: e?.message || "upload failed" };
    }
  });

  ipcMain.handle("listDataFiles", async () => {
    const dataDir = path.join(process.cwd(), "data");
    if (!existsSync(dataDir)) {
      return { status: false, error: "Directory not found", files: [] };
    }
    try {
      const names = readdirSync(dataDir)
        .filter((n) => path.extname(n).toLowerCase() === ".txt")
        .sort((a, b) => a.localeCompare(b));
      return { status: true, files: names };
    } catch (e: any) {
      return { status: false, error: e?.message || "list failed", files: [] };
    }
  });

  ipcMain.handle("deleteDataFile", async (event, name: string) => {
    const dataDir = path.join(process.cwd(), "data");
    if (!existsSync(dataDir)) {
      return { status: false, error: "Directory not found" };
    }
    try {
      const target = path.join(dataDir, path.basename(name));
      if (!existsSync(target)) {
        return { status: false, error: "File not found" };
      }
      unlinkSync(target);
      return { status: true };
    } catch (e: any) {
      return { status: false, error: e?.message || "delete failed" };
    }
  });

  //-----------------------------------------------------------Image----------------------------------------------------------
  ipcMain.handle("loadImg", (event, args) => {
    const ext = path.extname(args);
    try {
      const image = readFileSync(path.join(process.resourcesPath, "out", args));
      return `data:image/${ext.replace(".", "")};base64,${image.toString("base64")}`;
    } catch {
      const image = readFileSync(path.join(process.cwd(), "public", args));
      return `data:image/${ext.replace(".", "")};base64,${image.toString("base64")}`;
    }
  });

  ipcMain.handle("uploadImg", async (event, args) => {
    event.preventDefault();
    var API = "";
    try {
      const config = readFileSync("config.cnf").toString("utf-8");
      for (let data of config.split("\n")) {
        if (data.includes("API")) {
          API = data.split("=")[1].trim().replaceAll('"', "");
          break;
        }
      }
    } catch {
      // file not found error
      writeFileSync("config.cnf", "API=http://localhost:3021/api/v1/");
      API = "http://localhost:3021/api/v1/";
    }

    const fileDialog = dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        {
          name: "image/png,jpg,jpeg,bmp,webp",
          extensions: ["png", "jpg", "jpeg", "bmp", "webp"],
        },
      ],
    });
    if ((await fileDialog).canceled) return await fileDialog;
    const file = readFileSync((await fileDialog).filePaths[0]);
    const filePath = (await fileDialog).filePaths[0].split("\\");
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([file], {
        type: `image/${path.extname(filePath[filePath.length - 1]).split(".")[1]
          }`,
      }),
      filePath[filePath.length - 1]
    );
    try {
      const res = await fetch(API + args.URL, {
        method: args.method,
        body: formData,
      });
      if (!res.ok) return await fileDialog;
      return file;
    } catch {
      return await fileDialog;
    }
  });

  ipcMain.handle("getImg", async (event, args) => {
    event.preventDefault();
    var API = "";
    try {
      const config = readFileSync("config.cnf").toString("utf-8");
      for (let data of config.split("\n")) {
        if (data.includes("API")) {
          API = data.split("=")[1].trim().replaceAll('"', "");
          break;
        }
      }
    } catch {
      // file not found error
      writeFileSync("config.cnf", "API=http://localhost:3021/api/v1/");
      API = "http://localhost:3021/api/v1/";
    }

    try {
      const res = await fetch(API + args.URL, {
        method: args.method,
        body: args.body,
      });
      if (!res.ok) return null;
      return await res.arrayBuffer();
    } catch {
      return null;
    }
  });

  //-----------------------------------------------------------API----------------------------------------------------------

  ipcMain.handle("getAPIPath", async (event, args) => {
    var API;
    try {
      const config = readFileSync("config.cnf").toString("utf-8");
      for (let data of config.split("\n")) {
        if (data.includes("API")) {
          API = data.split("=")[1].trim().replaceAll('"', "");
          break;
        }
      }
    } catch {
      // file not found error
      writeFileSync(
        "config.cnf",
        "API=http://localhost:3021/api/v1/"
      );
      API = null;
    }
    return API;
  });

  ipcMain.handle("setAPIPath", async (event, port) => {
    let newConfig = "";
    try {
      const config = readFileSync("config.cnf").toString("utf-8");
      if (!config.includes("API")) newConfig += `API=${port}\n`;
      for (let data of config.split("\n")) {
        if (data.includes("API")) {
          newConfig += `API=${port}\n`;
        } else {
          newConfig += data + "\n";
        }
      }
      writeFileSync("config.cnf", newConfig.substring(0, newConfig.length - 1));
    } catch {
      // file not found error
      writeFileSync(
        "config.cnf",
        "API=http://localhost:3021/api/v1/"
      );
    }
  });

  ipcMain.handle("fetchAPI", async (event, args) => {
    var API = "";
    try {
      const config = readFileSync("config.cnf").toString("utf-8");
      for (let data of config.split("\n")) {
        if (data.includes("API")) {
          API = data.split("=")[1].trim().replaceAll('"', "");
          break;
        }
      }
    } catch {
      // file not found error
      writeFileSync(
        "config.cnf",
        "API=http://localhost:3021/api/v1/"
      );
      API = "http://localhost:3021/api/v1/";
    }
    if (args.method === "POST") {
      try {
        const res = await fetch(API + args.URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...args.body }),
        });
        if (!res.ok) {
          console.error(`Fetch POST failed: ${res.status} ${res.statusText} for URL: ${API + args.URL}`);
          return null;
        }
        return await res.json();
      } catch (err: any) {
        console.error(`Fetch POST exception: ${err.message} for URL: ${API + args.URL}`);
        return null;
      }
    } else if (args.method === "GET") {
      try {
        const res = await fetch(API + args.URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          console.error(`Fetch GET failed: ${res.status} ${res.statusText} for URL: ${API + args.URL}`);
          return null;
        }
        return await res.json();
      } catch (err: any) {
        console.error(`Fetch GET exception: ${err.message} for URL: ${API + args.URL}`);
        return null;
      }
    } else if (args.method === "PATCH") {
      try {
        const res = await fetch(API + args.URL, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...args.body }),
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    } else if (args.method === "PUT") {
      try {
        const res = await fetch(API + args.URL, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...args.body }),
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    } else if (args.method === "DELETE") {
      try {
        const res = await fetch(API + args.URL, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...args.body }),
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    } else return null;
  });

  //-----------------------------------------------------------Arduino----------------------------------------------------------
  ipcMain.handle("getPort", async (event, args) => {
    var COM;
    try {
      const config = readFileSync("config.cnf").toString("utf-8");
      for (let data of config.split("\n")) {
        if (data.includes("TemperatureCOM")) {
          COM = data.split("=")[1].trim().replaceAll('"', "");
          break;
        }
      }
    } catch {
      // file not found error
      writeFileSync(
        "config.cnf",
        "API=http://localhost:3021/api/v1/"
      );
      COM = null;
    }
    return COM;
  });

  ipcMain.handle("setPort", async (event, port) => {
    let newConfig = "";
    try {
      const config = readFileSync("config.cnf").toString("utf-8");
      if (!config.includes("TemperatureCOM"))
        newConfig += `TemperatureCOM=${port}\n`;
      for (let data of config.split("\n")) {
        if (data.includes("TemperatureCOM")) {
          newConfig += `TemperatureCOM=${port}\n`;
        } else {
          newConfig += data + "\n";
        }
      }
      writeFileSync("config.cnf", newConfig.substring(0, newConfig.length - 1));
    } catch {
      // file not found error
      writeFileSync(
        "config.cnf",
        "API=http://localhost:3021/api/v1/"
      );
    }
  });

  ipcMain.handle("openPort", async (event, portName) => {
    return new Promise((resolve, reject) => {
      if (port && port.isOpen) {
        console.log("Port already opened");
        return resolve("Port already opened");
      }

      const portPath = portName.startsWith("COM") ? portName : `COM${portName}`;
      port = new SerialPort({
        path: portPath,
        baudRate: 115200,
        autoOpen: false,
      });

      port.on("error", (err) => {
        console.error("Serial port error:", err);
      });

      port.open((err) => {
        if (err) {
          port = null;
          return reject(`Failed to open port: ${err.message}`);
        }

        console.log("Port opened successfully:", portPath);

        parser = port!.pipe(new ReadlineParser({ delimiter: "\n" }));

        const win = BrowserWindow.getAllWindows()[0];

        const onData = (data: Buffer | string): void => {
          const str = data.toString().trim();
          console.log("Data from Arduino:", str);
          // ส่งข้อมูลไป renderer ทันทีทีละบรรทัด
          win.webContents.send("serial-data", str);
          // ฝั่ง renderer จะได้ทีละรอบ เรียลไทม์
        };

        parser.removeAllListeners("data");
        parser.on("data", onData);

        resolve("Port opened and parser ready");
      });
    });
  });

  ipcMain.handle("writeData", async (event, args) => {
    return new Promise((resolve, reject) => {
      if (!port || !port.isOpen) return reject("Port not open");

      // command is now a pre-formatted comma-separated string
      const command: string = String(args.command ?? "");

      // Handle stop command
      if (command === "stop" || command.startsWith("stop,")) {
        port.write("stop\n");
        console.log("Sent stop command");
        return resolve("Stopped");
      }

      // Handle calibrate command (calibration-test page)
      if (command === "calibrate") {
        port.write("calibrate\n", (err) => {
          if (err) return reject(err);
          console.log("Sent command: calibrate");
          resolve("Command sent successfully");
        });
        return;
      }

      // Send command as-is (React already appends \n at the end)
      port.write(command, (err) => {
        if (err) return reject(err);
        console.log("Sent command:", command.trim());
        resolve("Command sent successfully");
      });
    });
  });

  ipcMain.handle("closePort", async () => {
    return new Promise((resolve, reject) => {
      if (!port || !port.isOpen) {
        return resolve("Port already closed");
      }

      port.close((err) => {
        if (err) {
          return reject(`Failed to close port: ${err.message}`);
        }
        port = null; // เคลียร์ตัวแปรหลังปิด
        resolve("Port closed");
        console.log("Port is closing...................");
      });
    });
  });
  ipcMain.handle("openExternal", async (event, url: string) => {
    const { shell } = require("electron");
    await shell.openExternal(url);
  });
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
