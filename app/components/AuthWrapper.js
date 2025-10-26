"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AuthWrapper({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const unprotectedRoutes = ["/login", "/signup"];

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Unprotected routes → skip
        if (unprotectedRoutes.includes(pathname)) {
          setAuthChecked(true);
          return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        const data = await res.json();

        console.log(data);
        

        if (!res.ok || !data.success) {
          localStorage.removeItem("token");
          router.push("/login");
        } else {
          setAuthChecked(true);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      }
    };

    verifyAuth();
  }, [pathname, router]);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-600">
        <p>Checking authentication...</p>
      </div>
    );
  }

  return children;
}
