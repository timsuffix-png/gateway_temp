"use client";
import React, { useEffect, useRef, useState } from "react";
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
import SideBar from "@/components/sidebar";

import Breadcrumb from "@/components/breadcrumb";
import { useAuth } from "@/lib/auth/authProvider";
import { abort } from "process";

const statusMap: Record<string, { css: string; stateName: string }> = {
  stop: { css: "bg-red-600", stateName: "STOP" },
  on: { css: "bg-yellow-600", stateName: "IN PROCESS" },
  Passed: { css: "bg-green-600", stateName: "PASS" },
  Failed: { css: "bg-red-400", stateName: "FAIL" },
};

export default function MainTempTest() {
  // Selectbar
  const [serialNumber, setSerialNumber] = useState(""); //รหัสสินค้า 99202509250014055801
  const [currentCOMPort, setCurrentCOMPort] = useState<number | null>();
  const [popup, setPopup] = useState(false);
  const openPopup = () => setPopup(true);
  const closePopup = async () => {
    setPopup(false);
    setCurrentCOMPort(Number(await window.electronAPI.getPort()));
  };

  const auth = useAuth();

  const [qcProject, setQcProject] = useState(""); //qcProject ID
  const [temp1, setTemp1] = useState<number | 0>(0); //หันหน้าเข้าแผ่นเตารีด ขวา
  const [temp2, setTemp2] = useState<number | 0>(0); //หันหน้าเข้าแผ่นเตารีด ซ้าย
  const [temp3, setTemp3] = useState<number | 0>(0); //บนหน้าเตารีด
  const [ambient1, setAmbient1] = useState<number | 0>(0);
  const [ambient2, setAmbient2] = useState<number | 0>(0);
  const [ambient3, setAmbient3] = useState<number | 0>(0);
  const [current, setCurrent] = useState<number | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [status, setStatus] = useState<string>(""); //สถานะการทดสอบ
  const { css, stateName } = statusMap[status] || {
    css: "bg-gray-400",
    stateName: "OFF",
  };
  const [detail, setDetail] = useState("");
  const ironImageRef = useRef<any | null>(null);
  const [sendData, setSendData] = useState<{
    state: string;
    tempLim: number;
    currentLim: number;
    startMoment: number;
    endMoment: number;
  }>({
    state: "on",
    tempLim: 0.0,
    currentLim: 0.0,
    startMoment: 0.0,
    endMoment: 0.0,
  });

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
      },
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
          },
        ];
      },
    ];
    allPage: number;
  } | null>();

  const recordedRef = useRef(false);
  const qcMainsRef = useRef(qcMains);
  const qcProjectRef = useRef(qcProject);
  const serialNumberRef = useRef(serialNumber);
  const statusRef = useRef(status);

  useEffect(() => {
    if (ironImageRef.current) {
      const loadImage = async () => {
        const logo = await window.electronAPI.loadImg("iron-plate.png");

        ironImageRef.current.src = logo;
      };
      loadImage();
    }
  }, [auth]);

  //ฟังชั่นรับserial Data
  const handleSerialData = (data: string) => {
    const parts = data.split(",");
    if (parts.length > 10) {
      setTemp1(parseFloat(parts[0]));
      setTemp2(parseFloat(parts[1]));
      setTemp3(parseFloat(parts[2]));
      setAmbient1(parseFloat(parts[3]));
      setAmbient2(parseFloat(parts[4]));
      setAmbient3(parseFloat(parts[5]));
      setTime(parseInt(parts[7]));
      setCurrent(parseFloat(parts[8]));
      setStatus(parts[9].trim());
      setDetail(parts[10].trim());

      if (
        parts[9].trim() === "Passed" ||
        (parts[9].trim() === "Failed" && parts[10] !== "Please check iron.")
      ) {
        if (!recordedRef.current) {
          recordedRef.current = true;
          recordData(parts);
        }
      }
    }
  };


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
    const rawData = await window.electronAPI.fetchAPI({
      method: "GET",
      URL: `qc/itemProject/${idProject}`,
    });
    setQcMains(rawData);
    if (!rawData) {
      throw new Error("Failed to fetch data");
    }
    const format_script = await rawData?.data?.find(
      (data: any) =>
        //api kla
        data.qcMain?.qcType?.ID === "96accb41-4eae-43af-853b-bedcae094c10"
      //api  P' Bright
      // data.qcMain?.qcType?.ID === "796a7f7f-3aa0-4e8a-98b1-b6f7dbeeb600"
    );


    setSendData((prev) => ({
      ...prev,
      tempLim: format_script?.qcMain?.qcScript?.script?.TemperatureMax,
      currentLim: format_script?.qcMain?.qcScript?.script?.CurrentMax,
      startMoment: format_script?.qcMain?.qcScript?.script?.StartMoment,
      endMoment: format_script?.qcMain?.qcScript?.script?.EndMoment,
    }));
  };

  const clickTest = async () => {
    recordedRef.current = false;
    if (!currentCOMPort) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "กรุณาเลือกพอร์ตให้ถูกต้อง",
      });
      return;
    }

    if (!qcProject) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "กรุณาเลือกโปรเจกต์การทดสอบ",
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

    try {
      const checkSerialNumber = async () => {
        const response = await window.electronAPI.fetchAPI({
          method: "GET",
          URL: `construct/${serialNumber}`,
        });
        if (!response) {
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: "รหัสสินค้าไม่ถูกต้อง",
          });
          return;
        }
      };
      checkSerialNumber();

      await window.electronAPI.openPort(String(currentCOMPort));
      await window.electronAPI.writeData({
        port: currentCOMPort,
        command: { ...sendData, state: "on" },
      });
 
    } catch (error) {
      const errStr = String(error ?? "").trim(); // รับรองเป็น string
      if (currentCOMPort !== null && errStr.includes("Access denied")) {
        Swal.fire({
          icon: "warning",
          title: "เกิดข้อผิดพลาด",
          text: `พอร์ต ${currentCOMPort} กำลังเชื่อมต่อกับที่อื่น`,
        });
      }
      return;
    }
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
      const record = await window.electronAPI.fetchAPI({
        method: "POST",
        URL: "qc/record",
        body: {
          qcProjectID: qcProjectRef.current,
          //99202509160012055701
          serialNumber: serialNumberRef.current,
          testBy: auth.user.data.ID,
        },
      });
      if (!record) {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาดทางซอฟเเวร์",
          text: "ไม่สามารถบันทึกค่าได้",
        });
        return;
      }
      const res = await window.electronAPI.fetchAPI({
        method: "POST",
        URL: "qc/status",
        body: {
          qcRecordID: record.data[0].ID,
          qcMainID: qcMainsRef.current?.data[0]?.qcMain?.ID,
          result: statusRef.current,
          status: statusRef.current,
          detail: lastResult.join(",").trim(),
        },
      });
    } catch (error) {
      console.error("Error recording data:", error);
    }
  };

  const refreshData = async () => {
    const data = await fetchQcProjectList();
    setQcProjectList(data);
  };

  useEffect(() => {
    qcProjectRef.current = qcProject;
  }, [qcProject]);
  useEffect(() => {
    serialNumberRef.current = serialNumber;
  }, [serialNumber]);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    qcMainsRef.current = qcMains;
  }, [qcMains]);

  useEffect(() => {
    // ส่ง callback เดิมเข้าไปทั้งตอน on และตอน remove)
    const serialDataListener = handleSerialData;

    window.electronAPI.onSerialData(serialDataListener); // เมื่อมีข้อมูล Serial Data เข้ามา ให้เรียกใช้ฟังก์ชัน handleSerialData
    // window.electronAPI.onSerialPortClosed(serialPortClosedListener); // เมื่อพอร์ตถูกปิด ให้เรียกใช้ฟังก์ชัน handlePortClosed

    // ล้าง listener เมื่อ component ถูก unmount หรือเมื่อdependencyเปลี่ยน
    // return () => {
    //   window.electronAPI.removeSerialDataListener(serialDataListener);
    //   window.electronAPI.removeSerialPortClosedListener(
    //     serialPortClosedListener
    //   );
    // };
  }, []);

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (!qcProject) return;
    fetchScript(qcProject);
  }, [qcProject]);

  return (
    <div className="flex h-screen">
      <SideBar />
      <div className="flex flex-col w-full h-full overflow-y-auto">
        <Breadcrumb />
        <div className="flex flex-col bg-white w-full h-full overflow-y-auto whitespace-nowrap place-items-center">
          {/* Select Bar */}
          <div className="w-full flex flex-col 2x:flex-row">
            <ul
              className=" flex flex-col justify-between items-start pt-5 px-10 gap-2 text-lg 
            md:flex-row md:gap-10 md:items-center"
            >
              <li
                className="flex flex-col justify-center items-center text-center whitespace-nowrap
             md:basis-40"
              >
                <h4 className="flex-nowrap pb-3 text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
                  Temperature port
                  <span className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-red-600">
                    &nbsp;*
                  </span>
                </h4>
                <div className="text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl flex place-content-start w-full lg:mt-3">
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
              <li className="w-full text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl md:basis-60">
                <div className="flex pb-3">
                  <p className="">โปรเจกต์การทดสอบ</p>
                  <span className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-red-600">
                    &nbsp;*
                  </span>
                </div>

                <Select
                  className="rounded-sm border"
                  // options={
                  //   qcProjectList?.data
                  //     ? qcProjectList.data
                  //         //1) filter
                  //         .filter((project) =>
                  //           project.qcItemProject?.some(
                  //             (item) =>
                  //               item.qcMain?.ID ===
                  //               //api kla
                  //               "497da269-cdd3-419c-8f7d-f14a8a07e1f0"
                  //               //api P' Bright
                  //               // "23c853da-0d4d-4605-b242-0c13731dfb29"
                  //           )
                  //         )
                  //         //2) map
                  //         .map((project) => ({
                  //           value: project.ID,
                  //           label: project.projectName,
                  //         }))
                  //     : []
                  // }
                  options={qcProjectList?.data?.map((data) => ({
                    value: data.ID,
                    label: data.projectName,
                  }))}
                  onChange={(e) => {
                    setQcProject(e ? e.value : "");
                  }}
                />
              </li>
              <li className="w-full md:flex-grow md:w-auto text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl">
                <div className="flex pb-3">
                  <p>รหัสสินค้า</p>
                  <span className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-red-600">
                    &nbsp;*
                  </span>
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
            className="w-full flex px-[20%] flex-col justify-between gap-10 
          lg:gap-10 lg:px-[10%] lg:my-2"
          >
            {/* charTemp */}
            <div className="relative self-center pt-10">
              <img
                className="w-[240px] h-[370px]"
                ref={ironImageRef}
                alt="logo"
              />

              <div>
                <div>
                  {/* บน */}
                  <div className="absolute absolute left-1/2 -translate-x-1/2 -top-7 text-[#C7AD00] text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl  font-bold">
                    {temp3} °C
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 top-3 text-gray-900 text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-semibold">
                    อุณหภูมิรอบข้าง : {ambient3} °C
                  </div>
                  <div className="flex flex-col absolute left-25 top-20 items-center">
                    <label className="text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl text-[#fbff00ff]">
                      บน
                    </label>

                    <svg
                      className="h-6 w-6"
                      fill="#fbff00ff"
                      viewBox="0 0 512 512"
                      xmlns="http://www.w3.org/2000/svg"
                      stroke="#ff0000"
                    >
                      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                      <g
                        id="SVGRepo_tracerCarrier"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></g>
                      <g id="SVGRepo_iconCarrier">
                        <path d="M256 56c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m0-48C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 168c-44.183 0-80 35.817-80 80s35.817 80 80 80 80-35.817 80-80-35.817-80-80-80z"></path>
                      </g>
                    </svg>
                  </div>
                </div>

                <div className="absolute right-58 top-50 text-[#00A385] text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl  font-bold">
                  {temp2} °C
                </div>
                <div className="absolute right-58 top-58 text-gray-900 text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl  font-semibold">
                  อุณหภูมิรอบข้าง : {ambient1} °C
                </div>
                <div className="flex flex-col absolute left-6 top-55 items-center">
                  <label className="text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl text-[#00ffd0ff]">
                    ซ้าย
                  </label>
                  <svg
                    className="h-6 w-6"
                    fill="#00ffd0ff"
                    viewBox="0 0 512 512"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="#ff0000"
                  >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <path d="M256 56c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m0-48C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 168c-44.183 0-80 35.817-80 80s35.817 80 80 80 80-35.817 80-80-35.817-80-80-80z"></path>
                    </g>
                  </svg>
                </div>
              </div>

              <div>
                <div className="absolute left-58 top-50 text-[#FF5CB6] text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl  font-bold">
                  {temp1} °C
                </div>
                <div className="absolute  left-58 top-58 text-gray-900 text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-semibold">
                  อุณหภูมิรอบข้าง : {ambient1} °C
                </div>
                <div className="flex flex-col absolute right-5 top-55 items-center">
                  <label className="text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl text-[#FFB8DF]">
                    ขวา
                  </label>

                  <svg
                    className="h-6 w-6"
                    fill="#FFB8DF"
                    viewBox="0 0 512 512"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="#ff0000"
                  >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <path d="M256 56c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m0-48C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 168c-44.183 0-80 35.817-80 80s35.817 80 80 80 80-35.817 80-80-35.817-80-80-80z"></path>
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            {/* 
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
            </div> */}
            <div
              className="flex flex-col justify-between gap-10
              lg:flex-row lg:gap-0"
              >
              {/* กระแส อุณหภูมิ */}
              <div
                className="flex flex-col w-full h-full gap-10 justify-between  text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl
                lg:items-start lg:pl-10"
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
                <div className="flex flex-col gap-10 items-start">
                  <div className="flex h-auto w-auto items-center justify-center gap-4 ">
                    <p>ผลลัพธ์ : </p>
                    <div
                      className={`w-auto flex px-4 py-2 justify-center items-center whitespace-nowrap rounded-lg text-white ${css}`}
                    >
                      {stateName}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p>หมายเหตุ :</p>
                    <p>{detail}</p>
                  </div>
                </div>
              </div>

              {/* ปุ่มกดทดสอบ หยุด */}
              <div
                className="flex flex-col h-full w-full items-center gap-[9%]
                lg:items-end"
              >
                <button
                  id="test"
                  className="w-[50%] h-[80%] text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl rounded-lg bg-[#001F3F] hover:cursor-pointer text-xl text-white font-semibold"
                  onClick={clickTest}
                >
                  ทดสอบ
                </button>
                <button
                  className="w-[50%] h-[80%] text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl rounded-lg bg-red-600 hover:cursor-pointer text-xl text-white font-semibold"
                  onClick={async () => {
                    await window.electronAPI.writeData({
                      port: currentCOMPort,
                      command: { ...sendData, state: "stop" },
                    });
                  }}
                >
                  หยุด
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse place-content-center mt-auto ">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
