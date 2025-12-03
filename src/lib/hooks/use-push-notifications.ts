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

    console.log('usePushNotifications hook initialized');

    useEffect(() => {
        console.log('usePushNotifications useEffect running');
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            console.log('Environment supports Push Notifications');
            setPermission(Notification.permission);
            checkSubscription();
        } else {
            console.log('Environment DOES NOT support Push Notifications');
            console.log('window:', typeof window);
            console.log('serviceWorker:', 'serviceWorker' in navigator);
            console.log('PushManager:', 'PushManager' in window);
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
            console.log('Starting subscription process...');

            // Request permission first
            if (Notification.permission === 'default') {
                console.log('Requesting permission...');
                const result = await Notification.requestPermission();
                console.log('Permission result:', result);
                if (result !== 'granted') {
                    throw new Error('Permission denied');
                }
            }

            console.log('Waiting for Service Worker ready...');
            const registration = await navigator.serviceWorker.ready;
            console.log('Service Worker ready:', registration);

            if (!VAPID_PUBLIC_KEY) {
                console.error('VAPID Public Key missing');
                throw new Error('VAPID Public Key not found');
            }
            console.log('Using VAPID Key:', VAPID_PUBLIC_KEY);

            console.log('Subscribing with PushManager...');
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
            console.log('Subscription object:', subscription);

            // Save to Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                console.log('Saving to Supabase...');
                const subJson = subscription.toJSON();
                const { error } = await supabase.from('push_subscriptions').upsert({
                    user_id: user.id,
                    endpoint: subJson.endpoint,
                    p256dh: subJson.keys?.p256dh,
                    auth: subJson.keys?.auth
                }, { onConflict: 'endpoint' });

                if (error) console.error('Supabase error:', error);
                else console.log('Saved to Supabase successfully');
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
