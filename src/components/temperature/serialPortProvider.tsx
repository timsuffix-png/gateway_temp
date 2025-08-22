"use client"
import { createContext, ReactNode, useContext, useState } from "react";

const SerialPortContext = createContext<any | null>(null);

export default function SerialPortProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [COMPort, setCOMPort] = useState(null);

  return (
    <SerialPortContext.Provider value={{ COMPort, setCOMPort }}>
      {children}
    </SerialPortContext.Provider>
  );
}

export { SerialPortContext };
