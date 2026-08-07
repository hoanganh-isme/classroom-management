export const COUNTRY_CODES = [
  { code: '+84', label: '🇻🇳 +84', name: 'Vietnam', cca2: 'VN' },
  { code: '+1', label: '🇺🇸 +1', name: 'United States', cca2: 'US' },
  { code: '+44', label: '🇬🇧 +44', name: 'United Kingdom', cca2: 'GB' },
  { code: '+81', label: '🇯🇵 +81', name: 'Japan', cca2: 'JP' },
  { code: '+82', label: '🇰🇷 +82', name: 'South Korea', cca2: 'KR' },
  { code: '+65', label: '🇸🇬 +65', name: 'Singapore', cca2: 'SG' },
  { code: '+61', label: '🇦🇺 +61', name: 'Australia', cca2: 'AU' },
  { code: '+86', label: '🇨🇳 +86', name: 'China', cca2: 'CN' },
  { code: '+91', label: '🇮🇳 +91', name: 'India', cca2: 'IN' },
  { code: '+66', label: '🇹🇭 +66', name: 'Thailand', cca2: 'TH' },
  { code: '+60', label: '🇲🇾 +60', name: 'Malaysia', cca2: 'MY' },
  { code: '+62', label: '🇮🇩 +62', name: 'Indonesia', cca2: 'ID' },
  { code: '+63', label: '🇵🇭 +63', name: 'Philippines', cca2: 'PH' },
  { code: '+49', label: '🇩🇪 +49', name: 'Germany', cca2: 'DE' },
  { code: '+33', label: '🇫🇷 +33', name: 'France', cca2: 'FR' },
];

export const formatFullPhone = (countryCode, inputPhone) => {
  let cleaned = (inputPhone || '').trim();
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) return cleaned;
  cleaned = cleaned.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }
  return countryCode + cleaned;
};

export const parsePhoneInput = (fullPhone) => {
  if (!fullPhone) return { countryCode: '+84', phoneInput: '' };
  const trimmed = fullPhone.trim();
  for (const item of COUNTRY_CODES) {
    if (trimmed.startsWith(item.code)) {
      const rest = trimmed.slice(item.code.length);
      return { countryCode: item.code, phoneInput: rest ? (rest.startsWith('0') ? rest : '0' + rest) : '' };
    }
  }
  return { countryCode: '+84', phoneInput: trimmed };
};
