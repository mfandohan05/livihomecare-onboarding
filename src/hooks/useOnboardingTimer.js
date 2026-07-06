import { useEffect, useRef, useState } from "react";

const IDLE_LIMIT = 120000;
const TAB_KEY = "livi_active_tab";
const TAB_ID = crypto.randomUUID();
const MAX_DELTA = 2000;

export function useOnboardingTimer(token) {
  const TIME_KEY = `livi_time_${token}`;

  const [isIdle, setIsIdle] = useState(false);
  const [isActiveTab, setIsActiveTab] = useState(true);

  const totalActiveMs = useRef(0);
  const lastActivity = useRef(Date.now());
  const lastTick = useRef(Date.now());
  const popupOpenRef = useRef(false);

  const restoreTime = (raw) => {
    if (raw == null) return;
    const n = Number(raw);
    if (!Number.isNaN(n) && n >= 0) {
      totalActiveMs.current = n;
    }
  };

  const claimOwnership = () => {
    localStorage.setItem(TAB_KEY, TAB_ID);
    setIsActiveTab(true);
    lastTick.current = Date.now();
    lastActivity.current = Date.now();
  };

  useEffect(() => {
    if (!token) return;
    restoreTime(localStorage.getItem(TIME_KEY));
  }, [token]);

  useEffect(() => {
    claimOwnership();

    const handleStorage = (e) => {
      if (e.key === TAB_KEY) {
        if (e.newValue === null) {
          claimOwnership();
        } else {
          setIsActiveTab(e.newValue === TAB_ID);
        }
      }
      if (e.key === TIME_KEY && e.newValue) {
        restoreTime(e.newValue);
      }
    };

    const handleFocus = () => {
      claimOwnership();
      restoreTime(localStorage.getItem(TIME_KEY));
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

  useEffect(() => {
    const interval = setInterval(() => {
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

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTick.current;
      lastTick.current = now;

      if (delta > MAX_DELTA) return;

      const ownsTab = localStorage.getItem(TAB_KEY) === TAB_ID;

      if (!isIdle && isActiveTab && ownsTab) {
        totalActiveMs.current += delta;
        if (token) {
          localStorage.setItem(TIME_KEY, String(totalActiveMs.current));
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isIdle, isActiveTab, token]);

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