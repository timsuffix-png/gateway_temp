export default function Popup({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      <div
        id="popup"
        className="fixed top-0 left-0 w-screen h-screen z-50 flex place-items-center place-content-center"
        tabIndex={0}
        onClick={(e: any) => {
          if (e.target.id === "popup") onClose();
        }}
      >
        {children}
      </div>
      <div className="fixed top-0 left-0 bg-black opacity-50 w-screen h-screen z-40"></div>
    </>
  );
}
