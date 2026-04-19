"use client";
import { useEffect, useState } from "react";

export function useOnboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("onboarded")) setShow(true);
  }, []);

  function finish() {
    localStorage.setItem("onboarded", "1");
    setShow(false);
  }

  return { show, finish };
}
