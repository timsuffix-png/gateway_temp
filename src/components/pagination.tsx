export default function Pagination({ ...props }) {
  if (props["allPage"] === 0)
    return (
      <h4 className="text-black text-lg font-normal ">
        ไม่มีข้อมูล
      </h4>
    );
  for (let attribute of [
    "currentPage",
    "increase",
    "decrease",
    "first",
    "last",
  ]) {
    if (!props[attribute]) throw new Error(`Please specify ${attribute}`);
  }

  return (
    <>
      <div className="flex place-content-center place-items-center w-[470px] h-[70px] scale-75 sm:scale-100">
        {1 < props["currentPage"] ? (
          <>
            <div className="flex mr-5">
              <button onClick={props.first}>
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16 7.42857L7.42857 16M7.42857 16L16 24.5714M7.42857 16H31M1 1V31"
                    stroke="black"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <button onClick={props.decrease}>
              <div className="flex mr-5 place-items-center">
                <svg
                  width="32"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 11H1M1 11L11 21M1 11L11 1"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h4 className="text-center text-black text-lg font-normal ">
                  หน้าก่อน
                </h4>
              </div>
            </button>
          </>
        ) : null}
        <div className="">
          <h4 className="text-center text-black text-lg font-normal ">
            {props.currentPage} of {props.allPage}
          </h4>
        </div>
        {props["allPage"] > props["currentPage"] ? (
          <>
            <button onClick={props.increase}>
              <div className="flex ml-5 place-items-center">
                <h4 className="text-center text-black text-lg font-normal ">
                  หน้าต่อไป&nbsp;
                </h4>
                <svg
                  className="rotate-180"
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 11H1M1 11L11 21M1 11L11 1"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>
            <div className="flex ml-5">
              <button onClick={props.last}>
                <svg
                  className="rotate-180"
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16 7.42857L7.42857 16M7.42857 16L16 24.5714M7.42857 16H31M1 1V31"
                    stroke="black"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
