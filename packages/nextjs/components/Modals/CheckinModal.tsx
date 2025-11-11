"use client";

import { I18N } from "~~/constants/i18n";

interface CheckinModalProps {
  open: boolean;
  onClose: () => void;
  onCheckin: () => void;
  checkinLastDate: string;
  checkinRecords: Record<string, number[]>;
  language: string;
}

// Helper functions
function getYearMonthStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${m.toString().padStart(2, "0")}`;
}

function getAllDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function hasCheckedInToday(checkinLastDate: string): boolean {
  if (!checkinLastDate) return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
  return checkinLastDate === todayStr;
}

export function CheckinModal({
  open,
  onClose,
  onCheckin,
  checkinLastDate,
  checkinRecords,
  language,
}: CheckinModalProps) {
  const t = (key: string): string => {
    const langData = I18N[language as keyof typeof I18N];
    return (langData?.[key as keyof typeof langData] as string) || I18N.zh[key as keyof typeof I18N.zh] || key;
  };

  if (!open) return null;
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = getAllDaysInMonth(year, month);
  const yearMonth = getYearMonthStr();
  const checkedDays = checkinRecords[yearMonth] || [];
  const hasCheckedIn = hasCheckedInToday(checkinLastDate);

  let weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  if (language === "en") weekdays = ["S", "M", "T", "W", "T", "F", "S"];
  if (language === "ko") weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-[min(600px,95vw)] rounded-2xl border shadow-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-lg">{t("checkin")}</div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            ✖
          </button>
        </div>
        <div className="text-sm text-slate-600 mb-3">
          {hasCheckedIn ? (
            <span className="text-emerald-600">✓ {t("checkinTodayCompleted")}</span>
          ) : (
            <span>{t("checkinClickToGet")}</span>
          )}
        </div>
        <div className="mb-4">
          <div className="font-medium mb-2">
            {language === "en"
              ? `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month]} ${year}`
              : language === "ko"
                ? `${year}년 ${month + 1}월`
                : `${year}年${month + 1}月`}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekdays.map(day => (
              <div key={day} className="text-center text-xs text-slate-500 py-1">
                {day}
              </div>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isChecked = checkedDays.includes(dayNum);
              const isToday = dayNum === today.getDate();
              return (
                <div
                  key={dayNum}
                  className={`aspect-square rounded-lg border flex items-center justify-center text-xs relative ${
                    isChecked
                      ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                      : isToday
                        ? "bg-amber-100 border-amber-300 text-amber-700"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  {dayNum}
                  {isChecked && <div className="absolute top-0 right-0 text-emerald-600">✓</div>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (!hasCheckedIn) {
                onCheckin();
              }
            }}
            disabled={hasCheckedIn}
            className={`flex-1 px-3 py-1.5 rounded-lg border ${hasCheckedIn ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-emerald-100 hover:bg-emerald-200 text-emerald-700"}`}
          >
            {hasCheckedIn ? t("checkinAlready") : t("checkinNow")}
          </button>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50">
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
