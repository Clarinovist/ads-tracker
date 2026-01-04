// Predefined color palette for business cards
export const BUSINESS_COLORS = [
    { name: 'Blue', value: '#3B82F6', light: '#DBEAFE' },
    { name: 'Purple', value: '#8B5CF6', light: '#EDE9FE' },
    { name: 'Pink', value: '#EC4899', light: '#FCE7F3' },
    { name: 'Green', value: '#10B981', light: '#D1FAE5' },
    { name: 'Orange', value: '#F59E0B', light: '#FEF3C7' },
    { name: 'Red', value: '#EF4444', light: '#FEE2E2' },
    { name: 'Teal', value: '#14B8A6', light: '#CCFBF1' },
    { name: 'Indigo', value: '#6366F1', light: '#E0E7FF' },
] as const;

export type BusinessColor = typeof BUSINESS_COLORS[number];
