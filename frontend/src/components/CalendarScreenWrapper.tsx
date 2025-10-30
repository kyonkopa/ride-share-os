import { CalendarScreen } from "./CalendarScreen";
import { useShift } from "../hooks/useShift";

export default function CalendarScreenWrapper() {
  const { shifts, vehicles } = useShift();

  return <CalendarScreen shifts={shifts} vehicles={vehicles} />;
}
