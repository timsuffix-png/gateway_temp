"use client";
import { localStorageWeb } from "@/utils/localstorage";
import SideBar from "@/components/sidebar";
import Breadcrumb from "@/components/breadcrumb";
import Footer from "@/components/footer";
import BackButton from "@/components/backButton";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/authProvider";

export default function QcDetail() {
  const auth = useAuth();
  const param = localStorageWeb.getItem("param");
  const [record, setRecord] = useState([]);

  const detailTemp: Record<string, Record<string, string>> = {
    ironError: {
      "010": "sensor2มีปัญหาในการอ่านค่า",
      "011": "sensor3มีปัญหาในการอ่านค่า",
      "012": "sensor4มีปัญหาในการอ่านค่า",
      "013": "sensor5มีปัญหาในการอ่านค่า",
      "000": "โปรดตรวจเช็คว่าเครื่องเปิดหรือว่าเสียบปลั๊กหรือยัง",
    },
    detailFailed: {
      "888": "ผ่าน",
      "020": "อุณหภูมิเกินกว่าค่าที่กำหนด",
      "021": "อุณหภูมิต่ำกว่าค่าที่กำหนด",
      "030": "เทอโมสตัดตัดก่อนกำหนด",
      "031": "เทอโมสตัดตัดหลังกำหนด",
      "040": "กระแสไฟฟ้าเกิน",
      "666": "กำลังดำเนินการ",
      "777": "หยุดโดยผู้ใช้งาน",
    },
  };

  const translateCode = (code: string | undefined): string => {
    if (!code) return "-";
    const trimmed = code.trim();
    return detailTemp.detailFailed[trimmed] ??
      detailTemp.ironError[trimmed] ??
      trimmed;
  };

  useEffect(() => {
    refreshData();
  }, [auth]);

  const fetchData = async () => {
    if (!param) {
      console.warn("No serial number (param) found in localStorage.");
      return { data: [] };
    }

    const data = await window.electronAPI.fetchAPI({
      method: "POST",
      URL: `qc/record/findBySerialNumber`,
      body: {
        serialNumber: param,
      },
    });
    if (!data) throw new Error("Failed to fetch data from API.");

    return data;
  };

  const fetchFailedReason = async (qcRecordId: string) => {
    const res = await window.electronAPI.fetchAPI({
      method: "GET",
      URL: `qc/status/type/${qcRecordId}?limit=99999&page=1&type=both`,
    });

    if (!res) throw new Error("Failed to fetchFailedReason data.");

    const has_seaward_data = res.data?.some(
      (item: any) =>
        item.qcMain?.qcType?.name?.toLowerCase() === "seaward" &&
        item.status
    );
    const has_temp_data = res.data?.some(
      (item: any) =>
        item.qcMain?.qcType?.name?.toLowerCase() === "thermostat" &&
        item.status
    );

    const failed_seaward_item = res.data?.filter(
      (item: any) =>
        item.qcMain?.qcType?.name?.toLowerCase() === "seaward" &&
        item.status?.toLowerCase() === "failed"
    );

    const seaward_item = res.data?.find(
      (item: any) => item.qcMain?.qcType?.name?.toLowerCase() === "seaward"
    );

    const thermostat_item = res.data?.find(
      (item: any) => item.qcMain?.qcType?.name?.toLowerCase() === "thermostat"
    );

    const failed_thermostat_item = res.data?.find(
      (item: any) =>
        item.qcMain?.qcType?.name?.toLowerCase() === "thermostat" &&
        item.status?.toLowerCase() === "failed"
    );

    const seaward_details =
      failed_seaward_item?.map((item: any) => item.qcMain?.testName?.trim()) ??
      [];

    const thermostat_details = thermostat_item?.detail?.split(",") ?? [];
    const script_temp = thermostat_item?.qcMain?.qcScript?.script;

    const seaward_script = seaward_item?.qcMain?.qcScript?.script;
    const seaward_result_details = seaward_item?.detail?.split(",") ?? [];

    return {
      seaward:
        failed_seaward_item?.length > 0
          ? "Failed"
          : has_seaward_data
            ? "Passed"
            : "-",
      seaward_failed: seaward_details,
      thermostat: failed_thermostat_item
        ? "Failed"
        : has_temp_data
          ? "Passed"
          : "-",

      thermostat_failed:
        thermostat_details[thermostat_details.length - 1]?.trim(),
      result: {
        time: thermostat_details[9]?.trim(),
        temp0: thermostat_details[0]?.trim(),
        temp1: thermostat_details[1]?.trim(),
        temp2: thermostat_details[2]?.trim(),
        temp3: thermostat_details[3]?.trim(),
      },
      script_temp: script_temp ?? "-",
      seaward_script: seaward_script ?? "-",
      seaward_result: {
        value: seaward_result_details[0]?.trim(),
        status: seaward_result_details[1]?.trim(),
      },
    };
  };

  const refreshData = async () => {
    const data = await fetchData();

    const fetchPromises = data.data.map(async (item: any) => {
      if (item.tag === "qcRecord") {
        try {
          const failedReasonText = await fetchFailedReason(item.ID);
          return {
            ...item,
            status: {
              seaward: failedReasonText.seaward,
              seaward_failed: failedReasonText.seaward_failed,
              seaward_script: failedReasonText.seaward_script,
              seaward_result: failedReasonText.seaward_result,
              thermostat: failedReasonText.thermostat,
              thermostat_failed: failedReasonText.thermostat_failed,
              result: failedReasonText.result,
              script_temp: failedReasonText.script_temp,
            },
          };
        } catch (error) {
          console.error(
            `Error fetching failed reason for ID ${item.ID}:`,
            error
          );
          return { ...item, failedReasonText: "ไม่สามารถดึงข้อมูลสาเหตุได้" };
        }
      }
      return item;
    });

    //รอให้ Promise ทั้งหมดเสร็จสิ้นพร้อมกัน
    const updatedRecords: any = await Promise.all(fetchPromises);
    setRecord(updatedRecords);
  };

  return (
    <>
      <div className="flex w-screen h-screen">
        <div>
          <SideBar />
        </div>
        <div className="flex flex-col w-full h-full">
          <Breadcrumb />
          <div className="flex flex-col bg-white w-full h-full overflow-y-auto whitespace-nowrap place-items-center pt-5">
            <div className="flex flex-row w-full place-items-center">
              <div className="flex place-items-center">
                <div
                  tabIndex={0}
                  onClick={() => {
                    localStorageWeb.setItem("currentUrl", "qc");
                    window.location.reload();
                  }}
                  className="ml-5 sm:ml-20 cursor-pointer"
                >
                  <BackButton text="ย้อนกลับ" />
                </div>
                <h2 className="ml-5 sm:ml-20 text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl  font-bold  text-wrap sm:text-nowrap">
                  รายละเอียดการทดสอบ
                </h2>
              </div>
            </div>
            <div className="flex flex-col w-full sm:w-10/12 md:w-7/12 h-auto">
              {record.length ? (
                record.map((data: any) => {
                  if (data.tag === "qcRecord") {
                    return (
                      <div
                        key={data.ID}
                        className="text-black w-full border border-black mt-5 rounded-2xl pb-5"
                      >
                        <div className="w-full flex px-5 pt-3 pb-2 place-content-between place-items-center bg-[#76a0d6] rounded-t-2xl">
                          <div className="flex w-1/2">
                            {/* /ผลลัพธ์การทดสอบ/ */}
                            <div className="ml-2 overflow-hidden text-ellipsis">
                              {data.statusOverView?.toLowerCase() === "passed" ? (
                                <h3 className="text-[#13A452] bg-[#adff9d] px-2 text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl rounded-xl text-center mr-5 overflow-hidden text-ellipsis">
                                  ผ่าน
                                </h3>
                              ) : data.statusOverView?.toLowerCase() === "failed" ? (
                                <h3 className="text-[#ff0000] bg-[#ffa6a6] px-2 text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl rounded-xl text-center mr-5 overflow-hidden text-ellipsis">
                                  ไม่ผ่าน
                                </h3>
                              ) : data.statusOverView?.toLowerCase() === "in progress" ? (
                                <h3 className="text-[#ff6600] bg-[#ffea8f] px-2 text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl rounded-xl text-center mr-5 overflow-hidden text-ellipsis">
                                  รอการตรวจสอบ
                                </h3>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex place-content-end w-1/2">
                            <h1 className="text-black text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal  overflow-hidden text-ellipsis">
                              {data.updatedAt.split("T")[0] +
                                " " +
                                data.updatedAt.split("T")[1]}
                            </h1>
                          </div>
                        </div>
                        {data?.status?.seaward !== "-" && (
                          <h1 className="text-start pl-[15%] text-black font-normal text-base text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl w-full text-center mt-5">
                            ซีเวิร์ด : {data?.status?.seaward}
                            {data?.status?.seaward === "Failed" && (
                              <label className="whitespace-normal text-black font-normal text-base text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl w-full text-center mt-5 ">
                                {" "}
                                {"("}{" "}
                                {data.status.seaward_failed
                                  .map((item: any) => item.trim())
                                  .join(", ")}
                                {" )"}
                              </label>
                            )}
                          </h1>
                        )}

                        <div className="mt-5 w-full text-center">
                          {data?.status?.thermostat !== "-" && (
                            <h1 className="text-start pl-[15%] text-black font-normal text-base text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">
                              เทอร์โมสตัท ({data.qcProject?.projectName}) : {data?.status?.thermostat}
                              {data?.status?.thermostat === "Failed" && (
                                <span className="whitespace-normal text-black font-normal text-base text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">
                                  {" ( "}
                                  {translateCode(data.status.thermostat_failed)}
                                  {" )"}
                                </span>
                              )}
                            </h1>
                          )}

                          {data?.status?.thermostat !== "-" && (
                            <div className=" pl-[17%] flex gap-[10%] items-start">
                              <div className=" text-start whitespace-normal text-black font-normal text-sm xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl mt-5">
                                <h1 className="mb-2 underline font-bold">ค่าที่กำหนด (เทอร์โมสตัท)</h1>
                                <h1>เวลาเริ่มต้น : {data.status?.script_temp?.StartMoment ?? "-"}</h1>
                                <h1>เวลาสิ้นสุด : {data.status?.script_temp?.EndMoment ?? "-"}</h1>
                                <h1>อุณหภูมิต่ำสุด : {data.status?.script_temp?.TemperatureMin ?? "-"}</h1>
                                <h1>อุณหภูมิสูงสุด : {data.status?.script_temp?.TemperatureMax ?? "-"}</h1>
                              </div>
                              <div className=" text-start  whitespace-normal text-black font-normal text-sm xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl mt-5">
                                <h1 className="mb-2 underline font-bold">ผลลัพธ์</h1>
                                <h1>เวลา : {data?.status?.result?.time ?? "-"} วินาที</h1>
                                <h1>อุณหภูมิขวา : {data?.status?.result?.temp0 ?? "-"} องศา</h1>
                                <h1>อุณหภูมิซ้าย : {data?.status?.result?.temp1 ?? "-"} องศา</h1>
                                <h1>อุณหภูมิบน : {data?.status?.result?.temp2 ?? "-"} องศา</h1>
                                <h1>อุณหภูมิกลาง : {data?.status?.result?.temp3 ?? "-"} องศา</h1>
                              </div>
                            </div>
                          )}

                          {data?.status?.seaward !== "-" && (
                            <div className=" pl-[17%] flex gap-[10%] items-start border-t border-gray-100 mt-5 pt-5">
                              <div className=" text-start whitespace-normal text-black font-normal text-sm xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl mt-2">
                                <h1 className="mb-2 underline font-bold">ค่าที่กำหนด (ซีเวิร์ด)</h1>
                                <h1>Output : {data.status?.seaward_script?.script_5 ?? "-"}</h1>
                                <h1>RampUp : {data.status?.seaward_script?.script_6 ?? "-"}</h1>
                                <h1>Dwell : {data.status?.seaward_script?.script_7 ?? "-"}</h1>
                                <h1>High Limit : {data.status?.seaward_script?.script_10 ?? "-"}</h1>
                              </div>
                              <div className=" text-start  whitespace-normal text-black font-normal text-sm xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl mt-2">
                                <h1 className="mb-2 underline font-bold">ผลลัพธ์</h1>
                                <h1>ค่าที่ได้ : {data?.status?.seaward_result?.value ?? "-"}</h1>
                                <h1>สถานะ : {data?.status?.seaward_result?.status ?? "-"}</h1>
                              </div>
                            </div>
                          )}
                        </div>

                        <h1 className="text-black font-normal  text-base text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl w-full text-center mt-5">
                          ทดสอบโดย
                        </h1>
                        <h1 className="text-black font-normal  text-base text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl w-full text-center mt-5">
                          ผู้ใช้: {data.testBy.name + " " + data.testBy.surname}
                        </h1>
                      </div>
                    );
                  } else if (data.tag === "repair") {
                    return (
                      <div
                        key={data.ID}
                        className="text-black w-full border border-black mt-5 rounded-2xl pb-5"
                      >
                        <div className="w-full flex px-5 pt-3 pb-2 place-content-between place-items-center bg-[#f3856a] rounded-t-2xl">
                          <h1 className="text-black  text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal">
                            ซ่อมแซม
                          </h1>
                          <div className="flex overflow-hidden text-ellipsis">
                            <h1 className="text-black text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal  overflow-hidden text-ellipsis">
                              {data.createdAt.split("T")[0] +
                                " " +
                                data.createdAt.split("T")[1]}
                            </h1>
                          </div>
                        </div>
                        <h1 className="text-black font-normal  text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl w-full text-center mt-5">
                          ซ่อมแซมโดย
                        </h1>
                        <h1 className="text-black font-normal  text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl w-full text-center mt-5">
                          ผู้ใช้:{" "}
                          {data.repairBy.name + " " + data.repairBy.surname}
                        </h1>
                      </div>
                    );
                  } else {
                    null;
                  }
                })
              ) : (
                <h1 className="text-black w-full text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal  text-center">
                  ไม่มีข้อมูล
                </h1>
              )}
            </div>
            <div className="flex flex-col-reverse place-content-center mt-[50px]">
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
