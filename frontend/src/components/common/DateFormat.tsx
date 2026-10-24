interface formatProps{
    value:string | number;
}
export default function DateFormat(props: any) {
    const value = props?.value || props?.date || (typeof props !== 'object' ? props : undefined);
    if (!value) return "";
    
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}