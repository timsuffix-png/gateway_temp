import Link from "next/link";
import ButtonBlue from "@/components/buttonBlue";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Breadcrumb from "@/components/breadcrumb";

export default function Inspection_page() {
  return (
    <div className="w-full h-full flex border">
      <Navbar />
      <div className="w-full flex flex-col">
         <Breadcrumb />
        {/* การตรวจสอบคุณภาพสินค้า */}
        <div className="flex justify-between items-center px-20 py-5">
          <label className="text-xl font-bold 2xl:text-2xl">
            การตรวจสอบคุณภาพสินค้า
          </label>
          <div className="flex gap-3">
            <ButtonBlue name="ตั้งค่าการทดสอบ" onClick={() => {
              localStorage.setItem("currentUrl", "qc/settingTest");
              window.location.reload();
            }} />

            <ButtonBlue name="โปรเจ็คการทดสอบ" onClick={() => {
              localStorage.setItem("currentUrl", "qc/projectTest");
              window.location.reload();
            }} />
          </div>
        </div>

        {/* ผลรวมการทดสอบ */}
        <div></div>
        {/* ค้นหา */}
        <div></div>
        {/* ตารางสินค้า */}
        <div></div>
        <Footer />
      </div>
    </div>
  );
}
