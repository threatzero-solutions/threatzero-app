import { useContext, useRef } from "react";
import { AlertContext } from "./alert-context";

export const useAlertId = () => {
  const { getAlertId } = useContext(AlertContext);
  return useRef(getAlertId()).current;
};
