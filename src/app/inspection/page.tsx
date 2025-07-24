import Link from "next/link";
import ButtonBlue from "@/components/buttonBlue";

export default function Inspection_page() {
  return (
    <div className="w-full h-full flex flex-col border">
      <div className="hidden py-2 px-10 text-2xl border-b 2xl:blo">หน้าหลัก / การตรวจสอบ</div>

      <div className="flex flex-col">
        {/* การตรวจสอบคุณภาพสินค้า */}
        <div className="flex justify-between items-center px-20 py-5">
          <label className="text-xl font-bold 2xl:text-2xl">การตรวจสอบคุณภาพสินค้า</label>
          <div className="flex gap-3">
            
            <ButtonBlue name="ตั้งค่าการทดสอบ" href="/inspection/settingTest"/>
      
            <ButtonBlue name="โปรเจ็คการทดสอบ"/>
           
          </div>
        </div>

        {/* ผลรวมการทดสอบ */}
        <div></div>
        {/* ค้นหา */}
        <div></div>
        {/* ตารางสินค้า */}
        <div></div>
        
      </div>
    </div>
  );
}
