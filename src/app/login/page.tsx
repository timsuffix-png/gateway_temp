"use client";

import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import Footer from "@/components/footer";
import SubmitButton from "@/components/submitButton";
import { useAuth } from "@/lib/auth/authProvider";
import Index from "@/components";
import APISetting from "@/components/temperature/apiSetting";
import Popup from "@/components/popup";

export default function Login() {
  const [username, setusername] = useState("");
  const [password, setPassword] = useState("");
  const ironsImageRef = useRef<any | null>(null);
  const logoImageRef = useRef<any | null>(null);
  const auth = useAuth();
  const [apiPopup, setApiPopup] = useState(false);
  const openPopup = () => setApiPopup(true);
  const closePopup = () => setApiPopup(false);

  useEffect(() => {
    if (ironsImageRef.current && logoImageRef.current) {
      const loadImage = async () => {
        const irons = await window.electronAPI.loadImg("irons.png");
        const logo = await window.electronAPI.loadImg("logo.png");
        try {
          ironsImageRef.current.src = irons;
          logoImageRef.current.src = logo;
        } catch {}
      };
      loadImage();
    }
  }, [auth]);

  const fetchData = async () => {
    const api = (await window.electronAPI.getAPIPath())?.trim();
    if (!api || !/^https?:\/\//i.test(api)) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาตั้งค่า API ก่อนเข้าสู่ระบบ",
        text: "ไปที่ \"เปลี่ยนเส้นทางบันทึกข้อมูล\" เพื่อกำหนดค่า",
      });
      openPopup();
      return;
    }
    if (!username.trim() || !password.trim()) {
      Swal.fire({
        title: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน",
        position: "bottom-end",
        timer: 1500,
        showConfirmButton: false,
        icon: "error",
        width: "20rem",
      });
      return;
    }
    try {
      const checklogin = await auth.handleLogin({ username, password });
      if (!checklogin || !checklogin.success) {
        return Swal.fire({
          title: "Login failed",
          position: "bottom-end",
          timer: 1000,
          showConfirmButton: false,
          icon: "error",
        });
      }
      Swal.fire({
        title: "Login success",
        position: "bottom-end",
        timer: 1000,
        showConfirmButton: false,
        icon: "success",
        width: "20rem",
      });
    } catch (err) {
      Swal.fire({
        title: "Login failed",
        position: "bottom-end",
        timer: 1000,
        showConfirmButton: false,
        icon: "error",
        width: "20rem",
      });
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      fetchData();
    }
  };

  if (!auth.user?.data)
    return (
      <div className="h-screen flex bg-white">
        <div className="w-full lg:w-8/12 h-full flex flex-col">
          <div className="w-full h-[15%] flex place-items-center place-content-center sm:place-content-start sm:pl-20">
            <img
              className="w-[254px] h-[60px]"
              ref={logoImageRef}
              width={254}
              height={60}
              alt="logo"
            />
          </div>
          <div className=" w-full h-[80%] flex flex-col place-items-center">
            <div className="w-full sm:w-3/4 2xl:w-1/2 h-auto flex flex-col place-items-center bg-white rounded-[15px] border-2 border-black pt-10">
              <h1 className="text-black text-[23px] lg:text-[27px] xl:text-[32px] font-extrabold ">
                ยินดีต้อนรับสู่โปรแกรมทดสอบ
              </h1>
              <h2 className="text-black text-base lg:text-lg xl:text-2xl font-bold  mt-10">
                ลงชื่อเข้าใช้บัญชีผู้ทดสอบของคุณ
              </h2>
              <div className="w-full flex flex-col place-items-center mt-14">
                <label className="w-3/4">
                  <h3 className="text-black text-base lg:text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
                    ชื่อผู้ใช้งาน
                  </h3>
                  <input
                    className="w-full h-[40px] md:h-[50px] bg-white rounded-md border border-black text-black text-base lg:text-lg xl:text-2xl px-3 font-normal "
                    type="text"
                    placeholder="ชื่อผู้ใช้งาน"
                    onChange={(e) => setusername(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </label>
                <label className="w-3/4 mt-5">
                  <h3 className="text-black text-base lg:text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-normal ">
                    รหัสผ่าน
                  </h3>
                  <input
                    className="w-full h-[40px] md:h-[50px] bg-white rounded-md border border-black text-black text-base lg:text-lg xl:text-2xl px-3 font-normal "
                    type="password"
                    placeholder="รหัสผ่าน"
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </label>
              </div>
              {/* <div className="w-full flex place-content-center">
                <div className="w-3/4">
                  <h5 className="text-zinc-500 text-[10px] md:text-xs font-normal  leading-snug mt-1">
                    ลืมรหัสผ่าน?
                  </h5>
                </div>
              </div> */}
              <div className="w-full flex place-content-center">
                <div className="w-3/4 flex place-content-end mt-5">
                  <SubmitButton text="เข้าสู่ระบบ" onClick={fetchData} />
                </div>
              </div>
              <div className="w-full">
                <button className="mt-10 ml-5 mb-3" onClick={openPopup}>
                  <h5 className="text-neutral-500 text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl font-normal  leading-snug hover:cursor-pointer">
                    เปลี่ยนเส้นทางบันทึกข้อมูล
                  </h5>
                </button>
              </div>
            </div>
           
          </div>
           <div className="flex place-items-end place-content-center mt-auto">
              <Footer />
            </div>
        </div>
        <div className="w-4/12 h-full hidden lg:block">
          <img
            className="w-full h-screen object-cover"
            ref={ironsImageRef}
            width={571}
            height={945}
            alt="irons"
          />
        </div>
        {apiPopup && (
          <Popup onClose={closePopup}>
            <APISetting />
          </Popup>
        )}
      </div>
    );
  else return <Index />;
}
