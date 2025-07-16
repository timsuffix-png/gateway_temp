import { readFileSync, writeFileSync } from 'fs';
import { app, BrowserWindow, ipcMain } from 'electron';
import { SerialPort, ReadlineParser } from 'serialport';
import path from 'path';
import { fileURLToPath } from 'url';
import { error } from 'console';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createWindow = () => {
// หน้าที่: เปิด BrowserWindow และโหลด preload.js
const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
     webPreferences: {
     preload: path.join(__dirname, '../../electron/dist/electron/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    
  })

  mainWindow.loadURL('http://localhost:3000')
mainWindow.webContents.openDevTools();


    mainWindow.webContents.session.on("select-serial-port", (event, portList, webContents, callback) => {
        const newPortList = [];
        for (let port of portList) {
            if (port.portName.includes("COM")) {
                newPortList.push(port);
            }
        }
        mainWindow.webContents.send("portlist", newPortList);
    });
}


app.on('ready', () => {
  createWindow();
  ipcMain.handle("getAPIPath", async (event, args) => {
    var COM
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
      writeFileSync("config.cnf", "API=http://localhost:3000/api/v1/");
      COM = null;
    }
    return COM;
  });

  ipcMain.on("setAPIPath", async (event, port) => {
    let newConfig = "";
    try {
      const config = readFileSync("config.cnf").toString("utf-8");
      if (!config.includes("TemperatureCOM")) newConfig += `TemperatureCOM=${port}\n`;
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
      writeFileSync("config.cnf", "API=http://localhost:3000/api/v1/");
    }
  });


  //-----------------------------------------------------------Arduino----------------------------------------------------------
  ipcMain.handle("getPort", async (event, args) => {
       var COM
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
      writeFileSync("config.cnf", "API=http://localhost:3000/api/v1/");
      COM = null;
    }
    return COM;
  });

  ipcMain.handle("setPort", async (event, port) => {
    let newConfig = "";
    try {
      const config = readFileSync("config.cnf").toString("utf-8");
      if (!config.includes("TemperatureCOM")) newConfig += `TemperatureCOM=${port}\n`;
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
      writeFileSync("config.cnf", "API=http://localhost:3000/api/v1/");
    }
  });

let port //ใช้เช็กว่า พอร์ตเปิดอยู่มั้ย
let parser = null; //ฟังรอข้อมูลเข้ามา มีข้อมูลเมื่อไหร่ จะยิง 'data' event
let isOn = false; // ตัวควบคุมสถานะ ว่า ตอนนี้กำลังสั่ง Arduino ทำงานอยู่มั้ย

ipcMain.handle('openPort', async (event, portName) => {
  
  return new Promise((resolve, reject) => {
    if (port && port.isOpen) {
      return resolve('Port already opened');
    }
    
    
const portPath = portName.startsWith("COM") ? portName : "COM" + portName;
port = new SerialPort({ path: portPath, baudRate: 9600, autoOpen: false });

    parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    port.on('error', (err) => {
  console.error("Serial port error:", err);
});

   port.open((err) => {
  if (err) {
    port = null;
    console.log("Failed to open port:", err.message);
    return reject(`Failed to open port: ${err.message}`);
  }
  console.log("Port opened successfully");
  resolve('Port opened');
});

  });
 
});

async function openPortIfNeeded(portName) {
  try{
  return new Promise((resolve, reject) => {
    if (port && port.isOpen) {
      return resolve("Port already opened");
    }

  

    const portPath = portName.startsWith("COM") ? portName : "COM" + portName;
    port = new SerialPort({ path: portPath, baudRate: 9600, autoOpen: false });
    parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

      port.on('error', (err) => {
  console.error("Serial port error:", err);
});

   port.open((err) => {
  if (err) {
    port = null;
    console.log("Failed to open port:", err.message);
    return reject(`Failed to open port: ${err.message}`);
  }
  console.log("Port opened successfully");
  resolve('Port opened');
});


  });
  } catch (err) {
  console.error('Error caught:', err);
}
}

ipcMain.handle('writeData', async (event, args) => {
    console.log("writeData called with port:", args.port);
    // console.log("Port status in writeData:", port, port?.isOpen);
  return await new Promise(async (resolve, reject) => {

    const win = BrowserWindow.getAllWindows()[0];
    const cleanCmd = args.command.trim();
    if (cleanCmd === 'off') {
      isOn = false;
      if (port && port.isOpen) {
        //ถ้าปิดไม่ได้
        port.close((err) => {
          if (err) {
             console.log('Error closing port:', err);
            reject('Error closing port');
          }
          port = null;
          win.webContents.send('serial-port-closed')
          resolve('Port closed');
        });
      } 
      // ถ้าปิดได้
      else {
        resolve('Port already closed');
      }
          port.write(cleanCmd + '\n')
         console.log("writeData called with command:", args.command);
          console.log("Port status in writeData:", port, port?.isOpen);
          return
    }

     if (!port || !port.isOpen) {
      await openPortIfNeeded(args.port);
    }

    if (!port || !port.isOpen) {
      throw new Error("Port is not open");
    }
 
  //เขียนคำสั่งไปarduino
   port.write(cleanCmd + '\n', (err) => {
      if (err) return reject(err);
      console.log("Send ......." + cleanCmd + " to Arduino.")
    });

    //ทุกครั้งที่ port.open จะ parser.on('data', ...) → ถ้าเปิด/ปิดหลายรอบ อาจซ้อนหลาย event
      parser.removeAllListeners('data');
      
    const dataArray = [];
    let lastTimeValue = 0;

    const onData = (data) => {
      console.log("Callback data parser...........................");
      console.log("writeData called with command:", args.command);
      console.log("Port status in writeData:", port, port?.isOpen);
      console.log('Data from Arduino:', data.toString());
      data = data.trim();
      dataArray.push(data);
    // ส่งข้อมูลไป renderer ทันทีทีละบรรทัด
        win.webContents.send('serial-data', data); 
        // 👉 ฝั่ง renderer จะได้ทีละรอบ เรียลไทม์
   
      

    const index_data = data.split(',');
    if (index_data.length === 5) {
      const timeValue = Number(index_data[4]);
      lastTimeValue = timeValue;

      if (timeValue >= 10) {
        parser.removeListener('data', onData);
           console.log("writeData called with command:", args.command);
           console.log("Port status in writeData:", port, port?.isOpen);
         resolve("Open port and send datas : " , dataArray); 
        // ✅ คืนค่าทุกบรรทัดที่เก็บมาเมื่อ time = 10
      }
    }
    };

    parser.on('data', onData);
    console.log("writeData called with command:", args.command);
      console.log("Port status in writeData:", port, port?.isOpen);
        // resolve("Open port in writeSerial func."); 
   
  }
);

});


ipcMain.handle('closePort', async () => {

  return new Promise((resolve, reject) => {
    if (!port || !port.isOpen) {
      return resolve('Port already closed');
    }

    port.close((err) => {
      if (err) {
        return reject(`Failed to close port: ${err.message}`);
      }
      port = null;  // เคลียร์ตัวแปรหลังปิด
      resolve('Port closed');
    });
  });

});


})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

