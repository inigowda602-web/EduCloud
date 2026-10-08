import { useState } from "react";
import PageHeader from "../../components/PageHeader";
import { usePersistentState } from "../../hooks/usePersistentState";
import { useAuth } from "../../context/AuthContext";
import { currentFaculty } from "../../data/mockData";
import { CalendarDays, Clock, MapPin, User } from "lucide-react";

export default function FacultyTimetable() {
  const { user } = useAuth();
  const current = user || currentFaculty;
  const [timetable] = usePersistentState("timetable");
  const days = Object.keys(timetable || {});
  const [activeDay, setActiveDay] = useState(days[0] || "Monday");
  const [onlyMine, setOnlyMine] = useState(false);

  const daySchedule = timetable?.[activeDay] || [];
  const filteredSchedule = onlyMine
    ? daySchedule.filter((c) => c.faculty === current.name)
    : daySchedule;

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="Weekly class schedule and lecture timings"
        actions={
          <button
            onClick={() => setOnlyMine(!onlyMine)}
            className={`text-xs px-3 py-2 rounded-xl font-semibold border transition-colors ${
              onlyMine
                ? "bg-navy-800 text-white border-navy-800"
                : "bg-white text-navy-700 border-surface-border hover:bg-navy-50"
            }`}
          >
            {onlyMine ? "Showing My Classes Only" : "Show All Department Classes"}
          </button>
        }
      />

      <div className="flex gap-2 overflow-x-auto scrollbar-thin mb-5 pb-1">
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setActiveDay(d)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              activeDay === d
                ? "bg-navy-800 text-white"
                : "bg-white border border-surface-border text-navy-600 hover:bg-navy-50"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredSchedule.map((cls, i) => {
          const isMyClass = cls.faculty === current.name;
          return (
            <div
              key={i}
              className={`card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 ${
                isMyClass ? "border-l-accent-teal bg-teal-50/20" : "border-l-navy-200"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-navy-900">{cls.subject}</p>
                  {isMyClass && (
                    <span className="badge-teal text-[10px] py-0.5 px-2">Assigned to You</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-navy-500 mt-1">
                  <span className="flex items-center gap-1">
                    <User size={13} /> {cls.faculty}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {cls.room}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge-blue flex items-center gap-1">
                  <Clock size={12} /> {cls.time}
                </span>
              </div>
            </div>
          );
        })}
        {filteredSchedule.length === 0 && (
          <div className="card p-10 text-center">
            <CalendarDays size={28} className="mx-auto text-navy-300 mb-2" />
            <p className="text-sm font-semibold text-navy-800">No classes scheduled</p>
            <p className="text-xs text-navy-400 mt-1">
              {onlyMine
                ? `You have no lectures scheduled on ${activeDay}.`
                : `No departmental classes scheduled on ${activeDay}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

