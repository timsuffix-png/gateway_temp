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
    ironInterrupt: {
      "010": "เซนเซอร์ ขวา มีปัญหาในการอ่านค่า",
      "011": "เซนเซอร์ ซ้าย มีปัญหาในการอ่านค่า",
      "012": "เซนเซอร์ กลาง มีปัญหาในการอ่านค่า",
      "013": "เซนเซอร์ บน มีปัญหาในการอ่านค่า",
      "000": "โปรดตรวจเช็คว่าเครื่องเปิดหรือว่าเสียบปลั๊กหรือยัง",
      "666": "กำลังดำเนินการ",
      "777": "หยุดโดยผู้ใช้งาน",
    },

    detailFailed: {
      "888": "ผ่าน",
      "020": "อุณหภูมิเกินกว่าค่าที่กำหนด",
      "021": "อุณหภูมิต่ำกว่าค่าที่กำหนด",
      "030": "เทอโมสตัดตัดก่อนกำหนด",
      "031": "เทอโมสตัดตัดหลังกำหนด",
      "040": "กระแสไฟฟ้าเกิน"
    },
  };

  const translateStatus = (status: string | undefined): string => {
    if (status === "Passed") return "ผ่าน";
    if (status === "Failed") return "ไม่ผ่าน";
    return status ?? "-";
  };

  const translateCode = (code: string | undefined): string => {
    if (!code) return "-";
    const trimmed = code.trim();
    return (
      detailTemp.detailFailed[trimmed] ??
      detailTemp.ironInterrupt[trimmed] ??
      trimmed
    );
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

  const defaultFailedReason = {
    seaward: "-",
    seaward_failed: [],
    seaward_items: [] as any[],
    thermostat: "-",
    thermostat_failed: undefined,
    result: {
      time: undefined,
      temp0: undefined,
      temp1: undefined,
      temp2: undefined,
      temp3: undefined,
    },
    script_temp: "-",
    seaward_script: "-",
    seaward_result: { value: undefined, status: undefined },
  };

  const seawardReasonTH: Record<string, string> = {
    "result is above upper limit": "ค่าเกินขีดจำกัดสูงสุด",
    "result is below lower limit": "ค่าต่ำกว่าขีดจำกัดต่ำสุด",
    "open circuit": "วงจรเปิด",
    "short circuit": "วงจรลัด",
    "test timeout": "หมดเวลาทดสอบ",
    "hardware fault": "ฮาร์ดแวร์ขัดข้อง",
    "over-current detected": "กระแสเกินกำหนด",
    "abort key was pressed": "หยุดโดยผู้ใช้งาน",
  };

  const parseSeawardResultItem = (item: any) => {
    const detail_parts = item.detail?.split(",") ?? [];
    const testName = (item.qcMain?.testName || "").trim();
    const script = item.qcMain?.qcScript?.script;

    let seaward_value = "-";
    let seaward_status = item.status || "-";
    let time: string | undefined;
    let machine_code: string | undefined;
    let measurement_1: string | undefined;
    let measurement_2: string | undefined;
    let has_raw = false;

    const first_element_raw = detail_parts[0]?.trim();
    const is_raw_data = first_element_raw && /^\d+(\.\d+)?[sS]$/.test(first_element_raw);

    if (is_raw_data) {
      has_raw = true;
      time = first_element_raw;
      machine_code = detail_parts[1]?.trim();
      measurement_1 = detail_parts[2]?.trim();
      const last_element = detail_parts[detail_parts.length - 1]?.trim();
      const second_to_last = detail_parts[detail_parts.length - 2]?.trim();

      if (last_element === "Passed" || last_element === "Failed") {
        seaward_status = last_element;
        seaward_value = detail_parts.slice(1, -1).join(", ").trim();
        if (detail_parts.length > 3) measurement_2 = detail_parts.slice(3, -1).join(", ").trim();
      } else if (second_to_last === "Failed") {
        seaward_status = "Failed";
        seaward_value = last_element || "-";
        if (detail_parts.length > 3) measurement_2 = detail_parts.slice(3, -2).join(", ").trim();
      } else {
        seaward_status = item.status || "Failed";
        seaward_value = item.detail?.trim() || "-";
        if (detail_parts.length > 3) measurement_2 = detail_parts.slice(3).join(", ").trim();
      }
    } else {
      if (detail_parts.length > 1) {
        const last_element = detail_parts[detail_parts.length - 1]?.trim();
        const first_element = detail_parts[0]?.trim();
        if (last_element === "Passed" || last_element === "Failed") {
          seaward_value = detail_parts.slice(0, -1).join(", ").trim();
          seaward_status = last_element;
        } else if (first_element === "Passed" || first_element === "Failed") {
          seaward_value = detail_parts.slice(1).join(", ").trim();
          seaward_status = first_element;
        } else {
          seaward_value = item.detail?.trim() || "-";
          seaward_status = item.status || "Failed";
        }
      } else {
        seaward_value = item.detail?.trim() || "-";
        seaward_status = item.status || "-";
      }
    }

    return {
      testName,
      status: seaward_status,
      script,
      result: { value: seaward_value, status: seaward_status, time, machine_code, measurement_1, measurement_2, has_raw, testName },
    };
  };

  const fetchFailedReason = async (qcRecordId: string) => {
    const res = await window.electronAPI.fetchAPI({
      method: "GET",
      URL: `qc/status/type/${qcRecordId}?limit=99999&page=1&type=both`,
    });

    if (!res || res.error) {
      console.warn(`fetchFailedReason: no data for record ${qcRecordId}`, res);
      return defaultFailedReason;
    }

    const has_seaward_data = res.data?.some(
      (item: any) =>
        item.qcMain?.qcType?.name?.toLowerCase() === "seaward" && item.status,
    );
    const has_temp_data = res.data?.some(
      (item: any) =>
        item.qcMain?.qcType?.name?.toLowerCase() === "thermostat" &&
        item.status,
    );

    const failed_seaward_item = res.data?.filter(
      (item: any) =>
        item.qcMain?.qcType?.name?.toLowerCase() === "seaward" &&
        item.status?.toLowerCase() === "failed",
    );

    const seaward_item = res.data?.find(
      (item: any) => item.qcMain?.qcType?.name?.toLowerCase() === "seaward",
    );

    const thermostat_item = res.data?.find(
      (item: any) => item.qcMain?.qcType?.name?.toLowerCase() === "thermostat",
    );

    const failed_thermostat_item = res.data?.find(
      (item: any) =>
        item.qcMain?.qcType?.name?.toLowerCase() === "thermostat" &&
        item.status?.toLowerCase() === "failed",
    );

    const seaward_details =
      failed_seaward_item?.map((item: any) => item.qcMain?.testName?.trim()) ??
      [];

    const thermostat_details = thermostat_item?.detail?.split(",") ?? [];
    const script_temp = thermostat_item?.qcMain?.qcScript?.script;

    // ใช้ script/detail ของ test ที่ Failed ก่อน ถ้าไม่มีค่อย fallback ไปอันแรกที่เจอ
    const seaward_display_item =
      failed_seaward_item?.length > 0 ? failed_seaward_item[0] : seaward_item;
    const seaward_script = seaward_display_item?.qcMain?.qcScript?.script;
    const seaward_result_details = seaward_display_item?.detail?.split(",") ?? [];

    const seaward_items = (res.data ?? [])
      .filter((item: any) => item.qcMain?.qcType?.name?.toLowerCase() === "seaward")
      .map((item: any) => parseSeawardResultItem(item));

    return {
      seaward:
        failed_seaward_item?.length > 0
          ? "Failed"
          : has_seaward_data
            ? "Passed"
            : "-",
      seaward_failed: seaward_details,
      seaward_items,
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
      seaward_result: (() => {
        let seaward_value = "-";
        let seaward_status = seaward_display_item?.status || "-";
        let time = undefined;
        let machine_code = undefined;
        let measurement_1 = undefined;
        let measurement_2 = undefined;
        let has_raw = false;
        const testName = seaward_display_item?.qcMain?.testName || "";

        const first_element_raw = seaward_result_details[0]?.trim();
        const is_raw_data = first_element_raw && /^\d+(\.\d+)?[sS]$/.test(first_element_raw);

        if (is_raw_data) {
          has_raw = true;
          time = first_element_raw;
          machine_code = seaward_result_details[1]?.trim();
          measurement_1 = seaward_result_details[2]?.trim();

          const last_element = seaward_result_details[seaward_result_details.length - 1]?.trim();
          const second_to_last = seaward_result_details[seaward_result_details.length - 2]?.trim();

          if (last_element === "Passed" || last_element === "Failed") {
            seaward_status = last_element;
            seaward_value = seaward_result_details.slice(1, -1).join(", ").trim();
            if (seaward_result_details.length > 3) {
              measurement_2 = seaward_result_details.slice(3, -1).join(", ").trim();
            }
          } else if (second_to_last === "Failed") {
            seaward_status = "Failed";
            seaward_value = last_element;
            if (seaward_result_details.length > 3) {
              measurement_2 = seaward_result_details.slice(3, -2).join(", ").trim();
            }
          } else {
            seaward_status = seaward_display_item?.status || "Failed";
            if (seaward_status === "Failed" && seaward_display_item?.result) {
              seaward_value = seaward_display_item.result;
            } else {
              seaward_value = seaward_display_item?.detail?.trim() || "-";
            }
            if (seaward_result_details.length > 3) {
              measurement_2 = seaward_result_details.slice(3).join(", ").trim();
            }
          }
        } else {
          if (seaward_result_details.length > 1) {
            const last_element = seaward_result_details[seaward_result_details.length - 1]?.trim();
            const first_element = seaward_result_details[0]?.trim();
            if (last_element === "Passed" || last_element === "Failed") {
              seaward_value = seaward_result_details.slice(0, -1).join(", ").trim();
              seaward_status = last_element;
            } else if (first_element === "Passed" || first_element === "Failed") {
              seaward_value = seaward_result_details.slice(1).join(", ").trim();
              seaward_status = first_element;
            } else {
              seaward_value = seaward_display_item?.detail?.trim() || "-";
              seaward_status = seaward_display_item?.status || "Failed";
            }
          } else {
            if (seaward_display_item?.status === "Failed" && seaward_display_item?.result) {
              seaward_value = seaward_display_item.result;
            } else {
              seaward_value = seaward_display_item?.detail?.trim() || "-";
            }
            seaward_status = seaward_display_item?.status || "-";
          }
        }

        return {
          value: seaward_value,
          status: seaward_status,
          time,
          machine_code,
          measurement_1,
          measurement_2,
          has_raw,
          testName,
        };
      })(),
    };
  };

  const fetchRemaining = async (qcRecordId: string): Promise<any[]> => {
    try {
      const res = await window.electronAPI.fetchAPI({
        method: "GET",
        URL: `qc/record/remainingQc/${qcRecordId}`,
      });
      if (!res || res.error) return [];
      return res.data ?? [];
    } catch {
      return [];
    }
  };

  const refreshData = async () => {
    const data = await fetchData();

    const fetchPromises = data.data.map(async (item: any) => {
      if (item.tag === "qcRecord") {
        try {
          const [failedReasonText, remaining] = await Promise.all([
            fetchFailedReason(item.ID),
            item.statusOverView?.toLowerCase() === "in progress"
              ? fetchRemaining(item.ID)
              : Promise.resolve([]),
          ]);
          return {
            ...item,
            status: {
              seaward: failedReasonText.seaward,
              seaward_failed: failedReasonText.seaward_failed,
              seaward_items: failedReasonText.seaward_items,
              seaward_script: failedReasonText.seaward_script,
              seaward_result: failedReasonText.seaward_result,
              thermostat: failedReasonText.thermostat,
              thermostat_failed: failedReasonText.thermostat_failed,
              result: failedReasonText.result,
              script_temp: failedReasonText.script_temp,
              remaining,
            },
          };
        } catch (error) {
          console.error(
            `Error fetching failed reason for ID ${item.ID}:`,
            error,
          );
          return {
            ...item,
            status: {
              seaward: "-",
              seaward_failed: [],
              seaward_items: [],
              seaward_script: "-",
              seaward_result: { value: undefined, status: undefined },
              thermostat: "-",
              thermostat_failed: undefined,
              result: {
                time: undefined,
                temp0: undefined,
                temp1: undefined,
                temp2: undefined,
                temp3: undefined,
              },
              script_temp: "-",
              remaining: [],
            },
          };
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
                              {(() => {
                                // ถ้ามี Failed อย่างน้อย 1 test → ไม่ผ่านทันที (ไม่ต้องรอครบ)
                                const hasFailed =
                                  data.status?.seaward === "Failed" ||
                                  data.status?.thermostat === "Failed";

                                if (hasFailed) {
                                  return (
                                    <h3 className="text-[#ff0000] bg-[#ffa6a6] px-2 text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl rounded-xl text-center mr-5 overflow-hidden text-ellipsis">
                                      ไม่ผ่าน
                                    </h3>
                                  );
                                }
                                // ผ่านได้ต่อเมื่อ DB บอก Passed (ครบทุก test และผ่านหมด)
                                if (data.statusOverView?.toLowerCase() === "passed") {
                                  return (
                                    <h3 className="text-[#13A452] bg-[#adff9d] px-2 text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl rounded-xl text-center mr-5 overflow-hidden text-ellipsis">
                                      ผ่าน
                                    </h3>
                                  );
                                }
                                // ยังทดสอบไม่ครบ
                                return (
                                  <h3 className="text-[#ff6600] bg-[#ffea8f] px-2 text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl rounded-xl text-center mr-5 overflow-hidden text-ellipsis">
                                    รอการตรวจสอบ
                                  </h3>
                                );
                              })()}
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

                        {/* แสดง test ที่ยังรอทดสอบ */}
                        {data.statusOverView?.toLowerCase() === "in progress" &&
                          data.status?.remaining?.length > 0 && (
                            <div className="mx-[15%] mt-4 mb-2 px-4 py-3 bg-[#fff8e1] border border-[#ffcc00] rounded-xl">
                              <h1 className="text-[#cc7700] font-bold text-sm xl:text-base 2xl:text-lg mb-2">
                                ⏳ รอการทดสอบ ({data.status.remaining.length} รายการ)
                              </h1>
                              <ul className="list-disc list-inside space-y-1">
                                {data.status.remaining.map((test: any) => (
                                  <li
                                    key={test.ID}
                                    className="text-black text-sm xl:text-base 2xl:text-lg whitespace-normal"
                                  >
                                    <span className="font-medium">{test.testName}</span>
                                    {test.qcType?.name && (
                                      <span className="ml-2 text-gray-500 text-xs xl:text-sm">
                                        ({test.qcType.name === "seaward" ? "ซีเวิร์ด" : test.qcType.name === "thermostat" ? "เทอร์โมสตัท" : test.qcType.name})
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                        {data?.status?.seaward !== "-" && (
                          <h1 className="text-black font-normal text-base text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl w-full text-center mt-5">
                            ซีเวิร์ด : {translateStatus(data?.status?.seaward)}
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
                            <h1 className="text-center px-[8%] text-black font-normal text-base text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">
                              เทอร์โมสตัท ({data.qcProject?.projectName}) :{" "}
                              {translateStatus(data?.status?.thermostat)}
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
                            <div className="px-[8%] flex gap-6 items-start">
                              <div className="flex-1 text-start whitespace-normal text-black font-normal text-sm xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl mt-5">
                                <h1 className="mb-2 underline font-bold">
                                  ค่าที่กำหนด (เทอร์โมสตัท)
                                </h1>
                                <h1>
                                  เวลาเริ่มต้น :{" "}
                                  {data.status?.script_temp?.StartMoment ?? "-"}
                                </h1>
                                <h1>
                                  เวลาสิ้นสุด :{" "}
                                  {data.status?.script_temp?.EndMoment ?? "-"}
                                </h1>
                                <h1>
                                  อุณหภูมิต่ำสุด :{" "}
                                  {data.status?.script_temp?.TemperatureMin ??
                                    "-"}
                                </h1>
                                <h1>
                                  อุณหภูมิสูงสุด :{" "}
                                  {data.status?.script_temp?.TemperatureMax ??
                                    "-"}
                                </h1>
                              </div>
                              <div className="flex-1 text-start whitespace-normal text-black font-normal text-sm xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl mt-5">
                                <h1 className="mb-2 underline font-bold">
                                  ผลลัพธ์
                                </h1>
                                <h1>
                                  เวลา : {data?.status?.result?.time ?? "-"}{" "}
                                  วินาที
                                </h1>
                                <h1>
                                  อุณหภูมิขวา :{" "}
                                  {data?.status?.result?.temp0 ?? "-"} องศาเซลเซียส
                                </h1>
                                <h1>
                                  อุณหภูมิซ้าย :{" "}
                                  {data?.status?.result?.temp1 ?? "-"} องศาเซลเซียส
                                </h1>
                                <h1>
                                  อุณหภูมิบน :{" "}
                                  {data?.status?.result?.temp2 ?? "-"} องศาเซลเซียส
                                </h1>
                                <h1>
                                  อุณหภูมิกลาง :{" "}
                                  {data?.status?.result?.temp3 ?? "-"} องศาเซลเซียส
                                </h1>
                              </div>
                            </div>
                          )}

                          {data?.status?.seaward_items?.map((sw: any, idx: number) => {
                            const tn = sw.testName.toUpperCase();
                            let val1Label = "โค้ด / แรงดันทดสอบ";
                            let val2Label = "ค่าที่วัดได้";
                            let val1Unit = "";
                            let val2Unit = "";

                            let scriptOutputLabel = "แรงดัน/กระแสทดสอบ";
                            let scriptOutputUnit = "";
                            let scriptHighLimitLabel = "ค่าจำกัดสูงสุด";
                            let scriptHighLimitUnit = "";

                            if (tn.includes("EBOND")) {
                              val1Label = "กระแสทดสอบ"; val2Label = "ความต้านทานสายดิน";
                              val1Unit = " แอมแปร์"; val2Unit = " มิลลิโอห์ม";
                              scriptOutputLabel = "กระแสทดสอบ"; scriptOutputUnit = " มิลลิแอมแปร์";
                              scriptHighLimitLabel = "ความต้านทานสูงสุด"; scriptHighLimitUnit = " มิลลิโอห์ม";
                            } else if (tn.includes("DCIR") || tn.includes("INSULATION")) {
                              val1Label = "แรงดันทดสอบ"; val2Label = "ความต้านทานฉนวน";
                              val1Unit = " โวลต์"; val2Unit = " เมกะโอห์ม";
                              scriptOutputLabel = "แรงดันทดสอบ"; scriptOutputUnit = " โวลต์";
                              scriptHighLimitLabel = "ความต้านทานฉนวนสูงสุด"; scriptHighLimitUnit = " เมกะโอห์ม";
                            } else if (tn.includes("HIPOT")) {
                              val1Label = "แรงดันทดสอบ"; val2Label = "กระแสรั่วไหล";
                              val1Unit = " โวลต์"; val2Unit = " มิลลิแอมแปร์";
                              scriptOutputLabel = "แรงดันทดสอบ"; scriptOutputUnit = " โวลต์";
                              scriptHighLimitLabel = "กระแสรั่วไหลสูงสุด"; scriptHighLimitUnit = " มิลลิแอมแปร์";
                            } else if (tn.includes("LEAKAGE") || tn.includes("POWER")) {
                              val1Label = "แรงดันทดสอบ"; val2Label = "กระแสรั่วไหล";
                              val1Unit = " โวลต์"; val2Unit = " มิลลิแอมแปร์";
                              scriptOutputLabel = "แรงดันทดสอบ"; scriptOutputUnit = " โวลต์";
                              scriptHighLimitLabel = "กระแสรั่วไหลสูงสุด"; scriptHighLimitUnit = " มิลลิแอมแปร์";
                            }

                            let val1Display = sw.result.machine_code;
                            if (tn.includes("EBOND") && val1Display && !isNaN(Number(val1Display))) {
                              const numVal = Number(val1Display);
                              if (numVal > 100) val1Display = (numVal / 1000).toFixed(2);
                            }

                            return (
                              <div key={idx} className="px-[8%] flex gap-6 items-start border-t border-gray-100 mt-5 pt-5">
                                <div className="flex-1 text-start whitespace-normal text-black font-normal text-sm xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl mt-2">
                                  <h1 className="mb-2 underline font-bold">
                                    ค่าที่กำหนด ({sw.testName})
                                  </h1>
                                  <h1>{scriptOutputLabel} : {sw.script?.script_5 ?? "-"}{scriptOutputUnit}</h1>
                                  <h1>เวลาเพิ่มแรงดัน : {sw.script?.script_6 ?? "-"} วินาที</h1>
                                  <h1>เวลาทดสอบ : {sw.script?.script_7 ?? "-"} วินาที</h1>
                                  <h1>{scriptHighLimitLabel} : {sw.script?.script_10 ?? "-"}{scriptHighLimitUnit}</h1>
                                </div>
                                <div className="flex-1 text-start whitespace-normal text-black font-normal text-sm xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl mt-2">
                                  <h1 className="mb-2 underline font-bold">ผลลัพธ์</h1>
                                  <h1>
                                    สถานะ :{" "}
                                    <span className={sw.result.status === "Passed" ? "text-green-600 font-bold" : sw.result.status === "Failed" ? "text-red-600 font-bold" : ""}>
                                      {translateStatus(sw.result.status)}
                                    </span>
                                  </h1>
                                  {sw.result.status === "Failed" && sw.result.value && sw.result.value !== "-" && !sw.result.value.includes(",") && (
                                    <h1>หมายเหตุ : {seawardReasonTH[sw.result.value.trim()] ?? sw.result.value}</h1>
                                  )}
                                  {sw.result.has_raw && (
                                    <>
                                      {sw.result.time && <h1>เวลาทดสอบ : {sw.result.time.replace(/[sS]$/, '')} วินาที</h1>}
                                      {val1Display && <h1>{val1Label} : {val1Display}{val1Unit}</h1>}
                                      {sw.result.measurement_1 && <h1>{val2Label} : {sw.result.measurement_1}{val2Unit}</h1>}
                                      {sw.result.measurement_2 && <h1>ค่าเพิ่มเติม : {sw.result.measurement_2}</h1>}
                                    </>
                                  )}
                                  {!sw.result.has_raw && sw.result.status !== "Failed" && (
                                    <h1>ค่าที่ได้ : {sw.result.value ?? "-"}</h1>
                                  )}
                                </div>
                              </div>
                            );
                          })}
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
