export default function Footer() {
  return (
    <div className="w-full mt-6 mb-2  py-2 flex justify-center">
      <h2 className="text-center text-black text-xs sm:text-sm md:text-base xl:text-lg">
        ©{new Date().getFullYear()} TestJunction TJ@Naresuan University v.1.0.2. All rights reserved.
      </h2>
    </div>
  );
}
