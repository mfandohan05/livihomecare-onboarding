import { useEffect, useRef, useState } from "react";

const IDLE_LIMIT = 5000;
const TAB_KEY = "livi_active_tab";
const TAB_ID = crypto.randomUUID();

export function useOnboardingTimer(token) {
  const TIME_KEY = `livi_time_${token}`;

  const [isIdle, setIsIdle] = useState(false);
  const [isActiveTab, setIsActiveTab] = useState(true);

  const totalActiveMs = useRef(0);
  const lastActivity = useRef(Date.now());
  const lastTick = useRef(Date.now());
  const popupOpenRef = useRef(false);

  // Restore saved time from localStorage on mount
  useEffect(() => {
    if (!token) return;
    const saved = localStorage.getItem(TIME_KEY);
    if (saved) {
      totalActiveMs.current = Number(saved);
    }
  }, [token]);

  // Claim this tab as the active tab
  useEffect(() => {
    localStorage.setItem(TAB_KEY, TAB_ID);

    const handleStorage = (e) => {
      if (e.key === TAB_KEY) {
        setIsActiveTab(e.newValue === TAB_ID);
      }
      if (e.key === TIME_KEY && e.newValue) {
        totalActiveMs.current = Number(e.newValue);
      }
    };

    const handleFocus = () => {
      localStorage.setItem(TAB_KEY, TAB_ID);
      setIsActiveTab(true);
      lastTick.current = Date.now();
      lastActivity.current = Date.now();
      const saved = localStorage.getItem(TIME_KEY);
      if (saved) {
        totalActiveMs.current = Number(saved);
      }
    };

    const handleBlur = () => {
      setTimeout(() => {
        if (document.visibilityState === "hidden") {
          setIsIdle(true);
        }
      }, 100);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      if (localStorage.getItem(TAB_KEY) === TAB_ID) {
        localStorage.removeItem(TAB_KEY);
      }
    };
  }, []);

  // Detect user activity
  useEffect(() => {
    const handleActivity = () => {
      lastActivity.current = Date.now();
      lastTick.current = Date.now();
      if (isIdle) setIsIdle(false);
    };

    const events = ["mousemove", "keydown", "mousedown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, handleActivity));
    return () => events.forEach((e) => window.removeEventListener(e, handleActivity));
  }, [isIdle]);

  // Detect idle state
  useEffect(() => {
    const interval = setInterval(() => {
      // if popup is open keep activity fresh so idle never triggers
      if (popupOpenRef.current) {
        lastActivity.current = Date.now();
        lastTick.current = Date.now();
        return;
      }

      const inactiveFor = Date.now() - lastActivity.current;
      setIsIdle(inactiveFor > IDLE_LIMIT);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Track active time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTick.current;
      lastTick.current = now;

      if (!isIdle && isActiveTab) {
        totalActiveMs.current += delta;
        if (token) {
          localStorage.setItem(TIME_KEY, totalActiveMs.current);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isIdle, isActiveTab, token]);

  // Call this when a popup opens or closes
  const setPopupOpen = (isOpen) => {
    popupOpenRef.current = isOpen;
    if (isOpen) {
      lastActivity.current = Date.now();
      lastTick.current = Date.now();
    }
  };

  const getHoursWorked = () => {
    return Number((totalActiveMs.current / 1000 / 60 / 60).toFixed(2));
  };

  return {
    isIdle,
    isActiveTab,
    getHoursWorked,
    setPopupOpen,
  };
}