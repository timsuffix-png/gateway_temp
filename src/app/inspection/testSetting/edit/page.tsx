"use client";

import SideBar from "@/components/sidebar";
import Breadcrumb from "@/components/breadcrumb";
import Footer from "@/components/footer";
import { useState, useEffect } from "react";
import { localStorageWeb } from "@/utils/localstorage";
import Popup from "@/components/popup";
import CalibrateFile from "@/components/temperature/carlibrateFile";
import BackButton from "@/components/backButton";
import SubmitButton from "@/components/submitButton";
import Swal from "sweetalert2";
import { useAuth } from "@/lib/auth/authProvider";

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
  m1: number;
  c1: number;
  m2: number;
  c2: number;
  k1: number;
  x01: number;
  m3: number;
  c3: number;
  m4: number;
  c4: number;
  k2: number;
  x02: number;
};
export default function EditTestSetting() {
  const auth = useAuth();
  const [param, setParam] = useState<string | null>(null);

  const [qcType, setQcType] = useState({ name: "", value: "" });

  const [qcScript, setQcScript] = useState<
    QcScriptSeaward | QcScriptTemperature | null
  >(null);
  const [disAbleClick, setDisAbleClick] = useState(false);
  const [calibratePopup, setCalibratePopup] = useState(false);
  const openCalibratePopup = () => setCalibratePopup(true);
  const closeCalibratePopup = () => {
    setCalibratePopup(false);
  };

  const handleCalibrateSave = (data: Partial<QcScriptTemperature>) => {
    setQcScript((prev) => {
      return {
        ...(prev as QcScriptTemperature),
        ...data,
      } as QcScriptTemperature;
    });
  };

  //  const [qcScriptTemp, setQcScriptTemp] = useState({
  //     TemperatureMax: 0,
  //     CurrentMax: 0,
  //     StartMoment: 0,
  //     EndMoment: 0,
  //   });
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");

  async function calibrateScript() {
    const activeFile = localStorageWeb.getItem("fileCalibrate");
    if (!activeFile) return qcScript;
    const res = await window.electronAPI.readCalibrateFile(activeFile);
    if (!res?.status) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: res.text,
      });
      return qcScript;
    }

    const pairs: Array<{ x: number; y: number }> = Array.isArray(res.text)
      ? res.text
      : [];

    return {
      ...(qcScript as QcScriptTemperature),
      m1: pairs[0]?.x ?? 0.0,
      c1: pairs[0]?.y ?? 0.0,
      m2: pairs[1]?.x ?? 0.0,
      c2: pairs[1]?.y ?? 0.0,
      k1: pairs[2]?.x ?? 0.0,
      x01: pairs[2]?.y ?? 0.0,
      m3: pairs[3]?.x ?? 0.0,
      c3: pairs[3]?.y ?? 0.0,
      m4: pairs[4]?.x ?? 0.0,
      c4: pairs[4]?.y ?? 0.0,
      k2: pairs[5]?.x ?? 0.0,
      x02: pairs[5]?.y ?? 0.0,
    } as QcScriptTemperature;
  }

  const editTest = async () => {
    if (disAbleClick) return;
    setDisAbleClick(true);
    setTimeout(() => {
      setDisAbleClick(false);
    }, 2000);
    if (!name || !qcType.value) {
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: "กรอกข้อมูลไม่ครบ",
        text: "กรุณากรอกข้อมูลให้ครบตามช่องที่มี * สีแดง",
      });
      return;
    }

    // ตรวจสอบ script fields สำหรับ seaward
    if (seawardScript) {
      const s = qcScript as QcScriptSeaward;
      const hasPwrlk = s.script_1?.indexOf("PWRLK") !== -1;
      if (
        !s.script_5 || !s.script_6 || !s.script_7 || !s.script_8 ||
        !s.script_9 || !s.script_10 || !s.script_11 || !s.script_12 ||
        (hasPwrlk && (!s.script_13 || !s.script_14 || !s.script_15 || !s.script_16))
      ) {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: "กรอกข้อมูลไม่ครบ",
          text: "กรุณากรอกข้อมูลให้ครบตามช่องที่มี * สีแดง",
        });
        return;
      }
    }

    // ตรวจสอบ script fields สำหรับ thermostat
    if (TemperatureScript) {
      const t = qcScript as QcScriptTemperature;
      if (!t.TemperatureMax || !t.CurrentMax || !t.StartMoment || !t.EndMoment) {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: "กรอกข้อมูลไม่ครบ",
          text: "กรุณากรอกข้อมูลให้ครบตามช่องที่มี * สีแดง",
        });
        return;
      }
    }

    const isThermo = qcType.name.toLowerCase() === "thermostat";

    const checkSettingSensor = isThermo ? await calibrateScript() : null;
    const script =
      isThermo
        ? { ...(qcScript as any), ...(checkSettingSensor as any) }
        : qcScript;

    var data = await window.electronAPI.fetchAPI({
      method: "PATCH",
      URL: `qc/main/${param}`,
      body: {
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
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const fetchData = async () => {
    const qcMainData = await fetchQcMainData();
    setQcType({
      name: qcMainData.data.qcType.name,
      value: qcMainData.data.qcType.ID,
    });
    console.log("Initial qcType (Edit):", qcMainData.data.qcType);
    setName(qcMainData.data.testName);
    setDetail(qcMainData.data.detail);
    setQcScript(qcMainData.data.qcScript?.script);
  };

  const fetchQcMainData = async () => {
    const data = await window.electronAPI.fetchAPI({
      method: "GET",
      URL: `qc/main/${param}`,
    });
    if (!data) {
      throw new Error("Failed to fetch data");
    }
    console.log("fetchQcMainData : ", data);
    return data;
  };

  const seawardScript =
    qcType?.name === "seaward" && qcScript
      ? (qcScript as QcScriptSeaward)
      : null;
  const isTemperature = qcType?.name?.toLowerCase() === "thermostat";
  const TemperatureScript =
    isTemperature && qcScript
      ? (qcScript as QcScriptTemperature)
      : null;
  useEffect(() => {
    if (typeof window !== "undefined") {
      setParam(localStorageWeb.getItem("param"));
    }
  }, []);

  useEffect(() => {
    if (param) {
      fetchData();
    }
  }, [auth, param]);
  return (
    <>
      <div className="flex w-screen h-screen">
        <div>
          <SideBar />
        </div>
        <div className="flex flex-col w-full h-full">
          <Breadcrumb />
          <div className="flex flex-col bg-white w-full h-full overflow-y-auto whitespace-nowrap place-items-center pt-[20px]">
            <div className="flex flex-row w-full place-items-center">
              <div className="flex place-items-center">
                <div
                  tabIndex={0}
                  onClick={() => {
                    localStorage.setItem("currentUrl", "qc/testSetting");
                    window.location.reload();
                  }}
                  className="ml-5 sm:ml-20 cursor-pointer"
                >
                  <BackButton text="ย้อนกลับ" />
                </div>
                <h2 className="ml-5 sm:ml-20 text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-bold font-['Sarabun'] text-wrap sm:text-nowrap">
                  แก้ไขข้อมูลการทดสอบ
                </h2>
              </div>
              <div className="hidden md:flex w-full place-content-end mr-20">
                <SubmitButton text="บันทึก" onClick={editTest} />
              </div>
            </div>
            <div className="bg-white w-full flex flex-col place-items-center place-content-center">
              <div className="w-full sm:w-[90%] mt-5 flex flex-col place-items-center place-content-between border-black border-2 rounded-[15px]">
                <div className="mx-10 my-10 w-[90%] flex flex-col text-black text-xl font-['Sarabun']">
                  <div className="w-full h-auto flex">
                    <div className="w-full h-full flex">
                      <label className="w-[100%]">
                        <h4 className="text-base lg:text-lg xl:text-xl font-normal font-['Sarabun']">
                          ประเภทการทดสอบ
                        </h4>
                        <select
                          className="h-[40px] md:h-[50px] w-full pl-5 border border-black mt-1 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md hover:cursor-not-allowed"
                          defaultValue={qcType?.name}
                          disabled
                        >
                          <option value={qcType?.name}>{qcType?.name}</option>
                        </select>
                      </label>
                    </div>
                  </div>
                  <div className="w-full h-auto my-2 flex text-black">
                    <label className="w-[100%]">
                      <h4 className="text-base lg:text-lg xl:text-xl font-normal font-['Sarabun']">
                        ชื่อการทดสอบ
                        <span className="text-red-600">&nbsp;*</span>
                      </h4>
                      <input
                        className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                        type="text"
                        maxLength={100}
                        placeholder="ชื่อการทดสอบ"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </label>
                  </div>
                  <div className="w-full h-auto my-2 flex text-black">
                    <div className="w-full h-full">
                      <label className="w-auto h-auto">
                        <h4 className="text-base lg:text-lg xl:text-xl font-normal font-['Sarabun']">
                          รายละเอียด
                        </h4>
                        <textarea
                          className="bg-white border border-black w-full h-[150px] min-h-[50px] max-h-[150px] rounded-lg text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] px-2 py-2"
                          maxLength={200}
                          value={detail}
                          onChange={(e) => setDetail(e.target.value)}
                        ></textarea>
                      </label>
                    </div>
                  </div>
                  {seawardScript && (
                    <div className="w-full h-auto rounded-[15px] border border-black flex flex-col mb-5">
                      <div className="flex flex-wrap place-content-between">
                        <label className="w-full md:w-[45%] h-auto mx-3 lg:mx-5 my-3 flex flex-col">
                          <h4 className="text-base lg:text-lg xl:text-xl font-normal font-['Sarabun']">
                            แรงดัน/กระแสทดสอบ
                            <span className="text-red-600">&nbsp;*</span>
                          </h4>
                          <input
                            className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                            type="number"
                            maxLength={50}
                            placeholder="แรงดัน/กระแสทดสอบ"
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
                            เวลาเพิ่มแรงดัน (วินาที)
                            <span className="text-red-600">&nbsp;*</span>
                          </h4>
                          <input
                            className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                            type="number"
                            maxLength={50}
                            placeholder="เวลาเพิ่มแรงดัน (วินาที)"
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
                            เวลาทดสอบ (วินาที)
                            <span className="text-red-600">&nbsp;*</span>
                          </h4>
                          <input
                            className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                            type="number"
                            maxLength={50}
                            placeholder="เวลาทดสอบ (วินาที)"
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
                            เวลาลดเป็นศูนย์ (วินาที)
                            <span className="text-red-600">&nbsp;*</span>
                          </h4>
                          <input
                            className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                            type="number"
                            maxLength={50}
                            placeholder="เวลาลดเป็นศูนย์ (วินาที)"
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
                            ค่าจำกัดต่ำสุด
                            <span className="text-red-600">&nbsp;*</span>
                          </h4>
                          <input
                            className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                            type="number"
                            maxLength={50}
                            placeholder="ค่าจำกัดต่ำสุด"
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
                            ค่าจำกัดสูงสุด
                            <span className="text-red-600">&nbsp;*</span>
                          </h4>
                          <input
                            className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                            type="number"
                            maxLength={50}
                            placeholder="ค่าจำกัดสูงสุด"
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
                            ตรวจจับประกายไฟ
                            <span className="text-red-600">&nbsp;*</span>
                          </h4>
                          <input
                            className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                            type="number"
                            maxLength={50}
                            placeholder="ตรวจจับประกายไฟ"
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
                            ช่อง
                            <span className="text-red-600">&nbsp;*</span>
                          </h4>
                          <input
                            className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                            type="number"
                            maxLength={50}
                            placeholder="ช่อง"
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
                        {(qcScript as QcScriptSeaward).script_1?.indexOf(
                          "PWRLK"
                        ) !== -1 && (
                            <>
                              <label className="w-full md:w-[45%] h-auto mx-3 lg:mx-5 my-3 flex flex-col">
                                <h4 className="text-base lg:text-lg xl:text-xl font-normal font-['Sarabun']">
                                  กระแสรั่วไหลต่ำสุด
                                  <span className="text-red-600">&nbsp;*</span>
                                </h4>
                                <input
                                  className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                                  type="number"
                                  maxLength={50}
                                  placeholder="กระแสรั่วไหลต่ำสุด"
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
                                  กำลังไฟสูงสุด
                                  <span className="text-red-600">&nbsp;*</span>
                                </h4>
                                <input
                                  className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                                  type="number"
                                  maxLength={50}
                                  placeholder="กำลังไฟสูงสุด"
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
                                  กำลังไฟต่ำสุด
                                  <span className="text-red-600">&nbsp;*</span>
                                </h4>
                                <input
                                  className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                                  type="number"
                                  maxLength={50}
                                  placeholder="กำลังไฟต่ำสุด"
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
                                  กระแสรั่วไหลสูงสุด
                                  <span className="text-red-600">&nbsp;*</span>
                                </h4>
                                <input
                                  className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base lg:text-lg xl:text-2xl font-normal font-['Sarabun'] rounded-md"
                                  type="number"
                                  maxLength={50}
                                  placeholder="กระแสรั่วไหลสูงสุด"
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
                    <div className="grid grid-cols-2 rounded-xl border">
                      <div className="col-span-2 flex pl-4 py-2">
                        <button
                          onClick={openCalibratePopup}
                          className="h-[40px] md:h-[50px] w-auto mt-1 px-3 text-base text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl rounded-md bg-gray-200 hover:bg-gray-300"
                        >
                          ตั้งค่าเซนเซอร์
                        </button>
                        {calibratePopup && (
                          <Popup onClose={closeCalibratePopup}>
                            <CalibrateFile onSave={handleCalibrateSave} onClose={closeCalibratePopup} />
                          </Popup>
                        )}
                      </div>
                      {[
                        { key: "TemperatureMin", label: "อุณหภูมิขั้นต่ำ (องศาเซลเซียส)" },
                        { key: "TemperatureMax", label: "อุณหภูมิสูงสุด (องศาเซลเซียส)" },
                        { key: "CurrentMax", label: "กระแสสูงสุด (A)" },
                        { key: "StartMoment", label: "เวลาเริ่มจับค่า (วินาที)" },
                        { key: "EndMoment", label: "เวลาสิ้นสุดจับค่า (วินาที)" },
                      ].map(({ key, label }, index) => (
                        <div key={index}>
                          <label className="w-full md:w-[45%] h-auto mx-5 md:mx-3 lg:mx-5 my-3 flex flex-col">
                            <h4 className="text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl">
                              {label}
                              <span className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-red-600">
                                &nbsp;*
                              </span>
                            </h4>
                            <input
                              className="h-[40px] md:h-[50px] w-full border mt-1 px-3 text-base text-xl  2xl:text-2xl 3xl:text-3xl 4xl:text-4xl rounded-md"
                              type="number"
                              min={0}
                              value={TemperatureScript[key as keyof QcScriptTemperature] ?? 0}
                              onChange={(e) =>
                                setQcScript({
                                  ...(qcScript as QcScriptTemperature),
                                  [key]: Math.max(0, Number(e.target.value)),
                                } as QcScriptTemperature)
                              }
                              required
                            />
                          </label>
                        </div>
                      ))}
                      {[
                        "m1",
                        "c1",
                        "m2",
                        "c2",
                        "k1",
                        "x01",
                        "m3",
                        "c3",
                        "m4",
                        "c4",
                        "k2",
                        "x02",
                      ].map((key, index) => (
                        <div key={index}>
                          <label className="w-full md:w-[45%] h-auto mx-5 md:mx-3 lg:mx-5 my-3 flex flex-col">
                            <h4 className="text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl">
                              {key}
                            </h4>
                            <input
                              className="h-[40px] md:h-[50px] w-full border mt-1 px-3 text-base text-xl  2xl:text-2xl 3xl:text-3xl 4xl:text-4xl rounded-md bg-gray-100"
                              type="number"
                              value={TemperatureScript[key as keyof QcScriptTemperature] ?? 0}
                              disabled
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex md:hidden w-full place-content-end mr-20 mt-5">
                    <SubmitButton text="บันทึก" onClick={editTest} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse place-content-center">
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
