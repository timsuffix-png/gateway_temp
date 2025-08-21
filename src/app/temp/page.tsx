"use client";
import React, { useEffect, useState } from "react";
import SelectBar from "@/components/temperature/selectBar";
import axios from "axios";
import Footer from "@/components/footer";
import Popup from "@/components/popup";
import SerialCommunicationPort from "@/components/temperature/serialCommunicationPort";
import { error } from "console";
import { useMemo } from "react";
import { ipcRenderer } from "electron";
import Swal from "sweetalert2";
import { resolve } from "path";
import Select from "react-select";
import ChartTemp from "@/components/temperature/chartTemp";
import Navbar from "@/components/navbar";
import Breadcrumb from "@/components/breadcrumb";
import { useAuth } from "@/lib/auth/authProvider";

const statusMap: Record<string, { css: string; stateName: string }> = {
  stop: { css: "bg-red-600", stateName: "STOP" },
  on: { css: "bg-yellow-600", stateName: "IN PROCESS" },
  pass: { css: "bg-green-600", stateName: "PASS" },
  fail: { css: "bg-red-400", stateName: "FAIL" },
};

export default function MainTempTest_page() {
  // Selectbar
  const [serialNumber, setSerialNumber] = useState(""); //รหัสสินค้า
  const [currentCOMPort, setCurrentCOMPort] = useState<number | null>();
  const [popup, setPopup] = useState(false);
  const openPopup = () => setPopup(true);
  const closePopup = async () => {
    setPopup(false);
    setCurrentCOMPort(Number(await window.electronAPI.getPort()));
  };

  const auth = useAuth();

  const [qcProject, setQcProject] = useState(""); //qcProject ID
  const [temp1, setTemp1] = useState<number | 0>(0);
  const [temp2, setTemp2] = useState<number | 0>(0);
  const [temp3, setTemp3] = useState<number | 0>(0);
  const [current, setCurrent] = useState<number | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [status, setStatus] = useState<string>(""); //สถานะการทดสอบ
  const { css, stateName } = statusMap[status] || {
    css: "bg-gray-400",
    stateName: "OFF",
  };
  const [reason, setReason] = useState("");
  const [allResult, setAllResult] = useState<string[]>([]);

  const qcProjectRef = React.useRef(qcProject);
  const serialNumberRef = React.useRef(serialNumber);
  const statusRef = React.useRef(status);

  useEffect(() => {
    qcProjectRef.current = qcProject;
  }, [qcProject]);
  useEffect(() => {
    serialNumberRef.current = serialNumber;
  }, [serialNumber]);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const [sendData, setSendData] = useState<{
    state: string;
    tempLim: number;
    currentLim: number;
    timeLim: number;
  }>({
    state: "",
    tempLim: 60.0,
    currentLim: 6.0,
    timeLim: 10,
  });
  //รายละเอียดqcที่จะทดสอบ
  const [qcMains, setQcMains] = useState<{
    error: boolean;
    message: string;
    data: [
      {
        ID: string;
        qcMain:
          | {
              qcType: {
                ID: string;
                name: string;
              };
              ID: string;
              testName: string;
              detail: string;
              qcScript: {
                ID: string;
                script: {
                  script_1: number;
                  script_2: number;
                  script_3: number;
                };
              };
              status: string | null; //ค่าสถานะ
              result: string | null; //ผลลัพธ์ล่าสุด
              allResult: string[] | null; //ข้อมูลทั้งหมด
            }
          | undefined;
        qcProject: {
          ID: string;
          projectName: string;
          detail: string;
        };
      }
    ];
  } | null>();
  const [qcProjectList, setQcProjectList] = useState<{
    error: boolean;
    message: string;
    data: [
      {
        ID: string;
        projectName: string;
        detail: string;
        qcItemProject: [
          {
            ID: string;
            qcMain: {
              ID: string;
              testName: string;
              detail: string;
            };
          }
        ];
      }
    ];
    allPage: number;
  } | null>();

  //ฟังก์ชันเปิดพอต
  const serialPort = async () => {
    try {
      const port = await window.electronAPI.getPort();
      await window.electronAPI.openPort(port);
      const data = await window.electronAPI.writeData({
        port,
        command: sendData,
      });
      console.log("State command : " + JSON.stringify(sendData));
      console.log("Data  : " + data);
    } catch (error) {
      console.log("Error in serialPort: " + error);
    }
  };

  //ฟังชั่นรับserial Data
  const handleSerialData = (data: string) => {
    const parts = data.split(",");
    if (parts.length > 8) {
      // const [t1, t2, t3, curr, tm, sendData] = parts;

      // setTemp1(parseFloat(parts[0]));
      // setTemp2(parseFloat(parts[1]));
      // setTemp3(parseFloat(parts[2]));
      // setCurrent(parseFloat(parts[3]));
      // setTime(parseInt(parts[4]));
      // setStatus(parseInt(parts[5]));

      setTemp1(parseFloat(parts[0]));
      setTemp2(parseFloat(parts[1]));
      setTemp3(parseFloat(parts[2]));
      setTime(parseInt(parts[3]));
      setCurrent(parseFloat(parts[4]));
      setStatus(parts[8].trim());
      setReason(parts[9].trim());

      if (parts[8].trim() === "fail" || parts[8].trim() === "pass") {
        console.log("qcProject before recordData:", qcProjectRef.current);
        console.log("serialNumber before recordData:", serialNumberRef.current);

        recordData(parts);
      }
    }
  };

  const handleSerialDataComplete = (dataArray: string[]) => {
    console.log("Data received in handleSerialDataComplete:", dataArray);
    setAllResult(dataArray);
  };

  //ฟังก์ชันปิดพอต
  const handlePortClosed = () => {
    console.log("Serial port ถูกปิดแล้ว"); // แจ้งสถานะ port ถูกปิด
    // TODO: อัพเดต UI แจ้งเตือนผู้ใช้ว่า port ปิดแล้ว เช่น ปิดปุ่ม หรือแสดงข้อความ
  };

  useEffect(() => {
    // ส่ง callback เดิมเข้าไปทั้งตอน on และตอน remove)
    const serialDataListener = handleSerialData;
    const serialPortClosedListener = handlePortClosed;
    const serialDataCompleteListener = handleSerialDataComplete;

    window.electronAPI.onSerialData(serialDataListener); // เมื่อมีข้อมูล Serial Data เข้ามา ให้เรียกใช้ฟังก์ชัน handleSerialData
    window.electronAPI.onSerialPortClosed(serialPortClosedListener); // เมื่อพอร์ตถูกปิด ให้เรียกใช้ฟังก์ชัน handlePortClosed
    window.electronAPI.onSerialDataComplete(serialDataCompleteListener); // เมื่อข้อมูล Serial Data ถูกส่งมาครบถ้วน ให้เรียกใช้ฟังก์ชัน handleSerialDataComplete

    // ล้าง listener เมื่อ component ถูก unmount
    return () => {
      window.electronAPI.removeSerialDataListener(serialDataListener);
      window.electronAPI.removeSerialPortClosedListener(
        serialPortClosedListener
      );
      window.electronAPI.removeSerialDataCompleteListener(
        serialDataCompleteListener
      );
    };
  }, []);

  useEffect(() => {
    if (sendData.state !== "on" && sendData.state !== "stop") return;

    serialPort();
  }, [sendData.state]);

  //fetch API
  const fetchQcProjectList = async () => {
    const data = await window.electronAPI.fetchAPI({
      method: "GET",
      URL: `qc/project/extend?limit=100&page=1`,
    });
    if (!data) {
      throw new Error("Failed to fetch data");
    }
    return data;
  };

  const fetchScript = async (idProject: string) => {
    console.log("ID Project: " + idProject);
    const rawData = await window.electronAPI.fetchAPI({
      method: "GET",
      URL: `qc/itemProject/${idProject}`,
    });
    setQcMains(rawData);
    if (!rawData) {
      throw new Error("Failed to fetch data");
    }
    const format_script = await rawData?.data?.find(
      // หาที่ "qcType": {
      //     "ID": "796a7f7f-3aa0-4e8a-98b1-b6f7dbeeb600",
      //     "name": "temperature"
      //   },
      (data: any) =>
        data.qcMain?.qcType?.ID === "796a7f7f-3aa0-4e8a-98b1-b6f7dbeeb600"
    );

    // console.log("format_script" + JSON.stringify(format_script));

    // console.log(
    //   "temp : " + format_script?.qcMain?.qcScript?.script?.TemperatureMax
    // );
    // console.log(
    //   "current : " + format_script?.qcMain?.qcScript?.script?.CurrentMax
    // );
    console.log("time : " + format_script?.qcMain?.qcScript?.script?.Time);
    setSendData((prev) => ({
      ...prev,
      tempLim: format_script?.qcMain?.qcScript?.script?.TemperatureMax,
      currentLim: format_script?.qcMain?.qcScript?.script?.CurrentMax,
      timeLim: format_script?.qcMain?.qcScript?.script?.Time,
    }));
  };

  const clickTest = async () => {
    const port = await window.electronAPI.getPort();
    if (!qcProject) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "กรุณาเลือกโปรเจ็คการทดสอบ",
      });
      return;
    }

    if (!port) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "กรุณาเลือกพอร์ตให้ถูกต้อง",
      });
      return;
    }

    if (!serialNumber) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "กรุณากรอกรหัสสินค้า",
      });
      return;
    }

    setSendData((prev) => ({
      ...prev,
      state: "on",
    }));
  };

  const recordData = async (lastResult: string[]) => {
    // const splitData = allResult.map((line) => line.split(","));
    // //       [
    // //   ["15", "1", "3", "in process"],
    // //   ["45", "2", "3", "in process"],
    // //   ["45", "3", "4", "in process"]
    // // ]
    // let splitResultArray = splitData[splitData.length - 1]; // ผลลัพธ์: [" 8.4S", " 249", " 500.000000","Passed",""Cus termostate is cut in time.]

    try {
      // console.log("qcProjectID: ", qcProject);
      // console.log("serialNumber: ", serialNumber);
      console.log("Testby : ", auth.user.data.ID);

      const record = await window.electronAPI.fetchAPI({
        method: "POST",
        URL: "qc/record",
        body: {
          qcProjectID: qcProjectRef.current,
          serialNumber: serialNumberRef.current,
          testBy: auth.user.data.ID,
        },
      });

      console.log("Record response:", record);
      // if (!record || !record.data || record.data.length === 0) {
      //   throw new Error("Failed to create QC record");
      // }

      await window.electronAPI.fetchAPI({
        method: "POST",
        URL: "qc/status",
        body: {
          qcRecordID: record.data[0].ID,
          qcMainID: qcMains?.data[0].qcMain?.ID,
          status: statusRef.current,
          detail: statusRef.current === "pass" ? "" : lastResult.join(",").trim(),
        },
      });
      console.log("Data recorded successfully");
    } catch (error) {
      console.error("Error recording data:", error);
    }
  };

  const refreshData = async () => {
    const data = await fetchQcProjectList();
    setQcProjectList(data);
    console.log("QcProjectList: ", data);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (!qcProject) return;
    fetchScript(qcProject);
  }, [qcProject]);

  return (
    <div className="flex">
      <Navbar />
      <div className="w-full h-full flex flex-col justify-between">
        <Breadcrumb />
        {/* Select Bar */}
        <div className="flex flex-col 2x:flex-row">
          <ul
            className="flex flex-col justify-between items-start pt-5 px-10 gap-2 text-lg font-['Sarabun']
       md:flex-row md:gap-10 md:items-center "
          >
            <li
              className="flex flex-col justify-center items-center text-center whitespace-nowrap
        md:basis-40"
            >
              <h4 className="flex-nowrap text-lg xl:text-xl font-normal font-['Sarabun']">
                Temperature port
                <span className="text-red-600">&nbsp;*</span>
              </h4>
              <div className="text-black text-lg xl:text-xl flex place-content-start w-full lg:mt-3">
                {currentCOMPort ? <h1>{"COM" + currentCOMPort}</h1> : null}
                <button className="ml-5" onClick={openPopup}>
                  {currentCOMPort ? "เปลี่ยน" : "เลือก"}
                </button>
              </div>
              {popup && (
                <Popup onClose={closePopup}>
                  <SerialCommunicationPort />
                </Popup>
              )}
            </li>
            <li className="w-full md:basis-60">
              <div className="flex">
                <p className="">โปรเจคการทดสอบ</p>
                <span className="text-red-600">&nbsp;*</span>
              </div>

              <Select
                className="rounded-sm border"
                options={
                  qcProjectList?.data
                    ? qcProjectList.data
                        //1) filter
                        .filter((project) =>
                          project.qcItemProject?.some(
                            (item) =>
                              item.qcMain?.ID ===
                              "daf844d8-2e39-4f05-8d45-4102b4baf7f4"
                          )
                        )
                        //2) map
                        .map((project) => ({
                          value: project.ID,
                          label: project.projectName,
                        }))
                    : []
                }
                onChange={(e) => {
                  console.log("Selected project:", e?.value);
                  setQcProject(e ? e.value : "");
                }}
              />
            </li>
            <li className="w-full md:flex-grow md:w-auto">
              <div className="flex">
                <p>รหัสสินค้า</p>
                <span className="text-red-600">&nbsp;*</span>
              </div>
              <input
                required
                className="w-full px-2 py-1 rounded-sm border"
                placeholder="รหัสสินค้า"
                onClick={(e: any) => {
                  e.target.value = "";
                  setSerialNumber("");
                }}
                onChange={(e) => {
                  console.log("Serial number input:", e.target.value);
                  setSerialNumber(e.target.value);
                  return;
                }}
              />
            </li>
          </ul>
        </div>
        <div className="w-full h-10 my-4"> </div>

        {/* ----------- Body -------------*/}
        <div
          className="flex mx-[20%] flex-col justify-between gap-10 
      lg:gap-10 lg:mx-[10%]"
        >
          {/* charTemp */}
          <div
            className="flex flex-col py-6 gap-10 w-full items-center justify-between rounded-[10%] bg-gray-100
         lg:flex-row lg:rounded-full lg:px-[5%] lg:py-10 "
          >
            <div
              className="flex flex-row items-center gap-4 text-center
          lg:flex-col"
            >
              <ChartTemp maxTemp={sendData.tempLim} values={temp1} />
              <label className="text-3xl">{temp1} °C</label>
              <label>ตัวที่ 1</label>
            </div>
            <div
              className="flex flex-row items-center gap-4 text-center
          lg:flex-col"
            >
              <ChartTemp maxTemp={sendData.tempLim} values={temp2} />
              <label className="text-3xl ">{temp2} °C </label>
              <label>ตัวที่ 2</label>
            </div>
            <div
              className="flex flex-row items-center gap-4 text-center
          lg:flex-col"
            >
              <ChartTemp maxTemp={sendData.tempLim} values={temp3} />
              <label className="text-3xl ">{temp3} °C</label>
              <label>ตัวที่ 3</label>
            </div>
          </div>

          <div
            className="flex flex-col justify-between gap-10
        lg:flex-row lg:gap-0"
          >
            {/* กระแส อุณหภูมิ */}
            <div
              className="flex flex-col w-full justify-between text-lg 
          lg:items-start lg:pl-10 "
            >
              <div className="flex gap-10">
                <div className="flex items-center gap-4">
                  <p>กระแสไฟฟ้า :</p>
                  <input
                    className="w-25 h-10 text-center border rounded-sm "
                    type="text"
                    value={current ? current : 0}
                    readOnly
                  ></input>
                </div>
                <div className="flex items-center gap-4">
                  <p>เวลา :</p>
                  <input
                    className="w-25 h-10 text-center border rounded-sm "
                    type="text"
                    value={time ? time : 0}
                    readOnly
                  ></input>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex h-auto w-auto items-center justify-center gap-4 ">
                  <p>ผลลัพธ์ : </p>
                  <div
                    className={`w-24 flex py-2 justify-center items-center whitespace-nowrap rounded-lg text-white ${css}`}
                  >
                    {stateName}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p>หมายเหตุ :</p>
                  <p>{reason}</p>
                </div>
              </div>
            </div>

            {/* ปุ่มกดทดสอบ หยุด */}
            <div
              className="flex flex-col h-full items-center gap-10
          lg:items-end"
            >
              <button
                id="test"
                className="w-40 h-15  rounded-lg bg-[#001F3F] hover:cursor-pointer text-xl text-white font-semibold

          md:w-45 md:h-20"
                onClick={clickTest}
              >
                ทดสอบ
              </button>
              <button
                className="w-40 h-15  rounded-lg bg-red-600 hover:cursor-pointer text-xl text-white font-semibold
          md:w-45 md:h-20"
                onClick={() => {
                  setSendData((prev) => ({
                    ...prev,
                    state: "stop",
                  }));
                  return;
                }}
              >
                หยุด
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
