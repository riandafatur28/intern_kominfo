import { useState } from "react";
import DatePicker from "./DatePicker";
import TimePicker from "./TimePicker";

/**
 * Contoh render gabungan DatePicker + TimePicker berdampingan, plus
 * TimePicker standalone (prefilled) dan state error.
 * File ini TIDAK dipasang ke halaman mana pun; hanya untuk verifikasi visual.
 */
export default function TimePickerExample() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [standalone, setStandalone] = useState("09:30");

  return (
    <div className="min-h-screen bg-[#F6FAFF] p-16">
      <div className="max-w-[36rem] bg-white border border-[#C2C6D8] rounded-xl p-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4 items-end">
          <DatePicker label="Tanggal" value={date} onChange={setDate} />
          <TimePicker label="Jam" value={time} onChange={setTime} />
        </div>
        <div className="w-1/2">
          <TimePicker label="Standalone (prefilled 09:30)" value={standalone} onChange={setStandalone} />
        </div>
        <div className="w-1/2">
          <TimePicker label="Dengan Error" error="Format jam tidak valid" />
        </div>
      </div>
    </div>
  );
}
