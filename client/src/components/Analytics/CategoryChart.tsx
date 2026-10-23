import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getAnalytics } from '../../lib/api';

export const CategoryChart = ({ weekStart }: { weekStart: string }) => {
  const [data, setData] = useState<{ nama_kategori: string; warna_hex: string; total_hours: number }[]>([]);

  useEffect(() => {
    getAnalytics(weekStart).then(setData).catch(console.error);
  }, [weekStart]);

  const totalHours = data.reduce((sum, item) => sum + (Number(item.total_hours) || 0), 0);

  if (data.length === 0 || totalHours <= 0) {
    return (
      <div className="py-4 px-3 rounded-[14px] bg-white/60 dark:bg-[#2C2C2E]/40 border border-black/[0.04] dark:border-white/[0.06] text-center">
        <p className="text-xs text-[#6E6E73] dark:text-[#98989D]">Belum ada aktivitas minggu ini</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[16px] bg-white/80 dark:bg-[#2C2C2E]/60 border border-black/[0.06] dark:border-white/[0.08] p-3.5">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-[11px] font-semibold text-[#6E6E73] dark:text-[#98989D] tracking-tight">
          Distribusi Waktu
        </h3>
        <span className="text-xs font-semibold text-[#1D1D1F] dark:text-white tabular-nums">
          {Number(totalHours.toFixed(1))} Jam
        </span>
      </div>

      <div className="h-32 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total_hours"
              nameKey="nama_kategori"
              cx="50%"
              cy="50%"
              outerRadius={54}
              innerRadius={36}
              paddingAngle={3}
              cornerRadius={4}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.warna_hex} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [`${Number(Number(value).toFixed(1))} Jam`, 'Durasi']}
              contentStyle={{
                backgroundColor: 'rgba(28, 28, 30, 0.92)',
                borderColor: 'rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                color: '#F5F5F7',
                fontSize: '11px',
                padding: '6px 10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
              }}
              itemStyle={{ color: '#F5F5F7' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Apple Screen Time Activity Breakdown */}
      <div className="mt-2 space-y-1.5 pt-2 border-t border-black/[0.05] dark:border-white/[0.06]">
        {data.map((entry, idx) => {
          const hrs = Number(Number(entry.total_hours).toFixed(1));
          return (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: entry.warna_hex }}
                />
                <span className="text-[#1D1D1F] dark:text-[#E5E5EA] truncate">{entry.nama_kategori}</span>
              </div>
              <span className="text-[#6E6E73] dark:text-[#98989D] font-medium tabular-nums shrink-0 ml-2">
                {hrs}j
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

