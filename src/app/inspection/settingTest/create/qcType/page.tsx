"use client";

import { useState, useEffect } from "react";
import { localStorageWeb } from "@/utils/localstorage";
import SideBar from "@/components/sidebar";
import Breadcrumb from "@/components/breadcrumb";
import Footer from "@/components/footer";
import SubmitButton from "@/components/submitButton";
import Pagination from "@/components/pagination";
import Swal from "sweetalert2";
import BackButton from "@/components/backButton";
import { Translator } from "@/components/translator";
import { useAuth } from "@/lib/auth/authProvider";

export default function QcType() {
  const auth = useAuth();
  const [qcType, setQcType] = useState<{
    error: boolean;
    message: string;
    data: [
      {
        ID: string;
        name: string;
      }
    ];
    allPage: number;
  } | null>();
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");

  useEffect(() => {
    refreshData();
  }, [auth, page]);

  const fetchQcTypeData = async () => {
    const data = await window.electronAPI.fetchAPI({
      method: "GET",
      URL: `qc/type?limit=5&page=${page}`,
    });
    if (!data) {
      throw new Error("Failed to fetch data");
    }
    return data;
  };

  const refreshData = async () => {
    const qcTypeData = await fetchQcTypeData();
    setQcType(qcTypeData);
  };

  const addQcType = async () => {
    if (name) {
      const data = await window.electronAPI.fetchAPI({
        method: "POST",
        URL: `qc/type`,
        body: {
          name: name
        }
      })
      if (!data) {
        Swal.fire({
          icon: "error",
          title: "ตรวจสอบข้อมูลใหม่อีกครั้ง",
          text: "ชื่อประเภทการทดสอบอาจจะซ้ำกับของที่มีอยู่",
        });
      } else {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "บันทึกข้อมูลเรียบร้อย",
          showConfirmButton: false,
          timer: 1500,
        });
        setName("");
        refreshData();
      }
    } else {
      Swal.fire({
        icon: "error",
        title: "กรอกข้อมูลไม่ครบ",
        text: "กรุณากรอกข้อมูลให้ครบตามช่องที่มี * สีแดง",
      });
    }
  };

  const increasePage = () => {
    setPage(qcType && page >= qcType.allPage ? qcType.allPage : page + 1);
  };
  const decreasePage = () => {
    setPage(page <= 1 ? 1 : page - 1);
  };
  const firstPage = () => {
    setPage(1);
  };
  const lastPage = () => {
    setPage(qcType?.allPage || 1);
  };

  return (
    <>
      <div className="flex w-screen h-screen scroll-smooth">
        <div>
          <SideBar />
        </div>
        <div className="flex flex-col w-full h-full">
          <Breadcrumb />
          <div className="flex flex-col bg-white w-full h-full overflow-y-auto whitespace-nowrap place-items-center pt-[60px]">
            <div className="flex flex-row w-full place-items-center">
              <div
                tabIndex={0}
                onClick={() => {
                  localStorageWeb.setItem("currentUrl", "qc/testSetting/create");
                  window.location.reload();
                }}
                className="ml-5 sm:ml-20 cursor-pointer"
              >
                <BackButton text="ย้อนกลับ" />
              </div>
              <h2 className="ml-5 sm:ml-20 text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl  font-bold ">
                ประเภทการทดสอบ
              </h2>
            </div>
            <div className="flex flex-col w-full mt-10">
              <div className="flex flex-row w-full place-items-center">
                <h2 className="ml-16 lg:ml-40 text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
                  เพิ่มรายการประเภทการทดสอบ
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row place-items-center place-content-center mt-10">
                <label className="mx-20 w-3/4 sm:w-1/2 flex flex-col">
                  <h4 className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-black font-normal ">
                    ชื่อประเภทการทดสอบ
                    <span className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-red-600">&nbsp;*</span>
                  </h4>
                  <input
                    type="text"
                    className="h-[40px] md:h-[50px] w-[90%] xl:w-[600px] border border-black mt-1 lg:ml-10 px-3 text-black text-xl xl:text-2xl font-normal  rounded-md"
                    placeholder="ชื่อประเภทการทดสอบ"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <div className="w-full sm:w-auto flex place-content-end mt-5 sm:mt-0 pr-20">
                  <SubmitButton text="บันทึก" onClick={addQcType} />
                </div>
              </div>
              <div className="flex flex-row w-full place-items-center mt-10">
                <h2 className="ml-16 lg:ml-40 text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
                  รายการประเภทการทดสอบ
                </h2>
              </div>
              <div className="sm:ml-10 sm:mr-20 mt-10 flex flex-col place-content-center border border-[#cecece] rounded-xl">
                <div className="flex place-content-center">
                  <div className="w-[95%] my-[20px]">
                    <div className="text-black font-bold">
                      <div className="bg-[#6494d3] rounded-t-3xl flex flex-row h-10 place-items-center">
                        <div className="w-6/12 text-center text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-bold  text-ellipsis overflow-hidden">
                          ชื่อประเภทการทดสอบ
                        </div>
                        <div className="w-3/12 text-center text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-bold  text-ellipsis overflow-hidden">
                          แก้ไข
                        </div>
                        <div className="w-3/12 text-center text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-bold  text-ellipsis overflow-hidden">
                          ลบ
                        </div>
                      </div>
                    </div>
                    <div className="text-black">
                      {qcType?.data?.map((data) => {
                        return (
                          <div
                            key={data.ID}
                            className="flex flex-row w-full h-12 hover:bg-gray-200"
                          >
                            <div className="w-6/12 text-start text-lg  flex place-items-center">
                              <div className="hidden sm:block">
                                {Translator.type.icon}
                              </div>
                              <h5 className="sm:ml-5 text-ellipsis text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl overflow-hidden">{data.name}</h5>
                            </div>
                            <div className="w-3/12 text-center text-lg  flex place-content-center place-items-center">
                              <button
                                onClick={
                                  () => {
                                    localStorageWeb.setItem("currentUrl", "qc/testSetting/create/qcType/edit");
                                    localStorageWeb.setItem("param", data.ID)
                                    window.location.reload();
                                  }
                                }
                              >
                                {Translator.edit.icon}
                              </button>
                            </div>
                            <div className="w-3/12 text-center text-lg  flex place-content-center place-items-center">
                              <button
                                onClick={() => {
                                  Swal.fire({
                                    title: `ลบประเภทการทดสอบ "${data.name}" จริงหรือไม่`,
                                    text: "หลังจากลบไปแล้วข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบไปด้วย",
                                    icon: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#d33",
                                    cancelButtonColor: "#3085d6",
                                    confirmButtonText: "ตกลง",
                                    cancelButtonText: "ยกเลิก",
                                  }).then(async (result) => {
                                    if (result.isConfirmed) {
                                      await window.electronAPI.fetchAPI({
                                        method: "DELETE",
                                        URL: `qc/type/${data.ID}`
                                      })
                                      await refreshData();
                                      Swal.fire({
                                        title: "ลบข้อมูลสำเร็จ",
                                        text: `ข้อมูลเกี่ยวกับ "${data.name}" ถูกลบสำเร็จ`,
                                        icon: "success",
                                      });
                                    }
                                  });
                                }}
                              >
                                {Translator.delete.icon}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex place-content-center">
                <Pagination
                  currentPage={page}
                  allPage={qcType?.allPage}
                  increase={increasePage}
                  decrease={decreasePage}
                  first={firstPage}
                  last={lastPage}
                />
              </div>
            </div>
            <div className="flex flex-col-reverse place-content-center mt-auto">
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
