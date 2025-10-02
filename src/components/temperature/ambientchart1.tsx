import React from "react";
import {
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  Tooltip,
  Legend,
} from "recharts";

// 🔹 จำลองข้อมูล 10 วินาที
const data = [
  {
    sec: 1,
    r0_object: 50,
    r1_object: 48,
    r2_object: 49,
    r0_ambient: 28,
    r1_ambient: 27.5,
    r2_ambient: 28.2,
    temp_avg: 49,
  },
  {
    sec: 2,
    r0_object: 80,
    r1_object: 78,
    r2_object: 79,
    r0_ambient: 28.1,
    r1_ambient: 27.8,
    r2_ambient: 28.3,
    temp_avg: 79,
  },
  {
    sec: 3,
    r0_object: 120,
    r1_object: 118,
    r2_object: 119,
    r0_ambient: 28.3,
    r1_ambient: 27.9,
    r2_ambient: 28.5,
    temp_avg: 119,
  },
  {
    sec: 4,
    r0_object: 150,
    r1_object: 149,
    r2_object: 151,
    r0_ambient: 28.2,
    r1_ambient: 28.0,
    r2_ambient: 28.4,
    temp_avg: 150,
  },
  {
    sec: 5,
    r0_object: 180,
    r1_object: 179,
    r2_object: 181,
    r0_ambient: 28.4,
    r1_ambient: 28.1,
    r2_ambient: 28.5,
    temp_avg: 180,
  },
  {
    sec: 6,
    r0_object: 195,
    r1_object: 194,
    r2_object: 196,
    r0_ambient: 28.5,
    r1_ambient: 28.2,
    r2_ambient: 28.6,
    temp_avg: 195,
  },
  {
    sec: 7,
    r0_object: 200,
    r1_object: 199,
    r2_object: 201,
    r0_ambient: 28.5,
    r1_ambient: 28.3,
    r2_ambient: 28.7,
    temp_avg: 200,
  },
  {
    sec: 8,
    r0_object: 202,
    r1_object: 201,
    r2_object: 203,
    r0_ambient: 28.6,
    r1_ambient: 28.4,
    r2_ambient: 28.8,
    temp_avg: 202,
  },
  {
    sec: 9,
    r0_object: 203,
    r1_object: 202,
    r2_object: 204,
    r0_ambient: 28.7,
    r1_ambient: 28.5,
    r2_ambient: 28.9,
    temp_avg: 203,
  },
  {
    sec: 10,
    r0_object: 205,
    r1_object: 204,
    r2_object: 206,
    r0_ambient: 28.7,
    r1_ambient: 28.6,
    r2_ambient: 29.0,
    temp_avg: 205,
  },
];

export default function AmbientChart1() {
  return (
    <div>
      <LineChart width={900} height={400} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="sec"
          label={{ value: "Seconds", position: "insideBottomRight" }}
        />
        <YAxis
          label={{
            value: "Temperature (°C)",
            angle: -90,
            position: "insideLeft",
          }}
        />
        <Tooltip />
        <Legend />

        {/* Object Temps (เตารีด) */}
        <Line type="monotone" dataKey="r0_object" stroke="#FF0000" name="R0 Iron" />
        <Line type="monotone" dataKey="r1_object" stroke="#00FF00" name="R1 Iron" />
        <Line type="monotone" dataKey="r2_object" stroke="#0000FF" name="R2 Iron" />

        {/* Ambient Temps */}
        <Line type="monotone" dataKey="r0_ambient" stroke="#FFA07A" name="R0 Ambient" />
        <Line type="monotone" dataKey="r1_ambient" stroke="#90EE90" name="R1 Ambient" />
        <Line type="monotone" dataKey="r2_ambient" stroke="#87CEFA" name="R2 Ambient" />

        {/* Average */}
        <Line
          type="monotone"
          dataKey="temp_avg"
          stroke="#000"
          strokeDasharray="5 5"
          name="Average"
        />
      </LineChart>
    </div>
  );
}
