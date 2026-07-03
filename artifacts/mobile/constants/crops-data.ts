export interface CropData {
  name: string;
  mr: string;
  hi: string;
  emoji: string;
  color: string;
  bgColor: string;
}

export const CROP_LIST: CropData[] = [
  { name: 'Wheat',       mr: 'गहू',       hi: 'गेहूं',    emoji: '🌾', color: '#D97706', bgColor: '#FEF3C7' },
  { name: 'Rice',        mr: 'तांदूळ',     hi: 'चावल',    emoji: '🍚', color: '#059669', bgColor: '#D1FAE5' },
  { name: 'Sugarcane',   mr: 'ऊस',         hi: 'गन्ना',    emoji: '🌿', color: '#047857', bgColor: '#ECFDF5' },
  { name: 'Cotton',      mr: 'कापूस',      hi: 'कपास',    emoji: '☁️', color: '#0284C7', bgColor: '#E0F2FE' },
  { name: 'Soybean',     mr: 'सोयाबीन',    hi: 'सोयाबीन', emoji: '🫘', color: '#65A30D', bgColor: '#F7FEE7' },
  { name: 'Onion',       mr: 'कांदा',      hi: 'प्याज',   emoji: '🧅', color: '#7C3AED', bgColor: '#EDE9FE' },
  { name: 'Tomato',      mr: 'टोमॅटो',     hi: 'टमाटर',   emoji: '🍅', color: '#DC2626', bgColor: '#FEE2E2' },
  { name: 'Potato',      mr: 'बटाटा',      hi: 'आलू',     emoji: '🥔', color: '#92400E', bgColor: '#FEF3C7' },
  { name: 'Maize',       mr: 'मका',        hi: 'मक्का',   emoji: '🌽', color: '#B45309', bgColor: '#FEF9C3' },
  { name: 'Groundnut',   mr: 'शेंगदाणे',   hi: 'मूंगफली', emoji: '🥜', color: '#92400E', bgColor: '#FEF9C3' },
  { name: 'Turmeric',    mr: 'हळद',        hi: 'हल्दी',   emoji: '🌕', color: '#D97706', bgColor: '#FFFBEB' },
  { name: 'Chilli',      mr: 'मिरची',      hi: 'मिर्च',   emoji: '🌶️', color: '#DC2626', bgColor: '#FFF1F2' },
  { name: 'Gram',        mr: 'हरभरा',      hi: 'चना',     emoji: '🫘', color: '#65A30D', bgColor: '#F7FEE7' },
  { name: 'Jowar',       mr: 'ज्वारी',     hi: 'ज्वार',   emoji: '🌾', color: '#B45309', bgColor: '#FEF3C7' },
  { name: 'Bajra',       mr: 'बाजरी',      hi: 'बाजरा',   emoji: '🌾', color: '#D97706', bgColor: '#FFFBEB' },
  { name: 'Mango',       mr: 'आंबा',       hi: 'आम',      emoji: '🥭', color: '#D97706', bgColor: '#FEF3C7' },
  { name: 'Banana',      mr: 'केळी',       hi: 'केला',    emoji: '🍌', color: '#CA8A04', bgColor: '#FEF9C3' },
  { name: 'Grapes',      mr: 'द्राक्षे',   hi: 'अंगूर',   emoji: '🍇', color: '#7C3AED', bgColor: '#EDE9FE' },
  { name: 'Pomegranate', mr: 'डाळिंब',     hi: 'अनार',    emoji: '🍎', color: '#DC2626', bgColor: '#FFF1F2' },
  { name: 'Other',       mr: 'इतर',        hi: 'अन्य',    emoji: '🌱', color: '#6B7280', bgColor: '#F3F4F6' },
];

/** Return CROP_LIST entry matching by English name, Marathi, Hindi, or partial match */
export function findCropData(name: string): CropData {
  const lower = name.toLowerCase();
  return (
    CROP_LIST.find(
      c =>
        c.name.toLowerCase() === lower ||
        c.mr === name ||
        c.hi === name ||
        lower.includes(c.name.toLowerCase()),
    ) ?? CROP_LIST[CROP_LIST.length - 1]
  );
}
