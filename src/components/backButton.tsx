export default function BackButton({ text = "ย้อนกลับ", ...props }) {
  return (
    <div className={" w-[140px] 2xl:w-[170px] h-10 2xl:h-14 " + props.className}>
      <div className="w-full h-full border-4 border-[#001F3F] rounded-[10px] flex flex-row place-items-center group">
        <svg
          className="group-hover:w-20 transition-all"
          width="50"
          height="50"
          viewBox="0 0 50 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16.3021 27.0833L27.9687 38.75L25 41.6667L8.33331 25L25 8.33333L27.9687 11.25L16.3021 22.9167H41.6666V27.0833H16.3021Z"
            fill="#001F3F"
          />
        </svg>
        <div className="w-full h-full text-center text-[#001F3F] text-xl  2xl:text-2xl 3xl:text-3xl 4xl:text-4xl whitespace-nowrap  font-bold  place-content-center">
          {text}
        </div>
      </div>
    </div>
  );
}