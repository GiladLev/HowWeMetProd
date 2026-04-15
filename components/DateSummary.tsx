'use client';

import { motion } from 'framer-motion';
import { GAME_TITLES, type DatePlan } from '../types';

const PLAN_DISPLAY: { key: keyof DatePlan; gameNum: number }[] = [
  { key: 'inviter', gameNum: 1 },
  { key: 'dateTime', gameNum: 2 },
  { key: 'payment', gameNum: 3 },
  { key: 'foodStyle', gameNum: 4 },
  { key: 'dressCode', gameNum: 5 },
  { key: 'venueType', gameNum: 6 },
  { key: 'transportation', gameNum: 7 },
  { key: 'tabooTopic', gameNum: 8 },
  { key: 'firstDrink', gameNum: 9 },
  { key: 'crazyRule', gameNum: 10 },
];

export default function DateSummary({ datePlan }: { datePlan: DatePlan }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 font-sans"
    >
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-3xl border border-blue-200 p-6 shadow-lg shadow-blue-100">
        <div className="text-center mb-6">
          <span className="text-4xl block mb-2">📋</span>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">תוכנית הדייט שלכם</h2>
          <p className="text-sm text-gray-400 mt-1">כל מה שהחלטתם ב-10 המשחקים</p>
        </div>

        <div className="flex flex-col gap-3">
          {PLAN_DISPLAY.map(({ key, gameNum }, i) => {
            const value = datePlan[key];
            const meta = GAME_TITLES[gameNum];
            if (!value) return null;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100"
              >
                <span className="text-xl w-8 text-center shrink-0">{meta?.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-medium">{meta?.title}</p>
                  <p className="text-sm font-bold text-gray-800 truncate">{value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
