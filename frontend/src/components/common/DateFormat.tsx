interface DateFormatProps {
  value?: string | number | Date | null;
  date?: string | number | Date | null;
}

export default function DateFormat(props: DateFormatProps) {
  const value = props?.value ?? props?.date;
  if (!value) return null;

  const date = new Date(value);
  if (isNaN(date.getTime())) return null;

  return (
    <>
      {date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </>
  );
}
