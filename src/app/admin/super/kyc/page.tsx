"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
    createColumnHelper
} from "@tanstack/react-table";
import {
    Search,
    CheckCircle2,
    XCircle,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ExternalLink
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Store {
    id: string;
    name: string;
    owner_id: string;
    approval_status: string;
    created_at: string;
    profiles: {
        full_name: string;
        email: string;
        cedula: string;
        cedula_photo_url: string;
        selfie_holding_id_url: string;
    };
}

export default function KYCVerificationPage() {
    const [data, setData] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState("");

    // Rejection Modal State
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [processingReject, setProcessingReject] = useState(false);

    const supabase = createClient();
    const { toast } = useToast();

    // Fetch Pending Stores
    const fetchStores = async () => {
        setLoading(true);
        const { data: stores, error } = await supabase
            .from('stores')
            .select(`
                *,
                profiles:owner_id (full_name, email, cedula, cedula_photo_url, selfie_holding_id_url)
            `)
            .eq('approval_status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching stores:", error);
            toast("Error cargando solicitudes", "error");
        } else {
            setData(stores || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStores();
    }, []);

    // Actions
    const handleApproval = async (id: string, status: 'approved' | 'rejected') => {
        const { error } = await supabase
            .from('stores')
            .update({ approval_status: status })
            .eq('id', id);

        if (error) {
            toast("Error actualizando estado", "error");
        } else {
            toast(status === 'approved' ? "Tienda aprobada" : "Tienda rechazada", "success");
            fetchStores();
        }
    };

    const openRejectModal = (store: Store) => {
        setSelectedStore(store);
        setRejectReason("");
        setRejectModalOpen(true);
    };

    const closeRejectModal = () => {
        setRejectModalOpen(false);
        setSelectedStore(null);
        setRejectReason("");
    };

    const handleRejectBlock = async () => {
        if (!selectedStore) return;
        setProcessingReject(true);

        // 1. Update store: rejected AND banned
        const { error } = await supabase
            .from('stores')
            .update({
                approval_status: 'rejected',
                is_banned: true
            })
            .eq('id', selectedStore.id);

        if (error) {
            toast("Error al bloquear tienda", "error");
        } else {
            toast("Tienda rechazada y bloqueada permanentemente", "success");

            // Notify user (Optional but good practice)
            await supabase.from('notifications').insert({
                user_id: selectedStore.owner_id,
                title: "Cuenta Suspendida",
                message: "Tu solicitud de verificación ha sido rechazada y tu cuenta ha sido suspendida permanentemente por incumplimiento de términos.",
                type: "error"
            });

            fetchStores();
            closeRejectModal();
        }
        setProcessingReject(false);
    };

    const handleRejectRetry = async () => {
        if (!selectedStore) return;
        if (!rejectReason.trim()) {
            toast("Debes ingresar un motivo para el rechazo", "error");
            return;
        }
        setProcessingReject(true);

        // 1. Update store: rejected (but NOT banned)
        const { error } = await supabase
            .from('stores')
            .update({ approval_status: 'rejected' })
            .eq('id', selectedStore.id);

        if (error) {
            toast("Error al rechazar solicitud", "error");
        } else {
            toast("Solicitud rechazada. Se ha notificado al usuario.", "success");

            // 2. Send Notification with Reason
            await supabase.from('notifications').insert({
                user_id: selectedStore.owner_id,
                title: "Verificación Rechazada",
                message: `Tu verificación fue rechazada. Motivo: ${rejectReason}. Por favor, corrige los errores e inténtalo nuevamente.`,
                type: "warning",
                link: "/seller/kyc" // Assuming this is where they retry
            });

            fetchStores();
            closeRejectModal();
        }
        setProcessingReject(false);
    };

    // Table Config
    const columnHelper = createColumnHelper<Store>();

    const columns = useMemo(() => [
        columnHelper.accessor("name", {
            header: "Tienda",
            cell: (info) => (
                <div className="font-bold text-white">{info.getValue()}</div>
            ),
        }),
        columnHelper.accessor("profiles.full_name", {
            header: "Solicitante",
            cell: (info) => (
                <div>
                    <div className="font-medium text-white">{info.getValue() || "Sin nombre"}</div>
                    <div className="text-xs text-gray-400">{info.row.original.profiles?.email}</div>
                    <div className="text-xs text-brand-red font-mono mt-1">
                        C.I: {info.row.original.profiles?.cedula || "N/A"}
                    </div>
                </div>
            ),
        }),
        columnHelper.display({
            id: "documents",
            header: "Documentos",
            cell: (info) => {
                const profile = info.row.original.profiles;
                return (
                    <div className="flex flex-col gap-2">
                        {profile?.cedula_photo_url ? (
                            <DocumentLink path={profile.cedula_photo_url} label="Ver Cédula" />
                        ) : <span className="text-xs text-gray-600">Sin Cédula</span>}

                        {profile?.selfie_holding_id_url ? (
                            <DocumentLink path={profile.selfie_holding_id_url} label="Ver Selfie" />
                        ) : <span className="text-xs text-gray-600">Sin Selfie</span>}
                    </div>
                );
            }
        }),
        columnHelper.display({
            id: "actions",
            header: "Acciones",
            cell: (info) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => handleApproval(info.row.original.id, 'approved')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-xs font-bold"
                    >
                        <CheckCircle2 className="w-4 h-4" /> Aprobar
                    </button>
                    <button
                        onClick={() => openRejectModal(info.row.original)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-xs font-bold"
                    >
                        <XCircle className="w-4 h-4" /> Rechazar
                    </button>
                </div>
            ),
        }),
    ], []);

    const table = useReactTable({
        data,
        columns,
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    if (loading) return <div className="text-white flex items-center gap-2"><Loader2 className="animate-spin" /> Cargando solicitudes...</div>;



    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-950 border border-gray-800 p-4 rounded-2xl">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Verificaciones KYC</h1>
                    <p className="text-gray-400 text-sm">Revisa y aprueba las solicitudes de nuevos vendedores.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        value={globalFilter ?? ""}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder="Buscar por nombre, cédula..."
                        className="w-full bg-gray-900 border border-gray-700 text-white pl-11 pr-4 py-3 rounded-xl focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all placeholder:text-gray-600 text-sm"
                    />
                </div>
            </div>

            {data.length === 0 ? (
                <div className="bg-gray-950 border border-gray-800 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Todo al día</h3>
                    <p className="text-gray-400">No hay solicitudes pendientes de revisión.</p>
                </div>
            ) : (
                <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-gray-900 text-gray-200 uppercase font-bold text-xs">
                                {table.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <th key={header.id} className="px-6 py-4">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className="hover:bg-gray-900/50 transition-colors">
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id} className="px-6 py-4">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-gray-800 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="p-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="p-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {rejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-white mb-4">Rechazar Solicitud</h2>
                        <p className="text-gray-400 text-sm mb-4">
                            Selecciona una acción para la solicitud de <span className="text-white font-medium">{selectedStore?.name}</span>.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Motivo del rechazo (para reintento)</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Ej: La foto de la cédula está borrosa..."
                                    className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-3 text-sm focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none min-h-[100px]"
                                />
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    onClick={handleRejectRetry}
                                    disabled={processingReject}
                                    className="w-full py-3 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/20 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    {processingReject ? <Loader2 className="animate-spin w-4 h-4" /> : null}
                                    Rechazar y Permitir Reintento
                                </button>

                                <div className="relative flex items-center py-2">
                                    <div className="flex-grow border-t border-gray-800"></div>
                                    <span className="flex-shrink-0 mx-4 text-gray-600 text-xs uppercase">O zona de peligro</span>
                                    <div className="flex-grow border-t border-gray-800"></div>
                                </div>

                                <button
                                    onClick={handleRejectBlock}
                                    disabled={processingReject}
                                    className="w-full py-3 bg-red-500 text-white hover:bg-red-600 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    {processingReject ? <Loader2 className="animate-spin w-4 h-4" /> : null}
                                    Rechazar y Bloquear (Permanente)
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={closeRejectModal}
                            disabled={processingReject}
                            className="mt-4 w-full py-2 text-gray-500 hover:text-white text-sm transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function DocumentLink({ path, label }: { path: string, label: string }) {
    const [url, setUrl] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function getUrl() {
            if (!path) return;
            const { data } = await supabase.storage
                .from('kyc-documents')
                .createSignedUrl(path, 3600); // 1 hour
            if (data) setUrl(data.signedUrl);
        }
        getUrl();
    }, [path, supabase]);

    if (!url) return <span className="text-xs text-gray-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Cargando...</span>;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline"
        >
            <ExternalLink className="w-3 h-3" /> {label}
        </a>
    );
}
