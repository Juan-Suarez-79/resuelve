"use client";

import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { Send, Loader2 } from 'lucide-react';

export default function NotificationsPage() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetEmail, setTargetEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSend = async () => {
        if (!title || !message || !targetEmail) {
            toast('Por favor completa todos los campos', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/send-push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: targetEmail,
                    title,
                    message,
                    url: '/profile/orders' // Default link
                })
            });

            const data = await res.json();

            if (res.ok) {
                if (data.sent > 0) {
                    toast(`Notificación enviada a ${data.sent} dispositivos`, 'success');
                    setMessage('');
                } else {
                    toast('El usuario no tiene dispositivos suscritos', 'info');
                }
            } else {
                toast(data.error || 'Error enviando notificación', 'error');
            }
        } catch (e) {
            toast('Error de conexión', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                        <Send className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Enviar Notificación</h1>
                        <p className="text-gray-500">Envía alertas push a los usuarios</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email del Usuario</label>
                        <input
                            type="email"
                            placeholder="ejemplo@correo.com"
                            value={targetEmail}
                            onChange={e => setTargetEmail(e.target.value)}
                            className="flex h-10 w-full rounded-xl border border-gray-200 bg-gray-900 px-4 py-2 text-sm text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                        <input
                            type="text"
                            placeholder="Ej: ¡Tu pedido está listo!"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="flex h-10 w-full rounded-xl border border-gray-200 bg-gray-900 px-4 py-2 text-sm text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje</label>
                        <textarea
                            placeholder="Escribe el contenido de la notificación..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            className="flex min-h-[100px] w-full rounded-xl border border-gray-200 bg-gray-900 px-4 py-3 text-sm text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none resize-none"
                        />
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5 mr-2" />
                                Enviar Notificación
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
