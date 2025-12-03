"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertTriangle, CheckCircle, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Report {
    id: string;
    store_id: string;
    reporter_id: string;
    reason: string;
    created_at: string;
    stores: { name: string };
    profiles: { full_name: string; email: string };
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const { toast } = useToast();

    const fetchReports = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('store_reports')
            .select(`
                *,
                stores (name),
                profiles:reporter_id (full_name, email)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching reports:", error);
        } else {
            setReports(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleResolve = async (id: string) => {
        // For now, resolving just deletes the report. 
        // In a more complex system, we might update a 'status' column.
        const { error } = await supabase
            .from('store_reports')
            .delete()
            .eq('id', id);

        if (error) {
            toast("Error al resolver reporte", "error");
        } else {
            toast("Reporte marcado como resuelto (eliminado)", "success");
            fetchReports();
        }
    };

    if (loading) return <div className="text-white flex items-center gap-2"><Loader2 className="animate-spin" /> Cargando reportes...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-1">Reportes de Usuarios</h1>
                <p className="text-gray-400 text-sm">Revisa y gestiona las denuncias realizadas por los usuarios.</p>
            </div>

            {reports.length === 0 ? (
                <div className="bg-gray-950 border border-gray-800 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">¡Todo limpio!</h3>
                    <p className="text-gray-400">No hay reportes pendientes de revisión.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {reports.map((report) => (
                        <div key={report.id} className="bg-gray-950 border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-6 hover:border-gray-700 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded text-xs font-bold border border-red-500/20 uppercase tracking-wide">Reporte</span>
                                    <span className="text-gray-500 text-xs">• {new Date(report.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">
                                    Tienda: <span className="text-brand-red">{report.stores?.name || "Desconocida"}</span>
                                </h3>
                                <p className="text-gray-300 bg-gray-900 p-4 rounded-xl border border-gray-800 text-sm italic mb-3">
                                    "{report.reason}"
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <AlertTriangle className="w-3 h-3" />
                                    Reportado por: <span className="text-gray-400 font-medium">{report.profiles?.full_name} ({report.profiles?.email})</span>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <button
                                    onClick={() => handleResolve(report.id)}
                                    className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-lg active:scale-95 w-full md:w-auto justify-center"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Resolver
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
