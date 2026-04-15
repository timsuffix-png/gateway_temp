"use client";
import { use, useEffect, useState } from "react";
import React from "react";
import { localStorageWeb } from "@/utils/localstorage";
import BackButton from "@/components/backButton";
import Swal from "sweetalert2";
import SideBar from "@/components/sidebar";

import Breadcrumb from "@/components/breadcrumb";
import Footer from "@/components/footer";
import Popup from "@/components/popup";
import CalibrateFile from "@/components/temperature/carlibrateFile";

type QcScriptSeaward = {
  script_1: string;
  script_2: number;
  script_3: number;
  script_4: string;
  script_5: number;
  script_6: number;
  script_7: number;
  script_8: number;
  script_9: number;
  script_10: number;
  script_11: number;
  script_12: number;
  script_13: number;
  script_14: number;
  script_15: number;
  script_16: number;
};

type QcScriptTemperature = {
  TemperatureMin: number;
  TemperatureMax: number;
  CurrentMax: number;
  StartMoment: number;
  EndMoment: number;
  emissivity: number;
  m1: number;
  c1: number;
  m2: number;
  c2: number;
  m3: number;
  c3: number;
  m4: number;
  c4: number;
};

export default function CreateTestSetting() {
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [qcType, setQcType] = useState({ name: "", value: "" });
  const [disAbleClick, setDisAbleClick] = useState(false);
  const [qcTypeList, setQcTypeList] = useState<{
    error: boolean;
    message: string;
    data: [
      {
        ID: string;
        name: string;
      },
    ];
    allPage: number;
  } | null>();

  const defaultScripts: Record<string, any> = {
    seaward: {
      script_1: "",
      script_2: 0,
      script_3: 0,
      script_4: "",
      script_5: 0,
      script_6: 0,
      script_7: 0,
      script_8: 0,
      script_9: 0,
      script_10: 0,
      script_11: 0,
      script_12: 0,
      script_13: 0,
      script_14: 0,
      script_15: 0,
      script_16: 0,
    },
    thermostat: {
      TemperatureMin: 0,
      TemperatureMax: 0,
      CurrentMax: 0,
      StartMoment: 0,
      EndMoment: 0,
      emissivity: 0,
      m1: 0,
      c1: 0,
      m2: 0,
      c2: 0,
      m3: 0,
      c3: 0,
      m4: 0,
      c4: 0,
    },
  };

  const [qcScript, setQcScript] = useState<
    QcScriptSeaward | QcScriptTemperature | null
  >(null);

  const [calibratePopup, setCalibratePopup] = useState(false);
  const openCalibratePopup = () => setCalibratePopup(true);
  const closeCalibratePopup = async () => {
    setCalibratePopup(false);
  };

  const settingSensor = async () => {
    const activeFile = localStorageWeb.getItem("fileCalibrate");
    const emissivity = localStorageWeb.getItem("emissivity");
    if (!activeFile || emissivity === null || emissivity === undefined) return null;
    const res = await window.electronAPI.readCalibrateFile(activeFile);
    if (!res?.status) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: res.text,
      });
      return null;
    }
    if (res?.status) {
      const pairs: Array<{ x: number; y: number }> = Array.isArray(res.text)
        ? res.text
        : [];
      return {
        ...(qcScript as QcScriptTemperature),
        emissivity: Number(emissivity),
        m1: pairs[0]?.x ?? 0.0,
        c1: pairs[0]?.y ?? 0.0,
        m2: pairs[1]?.x ?? 0.0,
        c2: pairs[1]?.y ?? 0.0,
        m3: pairs[2]?.x ?? 0.0,
        c3: pairs[2]?.y ?? 0.0,
        m4: pairs[3]?.x ?? 0.0,
        c4: pairs[3]?.y ?? 0.0,
      };
    }
    return null;
  };

  async function clickCreate() {
    try {
      if (disAbleClick) return;
      setDisAbleClick(true);
      setTimeout(() => {
        setDisAbleClick(false);
      }, 2000);
      const checkSettingSensor = await settingSensor();

      const script =
        qcType.name === "thermostat"
          ? { ...(qcScript as QcScriptTemperature), ...(checkSettingSensor || {}) }
          : (qcScript as QcScriptSeaward);
      if (!name || !qcType.value) {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "กรุณากรอกข้อมูลให้ครบตามช่องที่มี * สีแดง",
        });
        return;
      }

      // @ts-ignore
      const data = await window.electronAPI.fetchAPI({
        method: "POST",
        URL: "qc/main",
        body: {
          qcType: qcType.value,
          testName: name,
          detail: detail,
          script: script,
        },
      });
      if (!data) {
        Swal.fire({
          icon: "error",
          title: "ตรวจสอบข้อมูลใหม่อีกครั้ง",
          text: "ชื่อการทดสอบไม่สามารถซ้ำกับของที่มีอยู่ได้ และข้อมูลที่จำเป็นต้องกรอกกรอกครบเรียบร้อยแล้ว",
        });
      } else {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "บันทึกข้อมูลเรียบร้อย",
          showConfirmButton: false,
          timer: 1500,
        }).then(() => window.location.reload());
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "API Error",
        text:
          error?.response?.data?.message ||
          error?.message ||
          "Unknown error occurred",
      });
    }
  }

  const fetchData = async () => {
    const qcTypeData = await fetchQcTypeList();
    setQcTypeList(qcTypeData);
  };

  const fetchQcTypeList = async () => {
    // @ts-ignore
    var data = await window.electronAPI.fetchAPI({
      method: "GET",
      URL: `qc/type?limit=9999999&page=1`,
    });
    if (!data) {
      throw new Error("Failed to fetch data");
    }
    return data;
  };

  const seawardScript =
    qcType?.name === "seaward" && qcScript
      ? (qcScript as QcScriptSeaward)
      : null;
  const TemperatureScript =
    qcType?.name === "thermostat" && qcScript
      ? (qcScript as QcScriptTemperature)
      : null;

  useEffect(() => {
    fetchData();
  }, []);

  const unitLabel: Record<string, string> = {
    TemperatureMin: "TemperatureMin (°C)",
    TemperatureMax: "TemperatureMax (°C)",
    CurrentMax: "CurrentMax (แอมแปร์)",
    StartMoment: "StartMoment (วินาที)",
    EndMoment: "EndMoment (วินาที)",
  };

  return (
    <div className="flex h-screen">
      <SideBar />
      <div className="w-full h-full flex flex-col">
        <Breadcrumb />
        <div className=" flex flex-col bg-white w-full h-full overflow-y-auto whitespace-nowrap place-items-center pt-10">
          {/* ส่วนหัว: ปุ่มย้อนกลับ, หัวข้อ, ปุ่มสร้าง */}
          <div className="flex flex-col sm:flex-row w-full sm:place-content-between sm:place-items-center">
            <div
              tabIndex={0}
              onClick={() => {
                localStorageWeb.setItem("currentUrl", "qc/testSetting");
                window.location.reload();
              }}
              className="flex ml-5 sm:ml-20 cursor-pointer"
            >
              <BackButton />
            </div>
            <p className="self-center font-bold ml-15 text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl">
              สร้างการทดสอบ
            </p>
            <button
              onClick={clickCreate}
              className="ml-auto mr-5 sm:mr-20 px-10 py-3 text-white  text-lg   rounded-xl bg-[#001F3F]
                         xl:text-xl 
                         2xl:text-2xl
                         hover:cursor-pointer"
            >
              สร้าง
            </button>
          </div>

          {/* กล่องกรอกข้อมูลหลัก */}
          <div className="mx-10 px-10 py-10 w-[90%] flex flex-col gap-8 rounded-xl border-2 mt-[20px]">
            {/* เลือกประเภทการทดสอบ*/}
            <div>
              <div className="flex">
                <p className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl">
                  ประเภทการทดสอบ
                </p>
                <span className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-red-600">
                  &nbsp;*
                </span>
              </div>

              <div className="flex gap-10 items-center">
                {qcType ? (
                  <select
                    value={qcType?.value || ""}
                    onChange={(e) => {
                      setQcType({
                        value: e.target.value,
                        name: e.target.options[e.target.selectedIndex].text,
                      });
                      setQcScript(
                        defaultScripts[
                        e.target.options[e.target.selectedIndex].text
                        ] || null
                      );
                    }}
                    className="w-[80%] px-8 h-10 text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl border rounded-sm"
                  >
                    <option value="" disabled hidden>
                      {" "}
                      เลือกประเภทการทดสอบ
                    </option>
                    {qcTypeList?.data?.map((data) => {
                      return (
                        <option
                          key={data.ID}
                          value={data.ID}
                          data-something={data.name}
                        >
                          {data.name}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <select className="w-[80%] px-8 h-10 text-lg border rounded-sm">
                    <option value="" disabled hidden>
                      {" "}
                      No options
                    </option>
                  </select>
                )}

                <button
                  onClick={() => {
                    localStorageWeb.setItem(
                      "currentUrl",
                      "qc/testSetting/create/qcType"
                    );
                    window.location.reload();
                  }}
                  className="w-auto p-2 text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl rounded-xl bg-gray-200
                           xl:px-2 xl:py-4 
                           hover:cursor-pointer hover:bg-gray-300"
                >
                  จัดการประเภทการทดสอบ
                </button>
              </div>
            </div>

            {/* ชื่อการทดสอบ */}
            <div>
              <div className="flex">
                <p className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl">
                  ชื่อการทดสอบ
                </p>
                <span className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-red-600">
                  &nbsp;*
                </span>
              </div>

              <div className="flex gap-10 items-center">
                <input
                  placeholder="ชื่อการทดสอบ"
                  className="w-full px-8 h-10 text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl border rounded-sm"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* รายละเอียดการทดสอบ */}
            <div>
              {" "}
              <div className="flex">
                <p className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl">
                  รายละเอียด
                </p>
                <span className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-red-600">
                  &nbsp;*
                </span>
              </div>
              <div className="flex gap-10 items-center">
                <input
                  className="w-full px-8 h-10 text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl border rounded-sm"
                  onChange={(e) => setDetail(e.target.value)}
                />
              </div>
            </div>

            {seawardScript && (
              <div className="w-full h-auto rounded-[15px] border border-black flex flex-col mb-5">
                <div className="flex flex-wrap place-content-between">
                  <label className="w-full md:w-[45%] h-auto mx-3 lg:mx-5 my-3 flex flex-col">
                    <h4 className="text-base lg:text-lg xl:text-xl font-normal font-['Sarabun']">
                      Output
                      <span className="text-red-600">&nbsp;*</span>
                    </h4>
                    <input
                      className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                      type="number"
                      maxLength={50}
                      placeholder="Output"
                      value={(qcScript as QcScriptSeaward).script_5}
                      onChange={(e) =>
                        setQcScript({
                          ...(qcScript as QcScriptSeaward),
                          script_5: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </label>
                  <label className="w-full md:w-[45%] h-auto mx-3 lg:mx-5 my-3 flex flex-col">
                    <h4 className="text-base lg:text-lg xl:text-xl font-normal font-['Sarabun']">
                      RampUp
                      <span className="text-red-600">&nbsp;*</span>
                    </h4>
                    <input
                      className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                      type="number"
                      maxLength={50}
                      placeholder="RampUp"
                      value={(qcScript as QcScriptSeaward).script_6}
                      onChange={(e) =>
                        setQcScript({
                          ...(qcScript as QcScriptSeaward),
                          script_6: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </label>
                  <label className="w-full md:w-[45%] h-auto mx-3 lg:mx-5 my-3 flex flex-col">
                    <h4 className="text-base lg:text-lg xl:text-xl font-normal font-['Sarabun']">
                      Dwell
                      <span className="text-red-600">&nbsp;*</span>
                    </h4>
                    <input
                      className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                      type="number"
                      maxLength={50}
                      placeholder="Dwell"
                      value={(qcScript as QcScriptSeaward).script_7}
                      onChange={(e) =>
                        setQcScript({
                          ...(qcScript as QcScriptSeaward),
                          script_7: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </label>
                  <label className="w-full md:w-[45%] h-auto mx-3 lg:mx-5 my-3 flex flex-col">
                    <h4 className="text-base lg:text-lg xl:text-xl font-normal font-['Sarabun']">
                      TimeToZero
                      <span className="text-red-600">&nbsp;*</span>
                    </h4>
                    <input
                      className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                      type="number"
                      maxLength={50}
                      placeholder="TimeToZero"
                      value={(qcScript as QcScriptSeaward).script_8}
                      onChange={(e) =>
                        setQcScript({
                          ...(qcScript as QcScriptSeaward),
                          script_8: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </label>
                  <label className="w-full md:w-[45%] h-auto mx-3 lg:mx-5 my-3 flex flex-col">
                    <h4 className="text-base lg:text-lg xl:text-xl font-normal font-['Sarabun']">
                      LowLimit
                      <span className="text-red-600">&nbsp;*</span>
                    </h4>
                    <input
                      className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                      type="number"
                      maxLength={50}
                      placeholder="LowLimit"
                      value={(qcScript as QcScriptSeaward).script_9}
                      onChange={(e) =>
                        setQcScript({
                          ...(qcScript as QcScriptSeaward),
                          script_9: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </label>
                  <label className="w-full md:w-[45%] h-auto mx-3 lg:mx-5 my-3 flex flex-col">
                    <h4 className="text-base lg:text-lg xl:text-xl font-normal font-['Sarabun']">
                      HighLimit
                      <span className="text-red-600">&nbsp;*</span>
                    </h4>
                    <input
                      className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                      type="number"
                      maxLength={50}
                      placeholder="HighLimit"
                      value={(qcScript as QcScriptSeaward).script_10}
                      onChange={(e) =>
                        setQcScript({
                          ...(qcScript as QcScriptSeaward),
                          script_10: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </label>
                  <label className="w-full md:w-[45%] h-auto mx-3 lg:mx-5 my-3 flex flex-col">
                    <h4 className="text-base lg:text-lg xl:text-xl font-normal font-['Sarabun']">
                      ArcDetect
                      <span className="text-red-600">&nbsp;*</span>
                    </h4>
                    <input
                      className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                      type="number"
                      maxLength={50}
                      placeholder="ArcDetect"
                      value={(qcScript as QcScriptSeaward).script_11}
                      onChange={(e) =>
                        setQcScript({
                          ...(qcScript as QcScriptSeaward),
                          script_11: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </label>
                  <label className="w-full md:w-[45%] h-auto mx-3 lg:mx-5 my-3 flex flex-col">
                    <h4 className="text-base lg:text-lg xl:text-xl font-normal font-['Sarabun']">
                      Channel
                      <span className="text-red-600">&nbsp;*</span>
                    </h4>
                    <input
                      className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                      type="number"
                      maxLength={50}
                      placeholder="Channel"
                      value={(qcScript as QcScriptSeaward).script_12}
                      onChange={(e) =>
                        setQcScript({
                          ...(qcScript as QcScriptSeaward),
                          script_12: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </label>
                  {(qcScript as QcScriptSeaward).script_1?.indexOf("PWRLK") !==
                    -1 && (
                      <>
                        <label className="w-full md:w-[45%] h-auto mx-3 lg:mx-5 my-3 flex flex-col">
                          <h4 className="text-base lg:text-lg xl:text-xl font-normal font-['Sarabun']">
                            LeakageLowLimit
                            <span className="text-red-600">&nbsp;*</span>
                          </h4>
                          <input
                            className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                            type="number"
                            maxLength={50}
                            placeholder="LeakageLowLimit"
                            value={(qcScript as QcScriptSeaward).script_13}
                            onChange={(e) =>
                              setQcScript({
                                ...(qcScript as QcScriptSeaward),
                                script_13: Number(e.target.value),
                              })
                            }
                            required
                          />
                        </label>
                        <label className="w-full md:w-[45%] h-auto mx-3 lg:mx-5 my-3 flex flex-col">
                          <h4 className="text-base lg:text-lg xl:text-xl font-normal font-['Sarabun']">
                            PowerHighLimit
                            <span className="text-red-600">&nbsp;*</span>
                          </h4>
                          <input
                            className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                            type="number"
                            maxLength={50}
                            placeholder="PowerHighLimit"
                            value={(qcScript as QcScriptSeaward).script_14}
                            onChange={(e) =>
                              setQcScript({
                                ...(qcScript as QcScriptSeaward),
                                script_14: Number(e.target.value),
                              })
                            }
                            required
                          />
                        </label>
                        <label className="w-full md:w-[45%] h-auto mx-3 lg:mx-5 my-3 flex flex-col">
                          <h4 className="text-base lg:text-lg xl:text-xl font-normal font-['Sarabun']">
                            PowerLowLimit
                            <span className="text-red-600">&nbsp;*</span>
                          </h4>
                          <input
                            className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                            type="number"
                            maxLength={50}
                            placeholder="PowerLowLimit"
                            value={(qcScript as QcScriptSeaward).script_15}
                            onChange={(e) =>
                              setQcScript({
                                ...(qcScript as QcScriptSeaward),
                                script_15: Number(e.target.value),
                              })
                            }
                            required
                          />
                        </label>
                        <label className="w-full md:w-[45%] h-auto mx-3 lg:mx-5 my-3 flex flex-col">
                          <h4 className="text-base lg:text-lg xl:text-xl font-normal font-['Sarabun']">
                            LeakageHighLimit
                            <span className="text-red-600">&nbsp;*</span>
                          </h4>
                          <input
                            className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                            type="number"
                            maxLength={50}
                            placeholder="LeakageHighLimit"
                            value={(qcScript as QcScriptSeaward).script_16}
                            onChange={(e) =>
                              setQcScript({
                                ...(qcScript as QcScriptSeaward),
                                script_16: Number(e.target.value),
                              })
                            }
                            required
                          />
                        </label>
                      </>
                    )}
                </div>
              </div>
            )}
            {TemperatureScript && (
              <div className="py-4 grid grid-cols-2 rounded-xl border">
                <div className="col-span-2 flex pl-4">
                  <button
                    onClick={openCalibratePopup}
                    className="h-[40px] md:h-[50px] w-auto mt-1 px-3 text-base text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl rounded-md bg-gray-200 hover:bg-gray-300"
                  >
                    ตั้งค่าSensor
                  </button>
                  <span className="text-base lg:text-lg xl:text-xl font-normal font-['Sarabun'] text-red-600">
                    &nbsp;*
                  </span>

                  {calibratePopup && (
                    <Popup onClose={closeCalibratePopup}>
                      <CalibrateFile />
                    </Popup>
                  )}
                </div>
                {[
                  "TemperatureMin",
                  "TemperatureMax",
                  "CurrentMax",
                  "StartMoment",
                  "EndMoment",
                ].map((key, index) => (
                  <div key={index}>
                    <div className="w-full md:w-[45%] h-auto mx-5 md:mx-3 lg:mx-5 my-3 flex flex-col">
                      <h4 className="text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl">
                        {unitLabel[key] ?? key}
                        <span className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-red-600">
                          &nbsp;*
                        </span>
                      </h4>
                      <input
                        className="h-[40px] md:h-[50px] w-full border mt-1 px-3 text-base text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl rounded-md"
                        type="number"
                        value={
                          (qcScript as QcScriptTemperature)[
                          key as keyof QcScriptTemperature
                          ]
                        }
                        onChange={(e) =>
                          setQcScript({
                            ...(qcScript as QcScriptTemperature),
                            [key]: Number(e.target.value),
                          } as QcScriptTemperature)
                        }
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col-reverse place-content-center mt-auto">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
