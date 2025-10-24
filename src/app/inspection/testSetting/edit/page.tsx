"use client";

import SideBar from "@/components/sidebar";
import Breadcrumb from "@/components/breadcrumb";
import Footer from "@/components/footer";
import { useState, useEffect } from "react";
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
  TemperatureMax: number;
  CurrentMax: number;
  StartMoment: number;
  EndMoment: number;
};
export default function EditTestSetting() {
  const auth = useAuth();
  const param = localStorage.getItem("param");

  const [qcType, setQcType] = useState({ name: "", value: "" });

  const [qcScript, setQcScript] = useState<
    QcScriptSeaward | QcScriptTemperature | null
  >(null);

  //  const [qcScriptTemp, setQcScriptTemp] = useState({
  //     TemperatureMax: 0,
  //     CurrentMax: 0,
  //     StartMoment: 0,
  //     EndMoment: 0,
  //   });
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    fetchData();
  }, [auth]);

  const editTest = async () => {
    if (!name || !qcType.value) {
      Swal.fire({
        icon: "error",
        title: "กรอกข้อมูลไม่ครบ",
        text: "กรุณากรอกข้อมูลให้ครบตามช่องที่มี * สีแดง",
      });
    }
      var data = await window.electronAPI.fetchAPI({
        method: "PATCH",
        URL: `qc/main/${param}`,
        body: {
          testName: name,
          detail: detail,
          script: qcScript,
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
    return data;
  };

  const seawardScript =
    qcType?.name === "seaward" && qcScript
      ? (qcScript as QcScriptSeaward)
      : null;
  const TemperatureScript =
    qcType?.name === "temperature" && qcScript
      ? (qcScript as QcScriptTemperature)
      : null;

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
                        {(qcScript as QcScriptSeaward).script_1?.indexOf(
                          "PWRLK"
                        ) !== -1 && (
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
                    <div className="grid grid-cols-2 rounded-xl border">
                      {Object.keys(qcScript as QcScriptTemperature).map(
                        (key, index) => (
                          <div key={index}>
                            <label className="w-full md:w-[45%] h-auto mx-5 md:mx-3 lg:mx-5 my-3 flex flex-col">
                              <h4 className="text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl">
                                {key}
                                <span className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-red-600">
                                  &nbsp;*
                                </span>
                              </h4>
                              <input
                                className="h-[40px] md:h-[50px] w-full border mt-1 px-3 text-base text-xl  2xl:text-2xl 3xl:text-3xl 4xl:text-4xl rounded-md"
                                type="number"
                                placeholder=""
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
                            </label>
                          </div>
                        )
                      )}
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
