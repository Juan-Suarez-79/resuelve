import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:soporte@resuelvemaestre.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
    try {
        const { userId, email, title, message, url } = await request.json();

        if (!title || !message) {
            return NextResponse.json({ error: 'Missing title or message' }, { status: 400 });
        }

        let targetUserId = userId;

        // If email provided, try to find user_id
        if (!targetUserId && email) {
            // Try to find in profiles first (if it has email)
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single();

            if (profile) {
                targetUserId = profile.id;
            } else {
                // If not in profiles, we can't easily find them without auth admin access
                // But we can try to find them in push_subscriptions if we joined with profiles, 
                // but for now let's return error if not found
                return NextResponse.json({ error: 'User not found with that email' }, { status: 404 });
            }
        }

        if (!targetUserId) {
            return NextResponse.json({ error: 'Target User ID or Email required' }, { status: 400 });
        }

        // Get user subscriptions
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', targetUserId);

        if (error || !subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ error: 'User has no active subscriptions' }, { status: 404 });
        }

        const payload = JSON.stringify({
            title,
            body: message,
            url: url || '/',
        });

        const results = await Promise.all(
            subscriptions.map(async (sub) => {
                try {
                    const pushSubscription = {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth
                        }
                    };
                    await webpush.sendNotification(pushSubscription, payload);
                    return { success: true, id: sub.id };
                } catch (err: any) {
                    console.error('Error sending to sub:', sub.id, err);
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Subscription is gone, delete it
                        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                    }
                    return { success: false, error: err.message };
                }
            })
        );

        const successCount = results.filter(r => r.success).length;

        return NextResponse.json({
            success: true,
            sent: successCount,
            total: subscriptions.length,
            results
        });

    } catch (error: any) {
        console.error('Error sending push:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
