import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Flame,
  LogOut,
  Ticket,
  Printer,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  RefreshCw,
  Key,
  Shield,
  Trash2,
  X,
  FileText,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { DevoteeUser, Registration } from '../types/yagya';

interface DevoteeTicketsPortalProps {
  currentUser: DevoteeUser | null;
  setCurrentUser: (user: DevoteeUser | null) => void;
  devotees: DevoteeUser[];
  setDevotees: React.Dispatch<React.SetStateAction<DevoteeUser[]>>;
  registrations: Registration[];
  onOpenSlip: (reg: Registration) => void;
  onBookNew: () => void;
  onLogout?: () => void;
  onGoHome?: () => void;
}

export const DevoteeTicketsPortal: React.FC<DevoteeTicketsPortalProps> = ({
  currentUser,
  setCurrentUser,
  devotees,
  setDevotees,
  registrations,
  onOpenSlip,
  onBookNew,
  onLogout,
  onGoHome,
}) => {
  // Navigation / Tab state
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeTab, setActiveTab] = useState<'tickets' | 'profile' | 'password' | 'security'>('tickets');

  // Sign In State
  const [loginIdent, setLoginIdent] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Sign Up State
  const [signupFullName, setSignupFullName] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupCity, setSignupCity] = useState('नोएडा');
  const [signupGotra, setSignupGotra] = useState('');
  const [signupAgreeTerms, setSignupAgreeTerms] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpTargetEmail, setOtpTargetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpDeliveryConfigured, setOtpDeliveryConfigured] = useState(true);
  const [otpDebugCode, setOtpDebugCode] = useState<string | null>(null);
  const [otpResendCountdown, setOtpResendCountdown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1); // 1: Request, 2: Verify OTP, 3: Reset Pass
  const [forgotIdent, setForgotIdent] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotResetAuthToken, setForgotResetAuthToken] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPass, setShowForgotNewPass] = useState(false);
  const [forgotDeliveryConfigured, setForgotDeliveryConfigured] = useState(true);
  const [forgotDebugCode, setForgotDebugCode] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Profile Edit State
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editGotra, setEditGotra] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrPass, setShowCurrPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [changePassSuccess, setChangePassSuccess] = useState('');
  const [changePassError, setChangePassError] = useState('');

  // Delete Account State
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Live Tickets State
  const [liveTickets, setLiveTickets] = useState<Registration[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState('');

  // Initialize profile form when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setEditFullName(currentUser.fullName || '');
      setEditEmail(currentUser.email || '');
      setEditCity(currentUser.city || 'नोएडा');
      setEditGotra(currentUser.gotra || '');
    }
  }, [currentUser]);

  // Resend OTP countdown effect
  useEffect(() => {
    if (otpResendCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpResendCountdown]);

  // Fetch devotee's private bookings from backend
  const fetchMyTickets = useCallback(async () => {
    if (!currentUser) return;
    const token = localStorage.getItem('yagya_devotee_token');
    if (!token) return;

    setTicketsLoading(true);
    setTicketsError('');
    try {
      const res = await fetch('/api/user/my-tickets', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tickets)) {
          setLiveTickets(data.tickets);
        }
      } else if (res.status === 401) {
        // Session expired
        handleLogout();
      }
    } catch (e) {
      // Offline fallback: filter from global registrations props
    } finally {
      setTicketsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchMyTickets();
    }
  }, [currentUser, fetchMyTickets]);

  // Combined tickets: prefer live server tickets, fallback to local registrations matching user
  const displayBookings = useMemo(() => {
    if (!currentUser) return [];
    if (liveTickets.length > 0) return liveTickets;
    return registrations.filter(
      (r) => (r.userId && r.userId === currentUser.id) || r.mobile === currentUser.mobile
    );
  }, [currentUser, liveTickets, registrations]);

  // ==========================================
  // AUTH ACTION 1: SIGN IN (EMAIL OR MOBILE)
  // ==========================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const cleanIdent = loginIdent.trim();
    if (!cleanIdent) {
      setLoginError('कृपया अपना पंजीकृत मोबाइल नंबर अथवा ईमेल आईडी दर्ज करें।');
      return;
    }
    if (!loginPassword) {
      setLoginError('कृपया अपना साधक पासवर्ड दर्ज करें।');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanIdent, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'लॉगिन विफल रहा। कृपया सही विवरण दर्ज करें।');
        setLoginLoading(false);
        return;
      }

      // Store persistent session token and clean user profile (NO plaintext password in storage!)
      localStorage.setItem('yagya_devotee_token', data.token);
      localStorage.setItem('yagya_devotee_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      setLoginPassword('');
    } catch (err: any) {
      // Local fallback in case server is unreachable
      const cleanMob = cleanIdent.replace(/\D/g, '').slice(-10);
      const found = devotees.find(
        (d) => (d.mobile === cleanMob || d.email === cleanIdent) && d.password === loginPassword
      );
      if (found) {
        setCurrentUser(found);
        localStorage.setItem('yagya_devotee_user', JSON.stringify(found));
      } else {
        setLoginError('सर्वर से संपर्क नहीं हो सका। कृपया इंटरनेट कनेक्शन जांचें।');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // ==========================================
  // AUTH ACTION 2: SIGN UP
  // ==========================================
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (signupFullName.trim().length < 2) {
      setSignupError('कृपया मुख्य यजमान का पूरा नाम दर्ज करें (कम से कम 2 अक्षर)।');
      return;
    }

    const cleanMob = signupMobile.replace(/\D/g, '').slice(-10);
    if (cleanMob.length !== 10) {
      setSignupError('कृपया वैध 10-अंकों का भारतीय मोबाइल नंबर दर्ज करें।');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail.trim())) {
      setSignupError('कृपया एक वैध ईमेल पता (उदा. devotee@example.com) दर्ज करें।');
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError('पासवर्ड न्यूनतम 6 अक्षरों का होना अनिवार्य है।');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('पासवर्ड एवं पुष्टि पासवर्ड मेल नहीं खाते हैं।');
      return;
    }

    if (!signupAgreeTerms) {
      setSignupError('कृपया आगे बढ़ने के लिए महायज्ञ नियम एवं गोपनीयता नीति स्वीकार करें।');
      return;
    }

    setSignupLoading(true);
    try {
      const res = await fetch('/api/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: signupFullName.trim(),
          mobile: cleanMob,
          email: signupEmail.trim(),
          password: signupPassword,
          confirmPassword: signupConfirmPassword,
          city: signupCity.trim() || 'नोएडा',
          gotra: signupGotra.trim() || undefined,
          agreeTerms: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSignupError(data.error || 'पंजीकरण अनुरोध विफल रहा।');
        setSignupLoading(false);
        return;
      }

      // Open OTP Verification Modal
      setOtpIdentifier(cleanMob);
      setOtpTargetEmail(signupEmail.trim());
      setOtpDeliveryConfigured(Boolean(data.deliveryConfigured));
      setOtpDebugCode(data.debugOtp || null);
      setOtpCode('');
      setOtpError('');
      setOtpSuccess(data.message || 'सत्यापन कोड भेजा गया।');
      setOtpResendCountdown(30);
      setShowOtpModal(true);
    } catch (err: any) {
      setSignupError('सर्वर से संपर्क करने में असमर्थ। कृपया पुनः प्रयास करें।');
    } finally {
      setSignupLoading(false);
    }
  };

  // ==========================================
  // AUTH ACTION 3: VERIFY SIGNUP OTP
  // ==========================================
  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpError('कृपया 6-अंकों का सत्यापन कोड दर्ज करें।');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await fetch('/api/user/verify-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: otpIdentifier,
          otp: otpCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'अमान्य OTP कोड। कृपया पुनः प्रयास करें।');
        setOtpLoading(false);
        return;
      }

      // Successful activation! Store session
      localStorage.setItem('yagya_devotee_token', data.token);
      localStorage.setItem('yagya_devotee_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      setShowOtpModal(false);
      setSignupPassword('');
      setSignupConfirmPassword('');
    } catch (err: any) {
      setOtpError('सत्यापन प्रक्रिया में त्रुटि। कृपया पुनः प्रयास करें।');
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend Signup OTP
  const handleResendSignupOtp = async () => {
    if (otpResendCountdown > 0) return;
    setOtpError('');
    setOtpSuccess('');
    try {
      const res = await fetch('/api/user/resend-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: otpIdentifier }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSuccess(data.message || 'नया सत्यापन कोड भेज दिया गया है।');
        if (data.debugOtp) setOtpDebugCode(data.debugOtp);
        setOtpResendCountdown(30);
      } else {
        setOtpError(data.error || 'OTP पुनः प्रेषण में त्रुटि।');
      }
    } catch (e) {
      setOtpError('नेटवर्क त्रुटि: OTP पुनः नहीं भेजा जा सका।');
    }
  };

  // ==========================================
  // AUTH ACTION 4: FORGOT PASSWORD RECOVERY
  // ==========================================
  const handleRequestForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    const clean = forgotIdent.trim();
    if (!clean) {
      setForgotError('कृपया पंजीकृत मोबाइल नंबर अथवा ईमेल आईडी दर्ज करें।');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/user/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: clean }),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || 'पासवर्ड रीसेट अनुरोध विफल रहा।');
        setForgotLoading(false);
        return;
      }

      setForgotDeliveryConfigured(Boolean(data.deliveryConfigured));
      setForgotDebugCode(data.debugCode || null);
      setForgotSuccess(data.message || 'सत्यापन कोड जनरेट हो गया है।');
      setForgotStep(2);
    } catch (err) {
      setForgotError('सर्वर से संपर्क में त्रुटि।');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setForgotError('कृपया 6-अंकों का OTP कोड दर्ज करें।');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/user/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: forgotIdent.trim(),
          otp: forgotOtp.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || 'अमान्य OTP कोड।');
        setForgotLoading(false);
        return;
      }

      setForgotResetAuthToken(data.resetAuthToken);
      setForgotSuccess('OTP सत्यापित हुआ! अब नया पासवर्ड बनाएं।');
      setForgotStep(3);
    } catch (err) {
      setForgotError('सत्यापन प्रक्रिया में त्रुटि।');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (forgotNewPassword.length < 6) {
      setForgotError('नया पासवर्ड न्यूनतम 6 अक्षरों का होना अनिवार्य है।');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('दोनों पासवर्ड मेल नहीं खाते हैं।');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetAuthToken: forgotResetAuthToken,
          newPassword: forgotNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || 'पासवर्ड रीसेट विफल रहा।');
        setForgotLoading(false);
        return;
      }

      alert('✓ आपका पासवर्ड सफलतापूर्वक बदल दिया गया है! अब नए पासवर्ड से लॉगिन करें।');
      setShowForgotModal(false);
      setForgotStep(1);
      setForgotIdent('');
      setForgotOtp('');
      setForgotResetAuthToken('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setAuthMode('login');
    } catch (err) {
      setForgotError('पासवर्ड बदलने में त्रुटि।');
    } finally {
      setForgotLoading(false);
    }
  };

  // ==========================================
  // AUTH ACTION 5: LOGOUT
  // ==========================================
  const handleLogout = async () => {
    const token = localStorage.getItem('yagya_devotee_token');
    if (token) {
      try {
        await fetch('/api/user/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {}
    }
    localStorage.removeItem('yagya_devotee_token');
    localStorage.removeItem('yagya_devotee_user');
    sessionStorage.removeItem('yagya_devotee_token');
    setCurrentUser(null);
    if (onLogout) {
      onLogout();
    } else if (onGoHome) {
      onGoHome();
    }
  };

  // ==========================================
  // AUTH ACTION 6: UPDATE PROFILE
  // ==========================================
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (editFullName.trim().length < 2) {
      setProfileError('कृपया एक वैध नाम दर्ज करें।');
      return;
    }

    const token = localStorage.getItem('yagya_devotee_token');
    if (!token) {
      setProfileError('सत्र समाप्त। कृपया पुनः लॉगिन करें।');
      return;
    }

    setProfileSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: editFullName.trim(),
          email: editEmail.trim() || undefined,
          city: editCity.trim() || 'नोएडा',
          gotra: editGotra.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error || 'प्रोफाइल अद्यतन करने में त्रुटि।');
        setProfileSaving(false);
        return;
      }

      setCurrentUser(data.user);
      localStorage.setItem('yagya_devotee_user', JSON.stringify(data.user));
      setProfileSuccess('✓ प्रोफाइल विवरण सफलतापूर्वक सहेजा गया!');
    } catch (err: any) {
      setProfileError('सर्वर से संपर्क करने में त्रुटि।');
    } finally {
      setProfileSaving(false);
    }
  };

  // ==========================================
  // AUTH ACTION 7: CHANGE PASSWORD
  // ==========================================
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassError('');
    setChangePassSuccess('');

    if (!currentPassword) {
      setChangePassError('कृपया अपना वर्तमान पासवर्ड दर्ज करें।');
      return;
    }
    if (newPassword.length < 6) {
      setChangePassError('नया पासवर्ड न्यूनतम 6 अक्षरों का होना अनिवार्य है।');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setChangePassError('नया पासवर्ड एवं पुष्टि पासवर्ड मेल नहीं खाते हैं।');
      return;
    }

    const token = localStorage.getItem('yagya_devotee_token');
    if (!token) {
      setChangePassError('सत्र समाप्त। कृपया पुनः लॉगिन करें।');
      return;
    }

    setChangePassLoading(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setChangePassError(data.error || 'पासवर्ड परिवर्तन विफल रहा।');
        setChangePassLoading(false);
        return;
      }

      setChangePassSuccess('✓ आपका पासवर्ड सफलतापूर्वक बदल दिया गया है!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setChangePassError('सर्वर से संपर्क करने में त्रुटि।');
    } finally {
      setChangePassLoading(false);
    }
  };

  // ==========================================
  // AUTH ACTION 8: DELETE ACCOUNT
  // ==========================================
  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (!deletePassword) {
      setDeleteError('खाता हटाने की पुष्टि हेतु वर्तमान पासवर्ड दर्ज करें।');
      return;
    }
    if (deleteConfirmText.trim() !== 'DELETE') {
      setDeleteError('कृपया पुष्टि बॉक्स में बड़े अक्षरों में "DELETE" टाइप करें।');
      return;
    }

    const token = localStorage.getItem('yagya_devotee_token');
    if (!token) {
      setDeleteError('सत्र समाप्त हो चुका है।');
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: deletePassword,
          confirmText: 'DELETE',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || 'खाता हटाने में त्रुटि।');
        setDeleteLoading(false);
        return;
      }

      alert('आपका खाता सफलतापूर्वक हटा दिया गया है।');
      setShowDeleteModal(false);
      handleLogout();
    } catch (err: any) {
      setDeleteError('सर्वर से संपर्क करने में असमर्थ।');
      setDeleteLoading(false);
    }
  };

  // ==========================================
  // RENDER: AUTHENTICATED USER DASHBOARD
  // ==========================================
  if (currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-12 space-y-5 sm:space-y-6">
        {/* User Hero Banner */}
        <div className="bg-gradient-to-r from-[#240608] via-[#4a0e17] to-[#872e18] text-white rounded-3xl p-4 sm:p-6 shadow-xl border-2 border-amber-500/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-[#4a0e17] flex items-center justify-center font-bold text-2xl sm:text-3xl shadow-lg border-2 border-amber-100 shrink-0">
                {currentUser.fullName ? currentUser.fullName.charAt(0) : '✓'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-2xl font-bold font-serif text-amber-200 truncate">
                    {currentUser.fullName}
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-medium">
                    <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>सत्यापित साधक</span>
                  </span>
                </div>
                <div className="text-xs text-amber-100/90 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-amber-400" /> +91 {currentUser.mobile}
                  </span>
                  {currentUser.email && (
                    <span className="flex items-center gap-1">
                      • <Mail className="w-3 h-3 text-amber-400" /> {currentUser.email}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    • <MapPin className="w-3 h-3 text-amber-400" /> {currentUser.city || 'नोएडा'}
                    {currentUser.gotra ? ` (${currentUser.gotra})` : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-900/50">
              <button
                type="button"
                onClick={onBookNew}
                className="flex-1 sm:flex-initial justify-center bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs sm:text-sm px-3.5 sm:px-4 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all text-center"
              >
                <Flame className="w-4 h-4 text-[#872e18] shrink-0" />
                <span className="truncate">नया कुंड बुक करें</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="bg-rose-950/70 hover:bg-rose-900 text-rose-200 hover:text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-rose-400/40 cursor-pointer flex items-center justify-center gap-1.5 transition-all shrink-0"
                title="खाते से सुरक्षित लॉग आउट करें"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>लॉग आउट</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b-2 border-amber-200/80 bg-amber-50/50 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'tickets'
                ? 'bg-[#872e18] text-white shadow-md'
                : 'text-stone-700 hover:bg-amber-200/60'
            }`}
          >
            <Ticket className="w-4 h-4 shrink-0" />
            <span>मेरी बुकिंग व पास ({displayBookings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#872e18] text-white shadow-md'
                : 'text-stone-700 hover:bg-amber-200/60'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>प्रोफ़ाइल संपादित करें</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'password'
                ? 'bg-[#872e18] text-white shadow-md'
                : 'text-stone-700 hover:bg-amber-200/60'
            }`}
          >
            <Key className="w-4 h-4 shrink-0" />
            <span>पासवर्ड बदलें</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'bg-[#872e18] text-white shadow-md'
                : 'text-stone-700 hover:bg-amber-200/60'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>खाता सुरक्षा व विलोपन</span>
          </button>
        </div>

        {/* TAB 1: MY BOOKINGS & PASS */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-[#872e18] font-serif flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-600 shrink-0" />
                <span>आरक्षित हवन कुंड एवं रसीदें</span>
              </h3>
              <button
                type="button"
                onClick={fetchMyTickets}
                disabled={ticketsLoading}
                className="text-xs text-stone-600 hover:text-stone-900 bg-white border border-stone-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${ticketsLoading ? 'animate-spin text-[#872e18]' : ''}`} />
                <span>ताज़ा करें</span>
              </button>
            </div>

            {displayBookings.length === 0 ? (
              <div className="bg-white rounded-3xl p-6 sm:p-10 text-center border-2 border-dashed border-amber-300 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                  <Ticket className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-base sm:text-lg text-stone-800">
                  कोई सक्रिय आरक्षण नहीं मिला
                </h4>
                <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto mt-1 mb-5">
                  आपने अभी तक 108 हवन कुंडों में से कोई कुंड आरक्षित नहीं किया है। पवित्र अनुष्ठान में अपना स्थान सुनिश्चित करें।
                </p>
                <button
                  type="button"
                  onClick={onBookNew}
                  className="bg-gradient-to-r from-[#8a1523] to-[#a01a2b] hover:from-[#70101b] hover:to-[#8a1523] text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm cursor-pointer shadow-md inline-flex items-center gap-2"
                >
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span>हवन कुंड आरक्षण आरंभ करें (₹1,100)</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {displayBookings.map((ticket) => {
                  const isPaid = ticket.paymentStatus === 'paid';
                  const isPending = ticket.paymentStatus === 'pending';
                  const isRejected = ticket.paymentStatus === 'rejected';

                  return (
                    <div
                      key={ticket.id}
                      className={`bg-white rounded-2xl border-2 p-4 sm:p-5 shadow-sm space-y-3.5 transition-all ${
                        isPaid
                          ? 'border-emerald-300 shadow-emerald-50'
                          : isRejected
                          ? 'border-rose-300 bg-rose-50/20'
                          : 'border-amber-300'
                      }`}
                    >
                      {/* Ticket Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-stone-100 pb-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="bg-[#872e18] text-amber-200 font-bold px-3 py-1 rounded-xl text-xs sm:text-sm shadow-xs shrink-0">
                            हवन कुंड #{ticket.kundNumbers && ticket.kundNumbers.length > 0
                              ? ticket.kundNumbers.map((n) => String(n).padStart(3, '0')).join(', #')
                              : String(ticket.kundNumber).padStart(3, '0')}
                          </span>
                          <div>
                            <span className="font-mono font-bold text-stone-900 text-xs sm:text-sm block">
                              टोकन: {ticket.token}
                            </span>
                            <div className="text-[11px] text-stone-500 font-medium">
                              📅 तिथि: {ticket.date} • {ticket.timeSlot || 'प्रातः 09:00 AM'}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs px-3 py-1 rounded-full font-bold shadow-2xs">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                              <span>भुगतान सत्यापित (Verified)</span>
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-900 border border-rose-300 text-xs px-3 py-1 rounded-full font-bold shadow-2xs">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                              <span>भुगतान अस्वीकृत (Rejected)</span>
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-950 border border-amber-300 text-xs px-3 py-1 rounded-full font-bold animate-pulse shadow-2xs">
                              <RefreshCw className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                              <span>सत्यापन लंबित (Pending)</span>
                            </span>
                          ) : (
                            <span className="inline-block bg-blue-100 text-blue-900 border border-blue-300 text-xs px-3 py-1 rounded-full font-bold">
                              काउंटर भुगतान
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                        <div>
                          <strong className="text-stone-500 block text-[10px]">मुख्य यजमान</strong>
                          <span className="font-medium text-stone-900">{ticket.fullName || ticket.husbandName}</span>
                        </div>
                        <div>
                          <strong className="text-stone-500 block text-[10px]">कुल दक्षिणा</strong>
                          <span className="font-medium text-stone-900">₹ {ticket.amount} ({ticket.kundCount || 1} कुंड)</span>
                        </div>
                        <div>
                          <strong className="text-stone-500 block text-[10px]">आरक्षित कुंड संख्या</strong>
                          <span className="font-medium text-stone-900">{ticket.kundCount || 1} कुंड</span>
                        </div>
                        <div>
                          <strong className="text-stone-500 block text-[10px]">UTR / संदर्भ संख्या</strong>
                          <span className="font-mono font-medium text-stone-900 break-all">{ticket.utrNumber || 'लंबित'}</span>
                        </div>
                      </div>

                      {/* Rejection Note */}
                      {isRejected && ticket.rejectionReason && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-3 text-xs">
                          <strong>अस्वीकृति कारण:</strong> {ticket.rejectionReason}
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                        <span className="text-[11px] text-stone-500">
                          {isPaid
                            ? '✓ बैंक सत्यापन पूर्ण हो चुका है। आप आधिकारिक रसीद व डिजिटल पास डाउनलोड कर सकते हैं।'
                            : isRejected
                            ? '✕ आश्रम व्यवस्थापक द्वारा बैंक खाते में UTR सत्यापित न होने पर यह आरक्षण निरस्त किया गया।'
                            : '⏳ आश्रम व्यवस्थापक द्वारा बैंक खाता व UTR सत्यापन के उपरांत आधिकारिक रसीद व QR कोड जारी होगा।'}
                        </span>

                        {isPaid ? (
                          <button
                            type="button"
                            onClick={() => onOpenSlip(ticket)}
                            className="w-full sm:w-auto justify-center px-4 py-2.5 bg-gradient-to-r from-[#8a1523] to-[#a01a2b] hover:from-[#70101b] hover:to-[#8a1523] text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md shrink-0"
                          >
                            <Printer className="w-4 h-4 text-amber-300 shrink-0" />
                            <span>रसीद देखें / PDF प्रिंट करें</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="w-full sm:w-auto justify-center px-4 py-2.5 bg-stone-100 text-stone-400 font-bold text-xs rounded-xl cursor-not-allowed flex items-center gap-1.5 border border-stone-200 shrink-0"
                          >
                            <Lock className="w-3.5 h-3.5 shrink-0" />
                            <span>रसीद लॉक है ({isRejected ? 'अस्वीकृत' : 'सत्यापन लंबित'})</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EDIT PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-stone-200/80 max-w-xl mx-auto space-y-5">
            <div>
              <h3 className="text-lg font-bold font-serif text-[#872e18] flex items-center gap-2">
                <User className="w-5 h-5 text-amber-600" />
                <span>साधक प्रोफ़ाइल संपादन</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                अपने व्यक्तिगत विवरण को अद्यतन रखें ताकि आश्रम सूचनाएं आप तक पहुंचती रहें।
              </p>
            </div>

            {profileSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  पूरा नाम *
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-[#872e18]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  सत्यापित मोबाइल नंबर (अपरिवर्तनीय)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={`+91 ${currentUser.mobile}`}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-100 text-stone-500 font-mono text-sm cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    ✓ सत्यापित पहचान
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  सुरक्षा कारणों से प्राथमिक मोबाइल नंबर नहीं बदला जा सकता।
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ईमेल पता
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="devotee@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-[#872e18]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">नगर / शहर</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-[#872e18]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">गोत्र (वैकल्पिक)</label>
                  <input
                    type="text"
                    value={editGotra}
                    onChange={(e) => setEditGotra(e.target.value)}
                    placeholder="उदा. भारद्वाज, कश्यप"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-[#872e18]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="w-full bg-[#8a1523] hover:bg-[#70101b] text-white font-bold py-3 rounded-xl shadow-md transition-all text-sm cursor-pointer disabled:opacity-50"
              >
                {profileSaving ? 'सहेजा जा रहा है...' : 'विवरण सहेजें (Save Changes)'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: CHANGE PASSWORD */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-stone-200/80 max-w-xl mx-auto space-y-5">
            <div>
              <h3 className="text-lg font-bold font-serif text-[#872e18] flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                <span>साधक पासवर्ड बदलें</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                सुरक्षा हेतु अपना पासवर्ड समय-समय पर बदलते रहें।
              </p>
            </div>

            {changePassSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{changePassSuccess}</span>
              </div>
            )}
            {changePassError && (
              <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{changePassError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  वर्तमान पासवर्ड *
                </label>
                <div className="relative">
                  <input
                    type={showCurrPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="वर्तमान पासवर्ड दर्ज करें"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm pr-10 focus:outline-none focus:border-[#872e18]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrPass(!showCurrPass)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showCurrPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  नया पासवर्ड (कम से कम 6 अक्षर) *
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="नया पासवर्ड बनाएं"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm pr-10 focus:outline-none focus:border-[#872e18]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  नए पासवर्ड की पुष्टि करें *
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="नए पासवर्ड को पुनः दर्ज करें"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-[#872e18]"
                />
              </div>

              <button
                type="submit"
                disabled={changePassLoading}
                className="w-full bg-[#8a1523] hover:bg-[#70101b] text-white font-bold py-3 rounded-xl shadow-md transition-all text-sm cursor-pointer disabled:opacity-50"
              >
                {changePassLoading ? 'पासवर्ड बदला जा रहा है...' : 'पासवर्ड अद्यतन करें'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: ACCOUNT SECURITY & DELETION */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-stone-200/80 max-w-xl mx-auto space-y-5">
            <div>
              <h3 className="text-lg font-bold font-serif text-rose-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-600" />
                <span>खाता सुरक्षा एवं विलोपन</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                गोपनीयता नीति, डेटा अवधारण (Data Retention Policy) एवं खाता विलोपन विकल्प।
              </p>
            </div>

            {/* Disclosure Box */}
            <div className="bg-amber-50/70 border border-amber-200 text-stone-700 rounded-2xl p-4 text-xs space-y-2">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-700" />
                <span>डेटा अवधारण एवं कानूनी नीति (Data Retention Policy)</span>
              </div>
              <p className="leading-relaxed">
                यदि आप अपना साधक खाता हटाते हैं, तो आपका लॉगिन क्रेडेंशियल, पासवर्ड हैश, सक्रिय सत्र (Active Sessions) और व्यक्तिगत प्रोफ़ाइल तुरंत हटा दिए जाएंगे।
              </p>
              <p className="leading-relaxed">
                <strong>वैधानिक एवं वित्तीय ऑडिट आवश्यकता:</strong> आश्रम वित्तीय लेखा-जोखा (Financial Compliance) एवं यज्ञ व्यवस्था हेतु आपके द्वारा पूर्व में किए गए हवन कुंड आरक्षण के डिजिटल टोकन, दक्षिणा राशि, UTR संदर्भ और भुगतान रिकॉर्ड सुरक्षित रखे जाएंगे, किंतु व्यक्तिगत पहचान हटा (Anonymized) दी जाएगी।
              </p>
            </div>

            <div className="border-t border-rose-100 pt-4">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-800 border-2 border-rose-300 font-bold py-3 rounded-xl transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>साधक खाता स्थायी रूप से हटाएं (Delete Account)</span>
              </button>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-400 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <div className="flex items-center gap-2 text-rose-800 font-bold font-serif text-base">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <span>साधक खाता विलोपन की पुष्टि</span>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-3 text-xs">
                ⚠️ <strong>सावधानी:</strong> यह क्रिया अपरिवर्तनीय है। एक बार खाता हटा दिए जाने के बाद इसे पुनः सक्रिय नहीं किया जा सकता।
              </div>

              {deleteError && (
                <div className="bg-rose-100 border border-rose-300 text-rose-900 text-xs p-3 rounded-xl">
                  {deleteError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    वर्तमान पासवर्ड दर्ज करें *
                  </label>
                  <input
                    type="password"
                    required
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="पासवर्ड"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    पुष्टि हेतु बड़े अक्षरों में <span className="font-mono text-rose-700">DELETE</span> टाइप करें *
                  </label>
                  <input
                    type="text"
                    required
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-mono focus:outline-none focus:border-rose-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                  className="flex-1 bg-rose-700 hover:bg-rose-800 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deleteLoading ? 'हटाया जा रहा है...' : 'खाता स्थायी हटाएं'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: UNAUTHENTICATED (SIGN IN / SIGN UP)
  // ==========================================
  return (
    <div className="max-w-md mx-auto px-4 pt-6 sm:pt-8 pb-12">
      <div className="bg-white rounded-3xl shadow-xl border-2 border-amber-300/80 overflow-hidden">
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-[#240608] via-[#4a0e17] to-[#872e18] p-6 text-white text-center relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-[#4a0e17] flex items-center justify-center mx-auto mb-2 border border-amber-300/50 shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-serif text-amber-200">
            साधक खाता लॉगिन व पंजीकरण
          </h2>
          <p className="text-xs text-amber-100/90 mt-1 max-w-xs mx-auto">
            भारत उत्कर्ष महायज्ञ 2026 • हवन कुंड ई-पास, आधिकारिक रसीद एवं साधक प्रोफाइल पोर्टल
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-stone-200 bg-stone-50">
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center border-b-2 cursor-pointer transition-all ${
              authMode === 'login'
                ? 'border-[#872e18] text-[#872e18] bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            साधक लॉगिन (Sign In)
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center border-b-2 cursor-pointer transition-all ${
              authMode === 'signup'
                ? 'border-[#872e18] text-[#872e18] bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            नया खाता बनाएं (Sign Up)
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {/* SIGN IN FORM */}
          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  पंजीकृत मोबाइल नंबर अथवा ईमेल आईडी *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="उदा. 9876543210 अथवा devotee@example.com"
                    value={loginIdent}
                    onChange={(e) => setLoginIdent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm pr-9 focus:outline-none focus:border-[#872e18]"
                  />
                  <User className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700">
                    साधक पासवर्ड *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotIdent(loginIdent);
                      setForgotStep(1);
                      setForgotError('');
                      setForgotSuccess('');
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] font-semibold text-[#872e18] hover:underline cursor-pointer"
                  >
                    पासवर्ड भूल गए?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="पासवर्ड दर्ज करें"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm pr-10 focus:outline-none focus:border-[#872e18]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-gradient-to-r from-[#8a1523] to-[#a01a2b] hover:from-[#70101b] hover:to-[#8a1523] text-white font-bold py-3 rounded-xl shadow-md transition-all text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>प्रमाणीकरण हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-amber-300" />
                    <span>खाता लॉगिन करें (Sign In)</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-stone-500">खाता नहीं है? </span>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className="text-xs font-bold text-[#872e18] hover:underline cursor-pointer"
                >
                  नया साधक खाता बनाएं
                </button>
              </div>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignup} className="space-y-3.5">
              {signupError && (
                <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{signupError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  मुख्य यजमान का पूरा नाम *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="उदा. राम प्रसाद शर्मा"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-[#872e18]"
                  />
                  <User className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  मोबाइल नंबर (10 अंक) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-stone-400 font-mono">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    placeholder="9876543210"
                    value={signupMobile}
                    onChange={(e) => setSignupMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-mono focus:outline-none focus:border-[#872e18]"
                  />
                  <Phone className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ईमेल पता (OTP सत्यापन हेतु) *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="devotee@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-[#872e18]"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    पासवर्ड (न्यूनतम 6 अक्षर) *
                  </label>
                  <div className="relative">
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="पासवर्ड"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm pr-8 focus:outline-none focus:border-[#872e18]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    पासवर्ड पुष्टि *
                  </label>
                  <div className="relative">
                    <input
                      type={showSignupConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="पुष्टि करें"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm pr-8 focus:outline-none focus:border-[#872e18]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                      className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showSignupConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">नगर / शहर</label>
                  <input
                    type="text"
                    value={signupCity}
                    onChange={(e) => setSignupCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-[#872e18]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">गोत्र (वैकल्पिक)</label>
                  <input
                    type="text"
                    value={signupGotra}
                    onChange={(e) => setSignupGotra(e.target.value)}
                    placeholder="उदा. कश्यप"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-[#872e18]"
                  />
                </div>
              </div>

              {/* Terms and Privacy Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-stone-700 leading-snug">
                  <input
                    type="checkbox"
                    required
                    checked={signupAgreeTerms}
                    onChange={(e) => setSignupAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded text-[#872e18] focus:ring-[#872e18]"
                  />
                  <span>
                    मैं भारत उत्कर्ष महायज्ञ 2026 के{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-[#872e18] font-bold underline cursor-pointer"
                    >
                      नियम, आश्रम मर्यादा एवं गोपनीयता नीति
                    </button>{' '}
                    को स्वीकार करता/करती हूँ। *
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={signupLoading || !signupAgreeTerms}
                className="w-full bg-gradient-to-r from-[#8a1523] to-[#a01a2b] hover:from-[#70101b] hover:to-[#8a1523] text-white font-bold py-3 rounded-xl shadow-md transition-all text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {signupLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>सत्यापन कोड भेजा जा रहा है...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>सत्यापन कोड (OTP) प्राप्त करें</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-stone-500">पहले से पंजीकृत हैं? </span>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-xs font-bold text-[#872e18] hover:underline cursor-pointer"
                >
                  साधक लॉगिन करें
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* REGISTRATION OTP VERIFICATION MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-amber-400 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2 text-[#872e18] font-bold font-serif text-base">
                <Shield className="w-5 h-5 text-amber-600" />
                <span>साधक खाता सत्यापन (OTP)</span>
              </div>
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              आपके पंजीकृत ईमेल <strong>{otpTargetEmail}</strong> / मोबाइल <strong>+91 {otpIdentifier}</strong> पर 6-अंकों का सत्यापन कोड प्रेषित किया गया है।
            </p>

            {/* Truthful delivery status alert */}
            {!otpDeliveryConfigured && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>परीक्षण / विकास सूचना</span>
                </div>
                <p>
                  सर्वर पर बाहरी SMTP/SMS सेवा अभी सक्रिय नहीं है। परीक्षण हेतु आपका सत्यापन कोड है:
                </p>
                {otpDebugCode && (
                  <div className="font-mono font-bold text-base bg-white border border-amber-300 px-3 py-1.5 rounded-lg text-center tracking-widest text-[#872e18]">
                    {otpDebugCode}
                  </div>
                )}
              </div>
            )}

            {otpSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs p-2.5 rounded-xl">
                {otpSuccess}
              </div>
            )}
            {otpError && (
              <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs p-2.5 rounded-xl">
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifySignupOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 text-center">
                  6-अंकों का सत्यापन कोड दर्ज करें *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-2xl font-mono font-bold tracking-widest py-3 rounded-xl border-2 border-amber-400 focus:outline-none focus:border-[#872e18] bg-amber-50/30"
                />
              </div>

              <button
                type="submit"
                disabled={otpLoading || otpCode.length !== 6}
                className="w-full bg-[#8a1523] hover:bg-[#70101b] text-white font-bold py-3 rounded-xl shadow-md transition-all text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {otpLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>सत्यापन हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-amber-300" />
                    <span>खाता सत्यापित व सक्रिय करें</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                <button
                  type="button"
                  onClick={handleResendSignupOtp}
                  disabled={otpResendCountdown > 0}
                  className={`font-semibold cursor-pointer ${
                    otpResendCountdown > 0
                      ? 'text-stone-400 cursor-not-allowed'
                      : 'text-[#872e18] hover:underline'
                  }`}
                >
                  {otpResendCountdown > 0
                    ? `पुनः कोड भेजें (${otpResendCountdown}s)`
                    : 'पुनः कोड भेजें (Resend OTP)'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="hover:underline cursor-pointer"
                >
                  रद्द करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-amber-400 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2 text-[#872e18] font-bold font-serif text-base">
                <Key className="w-5 h-5 text-amber-600" />
                <span>साधक पासवर्ड पुनर्प्राप्ति (Forgot Password)</span>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotError && (
              <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs p-2.5 rounded-xl">
                {forgotError}
              </div>
            )}
            {forgotSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs p-2.5 rounded-xl">
                {forgotSuccess}
              </div>
            )}

            {/* Step 1: Request OTP */}
            {forgotStep === 1 && (
              <form onSubmit={handleRequestForgotOtp} className="space-y-4">
                <p className="text-xs text-stone-600">
                  अपना पंजीकृत 10-अंकों का मोबाइल नंबर अथवा ईमेल आईडी दर्ज करें। हम आपको 10 मिनट के लिए मान्य एकल-उपयोग (single-use) सत्यापन कोड भेजेंगे।
                </p>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    पंजीकृत मोबाइल अथवा ईमेल *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="9876543210 अथवा devotee@example.com"
                    value={forgotIdent}
                    onChange={(e) => setForgotIdent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-[#872e18]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-[#8a1523] hover:bg-[#70101b] text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {forgotLoading ? 'कोड भेजा जा रहा है...' : 'रीसेट कोड (OTP) भेजें'}
                </button>
              </form>
            )}

            {/* Step 2: Verify OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
                <p className="text-xs text-stone-600">
                  कृपया <strong>{forgotIdent}</strong> पर भेजा गया 6-अंकों का OTP कोड दर्ज करें।
                </p>

                {!forgotDeliveryConfigured && forgotDebugCode && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                    <span className="font-bold">परीक्षण कोड (SMTP असक्रिय):</span>
                    <div className="font-mono font-bold text-base text-[#872e18] tracking-widest text-center bg-white py-1 rounded">
                      {forgotDebugCode}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 text-center">
                    6-अंकों का OTP *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="• • • • • •"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-xl font-mono font-bold tracking-widest py-2.5 rounded-xl border-2 border-amber-400 focus:outline-none focus:border-[#872e18]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading || forgotOtp.length !== 6}
                  className="w-full bg-[#8a1523] hover:bg-[#70101b] text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm cursor-pointer disabled:opacity-50"
                >
                  {forgotLoading ? 'सत्यापन हो रहा है...' : 'OTP सत्यापित करें'}
                </button>
              </form>
            )}

            {/* Step 3: Set New Password */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <p className="text-xs text-stone-600">
                  सत्यापन पूर्ण! कृपया अपने साधक खाते हेतु नया सुरक्षित पासवर्ड बनाएं।
                </p>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    नया पासवर्ड (न्यूनतम 6 अक्षर) *
                  </label>
                  <div className="relative">
                    <input
                      type={showForgotNewPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="नया पासवर्ड"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm pr-10 focus:outline-none focus:border-[#872e18]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPass(!showForgotNewPass)}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showForgotNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    नए पासवर्ड की पुष्टि करें *
                  </label>
                  <input
                    type="password"
                    required
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="पुष्टि करें"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-[#872e18]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-[#8a1523] hover:bg-[#70101b] text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm cursor-pointer disabled:opacity-50"
                >
                  {forgotLoading ? 'सहेजा जा रहा है...' : 'नया पासवर्ड सेट करें'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TERMS AND PRIVACY POLICY MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-amber-400 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3 shrink-0">
              <div className="flex items-center gap-2 text-[#872e18] font-bold font-serif text-base">
                <FileText className="w-5 h-5 text-amber-600" />
                <span>महायज्ञ नियम, मर्यादा एवं गोपनीयता नीति</span>
              </div>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 text-xs text-stone-700 leading-relaxed pr-1">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <h5 className="font-bold text-[#872e18] mb-1">1. हवन कुंड आरक्षण नियम</h5>
                <p>
                  • 108 हवन कुंडों में से कुंड सं. 1 से 9 पूज्य संतों एवं विशिष्ट अतिथियों हेतु आरक्षित हैं।
                  <br />• प्रति कुंड निर्धारित दक्षिणा ₹1,100 है।
                  <br />• निष्पक्षता एवं मर्यादा हेतु एक मोबाइल नंबर अथवा साधक खाते से प्रति दिवस एक कुंड आरक्षण की अनुमति है।
                </p>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <h5 className="font-bold text-[#872e18] mb-1">2. दक्षिणा भुगतान एवं सत्यापन</h5>
                <p>
                  • यजमान द्वारा UPI QR कोड के माध्यम से दक्षिणा प्रेषित करने के उपरांत 12-अंकों का UTR संदर्भ संख्या दर्ज करना अनिवार्य है।
                  <br />• आश्रम व्यवस्थापक द्वारा बैंक खाते में UTR सत्यापन के उपरांत ही आधिकारिक ई-पास एवं डिजिटल रसीद जारी की जाएगी।
                </p>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <h5 className="font-bold text-[#872e18] mb-1">3. गोपनीयता एवं खाता सुरक्षा नीति</h5>
                <p>
                  • साधक का पासवर्ड सर्वर पर सुरक्षित हैश (HMAC-SHA256) के रूप में संचित होता है। किसी भी ब्राउज़र स्टोरेज में सादा पासवर्ड नहीं रखा जाता।
                  <br />• खाता विलोपन के समय व्यक्तिगत विवरण तुरंत हटा दिया जाएगा, किंतु आश्रम वित्तीय लेखा-जोखा हेतु पूर्व बुकिंग टोकन को बिना पहचान के (Anonymized) सुरक्षित रखा जाएगा।
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSignupAgreeTerms(true);
                setShowTermsModal(false);
              }}
              className="w-full bg-[#8a1523] hover:bg-[#70101b] text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer shrink-0"
            >
              मैंने नियम समझ लिए हैं और स्वीकार करता/करती हूँ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
