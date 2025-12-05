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
    Rocket,
    CheckCircle2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Link as LinkIcon
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Store {
    id: string;
    name: string;
    slug: string;
    owner_id: string;
    is_banned: boolean;
    is_verified: boolean;
    approval_status: string; // 'pending', 'approved', 'rejected'
    plan_tier: string;
    boost_expires_at: string | null;
    created_at: string;
    profiles: { full_name: string; email: string; cedula: string; cedula_photo_url: string };
}

export default function StoreManagementPage() {
    const [data, setData] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState("");
    const [boostModalOpen, setBoostModalOpen] = useState(false);
    const [selectedStoreForBoost, setSelectedStoreForBoost] = useState<Store | null>(null);
    const [boostDays, setBoostDays] = useState(7);

    const supabase = createClient();
    const { toast } = useToast();

    // Fetch Stores
    const fetchStores = async () => {
        setLoading(true);
        const { data: stores, error } = await supabase
            .from('stores')
            .select(`
                *,
                profiles:owner_id (full_name, email, cedula, cedula_photo_url)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching stores:", error);
            toast("Error cargando tiendas", "error");
        } else {
            setData(stores || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStores();
    }, []);

    // Actions
    const toggleApproval = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('stores')
            .update({ approval_status: newStatus })
            .eq('id', id);

        if (error) toast("Error actualizando aprobación", "error");
        else {
            toast(`Tienda ${newStatus === 'approved' ? 'aprobada' : 'rechazada'}`, "success");
            fetchStores();
        }
    };

    const toggleBan = async (id: string, currentStatus: boolean, ownerId: string) => {
        const { error } = await supabase
            .from('stores')
            .update({ is_banned: !currentStatus })
            .eq('id', id);

        if (error) toast("Error actualizando estado", "error");
        else {
            toast(currentStatus ? "Tienda desbaneada" : "Tienda baneada", "success");

            // Send Notification if Banning
            if (!currentStatus) {
                const { error: notifError } = await supabase
                    .from('notifications')
                    .insert({
                        user_id: ownerId,
                        title: "Tienda Suspendida",
                        message: "Tu tienda ha sido suspendida por incumplimiento de normas. Contacta a soporte.",
                        type: "system",
                        is_read: false
                    });

                if (notifError) console.error("Error sending ban notification:", notifError);
            }

            fetchStores();
        }
    };

    const toggleVerify = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('stores')
            .update({ is_verified: !currentStatus })
            .eq('id', id);

        if (error) toast("Error actualizando verificación", "error");
        else {
            toast(currentStatus ? "Verificación removida" : "Tienda verificada", "success");
            fetchStores();
        }
    };

    const updatePlan = async (id: string, plan: string) => {
        const { error } = await supabase
            .from('stores')
            .update({ plan_tier: plan })
            .eq('id', id);

        if (error) toast("Error actualizando plan", "error");
        else {
            toast(`Plan actualizado a ${plan}`, "success");
            fetchStores();
        }
    };

    const handleBoost = async () => {
        if (!selectedStoreForBoost) return;

        const date = new Date();
        date.setDate(date.getDate() + boostDays);
        const expiresAt = date.toISOString();

        const { error } = await supabase
            .from('stores')
            .update({ boost_expires_at: expiresAt })
            .eq('id', selectedStoreForBoost.id);

        if (error) {
            toast("Error al aplicar boost", "error");
        } else {
            toast(`Boost aplicado hasta ${date.toLocaleDateString()}`, "success");
            setBoostModalOpen(false);
            fetchStores();
        }
    };

    const openBoostModal = (store: Store) => {
        setSelectedStoreForBoost(store);
        setBoostModalOpen(true);
    };

    // Table Config
    const columnHelper = createColumnHelper<Store>();



    const copyStoreLink = (slug: string) => {
        if (!slug) {
            toast("Esta tienda no tiene slug generado", "error");
            return;
        }
        const url = `${window.location.origin}/store/${slug}`;
        navigator.clipboard.writeText(url);
        toast("Link copiado al portapapeles", "success");
    };

    const columns = useMemo(() => [
        columnHelper.accessor("name", {
            header: "Tienda / Dueño",
            cell: (info) => (
                <div>
                    <div className="font-bold text-white">{info.getValue()}</div>
                    <div className="text-xs text-gray-400">
                        {info.row.original.profiles?.full_name || "Sin nombre"}
                    </div>
                    <div className="text-xs text-gray-500">
                        {info.row.original.profiles?.email}
                    </div>
                    {info.row.original.profiles?.cedula && (
                        <div className="text-xs text-brand-red font-mono mt-1">
                            ID: {info.row.original.profiles.cedula}
                        </div>
                    )}
                    {info.row.original.profiles?.cedula_photo_url && (
                        <a
                            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kyc-documents/${info.row.original.profiles.cedula_photo_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-400 hover:underline mt-1 block"
                        >
                            Ver Foto Cédula
                        </a>
                    )}
                </div>
            ),
        }),
        columnHelper.accessor("approval_status", {
            header: "Aprobación",
            cell: (info) => {
                const status = info.getValue() || 'approved'; // Default to approved for old records
                return (
                    <div className="flex flex-col gap-1">
                        <span className={`text-xs font-bold uppercase ${status === 'approved' ? 'text-green-400' :
                            status === 'rejected' ? 'text-red-400' :
                                'text-yellow-400'
                            }`}>
                            {status === 'pending' ? 'PENDIENTE' : status === 'approved' ? 'APROBADO' : 'RECHAZADO'}
                        </span>
                        {status === 'pending' && (
                            <div className="flex gap-1">
                                <button
                                    onClick={() => toggleApproval(info.row.original.id, 'approved')}
                                    className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] rounded hover:bg-green-500/30"
                                >
                                    Aprobar
                                </button>
                                <button
                                    onClick={() => toggleApproval(info.row.original.id, 'rejected')}
                                    className="px-2 py-1 bg-red-500/20 text-red-400 text-[10px] rounded hover:bg-red-500/30"
                                >
                                    Rechazar
                                </button>
                            </div>
                        )}
                    </div>
                );
            }
        }),
        columnHelper.accessor("plan_tier", {
            header: "Plan",
            cell: (info) => (
                <select
                    value={info.getValue() || 'free'}
                    onChange={(e) => updatePlan(info.row.original.id, e.target.value)}
                    className="bg-gray-900 border border-gray-700 text-white text-xs rounded-lg p-1 focus:border-brand-red outline-none"
                >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="vip">VIP</option>
                </select>
            ),
        }),
        columnHelper.accessor("is_verified", {
            header: "Verificado",
            cell: (info) => (
                <button
                    onClick={() => toggleVerify(info.row.original.id, info.getValue())}
                    className={`p-1 rounded-full transition-colors ${info.getValue() ? "text-blue-400 bg-blue-400/10" : "text-gray-600 hover:text-gray-400"}`}
                >
                    <CheckCircle2 className="w-5 h-5" />
                </button>
            ),
        }),
        columnHelper.accessor("is_banned", {
            header: "Estado",
            cell: (info) => (
                <button
                    onClick={() => toggleBan(info.row.original.id, info.getValue(), info.row.original.owner_id)}
                    className={`px-2 py-1 rounded-full text-xs font-bold transition-colors ${info.getValue() ? "bg-red-500/20 text-red-400 border border-red-500/50" : "bg-green-500/20 text-green-400 border border-green-500/50"}`}
                >
                    {info.getValue() ? "BANEADO" : "ACTIVO"}
                </button>
            ),
        }),
        columnHelper.display({
            id: "actions",
            header: "Acciones",
            cell: (info) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => openBoostModal(info.row.original)}
                        className={`p-2 rounded-lg transition-colors ${info.row.original.boost_expires_at && new Date(info.row.original.boost_expires_at) > new Date() ? "bg-yellow-400/20 text-yellow-400" : "hover:bg-gray-800 text-gray-500 hover:text-yellow-400"}`}
                        title="Boost / Publicidad"
                    >
                        <Rocket className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => copyStoreLink(info.row.original.slug)}
                        className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-blue-400 transition-colors"
                        title="Copiar Link Tienda"
                    >
                        <LinkIcon className="w-4 h-4" />
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

    if (loading) return <div className="text-white flex items-center gap-2"><Loader2 className="animate-spin" /> Cargando tiendas...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-950 border border-gray-800 p-4 rounded-2xl">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Gestión de Tiendas</h1>
                    <p className="text-gray-400 text-sm">Administra, verifica y modera las tiendas de la plataforma.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        value={globalFilter ?? ""}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder="Buscar por nombre, dueño, email..."
                        className="w-full bg-gray-900 border border-gray-700 text-white pl-11 pr-4 py-3 rounded-xl focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all placeholder:text-gray-600 text-sm"
                    />
                </div>
            </div>

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

            {/* Boost Modal */}
            {boostModalOpen && selectedStoreForBoost && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-white mb-2">Impulsar Tienda</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            La tienda <span className="text-brand-red font-bold">{selectedStoreForBoost.name}</span> aparecerá primero en las búsquedas.
                        </p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-300 mb-2">Duración del Boost</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[1, 7, 30].map((days) => (
                                        <button
                                            key={days}
                                            onClick={() => setBoostDays(days)}
                                            className={`py-2 rounded-xl text-sm font-bold border transition-all ${boostDays === days ? "bg-brand-red border-brand-red text-white" : "border-gray-700 text-gray-400 hover:border-gray-600"}`}
                                        >
                                            {days} Día{days > 1 ? 's' : ''}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setBoostModalOpen(false)}
                                className="flex-1 bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleBoost}
                                className="flex-1 bg-yellow-500 text-black font-bold py-3 rounded-xl hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
                            >
                                <Rocket className="w-4 h-4" />
                                Aplicar Boost
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
