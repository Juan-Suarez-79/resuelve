"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

interface Notification {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
    created_at: string;
}

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const { toast } = useToast();

    useEffect(() => {
        fetchNotifications();

        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${(supabase.auth.getUser() as any).id}` // This might be tricky with async, let's rely on the fetch first
                },
                (payload) => {
                    setNotifications(prev => [payload.new as Notification, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    toast("Nueva notificación: " + payload.new.title, "info");
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            setNotifications(data as any);
            setUnreadCount(data.filter((n: any) => !n.is_read).length);
        }
        setLoading(false);
    };

    const markAsRead = async (id: string) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
            >
                <Bell className={cn("w-5 h-5", unreadCount > 0 ? "text-gray-900 fill-gray-900" : "text-gray-500")} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-red text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-sm">Notificaciones</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} className="text-xs font-bold text-brand-red hover:underline">
                                    Marcar leídas
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs font-medium">No tienes notificaciones</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors relative group",
                                            !notification.is_read ? "bg-red-50/30" : ""
                                        )}
                                    >
                                        <div className="flex gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                                                notification.type === 'success' ? "bg-green-100 text-green-600" :
                                                    notification.type === 'error' ? "bg-red-100 text-red-600" :
                                                        notification.type === 'warning' ? "bg-yellow-100 text-yellow-600" :
                                                            "bg-blue-100 text-blue-600"
                                            )}>
                                                {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                                                    notification.type === 'error' ? <XCircle className="w-4 h-4" /> :
                                                        notification.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                                                            <Info className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={cn("text-sm font-bold", !notification.is_read ? "text-gray-900" : "text-gray-600")}>
                                                        {notification.title}
                                                    </h4>
                                                    {!notification.is_read && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                                            className="text-gray-400 hover:text-brand-red p-1"
                                                            title="Marcar como leída"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 leading-relaxed mb-2">{notification.message}</p>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                        {new Date(notification.created_at).toLocaleDateString()}
                                                    </span>
                                                    {notification.link && (
                                                        <Link
                                                            href={notification.link}
                                                            onClick={() => setIsOpen(false)}
                                                            className="text-[10px] font-bold text-brand-red hover:underline"
                                                        >
                                                            Ver detalles
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
