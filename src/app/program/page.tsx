"use client";
import React, { useEffect, useState } from "react";
import styles from "./SchedulePage.module.css";
import supabase from '../../../lib/supabase';
import { Timestamp } from "next/dist/server/lib/cache-handlers/types";


const dateOptions = [
  { label: ["Wed", "4"], key: "2025-06-04" },
  { label: ["Thu", "5"], key: "2025-06-05" },
  { label: ["Fri", "6"], key: "2025-06-06" },
];

interface ScheduleEntry {
  name: string;
  title: string;
  speaker: string;
  startTime: string;
  duration: Timestamp;
  affiliation: string;
  description: string;
  type: string;
  location: string;
}

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<string>("2025-06-04");
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("sessions")
        .select("name, title, speaker, start_time, duration, affiliation, description, type, location")
        .gte("start_time", `${selectedDate}T00:00:00`)
        .lt("start_time", `${selectedDate}T23:59:59`)
        .order("start_time", { ascending: true })
        .order("name", { ascending: true });

    
      if (error) console.error("Error loading schedule:", error);
      else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transformed = data?.map((entry: any): ScheduleEntry => ({
        name: entry.name,
        title: entry.title,
        speaker: entry.speaker,
        startTime: new Date(entry.start_time).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: false,
        }),
        duration: entry.duration,
        affiliation: entry.affiliation ?? "Independent",
        description: entry.description ?? "",
        type: entry.type,
        location: entry.location,
        }));

        setSchedule(transformed);
      }
      setLoading(false);
    };

    fetchSchedule();
  }, [selectedDate]);

  function groupOverlappingEvents(events: ScheduleEntry[]) {
    const parseTime = (timeStr: string) => {
      const timeOnly = timeStr.includes("T") ? timeStr.split("T")[1].slice(0, 5) : timeStr;
      const [hours, minutes] = timeOnly.split(":").map(Number);
      return hours * 60 + minutes;
    };


    const groups: ScheduleEntry[][] = [];

    for (const event of events) {
      const start = parseTime(event.startTime);
      let placed = false;

      for (const group of groups) {
        // Get max end of current group
        const last = group[group.length - 1];
        const lastEnd = parseTime(last.startTime) + parseTime(last.duration.toString());
        // Only overlap if event starts before group's last event ends
        if (start < lastEnd) {
          group.push(event);
          placed = true;
          break;
        }
      }

      // If no group found, make a new group
      if (!placed) {
        groups.push([event]);
      }
    }
    // console.log("Groups: ", groups);
    return groups;
  }

  const overlappingGroups = groupOverlappingEvents(schedule);

  return (
    <div className={styles.background}>
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h1 className={styles.title}>Program</h1>
        <div className={styles.dateSelector}>
          {dateOptions.map((d) => (
            <button
              key={d.key}
              onClick={() => setSelectedDate(d.key)}
              className={`${styles.date} ${
                selectedDate === d.key
                  ? styles.selectedDate
                  : ''
              }`}
            >
              <p className={styles.dateNumber}>{d.label[1]}</p>
              <p className={styles.weekDay}>{d.label[0]}</p>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.scheduleContainer}>
        {loading ? (
          <div className={styles.info}>Loading...</div>
        ) : schedule.length === 0 ? (
          <div className={styles.info}>No events scheduled.</div>
        ) : (
          overlappingGroups.map((group, i) => (
            <div key={i} className={`flex gap-2 scroll-x overflow-x ${styles.groupContainer}`}>
              {group.map((entry, j) => (
                <div key={j} className={`${styles.eventCard} ${entry.type=="non-academical"? styles.nonAcademical : ''} flex-1`}>
                  <p className={styles.startTime}>{entry.startTime}</p>
                  <p className={styles.eventName}>{entry.name}</p>
                  <p className={styles.eventTitle}>{entry.title}</p>
                  <p className={styles.speaker}>{entry.speaker}</p>
                  <p className={styles.location}>{entry.location}</p>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
    </div>
  );
}
