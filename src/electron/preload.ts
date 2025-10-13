import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  loadImg: async (path: string) => ipcRenderer.invoke("loadImg", path),
  uploadImg: async (args: { method: string; URL: string }) =>
    ipcRenderer.invoke("uploadImg", args),
  getImg: async (args: { method: string; URL: string }) =>
    ipcRenderer.invoke("getImg", args),
  
  portlist: (callback: (portList: any) => void) =>
    ipcRenderer.on("portlist", (event, portList) => callback(portList)),
  getPort: () => ipcRenderer.invoke("getPort"),
  setPort: (port: string) => ipcRenderer.invoke("setPort", port),
  getAPIPath: () => ipcRenderer.invoke("getAPIPath"),
  setAPIPath: (api: string) => ipcRenderer.invoke("setAPIPath", api),
  fetchAPI: (fetch: { method: string; url: string }) =>
    ipcRenderer.invoke("fetchAPI", fetch),

  onSerialData: (callback: (data: string) => void) => {
    ipcRenderer.on("serial-data", (_event, data) => callback(data));
  },
  //ใช้ลบการฟังข้อมูล
  removeSerialDataListener: (callback: (data: string) => void) => {
    ipcRenderer.removeListener("serial-data", (_event, data) => callback(data));
  },

  // // ใช้บอกว่าพอตปิดเเล้ว Main → Renderer
  // onSerialPortClosed: (callback: () => void) => {
  //   ipcRenderer.on("serial-port-closed", callback);
  // },
  // //ใช้ลบการฟังพอตปิด
  // removeSerialPortClosedListener: (callback: () => void) => {
  //   ipcRenderer.removeListener("serial-port-closed", callback); //เวลาเรียกใช้พร้อมกับฟังชั่นฝั่งrederer
  // },
  
  openPort: (portName: string) => ipcRenderer.invoke("openPort", portName),
  //ปิดพอต  	Renderer → Main
  closePort: () => ipcRenderer.invoke("closePort"),
  writeData: (args: {
    port: string;
    command: {
      state: string;
      tempLim: number;
      currentLim: number;
      startMoment: number;
      endMoment: number;

    };
  }) => ipcRenderer.invoke("writeData", args),
});
console.log("✅ Preload script loaded");

// .invoke คือ   Renderer → Main
// .on คือ      Main → Rederer
