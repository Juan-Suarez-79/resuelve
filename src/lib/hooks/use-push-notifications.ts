import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const supabase = createClient();

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setPermission(Notification.permission);
            checkSubscription();
        } else {
            setLoading(false);
        }
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error('Error checking subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    const subscribe = async () => {
        try {
            setLoading(true);
            const registration = await navigator.serviceWorker.ready;

            if (!VAPID_PUBLIC_KEY) {
                throw new Error('VAPID Public Key not found');
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            // Save to Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const subJson = subscription.toJSON();
                await supabase.from('push_subscriptions').upsert({
                    user_id: user.id,
                    endpoint: subJson.endpoint,
                    p256dh: subJson.keys?.p256dh,
                    auth: subJson.keys?.auth
                }, { onConflict: 'endpoint' });
            }

            setIsSubscribed(true);
            setPermission(Notification.permission);
            return true;
        } catch (error) {
            console.error('Error subscribing:', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const unsubscribe = async () => {
        try {
            setLoading(true);
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Remove from Supabase
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
                }
            }

            setIsSubscribed(false);
            return true;
        } catch (error) {
            console.error('Error unsubscribing:', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        isSubscribed,
        loading,
        permission,
        subscribe,
        unsubscribe
    };
}
