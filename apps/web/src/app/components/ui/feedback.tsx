import { useState, useEffect } from "react";

interface NotificationProps {
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
}

export const Notification = ({
  message,
  type,
  duration = 3000,
  onClose,
}: NotificationProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "info":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-md text-white shadow-lg ${getBgColor()}`}
    >
      <p>{message}</p>
    </div>
  );
};

export const useNotification = () => {
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
    visible: boolean;
  } | null>(null);

  const showNotification = (
    message: string,
    type: "success" | "error" | "info",
  ) => {
    setNotification({ message, type, visible: true });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  return {
    notification,
    showNotification,
    hideNotification,
  };
};

export const LoadingIndicator = ({
  size = "small",
}: {
  size?: "small" | "medium" | "large";
}) => {
  const sizeClass = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`animate-spin rounded-full border-b-2 border-email-primary ${sizeClass[size]}`}
      ></div>
    </div>
  );
};

const feedback = { Notification, useNotification, LoadingIndicator };
export default feedback;
