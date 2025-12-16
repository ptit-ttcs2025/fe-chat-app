interface DateMarkerProps {
  timestamp: string;
}

const formatDateMarker = (timestamp: string): string => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  
  // So sánh ngày (không tính giờ)
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffDays = Math.floor((nowOnly.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24));
  
  // Hôm nay
  if (diffDays === 0) {
    return "Hôm nay";
  }
  
  // Hôm qua
  if (diffDays === 1) {
    return "Hôm qua";
  }
  
  // Trong tuần này (từ 2-6 ngày trước)
  if (diffDays >= 2 && diffDays <= 6) {
    return date.toLocaleDateString("vi-VN", { weekday: "long" });
  }
  
  // Cùng tháng nhưng khác tuần
  if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("vi-VN", { day: "numeric", month: "long" });
  }
  
  // Cùng năm nhưng khác tháng
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("vi-VN", { day: "numeric", month: "long" });
  }
  
  // Khác năm
  return date.toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" });
};

const DateMarker = ({ timestamp }: DateMarkerProps) => {
  return (
    <div className="date-marker">
      <span>{formatDateMarker(timestamp)}</span>
    </div>
  );
};

export default DateMarker;
export { formatDateMarker };

