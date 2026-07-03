export interface District {
  label: string;
  value: string;
  talukas: string[];
}

export const MAHARASHTRA_DISTRICTS: District[] = [
  { label: 'Pune / पुणे',           value: 'Pune',         talukas: ['Baramati', 'Bhor', 'Daund', 'Haveli', 'Indapur', 'Junnar', 'Khed', 'Maval', 'Mulshi', 'Purandar', 'Shirur', 'Velhe'] },
  { label: 'Nashik / नाशिक',        value: 'Nashik',       talukas: ['Baglan', 'Chandwad', 'Deola', 'Dindori', 'Igatpuri', 'Kalwan', 'Malegaon', 'Nandgaon', 'Niphad', 'Peth', 'Sinnar', 'Surgana', 'Trimbak', 'Yeola'] },
  { label: 'Ahmednagar / नगर',       value: 'Ahmednagar',   talukas: ['Ahmednagar', 'Akole', 'Jamkhed', 'Karjat', 'Kopargaon', 'Nevasa', 'Parner', 'Pathardi', 'Rahata', 'Rahuri', 'Sangamner', 'Shevgaon', 'Shrirampur'] },
  { label: 'Solapur / सोलापूर',     value: 'Solapur',      talukas: ['Akkalkot', 'Barshi', 'Karmala', 'Madha', 'Malshiras', 'Mangalvedhe', 'Mohol', 'Pandharpur', 'Sangola', 'Solapur North', 'Solapur South'] },
  { label: 'Satara / सातारा',        value: 'Satara',       talukas: ['Jaoli', 'Khandala', 'Khatav', 'Koregaon', 'Mahabaleshwar', 'Man', 'Patan', 'Phaltan', 'Satara', 'Wai'] },
  { label: 'Sangli / सांगली',        value: 'Sangli',       talukas: ['Atpadi', 'Jat', 'Kadegaon', 'Kavathemahankal', 'Khanapur', 'Miraj', 'Palus', 'Shirala', 'Tasgaon', 'Walwa'] },
  { label: 'Kolhapur / कोल्हापूर',   value: 'Kolhapur',     talukas: ['Ajra', 'Bavda', 'Bhudargad', 'Chandgad', 'Gadhinglaj', 'Hatkanangale', 'Kagal', 'Karveer', 'Panhala', 'Radhanagari', 'Shahuwadi', 'Shirol'] },
  { label: 'Aurangabad / औरंगाबाद', value: 'Aurangabad',   talukas: ['Aurangabad', 'Gangapur', 'Kannad', 'Khuldabad', 'Paithan', 'Phulambri', 'Silod', 'Soegaon', 'Vaijapur'] },
  { label: 'Latur / लातूर',          value: 'Latur',        talukas: ['Ahmadpur', 'Ausa', 'Chakur', 'Deoni', 'Jalkot', 'Latur', 'Nilanga', 'Renapur', 'Udgir'] },
  { label: 'Nanded / नांदेड',        value: 'Nanded',       talukas: ['Ardhapur', 'Bhokar', 'Biloli', 'Deglur', 'Dharmabad', 'Hadgaon', 'Kandhar', 'Kinwat', 'Loha', 'Mukhed', 'Naigaon', 'Nanded', 'Umri'] },
  { label: 'Jalgaon / जळगाव',        value: 'Jalgaon',      talukas: ['Amalner', 'Bhadgaon', 'Bhusawal', 'Bodwad', 'Chalisgaon', 'Chopda', 'Dharangaon', 'Erandol', 'Jalgaon', 'Jamner', 'Muktainagar', 'Pachora', 'Parola', 'Raver', 'Yawal'] },
  { label: 'Yavatmal / यवतमाळ',      value: 'Yavatmal',     talukas: ['Arni', 'Babhulgaon', 'Darwha', 'Digras', 'Ghatanji', 'Kalamb', 'Kelapur', 'Mahagaon', 'Maregaon', 'Ner', 'Pusad', 'Ralegaon', 'Umarkhed', 'Wani', 'Yavatmal'] },
  { label: 'Amravati / अमरावती',     value: 'Amravati',     talukas: ['Achalpur', 'Amravati', 'Anjangaon Surji', 'Bhatkuli', 'Chandur Bazar', 'Chikhaldara', 'Daryapur', 'Dhamangaon', 'Morshi', 'Teosa', 'Tiwsa', 'Walgaon'] },
  { label: 'Nagpur / नागपूर',        value: 'Nagpur',       talukas: ['Bhiwapur', 'Hingna', 'Kamptee', 'Katol', 'Kuhi', 'Mauda', 'Nagpur Rural', 'Nagpur Urban', 'Narkhed', 'Parseoni', 'Ramtek', 'Savner', 'Umred'] },
  { label: 'Dhule / धुळे',           value: 'Dhule',        talukas: ['Dhule', 'Sakri', 'Shindkheda', 'Shirpur'] },
  { label: 'Nandurbar / नंदुरबार',   value: 'Nandurbar',    talukas: ['Akkalkuwa', 'Akrani', 'Nandurbar', 'Nawapur', 'Shahada', 'Talode'] },
  { label: 'Raigad / रायगड',         value: 'Raigad',       talukas: ['Alibag', 'Karjat', 'Khalapur', 'Mahad', 'Mangaon', 'Mhasla', 'Murud', 'Panvel', 'Pen', 'Poladpur', 'Roha', 'Shrivardhan', 'Sudhagad', 'Tala', 'Uran'] },
  { label: 'Other / इतर',            value: 'Other',        talukas: [] },
];

export function getTalukasByDistrict(districtValue: string): string[] {
  return MAHARASHTRA_DISTRICTS.find(d => d.value === districtValue)?.talukas ?? [];
}
