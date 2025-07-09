export default function SubmitButton({ ...props }) {
  for (let attribute of ["text"]) {
    if (!props[attribute]) throw new Error(`Please specify ${attribute}`);
  }

  return (
    <button onClick={props.onClick}>
      <div className="w-[125px] lg:w-[150px] xl:w-[175px] 2xl:w-[200px] h-12 lg:h-14 xl:h-16 2xl:h-20">
        <div
          className={
            "w-full h-full bg-[#001F3F] rounded-[10px] " + props.className
          }
        >
          <div className="w-full h-full text-center text-white text-base lg:text-lg xl:text-xl 2xl:text-2xl font-bold font-['Sarabun'] place-content-center">
            {props.text}
          </div>
        </div>
      </div>
    </button>
  );
}
