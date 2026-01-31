
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { UserRole } from '../types';
import { requestNotificationPermission, messaging } from '../services/firebase';
import { onMessage } from 'firebase/messaging';

export function useAuth() {
    const [role, setRole] = useState<UserRole | null>(null);
    const [userName, setUserName] = useState<string>('');
    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);
    const [isVerified, setIsVerified] = useState(true);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && mounted) {
                try {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name, role, avatar_url, mpps_registry, is_verified, verification_status')
                        .eq('id', session.user.id)
                        .single();

                    if (profile?.role) {
                        let appRole: UserRole;
                        switch (profile.role) {
                            case 'doctor': appRole = UserRole.DOCTOR; break;
                            case 'nutri':
                            case 'nutritionist': appRole = UserRole.NUTRITIONIST; break;
                            case 'admin': appRole = UserRole.ADMIN; break;
                            case 'paciente':
                            default: appRole = UserRole.PATIENT; break;
                        }
                        setRole(appRole);
                        if (profile.full_name) setUserName(profile.full_name);
                        if (profile.avatar_url) setAvatarUrl(profile.avatar_url);

                        const isOnboardingCreate = (appRole === UserRole.DOCTOR || appRole === UserRole.NUTRITIONIST) && !profile.mpps_registry;
                        setNeedsOnboarding(isOnboardingCreate);

                        const verifiedStatus = profile.verification_status === 'approved' || profile.is_verified === true;
                        setIsVerified(verifiedStatus);

                        // New: Global status for rejection view
                        if (profile.verification_status === 'rejected' && location.pathname !== '/pending-verification') {
                            navigate('/pending-verification');
                        }

                        setIsLoggedIn(true);

                        // Redirect if needed
                        if (isOnboardingCreate && location.pathname !== '/onboarding') {
                            navigate('/onboarding');
                        }

                        // FCM
                        requestNotificationPermission().then(token => {
                            if (token) {
                                supabase.from('profiles').update({ fcm_token: token }).eq('id', session.user.id).then();
                            }
                        });

                        // Foreground messages
                        if (messaging) {
                            onMessage(messaging, (payload) => {
                                console.log('FCM Message received in foreground:', payload);
                                if (Notification.permission === 'granted') {
                                    const notification = new Notification(payload.notification?.title || 'Nueva Notificación', {
                                        body: payload.notification?.body,
                                        icon: '/pwa-192x192.png'
                                    });
                                    notification.onclick = () => { window.focus(); notification.close(); };
                                }
                            });
                        }
                    }
                } catch (err) {
                    console.error('Error fetching profile:', err);
                }
            } else if (!session && mounted) {
                setIsLoggedIn(false);
            }
            if (mounted) setLoading(false);
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session && mounted) {
                setIsLoggedIn(false);
                setRole(null);
                setUserName('');
                setAvatarUrl('');
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []); // Empty dependency array as per original App.tsx (mostly)

    const handleLogin = (selectedRole: UserRole, name?: string, avatarUrl?: string, isOnboardingRequired?: boolean) => {
        setRole(selectedRole);
        if (name) setUserName(name);
        if (avatarUrl) setAvatarUrl(avatarUrl);
        setNeedsOnboarding(!!isOnboardingRequired);
        setIsVerified(true);
        setIsLoggedIn(true);

        // FCM Logic for manual login
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                requestNotificationPermission().then(token => {
                    if (token) {
                        supabase.from('profiles').update({ fcm_token: token }).eq('id', session.user.id).then();
                    }
                });
            }
        });

        // Navigation logic
        if (isOnboardingRequired) {
            navigate('/onboarding');
            return;
        }

        if (!isVerified && (selectedRole === UserRole.DOCTOR || selectedRole === UserRole.NUTRITIONIST)) {
            navigate('/pending-verification');
            return;
        }

        if (selectedRole === UserRole.PATIENT) navigate('/');
        else if (selectedRole === UserRole.DOCTOR) navigate('/clinical');
        else if (selectedRole === UserRole.NUTRITIONIST) navigate('/nutrition');
        else if (selectedRole === UserRole.ADMIN) navigate('/admin');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setRole(null);
        setUserName('');
        setAvatarUrl('');
        setIsLoggedIn(false);
        navigate('/login');
    };

    return {
        role,
        userName,
        avatarUrl,
        isLoggedIn,
        needsOnboarding,
        isVerified,
        loading,
        setNeedsOnboarding,
        setIsVerified,
        handleLogin,
        handleLogout
    };
}
