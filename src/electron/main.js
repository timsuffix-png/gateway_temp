import { readFileSync, writeFileSync } from "fs";
import { app, BrowserWindow, ipcMain } from "electron";
import { SerialPort, ReadlineParser } from "serialport";
import path from "path";
import { fileURLToPath } from "url";
import { error } from "console";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createWindow = () => {
  // หน้าที่: เปิด BrowserWindow และโหลด preload.js
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "../../electron/dist/electron/preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL("http://localhost:3000");
  mainWindow.webContents.openDevTools();

  mainWindow.webContents.session.on(
    "select-serial-port",
    (event, portList, webContents, callback) => {
      const newPortList = [];
      for (let port of portList) {
        if (port.portName.includes("COM")) {
          newPortList.push(port);
        }
      }
      mainWindow.webContents.send("portlist", newPortList);
    }
  );
};

app.on("ready", () => {
  createWindow();
  
  //-----------------------------------------------------------Image----------------------------------------------------------
  ipcMain.handle("loadImg", (event, args) => {
    const ext = path.extname(args);
    try {
      const image = readFileSync(path.join(process.cwd(), "resources", args));
      return `data:image/${ext};base64,${image.toString("base64")}`;
    } catch {
      const image = readFileSync(path.join(process.cwd(), "public", args));
      return `data:image/${ext};base64,${image.toString("base64")}`;
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
        "API=https://api.mephistopheles.live/api/v1/"
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
        "API=https://api.mephistopheles.live/api/v1/"
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
        "API=https://api.mephistopheles.live/api/v1/"
      );
      API = "API=https://api.mephistopheles.live/api/v1/";
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
        "API=https://api.mephistopheles.live/api/v1/"
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
        "API=https://api.mephistopheles.live/api/v1/"
      );
    }
  });

  let port; //ใช้เช็กว่า พอร์ตเปิดอยู่มั้ย
  let parser = null; //ฟังรอข้อมูลเข้ามา มีข้อมูลเมื่อไหร่ จะยิง 'data' event

  ipcMain.handle("openPort", async (event, portName) => {
    return new Promise((resolve, reject) => {
      if (port && port.isOpen) {
        return resolve("Port already opened");
      }

      const portPath = portName.startsWith("COM") ? portName : "COM" + portName;
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

  async function openPortIfNeeded(portName) {
    return new Promise((resolve, reject) => {
      if (port && port.isOpen) {
        return resolve("Port already opened");
      }
      const portPath = portName.startsWith("COM") ? portName : "COM" + portName;
      port = new SerialPort({
        path: portPath,
        baudRate: 9600,
        autoOpen: false,
      });
      parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

      port.on("error", (err) => {
        reject("Serial port error:", err);
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
      },${args.command.timeLim}`;

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
        try {
          await openPortIfNeeded(args.port);
        } catch (err) {
          return reject(err); // ต้อง reject ถ้าเปิดพอร์ตไม่สำเร็จ
        }
      }

      console.log("State on : " + cleanCmd);
      //เขียนคำสั่งไปarduino
      port.write(cleanCmd + "\n", (err) => {
        if (err) return reject(err);
      });

      //ทุกครั้งที่ port.open จะ parser.on('data', ...) → ถ้าเปิด/ปิดหลายรอบ อาจซ้อนหลาย event
      parser.removeAllListeners("data");

      const dataArray = [];

      const onData = (data) => {
        console.log("Data from Arduino:", data.toString());
        data = data.trim();
        dataArray.push(data);
        // ส่งข้อมูลไป renderer ทันทีทีละบรรทัด
        win.webContents.send("serial-data", data);
        // 👉 ฝั่ง renderer จะได้ทีละรอบ เรียลไทม์

        const index_data = data.split(",");
        if (index_data.length >= 3) {
          const state_data = index_data[8].trim();

          //ถ้าstate ไม่เท่ากับ In process
          if (state_data !== "on") {
            win.webContents.send("serial-data-complete", dataArray);
            parser.removeListener("data", onData);
            resolve(dataArray);
          }
        }
      };

      parser.on("data", onData);
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
  if (port) {
    if (port.isOpen) {
      port.close((err) => {
        if (err) {
          console.error("Error closing serial port on app exit:", err.message);
        } else {
          console.log("Serial port closed on app exit.");
        }
        port = null; // << เพิ่มตรงนี้
      });
    } else {
      console.log("Serial port was not open on app exit.");
      port = null; // << เพิ่มตรงนี้
    }
  }
  if (process.platform !== "darwin") app.quit();
});
