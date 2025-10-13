import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
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
  createWindow();

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
        type: `image/${
          path.extname(filePath[filePath.length - 1]).split(".")[1]
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
        "API=https://6bd1cbdf-3021.asse.devtunnels.ms/api/v1/"
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
        "API=https://6bd1cbdf-3021.asse.devtunnels.ms/api/v1/"
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
        "API=https://6bd1cbdf-3021.asse.devtunnels.ms/api/v1/"
      );
      API = "API=https://6bd1cbdf-3021.asse.devtunnels.ms/api/v1/";
    }
    if (args.method === "POST") {
      try {
        const res = await fetch(API + args.URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...args.body }),
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    } else if (args.method === "GET") {
      try {
        const res = await fetch(API + args.URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
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
        "API=https://6bd1cbdf-3021.asse.devtunnels.ms/api/v1/"
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
        "API=https://6bd1cbdf-3021.asse.devtunnels.ms/api/v1/"
      );
    }
  });

  ipcMain.handle("openPort", async (event, portName) => {
    return new Promise((resolve, reject) => {
      if (port && port.isOpen) {
        return resolve("Port already opened");
      }

      const portPath = portName.startsWith("COM") ? portName : `COM${portName}`;
      port = new SerialPort({
        path: portPath,
        baudRate: 9600,
        autoOpen: false,
      });

      parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

      port.on("error", (err) => {
        console.error("Serial port error:", err);
      });

      port.open((err) => {
        if (err) {
          port = null;
          console.log("Failed to open port:", err.message);
          return reject(`Failed to open port: ${err.message}`);
        }
        console.log("Port opened successfully");
        resolve("Port opened");
      });
    });
  });

  async function openPortIfNeeded(portName: string) {
    return new Promise((resolve, reject) => {
      if (port && port.isOpen) {
        return resolve("Port already opened");
      }
      const portPath = portName.startsWith("COM") ? portName : `COM${portName}`;
      port = new SerialPort({
        path: portPath,
        baudRate: 9600,
        autoOpen: false,
      });
      parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

      port.on("error", (err: Error) => {
        reject("Serial port error:" + err.message);
      });
      port.open((err) => {
        if (err) {
          port = null;
          console.log("Failed to open port:", err.message);
          return reject(`Failed to open port: ${err.message}`);
        }
        console.log("Port opened successfully");
        resolve("Port opened");
      });
    });
  }

  ipcMain.handle("writeData", async (event, args) => {
    // console.log("writeData2 called with port:", args.port);
    // // console.log("Port status in writeData2:", port, port?.isOpen);
    return new Promise(async (resolve, reject) => {
      const win = BrowserWindow.getAllWindows()[0];
      const state_command = args.command.state.trim();
      const cleanCmd = `${args.command.state.trim()},${args.command.tempLim},${
        args.command.currentLim
      },${args.command.startMoment},${args.command.endMoment}`;

      if (state_command === "stop") {
        if (port && port.isOpen) {
          port.write("stop" + "\n");
          console.log("State stop : " + cleanCmd);
        } else {
          console.log("Stop received but port not open — skip write");
        }
        resolve("State is off stop sending datas.");
        return;
      }
      if (!port || !port.isOpen) {
        return reject("Port not available after openPortIfNeeded");
      }

      console.log("State on : " + cleanCmd);
      //เขียนคำสั่งไปarduino
      port.write(cleanCmd + "\n", (err) => {
        if (err) return reject(err);
      });

      // ทุกครั้งให้แน่ใจว่า parser ถูกสร้าง/มีอยู่ก่อนใช้งาน
      if (!parser && port) {
        parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));
      }
      if (parser) {
        parser.removeAllListeners("data");
      }

      const onData = (data: Buffer | string): void => {
        const str = data.toString().trim();
        console.log("Data from Arduino:", str);
        // ส่งข้อมูลไป renderer ทันทีทีละบรรทัด
        win.webContents.send("serial-data", str);
        // 👉 ฝั่ง renderer จะได้ทีละรอบ เรียลไทม์

        const index_data = str.split(",");
        // ตรวจความยาวก่อนเข้าถึง index 9 (state)
        if (index_data.length > 10) {
          const state_data = index_data[9].trim();
          // ถ้า state ไม่เท่ากับ "on" ให้จบการรับข้อมูล
          if (state_data !== "on") {
            if (parser) parser.removeListener("data", onData);
          }
        }
      };

      if (parser) parser.on("data", onData);
      // resolve("Open port in writeSerial func.");
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
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
