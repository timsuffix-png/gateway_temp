import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth/authProvider";

export default function LoadingPage() {
  const auth = useAuth();
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const img = await window.electronAPI.loadImg("loading.gif");
        if (img) setImgSrc(img);
      } catch (err) {
        console.error("Load image failed:", err);
      }
    };

    loadImage();
  }, [auth]);

  return (
    <div className="flex min-h-screen justify-center items-center">
      {imgSrc && <img src={imgSrc} alt="loading" width={100} height={100} />}
      <p className="mt-3 text-gray-600">กำลังโหลด...</p>
    </div>
  );
}
