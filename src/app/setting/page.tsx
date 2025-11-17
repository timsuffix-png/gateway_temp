"use client";

import SideBar from "@/components/sidebar";
import Breadcrumb from "@/components/breadcrumb";
import Footer from "@/components/footer";
import { useState, useEffect, useRef } from "react";
import Select, { MultiValue } from "react-select";
import SubmitButton from "@/components/submitButton";
import Swal from "sweetalert2";
import { useAuth } from "@/lib/auth/authProvider";
import ButtonBlue from "@/components/buttonBlue";

export default function Setting() {
  const auth = useAuth();
  const role = auth?.user?.data?.role;
  const imageRef = useRef<any | null>(null);

  const fileInputRef = useRef<any | null>(null);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [tel, setTel] = useState("");
  const [duty, setDuty] =
    useState<MultiValue<{ value: string; label: string } | null>>();
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [dateEmployment, setDateEmployment] = useState("");

  const roles = [
    { value: "manager", label: "ผู้ดูแลระบบ" },
    { value: "storager", label: "ผู้ดูแลคลัง" },
    { value: "tester", label: "ผู้ทดสอบ" },
    { value: "worker", label: "แรงงาน" },
    { value: "admin", label: "แอดมิน" },
    { value: "finance", label: "การเงิน" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchUserData();
      setUsername(data?.data?.username);
      setName(data?.data?.name);
      setSurname(data?.data?.surname);
      setEmail(data?.data?.email);
      setGender(data?.data?.gender);
      setTel(data?.data?.phone);
      setDuty(data?.data?.role);
      setAddress(data?.data?.address);
      setBirthday(data?.data?.birthday);
      setDateEmployment(data?.data?.dateEmployment);
    };
    fetchData();
    if (imageRef.current) {
      const loadImage = async () => {
        const profile = await window.electronAPI.getImg({
          method: "GET",
          URL: `user/upload/profile/${
            auth?.user?.data?.ID
          }?timestamp=${Date.now()}`,
        });
        try {
          let data = "";
          new Uint8Array(profile).forEach((value) => {
            data += String.fromCharCode(value);
          });
          if (profile) {
            imageRef.current.src = `data:application/octet-stream;base64,${btoa(data)}`;
          } else {
            const defaultProfile = await window.electronAPI.loadImg("user.png");
            imageRef.current.src = defaultProfile;
          }
        } catch {}
      };
      loadImage();
    }
  }, [auth]);

  const fetchUserData = async () => {
    const data = await window.electronAPI.fetchAPI({
      method: "GET",
      URL: `user/${auth?.user?.data?.ID}`,
    });
    if (!data) {
      Swal.fire({
        icon: "error",
        title: "ไม่มีข้อมูลผู้ใช้นี้ในระบบ",
        text: "กลับไปหน้าก่อนหน้า",
      });
    }
    return data;
  };

  const updateUser = async () => {
    if (!(!name || !surname || !gender || !duty)) {
      var roleTemp = "----------";
      for (let r of duty) {
        if (r) {
          if (r.value === "manager") roleTemp = "m" + roleTemp.slice(1, 10);
          else if (r.value === "storager")
            roleTemp = roleTemp.slice(0, 1) + "s" + roleTemp.slice(2, 10);
          else if (r.value === "tester")
            roleTemp = roleTemp.slice(0, 2) + "t" + roleTemp.slice(3, 10);
          else if (r.value === "worker")
            roleTemp = roleTemp.slice(0, 3) + "w" + roleTemp.slice(4, 10);
          else if (r.value === "admin")
            roleTemp = roleTemp.slice(0, 4) + "a" + roleTemp.slice(5, 10);
          else if (r.value === "finance")
            roleTemp = roleTemp.slice(0, 5) + "f" + roleTemp.slice(6, 10);
        }
      }
      const data = await window.electronAPI.fetchAPI({
        method: "PATCH",
        URL: `user/${auth?.user?.data?.ID}`,
        body:
          roleTemp === "----------"
            ? {
                name: name,
                surname: surname,
                email: email,
              }
            : {
                name: name,
                surname: surname,
                role: roleTemp,
                email: email,
              },
      });
      if (!data) {
        Swal.fire({
          icon: "error",
          title: "ตรวจสอบข้อมูลใหม่อีกครั้ง",
          text: "ชื่อผู้ใช้งานและอีเมล์ไม่สามารถซ้ำกับของที่มีอยู่ได้ และข้อมูลที่จำเป็นต้องกรอกกรอกครบเรียบร้อยแล้ว",
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
    } else {
      Swal.fire({
        icon: "error",
        title: "กรอกข้อมูลไม่ครบ",
        text: "กรุณากรอกข้อมูลให้ครบตามช่องที่มี * สีแดง",
      });
    }
  };

  return (
    <>
      <div className="flex w-screen h-screen">
        <div>
          <SideBar />
        </div>
        <div className="flex flex-col w-full h-full">
          <Breadcrumb />
          <div className="flex flex-col bg-white w-full h-full overflow-y-auto whitespace-nowrap place-items-center pt-[50px]">
            <div className="flex flex-row w-full place-items-center">
              <div className="flex place-items-center">
                <h2 className="ml-5 sm:ml-20 text-black text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl  font-bold ">
                  แก้ไขข้อมูล
                </h2>
              </div>
              <div className="hidden md:flex w-full place-content-end mr-20">
                <ButtonBlue name="บันทึกการแก้ไข" onClick={updateUser} />
              </div>
            </div>
            <div className="bg-white w-full flex flex-col place-items-center place-content-center">
              <div className="w-full sm:w-[90%] mt-5 flex flex-col place-items-center place-content-between border-black border-2 rounded-[15px]">
                <div className="mx-10 my-10 w-[90%] h-[90%] flex flex-col text-black text-xl ">
                  <div className="w-full flex place-items-center place-content-center mb-5">
                    <div
                      tabIndex={0}
                      className="hidden"
                      ref={fileInputRef}
                      onClick={async (e) => {
                        const result = await window.electronAPI.uploadImg({
                          URL: `user/upload/profile/${auth?.user?.data?.ID}`,
                          method: "PATCH",
                        });
                        while (!result) {}
                        if (!result.canceled) {
                          window.location.reload();
                        }
                      }}
                    />
                    {auth.user?.data?.ID && (
                      <button
                        className="rounded-full"
                        onClick={() => {
                          fileInputRef.current.click();
                        }}
                      >
                        <div className="relative group w-[125px] h-[125px] md:w-[150px] md:h-[150px] rounded-full">
                          <img
                            className="rounded-full absolute w-full h-full"
                            ref={imageRef}
                            width={150}
                            height={150}
                            alt="userProfile"
                          />
                          <div className="absolute w-full h-full rounded-full bg-black opacity-80 invisible group-hover:visible" />
                          <div className="w-full h-full absolute invisible group-hover:visible rounded-full">
                            <div className="w-full h-full flex place-items-center place-content-center rounded-full">
                              <h1 className="text-white text-xl font-normal ">
                                อัปโหลดไฟล์
                              </h1>
                            </div>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                  <div className="w-full flex md:mb-5 flex-col md:flex-row">
                    <div className="w-full h-full flex">
                      <label className="w-[100%]">
                        <h4 className="text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
                          ชื่อผู้ใช้งาน
                        </h4>
                        <input
                          className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal  rounded-md cursor-not-allowed"
                          type="text"
                          value={username}
                          disabled
                        />
                      </label>
                    </div>
                  </div>
                  <div className="w-full flex md:mb-5 flex-col md:flex-row">
                    <div className="w-full md:w-1/2 h-full flex">
                      <label className="w-[100%]">
                        <h4 className="text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
                          ชื่อจริง<span className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-red-600">&nbsp;*</span>
                        </h4>
                        <input
                          className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal  rounded-md"
                          type="text"
                          placeholder="ชื่อจริง"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </label>
                    </div>
                    <div className="hidden md:block w-[5%] h-full"></div>
                    <div className="w-full md:w-1/2 h-full flex">
                      <label className="w-[100%]">
                        <h4 className="text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
                          นามสกุล<span className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-red-600">&nbsp;*</span>
                        </h4>
                        <input
                          className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal  rounded-md"
                          type="text"
                          placeholder="นามสกุล"
                          value={surname}
                          onChange={(e) => setSurname(e.target.value)}
                          required
                        />
                      </label>
                    </div>
                  </div>
                  <div className="w-full flex md:mb-5 flex-col md:flex-row">
                    <div className="w-full md:w-1/2 h-full flex">
                      <label className="w-[100%]">
                        <h4 className="text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
                          อีเมล์<span className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-red-600">&nbsp;*</span>
                        </h4>
                        <input
                          className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal  rounded-md"
                          type="email"
                          placeholder="example@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </label>
                    </div>
                    <div className="hidden md:block w-[5%] h-full"></div>
                    <div className="w-full md:w-1/2 h-full flex">
                      <label className="w-[100%]">
                        <h4 className="text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
                          เบอร์โทรศัพท์
                        </h4>
                        <input
                          className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal  rounded-md cursor-not-allowed"
                          type="tel"
                          placeholder="084XXXXXXX"
                          value={tel}
                          onChange={(e) => setTel(e.target.value)}
                          disabled
                        />
                      </label>
                    </div>
                  </div>
                  <div className="w-full flex md:mb-5 flex-col md:flex-row">
                    <div className="w-full md:w-1/2 h-full flex">
                      <label className="w-[100%]">
                        <h4 className="text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
                          วันเกิด (MM/DD/YYYY)
                        </h4>
                        <div className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal  rounded-md flex place-items-center overflow-hidden cursor-not-allowed">
                          <input
                            className="font-normal  w-full h-full cursor-not-allowed"
                            type="date"
                            value={birthday?.split("T")[0]}
                            onChange={(e) => setBirthday(e.target.value)}
                            min={"1950-01-01"}
                            max={new Date().toISOString().split("T")[0]}
                            disabled
                          />
                        </div>
                      </label>
                    </div>
                    <div className="hidden md:block w-[5%] h-full"></div>
                    <div className="w-full md:w-1/2 h-full flex">
                      <label className="w-[100%]">
                        <h4 className="text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
                          วันบรรจุเข้าทำงาน (MM/DD/YYYY)
                        </h4>
                        <div className="h-[40px] md:h-[50px] w-full border border-black mt-1 px-3 text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal  rounded-md flex place-items-center overflow-hidden cursor-not-allowed">
                          <input
                            className="font-normal  w-full cursor-not-allowed"
                            type="date"
                            value={dateEmployment?.split("T")[0]}
                            disabled
                          />
                        </div>
                      </label>
                    </div>
                  </div>
                  <div className="w-full flex md:mb-5 flex-col md:flex-row">
                    <div className="w-full md:w-[20%] h-full">
                      <label>
                        <h4 className="text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
                          เพศ
                        </h4>
                        <select
                          className="h-[40px] md:h-[50px] w-full pl-5 border border-black mt-1 text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal  rounded-md cursor-not-allowed"
                          value={gender}
                          onChange={(e) => {
                            setGender(e.target.value);
                          }}
                          disabled
                        >
                          <option
                            value="none"
                            disabled
                            hidden
                            className="text-red-600"
                          >
                            เลือกเพศ
                          </option>
                          <option value="male">ชาย</option>
                          <option value="female">หญิง</option>
                        </select>
                      </label>
                    </div>
                    <div className="hidden md:block w-[5%] h-full"></div>
                    <div className="w-full md:w-[75%] h-full">
                      <label>
                        <h4 className="text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
                          ตำแหน่ง
                          {role && role[0] === "m" && (
                            <span className="text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl text-red-600">&nbsp;*</span>
                          )}
                        </h4>
                        <div className="w-full text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl">
                          {duty &&
                            (role[0] === "m" ? (
                              <Select
                                closeMenuOnSelect={false}
                                isMulti
                                options={roles}
                                onChange={(e) => setDuty(e)}
                                defaultValue={[
                                  auth?.user?.data?.role[0] === "m"
                                    ? roles[0]
                                    : null,
                                  auth?.user?.data?.role[1] === "s"
                                    ? roles[1]
                                    : null,
                                  auth?.user?.data?.role[2] === "t"
                                    ? roles[2]
                                    : null,
                                  auth?.user?.data?.role[3] === "w"
                                    ? roles[3]
                                    : null,
                                  auth?.user?.data?.role[4] === "a"
                                    ? roles[4]
                                    : null,
                                  auth?.user?.data?.role[5] === "f"
                                    ? roles[5]
                                    : null,
                                ]}
                              />
                            ) : (
                              <Select
                                closeMenuOnSelect={false}
                                isMulti
                                options={roles}
                                onChange={(e) => setDuty(e)}
                                defaultValue={[
                                  auth?.user?.data?.role[0] === "m"
                                    ? roles[0]
                                    : null,
                                  auth?.user?.data?.role[1] === "s"
                                    ? roles[1]
                                    : null,
                                  auth?.user?.data?.role[2] === "t"
                                    ? roles[2]
                                    : null,
                                  auth?.user?.data?.role[3] === "w"
                                    ? roles[3]
                                    : null,
                                  auth?.user?.data?.role[4] === "a"
                                    ? roles[4]
                                    : null,
                                  auth?.user?.data?.role[5] === "f"
                                    ? roles[5]
                                    : null,
                                ]}
                                isDisabled={true}
                              />
                            ))}
                        </div>
                      </label>
                    </div>
                  </div>
                  <div className="w-full h-full flex">
                    <div className="w-full h-full">
                      <label className="w-auto h-auto">
                        <h4 className="text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
                          ที่อยู่
                        </h4>
                        <textarea
                          className="bg-white border border-black w-full h-[240px] min-h-[50px] max-h-[240px] rounded-lg text-base text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal  px-2 py-2 cursor-not-allowed"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          disabled
                        ></textarea>
                      </label>
                    </div>
                  </div>
                  <div className="flex md:hidden w-full place-content-end mr-20 mt-5">
                    <SubmitButton text="บันทึกการแก้ไข" onClick={updateUser} />
                  </div>
                </div>
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
