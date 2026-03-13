// Translation dictionary for all supported languages
export const translations: Record<string, Record<string, string>> = {
  en: {
    // Navbar
    home: 'Home',
    dashboard: 'Dashboard',
    newComplaint: 'New Complaint',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    
    // Dashboard
    greeting: 'Namaste',
    trackComplaints: 'Track and manage your civic complaints.',
    newComplaintBtn: 'File New Complaint',
    recentComplaints: 'Recent Complaints',
    noComplaints: 'No complaints found',
    searchComplaints: 'Search complaints...',
    filterComplaints: 'Filter',
    
    // Stats
    totalComplaints: 'Total Complaints',
    pending: 'Pending',
    active: 'Active',
    resolved: 'Resolved',
    
    // Complaint List
    complaintNumber: 'Complaint #',
    title: 'Title',
    status: 'Status',
    date: 'Date',
    viewDetails: 'View Details',
    
    // Status Display
    statusSubmitted: 'Submitted',
    statusProcessing: 'Processing',
    statusUnderReview: 'Under Review',
    statusInProgress: 'In Progress',
    statusResolved: 'Resolved',
    
    // Complaint Detail
    complaintDetails: 'Complaint Details',
    complaintDescription: 'Description',
    location: 'Location',
    aiAnalysis: 'AI Analysis',
    category: 'Category',
    severity: 'Severity',
    assignedDept: 'Assigned Department',
    reasoning: 'Reasoning',
    timeline: 'Timeline',
    mediaProof: 'Media Proof',
    
    // Form
    complaintForm: 'File a Complaint',
    step: 'Step',
    details: 'Details',
    locationInfo: 'Location',
    evidence: 'Evidence',
    complaintTitle: 'Complaint Title',
    formDescription: 'Description',
    useMyLocation: 'Use My Location',
    manualLocation: 'Manual Location',
    uploadFiles: 'Upload Files',
    submit: 'Submit',
    next: 'Next',
    previous: 'Previous',
    
    // Heatmap
    heatmap: 'Heatmap',
    allComplaints: 'All Complaints',
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    priority: 'Priority',
    
    // Emergency
    emergency: 'Emergency',
    sos: 'SOS',
    
    // Auth
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
    phone: 'Phone Number',
    otp: 'OTP',
    sendOtp: 'Send OTP',
    verifyOtp: 'Verify OTP',
    
    // Messages
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    tryAgain: 'Try Again',
    
    // Home Page
    connecting: 'Connecting citizens to municipal care.',
    reportDescription: 'Report potholes, water leaks, and garbage issues directly to your municipal corporation. AI-powered classification and real-time tracking until the job is done.',
    reportIssue: 'Report an Issue',
    viewHeatmap: 'View Heatmap',
    smartReporting: 'Smart Reporting',
    smartReportingDesc: 'Pin the exact location and upload photos. Our AI does the rest.',
    aiRouting: 'AI Routing',
    aiRoutingDesc: 'Gemini AI automatically classifies and routes your complaint to the right department.',
    realtimeTracking: 'Real-time Tracking',
    realtimeTrackingDesc: 'Get live updates as officers work on your complaint. Transparency at every step.',
  },
  hi: {
    // Navbar
    home: 'होम',
    dashboard: 'डैशबोर्ड',
    newComplaint: 'नई शिकायत',
    logout: 'लॉगआउट',
    login: 'लॉगिन',
    register: 'रजिस्टर',
    
    // Dashboard
    greeting: 'नमस्ते',
    trackComplaints: 'अपनी नागरिक शिकायतों को ट्रैक करें और प्रबंधित करें।',
    newComplaintBtn: 'नई शिकायत दर्ज करें',
    recentComplaints: 'हाल की शिकायतें',
    noComplaints: 'कोई शिकायत नहीं मिलीं',
    searchComplaints: 'शिकायतें खोजें...',
    filterComplaints: 'फ़िल्टर',
    
    // Stats
    totalComplaints: 'कुल शिकायतें',
    pending: 'लंबित',
    active: 'सक्रिय',
    resolved: 'समाधान किया गया',
    
    // Complaint List
    complaintNumber: 'शिकायत #',
    title: 'शीर्षक',
    status: 'स्थिति',
    date: 'तारीख',
    viewDetails: 'विवरण देखें',
    
    // Status Display
    statusSubmitted: 'जमा किया गया',
    statusProcessing: 'प्रक्रिया में',
    statusUnderReview: 'समीक्षा के तहत',
    statusInProgress: 'प्रगति में',
    statusResolved: 'समाधान किया गया',
    
    // Complaint Detail
    complaintDetails: 'शिकायत का विवरण',
    complaintDescription: 'विवरण',
    location: 'स्थान',
    aiAnalysis: 'एआई विश्लेषण',
    category: 'श्रेणी',
    severity: 'गंभीरता',
    assignedDept: 'निर्दिष्ट विभाग',
    reasoning: 'कारण',
    timeline: 'समयरेखा',
    mediaProof: 'मीडिया सबूत',
    
    // Form
    complaintForm: 'एक शिकायत दर्ज करें',
    step: 'चरण',
    details: 'विवरण',
    locationInfo: 'स्थान',
    evidence: 'साक्ष्य',
    complaintTitle: 'शिकायत का शीर्षक',
    formDescription: 'विवरण',
    useMyLocation: 'मेरा स्थान उपयोग करें',
    manualLocation: 'मैनुअल स्थान',
    uploadFiles: 'फाइलें अपलोड करें',
    submit: 'जमा करें',
    next: 'आगे',
    previous: 'पिछला',
    
    // Heatmap
    heatmap: 'हीटमैप',
    allComplaints: 'सभी शिकायतें',
    critical: 'गंभीर',
    high: 'उच्च',
    medium: 'मध्यम',
    low: 'काम',
    priority: 'प्राथमिकता',
    
    // Emergency
    emergency: 'आपातकाल',
    sos: 'एसओएस',
    
    // Auth
    email: 'ईमेल',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    fullName: 'पूरा नाम',
    phone: 'फोन नंबर',
    otp: 'ओटीपी',
    sendOtp: 'ओटीपी भेजें',
    verifyOtp: 'ओटीपी सत्यापित करें',
    
    // Messages
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफल',
    tryAgain: 'फिर से कोशिश करें',
    
    // Home Page
    connecting: 'नागरिकों को नगर निगम की सेवा से जोड़ना।',
    reportDescription: 'सीधे अपने नगर निगम को सड़क के गड्ढों, जल रिसाव और कचरे की समस्याओं की रिपोर्ट करें। एआई-संचालित वर्गीकरण और रियल-टाइम ट्रैकिंग।',
    reportIssue: 'समस्या की रिपोर्ट करें',
    viewHeatmap: 'हीटमैप देखें',
    smartReporting: 'स्मार्ट रिपोर्टिंग',
    smartReportingDesc: 'सटीक स्थान चिन्हित करें और फोटो अपलोड करें। बाकी हमारा एआई करेगा।',
    aiRouting: 'एआई रूटिंग',
    aiRoutingDesc: 'जेमिनी एआई स्वचालित रूप से आपकी शिकायत को सही विभाग में भेजता है।',
    realtimeTracking: 'रियल-टाइम ट्रैकिंग',
    realtimeTrackingDesc: 'जैसे ही अधिकारी आपकी शिकायत पर काम करें, लाइव अपडेट प्राप्त करें।',
  },
  mr: {
    home: 'मुख्यपृष्ठ',
    dashboard: 'डॅशबोर्ड',
    newComplaint: 'नवीन तक्रार',
    greeting: 'नमस्कार',
    trackComplaints: 'आपल्या नागरिक तक्रारींचे निरीक्षण आणि व्यवस्थापन करा.',
    newComplaintBtn: 'नवीन तक्रार दाखल करा',
    recentComplaints: 'अलीकडील तक्रारी',
    noComplaints: 'कोणत्याही तक्रारी सापडल्या नाहीत',
    totalComplaints: 'एकूण तक्रारी',
    pending: 'प्रलंबित',
    active: 'सक्रिय',
    resolved: 'निराकृत',
    submit: 'सबमिट करा',
    logout: 'लॉगआउट',
  },
  gu: {
    home: 'હોમ',
    dashboard: 'ડેશબોર્ડ',
    newComplaint: 'નવી ફરિયાદ',
    greeting: 'નમસ્તે',
    trackComplaints: 'તમારી નાગરિક ફરિયાદોનો ત્રાક કરો અને સંચાલન કરો.',
    newComplaintBtn: 'નવી ફરિયાદ દાખલ કરો',
    recentComplaints: 'તાજેતરની ફરિયાદો',
    submit: 'સબમિટ કરો',
    logout: 'લૉગઆઉટ',
  },
  ta: {
    home: 'முகப்பு',
    dashboard: 'டாஷ்போர்ட்',
    newComplaint: 'புதிய புகார்',
    greeting: 'வணக்கம்',
    trackComplaints: 'உங்கள் பொதுமக்கள் புகார்களைக் கண்காணிக்கவும் மற்றும் நிர்வகிக்கவும்.',
    submit: 'சமர்ப்பிக்கவும்',
    logout: 'வெளியேறு',
  },
  te: {
    home: 'ముख్యపేజీ',
    dashboard: 'డ్యాష్‌బోర్డ్',
    newComplaint: 'కొత్త ఫిర్యాదు',
    greeting: 'నమస్తే',
    submit: 'సమర్పించు',
    logout: 'లాగ్ అవుట్',
  },
  kn: {
    home: 'ಮುಖ್ಯಪೃಷ್ಠ',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    newComplaint: 'ಹೊಸ ದೂರು',
    greeting: 'ನಮಸ್ತೆ',
    submit: 'ಸಲ್ಲಿಸು',
    logout: 'ಲಾಗ್ ಔಟ್',
  },
  ml: {
    home: 'ഹോം',
    dashboard: 'ഡാഷ്‌ബോർഡ്',
    newComplaint: 'പുതിയ പരാതി',
    greeting: 'നമസ്കാരം',
    submit: 'സമർപ്പിക്കുക',
    logout: 'ലോഗ് ഔട്ട്',
  },
  es: {
    home: 'Inicio',
    dashboard: 'Panel',
    newComplaint: 'Nueva Queja',
    greeting: 'Hola',
    trackComplaints: 'Rastrear y administrar sus quejas cívicas.',
    submit: 'Enviar',
    logout: 'Cerrar sesión',
  },
  fr: {
    home: 'Accueil',
    dashboard: 'Tableau de bord',
    newComplaint: 'Nouvelle Plainte',
    greeting: 'Bonjour',
    submit: 'Soumettre',
    logout: 'Déconnecter',
  },
  de: {
    home: 'Startseite',
    dashboard: 'Armaturenbrett',
    newComplaint: 'Neue Beschwerde',
    greeting: 'Hallo',
    submit: 'Absenden',
    logout: 'Abmelden',
  },
  pt: {
    home: 'Início',
    dashboard: 'Painel',
    newComplaint: 'Nova Reclamação',
    greeting: 'Olá',
    submit: 'Enviar',
    logout: 'Sair',
  },
  ja: {
    home: 'ホーム',
    dashboard: 'ダッシュボード',
    newComplaint: '新しい苦情',
    greeting: 'こんにちは',
    submit: '送信',
    logout: 'ログアウト',
  },
  zh: {
    home: '首页',
    dashboard: '仪表板',
    newComplaint: '新投诉',
    greeting: '你好',
    submit: '提交',
    logout: '登出',
  },
};

export const getTranslation = (language: string, key: string): string => {
  return translations[language]?.[key] || translations.en[key] || key;
};
