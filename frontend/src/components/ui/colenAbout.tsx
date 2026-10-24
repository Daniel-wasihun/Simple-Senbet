
interface ColumnProps {
  show?: boolean;
  height?: number;
}

export const Colen = ({
  show = true,
  height = 130,
}: ColumnProps) => {
  if (!show) return null;

  return (
    <div>
      <div className="mb-1 w-[8px] h-[8px] rounded-full bg-gradient-to-r from-blue-500 to-gray-600" />
      <div
        className="ml-0.5 w-[3px] opacity-30 "
        
        style={{ height, backgroundImage: "linear-gradient(90deg, #0c61a7 80%, #666666 20%)"  }}
      />
    </div>
  );
};
