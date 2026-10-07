import React from 'react';
import { PublicQuestion } from '@/src/systems/questionSelector';

interface QuestionDiagramProps {
  visualPattern?: PublicQuestion['visualPattern'];
}

export const QuestionDiagram: React.FC<QuestionDiagramProps> = ({ visualPattern }) => {
  if (!visualPattern) return null;

  const { type, code } = visualPattern;

  return (
    <div className="my-2 p-3 rounded-xl bg-slate-900 border-2 border-slate-900 flex flex-col items-center justify-center">
      {type === 'cube_net' && (
        <div className="flex flex-col items-center gap-1.5">
          <svg width="230" height="125" viewBox="0 0 240 140">
            <g stroke="#F8FAFC" strokeWidth="2" fill="#1E293B">
              <rect x="60" y="15" width="35" height="35" rx="3" />
              <rect x="60" y="50" width="35" height="35" rx="3" />
              <rect x="60" y="85" width="35" height="35" rx="3" />
              <rect x="95" y="50" width="35" height="35" rx="3" />
              <rect x="130" y="50" width="35" height="35" rx="3" />
              <rect x="165" y="50" width="35" height="35" rx="3" />
            </g>
            <text x="77.5" y="38" textAnchor="middle" fill="#FBBF24" fontSize="14" fontWeight="bold">
              {code === 'NET-3' ? '×' : '★'}
            </text>
            <text x="77.5" y="73" textAnchor="middle" fill="#38BDF8" fontSize="13" fontWeight="bold">
              {code === 'NET-3' ? '1' : '●'}
            </text>
            <text x="112.5" y="73" textAnchor="middle" fill="#F8FAFC" fontSize="13" fontWeight="bold">
              {code === 'NET-3' ? '2' : '▲'}
            </text>
            <text x="147.5" y="73" textAnchor="middle" fill="#34D399" fontSize="13" fontWeight="bold">
              {code === 'NET-3' ? 'X' : '■'}
            </text>
            <text x="182.5" y="73" textAnchor="middle" fill="#F472B6" fontSize="13" fontWeight="bold">
              {code === 'NET-3' ? 'Y' : '◆'}
            </text>
            <text x="77.5" y="108" textAnchor="middle" fill="#A78BFA" fontSize="13" fontWeight="bold">
              {code === 'NET-3' ? '•' : '♥'}
            </text>
          </svg>
          <span className="text-[11px] text-slate-300">
            แผ่นคลี่ลูกบาศก์ 6 หน้า (พับตั้งฉาก 90°)
          </span>
        </div>
      )}

      {type === 'odd_one_out' && (
        <div className="flex flex-col items-center gap-1.5">
          <svg width="250" height="80" viewBox="0 0 260 90">
            {[0, 1, 2, 3].map((idx) => {
              const x = 15 + idx * 60;
              return (
                <g key={idx} transform={`translate(${x}, 8)`}>
                  <rect width="50" height="50" rx="8" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
                  <g
                    transform={
                      idx === 0
                        ? 'translate(25,25) scale(-1, 1)'
                        : `translate(25,25) rotate(${idx * 90})`
                    }
                  >
                    <path
                      d="M-8,-12 L-8,10 L10,10"
                      stroke={idx === 0 ? '#F59E0B' : '#38BDF8'}
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="10" cy="10" r="3.5" fill="#FBBF24" />
                  </g>
                  <text x="25" y="72" textAnchor="middle" fill="#E2E8F0" fontSize="11">
                    ภาพ {idx + 1}
                  </text>
                </g>
              );
            })}
          </svg>
          <span className="text-[11px] text-slate-300">
            เปรียบเทียบการหมุนในระนาบ 2 มิติ กับการสะท้อนกระจก
          </span>
        </div>
      )}

      {type === 'rotation_3d' && (
        <div className="flex flex-col items-center gap-1.5">
          <svg width="230" height="95" viewBox="0 0 240 110">
            <g transform="translate(75, 16)" stroke="#0F172A" strokeWidth="1.5">
              <polygon points="45,0 85,20 45,40 5,20" fill="#F8FAFC" />
              <polygon points="5,20 45,40 45,80 5,60" fill="#EF4444" />
              <polygon points="45,40 85,20 85,60 45,80" fill="#3B82F6" />
            </g>
            <path
              d="M 175 45 C 195 45, 195 75, 175 75"
              stroke="#FBBF24"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <polygon points="175,71 168,75 175,79" fill="#FBBF24" />
            <text x="188" y="36" fill="#FBBF24" fontSize="11" fontWeight="600">
              90°
            </text>
          </svg>
          <span className="text-[11px] text-slate-300">
            การหมุนรูปทรง 3 มิติ (บน=ขาว · หน้า=แดง · ขวา=น้ำเงิน)
          </span>
        </div>
      )}

      {type === 'shape_assembly' && (
        <div className="flex flex-col items-center gap-1.5">
          <svg width="240" height="80" viewBox="0 0 250 95">
            <polygon points="25,70 25,20 75,70" fill="#38BDF8" stroke="#E0F2FE" strokeWidth="1.5" />
            <text x="92" y="50" fill="#E2E8F0" fontSize="18" fontWeight="bold">+</text>
            <polygon points="115,20 165,20 165,70" fill="#34D399" stroke="#D1FAE5" strokeWidth="1.5" />
            <text x="180" y="50" fill="#E2E8F0" fontSize="18" fontWeight="bold">=</text>
            <rect x="198" y="22" width="46" height="46" fill="#F59E0B" fillOpacity="0.25" stroke="#FBBF24" strokeWidth="2" strokeDasharray="4 2" />
          </svg>
          <span className="text-[11px] text-slate-300">
            การประกอบชิ้นส่วนเรขาคณิตเข้าด้วยกัน
          </span>
        </div>
      )}

      {type === 'figure_series' && (
        <div className="flex flex-col items-center gap-1.5">
          <svg width="250" height="75" viewBox="0 0 260 85">
            {[0, 1, 2, 3].map((idx) => {
              const x = 12 + idx * 62;
              return (
                <g key={idx} transform={`translate(${x}, 10)`}>
                  <rect width="52" height="52" rx="8" fill="#1E293B" stroke={idx === 3 ? '#F59E0B' : '#64748B'} strokeWidth="2" />
                  {idx < 3 ? (
                    <>
                      <polygon
                        points={
                          idx === 0
                            ? '26,10 42,40 10,40'
                            : idx === 1
                            ? '12,12 40,12 40,40 12,40'
                            : '26,9 43,22 36,42 16,42 9,22'
                        }
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth="2"
                      />
                      <text x="26" y="32" textAnchor="middle" fill="#FBBF24" fontSize="12" fontWeight="bold">
                        {idx + 1}•
                      </text>
                    </>
                  ) : (
                    <text x="26" y="33" textAnchor="middle" fill="#FBBF24" fontSize="20" fontWeight="bold">
                      ?
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          <span className="text-[11px] text-slate-300">
            อนุกรมภาพ: วิเคราะห์การเปลี่ยนแปลงทีละขั้น
          </span>
        </div>
      )}

      {type === 'figure_analogy' && (
        <div className="flex flex-col items-center gap-1.5">
          <svg width="250" height="72" viewBox="0 0 260 80">
            <circle cx="35" cy="40" r="20" fill="#F8FAFC" />
            <text x="70" y="45" fill="#E2E8F0" fontSize="16" fontWeight="bold">:</text>
            <circle cx="98" cy="40" r="10" fill="#0F172A" stroke="#F8FAFC" strokeWidth="2" />
            <text x="130" y="45" fill="#F59E0B" fontSize="16" fontWeight="bold">::</text>
            <rect x="152" y="20" width="40" height="40" fill="#F8FAFC" rx="3" />
            <text x="208" y="45" fill="#E2E8F0" fontSize="16" fontWeight="bold">:</text>
            <rect x="224" y="26" width="28" height="28" fill="#1E293B" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 2" rx="3" />
            <text x="238" y="45" textAnchor="middle" fill="#FBBF24" fontSize="14" fontWeight="bold">?</text>
          </svg>
          <span className="text-[11px] text-slate-300">
            อุปมาอุปไมยภาพ (A : B :: C : ?)
          </span>
        </div>
      )}
    </div>
  );
};
