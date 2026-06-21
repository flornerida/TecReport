export const theme = {
  colors: {
    primary: '#2563EB', // Royal Blue
    primaryLight: '#3B82F6',
    primaryDark: '#1D4ED8',
    secondary: '#38bdf8', // Light Blue accent
    background: '#F5F7FA', // Off-white modern background
    surface: '#FFFFFF', // Cards and inputs background
    text: '#1E293B', // Slate 800 - dark text
    textMuted: '#64748B', // Slate 500 - secondary text
    border: '#E2E8F0', // Slate 200
    error: '#EF4444', // Red 500
    success: '#10B981', // Emerald 500
    warning: '#F59E0B', // Amber 500
  },
  typography: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semiBold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    round: 9999,
  },
  shadows: {
    soft: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: "#2563EB",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    }
  }
};
