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
  const [temp1, setTemp1] = useState<number | 0>(0);
  const [temp2, setTemp2] = useState<number | 0>(0);
  const [temp3, setTemp3] = useState<number | 0>(0);
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

  //ฟังชั่นรับserial Data
  const handleSerialData = (data: string) => {
    const parts = data.split(",");
    if (parts.length > 10) {
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

  //ฟังก์ชันปิดพอต
  const handlePortClosed = () => {
    console.log("Serial port ถูกปิดแล้ว"); // แจ้งสถานะ port ถูกปิด
    // TODO: อัพเดต UI แจ้งเตือนผู้ใช้ว่า port ปิดแล้ว เช่น ปิดปุ่ม หรือแสดงข้อความ
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
      // หาที่ "qcType": {
      //     "ID": "796a7f7f-3aa0-4e8a-98b1-b6f7dbeeb600",
      //     "name": "temperature"
      //   },
      (data: any) =>
        //api kla
        data.qcMain?.qcType?.ID === "96accb41-4eae-43af-853b-bedcae094c10"
      //api  P' Bright
      // data.qcMain?.qcType?.ID === "796a7f7f-3aa0-4e8a-98b1-b6f7dbeeb600"
    );
    console.log(
      "StartMoment : " + format_script?.qcMain?.qcScript?.script?.StartMoment
    );
    console.log(
      "EndMoment : " + format_script?.qcMain?.qcScript?.script?.EndMoment
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
        text: "กรุณาเลือกโปรเจ็คการทดสอบ",
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
      checkSerialNumber()

      await window.electronAPI.openPort(String(currentCOMPort));
      const data = await window.electronAPI.writeData({
        port: currentCOMPort,
        command: { ...sendData, state: "on" },
      });
      console.log(
        "State command : " + JSON.stringify({ ...sendData, state: "on" })
      );
      console.log("Data  : " + data);
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
      console.log("Record status response : ", res);
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
    const serialPortClosedListener = handlePortClosed;

    window.electronAPI.onSerialData(serialDataListener); // เมื่อมีข้อมูล Serial Data เข้ามา ให้เรียกใช้ฟังก์ชัน handleSerialData
    window.electronAPI.onSerialPortClosed(serialPortClosedListener); // เมื่อพอร์ตถูกปิด ให้เรียกใช้ฟังก์ชัน handlePortClosed

    // ล้าง listener เมื่อ component ถูก unmount หรือเมื่อdependencyเปลี่ยน
    return () => {
      window.electronAPI.removeSerialDataListener(serialDataListener);
      window.electronAPI.removeSerialPortClosedListener(
        serialPortClosedListener
      );
    };
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
                <h4 className="flex-nowrap text-lg xl:text-xl font-normal ">
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
            className="w-full flex px-[20%] flex-col justify-between gap-10 
          lg:gap-10 lg:px-[10%] lg:my-2"
          >
            {/* charTemp */}
            <div
              className="w-full flex flex-col py-6 gap-5 w-full items-center justify-between rounded-[10%] bg-gray-100
            lg:flex-row lg:rounded-full lg:px-[5%] lg:py-[4%] "
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

            {/* df */}
            <div
              className="flex flex-col py-6 gap-5 w-full items-center justify-between rounded-[10%] bg-gray-100
            lg:flex-row lg:rounded-full lg:px-[5%] lg:py-[4%] "
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
                    <p>{detail}</p>
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
          <div className="flex flex-col-reverse place-content-center">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
