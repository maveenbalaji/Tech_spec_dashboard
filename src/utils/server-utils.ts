
export const getUtilizationColor = (value: number): string => {
  if (value < 50) return "text-green-500";
  if (value < 80) return "text-amber-500";
  return "text-red-500";
};

export const getProgressColor = (value: number): string => {
  if (value < 50) return "bg-green-500";
  if (value < 80) return "bg-amber-500";
  return "bg-red-500";
};

export const getTypeColor = (type: string): string => {
  switch (type) {
    case "LIVE":
      return "bg-green-500";
    case "TEST":
      return "bg-amber-500";
    default:
      return "bg-gray-500";
  }
};

export const formatNumber = (num: number): string => {
  return num.toFixed(1);
};
