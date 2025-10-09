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
          <div className="w-full h-full text-center text-white text-base text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl  font-bold  place-content-center hover:cursor-pointer">
            {props.text}
          </div>
        </div>
      </div>
    </button>
  );
}
