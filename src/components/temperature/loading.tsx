import { useEffect, useRef } from "react";
import { useAuth } from "../../lib/auth/authProvider";

export default function LoadingPage() {
  const auth = useAuth();
  const imageRef = useRef<any | null>(null);

  useEffect(() => {
    if (imageRef.current) {
      const loadImage = async () => {
        const loading = await window.electronAPI.loadImg("loading.gif");
        try {
          imageRef.current.src = loading;
        } catch {}
      };
      loadImage();
    }
  }, [auth]);

  return (
    <div className="flex min-h-screen justify-center items-center">
      <img ref={imageRef} alt="my gif" height={100} width={100} />
      <p>loading</p>
    </div>
  );
}
